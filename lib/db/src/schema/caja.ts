import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { paymentsTable } from "./payments";

export const cajaMovementsTable = pgTable("caja_movements", {
  id: serial("id").primaryKey(),
  executiveId: integer("executive_id").notNull().references(() => usersTable.id),
  movementType: text("movement_type").notNull(), // collection | delivery | adjustment
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  relatedPaymentId: integer("related_payment_id").references(() => paymentsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCajaMovementSchema = createInsertSchema(cajaMovementsTable).omit({ id: true, createdAt: true });
export type InsertCajaMovement = z.infer<typeof insertCajaMovementSchema>;
export type CajaMovement = typeof cajaMovementsTable.$inferSelect;
