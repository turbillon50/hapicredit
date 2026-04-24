import { pgTable, serial, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const faqTable = pgTable("faq", {
  id:        serial("id").primaryKey(),
  question:  text("question").notNull(),
  answer:    text("answer").notNull(),
  category:  varchar("category", { length: 100 }).default("general").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive:  boolean("is_active").default(true).notNull(),
  treeId:    integer("tree_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
