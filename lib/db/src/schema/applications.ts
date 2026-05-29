import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Self-service credit applications submitted by customers from /aplicar.
// Lives next to the existing `credits` table (which models active loans
// in the operational asesor-CRM workflow). Once approved, a credit row
// is created and linked back via `convertedCreditId`.
export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("draft"), // draft | submitted | in_review | approved | rejected
  amountRequestedCents: integer("amount_requested_cents").notNull(),
  termMonths: integer("term_months"),
  termWeeks: integer("term_weeks"),
  purpose: text("purpose"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  decisionAt: timestamp("decision_at", { withTimezone: true }),
  decidedBy: integer("decided_by").references(() => usersTable.id),
  decisionNotes: text("decision_notes"),
  score: integer("score"), // 0..1000 risk score, nullable until evaluated
  convertedCreditId: integer("converted_credit_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;

// State-transition history. Append-only — every status change is logged.
export const applicationHistoryTable = pgTable("application_history", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  action: text("action").notNull(), // submit | start_review | approve | reject | reopen | comment
  byUserId: integer("by_user_id").references(() => usersTable.id),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  notes: text("notes"),
  metadata: jsonb("metadata_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApplicationHistorySchema = createInsertSchema(applicationHistoryTable).omit({ id: true, createdAt: true });
export type InsertApplicationHistory = z.infer<typeof insertApplicationHistorySchema>;
export type ApplicationHistoryEntry = typeof applicationHistoryTable.$inferSelect;
