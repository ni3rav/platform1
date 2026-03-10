import { Elysia, t } from "elysia";
import { db } from "@/db";
import { posts, postVotes } from "@/db/schema/posts";
import { eq, desc, sql } from "drizzle-orm";
import { extractAuth } from "@/lib/auth-api";
import { tryCatch } from "@/lib/utils";

const boardValues = [
  "random",
  "confessions",
  "rant",
  "knowledge",
  "hangout",
] as const;

export const postRoutes = new Elysia({ prefix: "/posts" })
  .derive(({ headers }) => ({
    auth: extractAuth(headers["cookie"]),
  }))

  // List posts (public, auth optional for vote state)
  .get(
    "/",
    async ({ query, auth, set }) => {
      const board = query.board as (typeof boardValues)[number] | undefined;
      const sort = (query.sort as "hot" | "top" | "new") || "hot";
      const page = parseInt(query.page || "1");
      const limit = Math.min(parseInt(query.limit || "20"), 50);
      const offset = (page - 1) * limit;

      let orderBy;
      switch (sort) {
        case "top":
          orderBy = desc(posts.score);
          break;
        case "new":
          orderBy = desc(posts.createdAt);
          break;
        case "hot":
        default:
          orderBy = desc(
            sql`${posts.score} / POWER(GREATEST(EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600, 1), 1.5)`,
          );
          break;
      }

      const conditions = board ? eq(posts.board, board) : undefined;

      const [error, results] = await tryCatch(() =>
        db
          .select()
          .from(posts)
          .where(conditions)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
      );

      if (error || !results) {
        set.status = 500;
        return { error: "Failed to fetch posts" };
      }

      let userVotes: Record<string, number> = {};
      if (auth?.voterHash && results.length > 0) {
        const postIds = results.map((p) => p.id);
        const [, votes] = await tryCatch(() =>
          db
            .select({ postId: postVotes.postId, value: postVotes.value })
            .from(postVotes)
            .where(
              sql`${postVotes.postId} IN (${sql.join(
                postIds.map((id) => sql`${id}`),
                sql`, `,
              )}) AND ${postVotes.voterHash} = ${auth!.voterHash}`,
            ),
        );
        if (votes) {
          for (const v of votes) {
            userVotes[v.postId] = v.value;
          }
        }
      }

      return {
        posts: results.map((p) => ({
          ...p,
          userVote: userVotes[p.id] ?? 0,
        })),
        page,
        limit,
      };
    },
    {
      query: t.Object({
        board: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  // Get single post
  .get(
    "/:id",
    async ({ params, auth, set }) => {
      const [error, result] = await tryCatch(() =>
        db.select().from(posts).where(eq(posts.id, params.id)).limit(1),
      );

      if (error || !result || result.length === 0) {
        set.status = 404;
        return { error: "Post not found" };
      }

      let userVote = 0;
      if (auth) {
        const [, vote] = await tryCatch(() =>
          db
            .select({ value: postVotes.value })
            .from(postVotes)
            .where(
              sql`${postVotes.postId} = ${params.id} AND ${postVotes.voterHash} = ${auth.voterHash}`,
            )
            .limit(1),
        );
        userVote = vote?.[0]?.value ?? 0;
      }

      return { ...result[0], userVote };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )

  // Create post (auth required)
  .post(
    "/",
    async ({ body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const [error, rows] = await tryCatch(() =>
        db
          .insert(posts)
          .values({
            board: body.board as (typeof boardValues)[number],
            title: body.title,
            body: body.body,
            isAdminPost: auth.role === "admin",
          })
          .returning(),
      );

      if (error || !rows) {
        console.error(error);
        set.status = 500;
        return { error: "Failed to create post" };
      }
      set.status = 201;
      return rows[0];
    },
    {
      body: t.Object({
        board: t.String(),
        title: t.String({ minLength: 1, maxLength: 300 }),
        body: t.String({ minLength: 1, maxLength: 10000 }),
      }),
    },
  )

  // Delete post (admin only)
  .delete(
    "/:id",
    async ({ params, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (auth.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const [error] = await tryCatch(() =>
        db.delete(posts).where(eq(posts.id, params.id)),
      );

      if (error) {
        set.status = 500;
        return { error: "Failed to delete post" };
      }
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
