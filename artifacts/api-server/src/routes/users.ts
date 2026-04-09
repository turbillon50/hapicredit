import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hapicontrol_salt").digest("hex");
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.get("/users", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.fullName);
  res.json(users.map(formatUser));
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning();
  res.status(201).json(formatUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Only admin or self
  if (req.userRole !== "admin" && req.userId !== params.data.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...updateData } = parsed.data;
  const updates: Record<string, unknown> = { ...updateData };
  if (password) {
    updates.passwordHash = hashPassword(password);
  }

  const [user] = await db
    .update(usersTable)
    .set(updates as Parameters<typeof usersTable.$inferSelect>[0])
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

// Genealogical tree: current user → their invited users → their invited users
router.get("/users/my-tree", requireAuth, async (req, res): Promise<void> => {
  const me = req.userId!;

  const level1Full = await db.select().from(usersTable).where(eq(usersTable.parentId, me));
  const level2Full: (typeof usersTable.$inferSelect)[] = [];
  for (const l1 of level1Full) {
    const children = await db.select().from(usersTable).where(eq(usersTable.parentId, l1.id));
    level2Full.push(...children);
  }

  const result = {
    id: me,
    children: level1Full.map(l1 => ({
      id: l1.id,
      fullName: l1.fullName,
      role: l1.role,
      email: l1.email,
      username: l1.username,
      isActive: l1.isActive,
      createdAt: l1.createdAt,
      children: level2Full.filter(l2 => l2.parentId === l1.id).map(l2 => ({
        id: l2.id,
        fullName: l2.fullName,
        role: l2.role,
        email: l2.email,
        username: l2.username,
        isActive: l2.isActive,
        createdAt: l2.createdAt,
        children: [],
      })),
    })),
  };

  res.json(result);
});

export default router;
