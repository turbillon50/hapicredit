import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  altPhone: text("alt_phone"),
  address: text("address"),
  curp: text("curp"),
  status: text("status").notNull().default("current"), // current | at_risk | overdue | defaulted | inactive
  executiveId: integer("executive_id").references(() => usersTable.id),
  guarantorName: text("guarantor_name"),
  guarantorPhone: text("guarantor_phone"),
  internalNotes: text("internal_notes"),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, registeredAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
