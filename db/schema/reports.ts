import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const targetTypeEnum = pgEnum("target_type", ["post", "comment"]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "resolved",
  "rejected",
]);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: targetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});
