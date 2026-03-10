import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  smallint,
} from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"), // self-ref, null = top-level
  body: text("body").notNull(),
  isAdminComment: boolean("is_admin_comment").notNull().default(false),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentVotes = pgTable(
  "comment_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    voterHash: text("voter_hash").notNull(),
    value: smallint("value").notNull(), // +1 or -1
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("comment_votes_unique").on(table.commentId, table.voterHash),
  ]
);
