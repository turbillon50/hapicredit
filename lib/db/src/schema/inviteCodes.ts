import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const inviteCodesTable = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull(), // admin | executive | client
  createdById: integer("created_by_id").references(() => usersTable.id), // null = system generated
  parentId: integer("parent_id").references(() => usersTable.id),        // establishes tree link
  usedById: integer("used_by_id").references(() => usersTable.id),       // null = not yet used
  usedAt: timestamp("used_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InviteCode = typeof inviteCodesTable.$inferSelect;
