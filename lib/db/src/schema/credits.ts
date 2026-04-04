import { pgTable, text, serial, integer, numeric, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const creditsTable = pgTable("credits", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  executiveId: integer("executive_id").references(() => usersTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  disbursementDate: date("disbursement_date").notNull(),
  termWeeks: integer("term_weeks").notNull(),
  weeklyPayment: numeric("weekly_payment", { precision: 12, scale: 2 }).notNull(),
  openingFee: numeric("opening_fee", { precision: 12, scale: 2 }),
  totalToRepay: numeric("total_to_repay", { precision: 12, scale: 2 }).notNull(),
  currentPaymentNumber: integer("current_payment_number").notNull().default(0),
  remainingBalance: numeric("remaining_balance", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active | completed | defaulted | restructured
  renewalEligible: boolean("renewal_eligible").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCreditSchema = createInsertSchema(creditsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCredit = z.infer<typeof insertCreditSchema>;
export type Credit = typeof creditsTable.$inferSelect;
