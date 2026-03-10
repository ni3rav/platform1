import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  smallint,
} from "drizzle-orm/pg-core";

export const boardEnum = pgEnum("board", [
  "random",
  "confessions",
  "rant",
  "knowledge",
  "hangout",
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  board: boardEnum("board").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isAdminPost: boolean("is_admin_post").notNull().default(false),
  score: integer("score").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postVotes = pgTable(
  "post_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    voterHash: text("voter_hash").notNull(),
    value: smallint("value").notNull(), // +1 or -1
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_votes_unique").on(table.postId, table.voterHash),
  ]
);
