import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const publicRequestsTable = pgTable("public_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | contacted
  decidedBy: integer("decided_by"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPublicRequestSchema = createInsertSchema(publicRequestsTable).omit({ id: true, createdAt: true });
export type InsertPublicRequest = z.infer<typeof insertPublicRequestSchema>;
export type PublicRequest = typeof publicRequestsTable.$inferSelect;
