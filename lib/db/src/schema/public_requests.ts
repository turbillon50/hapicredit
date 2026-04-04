import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const publicRequestsTable = pgTable("public_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPublicRequestSchema = createInsertSchema(publicRequestsTable).omit({ id: true, createdAt: true });
export type InsertPublicRequest = z.infer<typeof insertPublicRequestSchema>;
export type PublicRequest = typeof publicRequestsTable.$inferSelect;
