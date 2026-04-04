import { pgTable, text, serial, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { creditsTable } from "./credits";
import { usersTable } from "./users";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  creditId: integer("credit_id").notNull().references(() => creditsTable.id),
  paymentNumber: integer("payment_number").notNull(),
  paymentDate: date("payment_date").notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull(),
  amountExpected: numeric("amount_expected", { precision: 12, scale: 2 }).notNull(),
  lateFee: numeric("late_fee", { precision: 12, scale: 2 }),
  updatedBalance: numeric("updated_balance", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("on_time"), // on_time | partial | late | missed
  executiveId: integer("executive_id").references(() => usersTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
