import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // due_today | overdue | broken_promise | renewal_opportunity | executive_inactive | unusual_movement | repeated_delay
  severity: text("severity").notNull().default("medium"), // low | medium | high
  message: text("message").notNull(),
  clientId: integer("client_id").references(() => clientsTable.id),
  executiveId: integer("executive_id").references(() => usersTable.id),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
