import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // Roles: legacy ops workflow uses admin | executive | client;
  // the Phase-0 portal adds customer (alias of client) and reviewer.
  role: text("role").notNull().default("executive"),
  parentId: integer("parent_id"),   // FK to users.id — who invited this user
  treeId: integer("tree_id"),       // FK to root admin's user id — identifies the tree
  isActive: boolean("is_active").notNull().default(true),
  // Clerk identity link. Populated by /api/webhooks/clerk on user.created.
  clerkId: text("clerk_id").unique(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  // Soft delete for compliance — never hard-delete user rows.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
