import { db, eq, clientsTable, usersTable } from "@workspace/db";

// Portal end-users can carry either the legacy "client" role or the
// Phase-0 "customer" alias. Treat both identically everywhere.
export const CLIENT_ROLES = ["client", "customer"];
export const isClientRole = (role?: string | null) => CLIENT_ROLES.includes(role ?? "");

// Accent/case/space-insensitive normalization for name matching.
const norm = (s?: string | null) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Last 10 significant digits of a phone, ignoring formatting/country prefix.
const digits10 = (s?: string | null) => (s ?? "").replace(/\D/g, "").slice(-10);

// Resolve the clients.id for an authenticated portal user, robustly.
// Order of precedence:
//   1. clients.userId FK            (canonical; set once, reused thereafter)
//   2. normalized full-name match   (accent/case/space-insensitive, unique)
//   3. phone match (last 10 digits) (unique)
// On a match via (2) or (3) the FK is backfilled so later lookups take the
// fast canonical path. Returns null when nothing matches uniquely.
export async function resolveClientId(userId: number): Promise<number | null> {
  const [byFk] = await db
    .select({ id: clientsTable.id })
    .from(clientsTable)
    .where(eq(clientsTable.userId, userId))
    .limit(1);
  if (byFk) return byFk.id;

  const [user] = await db
    .select({ fullName: usersTable.fullName, phone: usersTable.phone })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;

  const candidates = await db
    .select({
      id: clientsTable.id,
      userId: clientsTable.userId,
      fullName: clientsTable.fullName,
      phone: clientsTable.phone,
    })
    .from(clientsTable);
  const unlinked = candidates.filter((c) => c.userId == null);

  async function link(clientId: number): Promise<number> {
    await db.update(clientsTable).set({ userId }).where(eq(clientsTable.id, clientId));
    return clientId;
  }

  if (user.fullName) {
    const target = norm(user.fullName);
    if (target.length > 0) {
      const hits = unlinked.filter((c) => norm(c.fullName) === target);
      if (hits.length === 1) return link(hits[0].id);
    }
  }

  if (user.phone) {
    const target = digits10(user.phone);
    if (target.length >= 10) {
      const hits = unlinked.filter((c) => digits10(c.phone) === target);
      if (hits.length === 1) return link(hits[0].id);
    }
  }

  return null;
}
