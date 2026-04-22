import { env } from "@/lib/env";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as postsSchema from "./schema/posts";
import * as commentsSchema from "./schema/comments";
import * as reportsSchema from "./schema/reports";

// Use Neon's WebSocket-backed serverless driver (not neon-http) because the
// app relies on `db.transaction(...)` in /api/votes, /api/comments and
// /api/reports. neon-http is stateless and throws "No transactions support
// in neon-http driver" the moment a transaction starts.
//
// Bun (used via `bun run --bun next ...`) and Node.js >= 22 both expose a
// global `WebSocket`, so no `ws` polyfill is needed here. If this ever runs
// under an older Node runtime, install `ws` and set
// `neonConfig.webSocketConstructor = ws`.
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: { ...postsSchema, ...commentsSchema, ...reportsSchema },
});
