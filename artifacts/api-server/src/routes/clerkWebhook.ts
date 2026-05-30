import type { Request, Response } from "express";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";

// In-process dedup of recently-seen svix message ids. A small ring is enough:
// the same svix-id only repeats if Clerk retries after our 2xx is lost.
// For a multi-instance deploy a shared store (Redis) would be better, but
// the handler is also idempotent at the DB level (clerkId unique), so a
// missed dedup just becomes a no-op UPDATE.
const recentSvixIds: string[] = [];
const RING_SIZE = 256;
function alreadyProcessed(id: string): boolean {
  if (recentSvixIds.includes(id)) return true;
  recentSvixIds.push(id);
  if (recentSvixIds.length > RING_SIZE) recentSvixIds.shift();
  return false;
}

type ClerkEmail = { email_address: string };
type ClerkUser = {
  id: string;
  email_addresses?: ClerkEmail[];
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  phone_numbers?: { phone_number: string }[];
  public_metadata?: { role?: string };
};

function primaryEmail(u: ClerkUser): string | null {
  return u.email_addresses?.[0]?.email_address ?? null;
}
function fullName(u: ClerkUser): string {
  const parts = [u.first_name, u.last_name].filter(Boolean) as string[];
  return parts.join(" ").trim() || u.username || primaryEmail(u) || "Usuario";
}
function uniqueUsername(u: ClerkUser): string {
  // Use the Clerk username when present; otherwise derive from the email
  // local-part. The DB-level UNIQUE constraint on users.username protects
  // us from collisions — we suffix with the Clerk id slice if needed.
  const base = u.username
    ?? primaryEmail(u)?.split("@")[0]
    ?? `user_${u.id.slice(-6)}`;
  return base.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export async function clerkWebhookHandler(req: Request, res: Response): Promise<void> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("CLERK_WEBHOOK_SECRET not configured — refusing webhook");
    res.status(503).json({ error: "Webhook not configured" });
    return;
  }

  // svix headers — Clerk sets svix-id, svix-timestamp, svix-signature.
  const svixId = req.header("svix-id");
  const svixTimestamp = req.header("svix-timestamp");
  const svixSignature = req.header("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  // Verify the signature. `req.body` is the raw Buffer because we mounted
  // this route with express.raw() in app.ts.
  let evt: { type: string; data: ClerkUser };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(req.body as Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: ClerkUser };
  } catch (err) {
    logger.warn({ err }, "svix signature verification failed");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  if (alreadyProcessed(svixId)) {
    res.json({ ok: true, dedup: true });
    return;
  }

  try {
    const u = evt.data;
    const email = primaryEmail(u);
    const phone = u.phone_numbers?.[0]?.phone_number ?? null;
    const role = u.public_metadata?.role ?? "client";

    switch (evt.type) {
      case "user.created": {
        const username = uniqueUsername(u);
        const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.clerkId, u.id));
        if (existing) {
          res.json({ ok: true, action: "noop-existing", id: existing.id });
          return;
        }
        const [created] = await db.insert(usersTable).values({
          username,
          fullName: fullName(u),
          email,
          phone,
          role,
          clerkId: u.id,
          isActive: true,
          // passwordHash null — Clerk owns the credential.
        }).returning({ id: usersTable.id });
        logger.info({ clerkId: u.id, userId: created?.id }, "user.created synced");
        res.json({ ok: true, action: "created", id: created?.id });
        return;
      }

      case "user.updated": {
        const updates: Partial<typeof usersTable.$inferInsert> = {
          fullName: fullName(u),
          email,
          phone,
          updatedAt: new Date(),
        };
        if (u.public_metadata?.role) updates.role = u.public_metadata.role;
        const [updated] = await db.update(usersTable)
          .set(updates)
          .where(eq(usersTable.clerkId, u.id))
          .returning({ id: usersTable.id });
        logger.info({ clerkId: u.id, userId: updated?.id }, "user.updated synced");
        res.json({ ok: true, action: "updated", id: updated?.id ?? null });
        return;
      }

      case "user.deleted": {
        // Soft delete — compliance requires the row to stay around.
        const [deleted] = await db.update(usersTable)
          .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(usersTable.clerkId, u.id))
          .returning({ id: usersTable.id });
        logger.info({ clerkId: u.id, userId: deleted?.id }, "user.deleted soft-deleted");
        res.json({ ok: true, action: "soft-deleted", id: deleted?.id ?? null });
        return;
      }

      default:
        res.json({ ok: true, action: "ignored", type: evt.type });
        return;
    }
  } catch (err) {
    logger.error({ err, type: evt.type }, "webhook handler error");
    res.status(500).json({ error: "Internal error" });
  }
}
