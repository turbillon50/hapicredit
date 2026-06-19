import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const inviteCodesTable = pgTable("invite_codes", {
  id:           serial("id").primaryKey(),
  code:         text("code").notNull().unique(),
  role:         text("role").notNull(), // admin | executive | client
  // --- VIP pre-approval fields (null = plain invite, not pre-approved) ---
  inviteType:   text("invite_type").notNull().default("staff"), // staff | vip_new | vip_renewal
  recipientName: text("recipient_name"),          // nombre del destinatario (para pantalla VIP)
  recipientPhone: text("recipient_phone"),
  vipMessage:   text("vip_message"),              // mensaje personalizado del admin
  preApprovedAmount:    numeric("pre_approved_amount",    { precision: 12, scale: 2 }),
  preApprovedTermWeeks: integer("pre_approved_term_weeks"),
  preApprovedRate:      numeric("pre_approved_rate",      { precision: 5,  scale: 2 }),
  preApprovedFee:       numeric("pre_approved_fee",       { precision: 12, scale: 2 }),
  // --- Relations ---
  createdById:  integer("created_by_id").references(() => usersTable.id),
  parentId:     integer("parent_id").references(() => usersTable.id),
  usedById:     integer("used_by_id").references(() => usersTable.id),
  usedAt:       timestamp("used_at",    { withTimezone: true }),
  isActive:     boolean("is_active").notNull().default(true),
  expiresAt:    timestamp("expires_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InviteCode = typeof inviteCodesTable.$inferSelect;
