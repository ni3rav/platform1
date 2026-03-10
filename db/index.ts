import { env } from "@/lib/env";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as postsSchema from "./schema/posts";
import * as commentsSchema from "./schema/comments";
import * as reportsSchema from "./schema/reports";

export const db = drizzle(env.DATABASE_URL, {
  schema: { ...postsSchema, ...commentsSchema, ...reportsSchema },
});
