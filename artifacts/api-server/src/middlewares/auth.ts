import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { verifyToken } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      userFullName?: string;
      userTreeId?: number | null;
      userParentId?: number | null;
    }
  }
}

export const DEMO_USERS: Record<string, { id: number; role: string; fullName: string; treeId: number | null; parentId: number | null }> = {
  "demo-token-admin":     { id: 1, role: "admin",     fullName: "Admin Demo",   treeId: 1, parentId: null },
  "demo-token-executive": { id: 2, role: "executive", fullName: "Asesor Demo",  treeId: 1, parentId: 1 },
  "demo-token-client":    { id: 3, role: "client",    fullName: "Cliente Demo", treeId: 1, parentId: 2 },
};

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED === "true";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);

  // Demo-mode bypass — gated behind DEMO_MODE_ENABLED so production
  // deployments never accept these tokens. Set DEMO_MODE_ENABLED=true on
  // a staging/showcase deploy to re-enable.
  if (isDemoModeEnabled()) {
    const demoUser = DEMO_USERS[token];
    if (demoUser) {
      req.userId       = demoUser.id;
      req.userRole     = demoUser.role;
      req.userFullName = demoUser.fullName;
      req.userTreeId   = demoUser.treeId;
      req.userParentId = demoUser.parentId;
      next();
      return;
    }
  }

  // Clerk JWT path: the token is a Clerk session JWT when CLERK_SECRET_KEY
  // is configured. verifyToken throws if the signature is bad or expired.
  // On success we look up (or lazily create) the local users row keyed by
  // clerk_id, so downstream routes see req.userId/Role as if it were a
  // native session.
  if (process.env.CLERK_SECRET_KEY && token.startsWith("eyJ")) {
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const clerkUserId = payload.sub;
      if (!clerkUserId) {
        res.status(401).json({ error: "Invalid Clerk token" });
        return;
      }
      // sessionClaims.publicMetadata.role lives on the payload.
      const roleFromClaim = (payload as unknown as { public_metadata?: { role?: string }; publicMetadata?: { role?: string } })
        ?.publicMetadata?.role
        ?? (payload as unknown as { public_metadata?: { role?: string } })?.public_metadata?.role;

      try {
        const [user] = await db.select({
          id: usersTable.id, role: usersTable.role, fullName: usersTable.fullName,
          isActive: usersTable.isActive, treeId: usersTable.treeId, parentId: usersTable.parentId,
        }).from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

        if (user) {
          if (!user.isActive) { res.status(401).json({ error: "User inactive" }); return; }
          req.userId       = user.id;
          req.userRole     = roleFromClaim ?? user.role;
          req.userFullName = user.fullName;
          req.userTreeId   = user.treeId;
          req.userParentId = user.parentId;
          next();
          return;
        }

        // No local row yet — webhook should land soon, but lazily create
        // one so the user can use the API immediately after sign-up.
        const [created] = await db.insert(usersTable).values({
          username: `clerk_${clerkUserId.slice(-10)}`.toLowerCase(),
          fullName: "Usuario",
          email: null,
          role: roleFromClaim ?? "client",
          clerkId: clerkUserId,
          isActive: true,
        }).returning({ id: usersTable.id, role: usersTable.role, fullName: usersTable.fullName, treeId: usersTable.treeId, parentId: usersTable.parentId });

        req.userId       = created.id;
        req.userRole     = created.role;
        req.userFullName = created.fullName;
        req.userTreeId   = created.treeId;
        req.userParentId = created.parentId;
        next();
        return;
      } catch (dbErr) {
        // DB down but Clerk token verified — give a usable response.
        req.userId       = -1;
        req.userRole     = roleFromClaim ?? "client";
        req.userFullName = "Usuario";
        req.userTreeId   = null;
        req.userParentId = null;
        next();
        return;
      }
    } catch {
      // Fall through — could be a non-Clerk Bearer token (legacy DB session
      // that happens to also start with "eyJ" if base64'd). Try DB next.
    }
  }

  try {
    const now = new Date();

    const [session] = await db
      .select({ userId: sessionsTable.userId, expiresAt: sessionsTable.expiresAt })
      .from(sessionsTable)
      .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)));

    if (!session) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, fullName: usersTable.fullName, isActive: usersTable.isActive, treeId: usersTable.treeId, parentId: usersTable.parentId })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId));

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    req.userId       = user.id;
    req.userRole     = user.role;
    req.userFullName = user.fullName;
    req.userTreeId   = user.treeId;
    req.userParentId = user.parentId;
    next();
  } catch (err) {
    // DB unreachable — return 503 with a JSON body so react-query handles
    // it gracefully instead of a vercel-generated HTML 500.
    res.status(503).json({
      error: "Database not configured. Set DATABASE_URL or sign in with Clerk.",
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.userRole ?? "")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
