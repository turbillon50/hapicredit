import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// KYC + portal profile sitting on top of the operational `users` row.
// One profile per user; populated as the customer fills the self-service form.
export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id),
  fullName: text("full_name"),
  dob: text("dob"),
  curp: text("curp"),
  rfc: text("rfc"),
  address: jsonb("address_json").$type<{ street?: string; city?: string; state?: string; postal?: string } | null>(),
  occupation: text("occupation"),
  monthlyIncomeCents: integer("monthly_income_cents"),
  kycStatus: text("kyc_status").notNull().default("pending"), // pending | approved | rejected
  kycReviewedBy: integer("kyc_reviewed_by").references(() => usersTable.id),
  kycReviewedAt: timestamp("kyc_reviewed_at", { withTimezone: true }),
  kycNotes: text("kyc_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
