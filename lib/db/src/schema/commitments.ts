import { pgTable, text, serial, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const commitmentsTable = pgTable("commitments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  executiveId: integer("executive_id").references(() => usersTable.id),
  promisedDate: date("promised_date").notNull(),
  promisedAmount: numeric("promised_amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending | fulfilled | broken
  followUpNote: text("follow_up_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCommitmentSchema = createInsertSchema(commitmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitmentsTable.$inferSelect;
