import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

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
    // DB unreachable (e.g. no DATABASE_URL in demo deploys) — return 503
    // with a JSON body so react-query handles it gracefully instead of
    // a vercel-generated HTML 500 that some clients may parse oddly.
    res.status(503).json({
      error: "Database not configured. Set DATABASE_URL or use a demo token.",
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
