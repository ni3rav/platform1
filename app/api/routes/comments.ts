import { Elysia, t } from "elysia";
import { db } from "@/db";
import { comments, commentVotes } from "@/db/schema/comments";
import { posts } from "@/db/schema/posts";
import { eq, asc, sql, and, isNull, desc } from "drizzle-orm";
import { extractAuth } from "@/lib/auth-api";
import { tryCatch } from "@/lib/utils";

export const commentRoutes = new Elysia({ prefix: "/comments" })
  .derive(({ headers }) => ({
    auth: extractAuth(headers["cookie"]),
  }))

  // Get comments for a post (public, auth optional for vote state)
  .get(
    "/post/:postId",
    async ({ params, auth, set }) => {
      const [error, results] = await tryCatch(() =>
        db
          .select()
          .from(comments)
          .where(and(eq(comments.postId, params.postId), isNull(comments.deletedAt)))
          .orderBy(asc(comments.createdAt)),
      );

      if (error || !results) {
        set.status = 500;
        return { error: "Failed to fetch comments" };
      }

      let userVotes: Record<string, number> = {};
      if (auth && results.length > 0) {
        const commentIds = results.map((c) => c.id);
        const [, votes] = await tryCatch(() =>
          db
            .select({
              commentId: commentVotes.commentId,
              value: commentVotes.value,
            })
            .from(commentVotes)
            .where(
              sql`${commentVotes.commentId} IN (${sql.join(
                commentIds.map((id) => sql`${id}`),
                sql`, `,
              )}) AND ${commentVotes.voterHash} = ${auth.voterHash}`,
            ),
        );
        if (votes) {
          for (const v of votes) {
            userVotes[v.commentId] = v.value;
          }
        }
      }

      return results.map((c) => ({
        ...c,
        userVote: userVotes[c.id] ?? 0,
      }));
    },
    {
      params: t.Object({ postId: t.String() }),
    },
  )

  // Admin content list (admin only, optionally includes deleted)
  .get(
    "/admin",
    async ({ query, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (auth.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const includeDeleted = query.includeDeleted === "1";
      const limit = Math.min(parseInt(query.limit || "20"), 50);
      const whereClause = includeDeleted ? undefined : isNull(comments.deletedAt);

      const [error, rows] = await tryCatch(() =>
        db
          .select({
            id: comments.id,
            postId: comments.postId,
            parentId: comments.parentId,
            body: comments.body,
            score: comments.score,
            createdAt: comments.createdAt,
            deletedAt: comments.deletedAt,
            postBoard: posts.board,
            postTitle: posts.title,
          })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .where(whereClause)
          .orderBy(desc(comments.createdAt))
          .limit(limit),
      );

      if (error || !rows) {
        set.status = 500;
        return { error: "Failed to fetch admin comments" };
      }

      return rows;
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        includeDeleted: t.Optional(t.String()),
      }),
    },
  )

  // Create comment (auth required)
  .post(
    "/",
    async ({ body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const [error, newComment] = await tryCatch(() =>
        db.transaction(async (tx) => {
          const [created] = await tx
            .insert(comments)
            .values({
              postId: body.postId,
              parentId: body.parentId || null,
              body: body.body,
              isAdminComment: auth.role === "admin",
            })
            .returning();

          await tx
            .update(posts)
            .set({ commentCount: sql`${posts.commentCount} + 1` })
            .where(eq(posts.id, body.postId));

          return created;
        }),
      );

      if (error || !newComment) {
        set.status = 500;
        return { error: "Failed to create comment" };
      }
      set.status = 201;
      return newComment;
    },
    {
      body: t.Object({
        postId: t.String(),
        parentId: t.Optional(t.String()),
        body: t.String({ minLength: 1, maxLength: 5000 }),
      }),
    },
  )

  // Delete comment (admin only)
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
        db.transaction(async (tx) => {
          const [comment] = await tx
            .select({ postId: comments.postId, deletedAt: comments.deletedAt })
            .from(comments)
            .where(eq(comments.id, params.id))
            .limit(1);

          if (!comment) throw new Error("Comment not found");

          if (!comment.deletedAt) {
            await tx
              .update(comments)
              .set({ deletedAt: new Date() })
              .where(and(eq(comments.id, params.id), isNull(comments.deletedAt)));

            await tx
              .update(posts)
              .set({
                commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
              })
              .where(eq(posts.id, comment.postId));
          }
        }),
      );

      if (error) {
        set.status = error === "Comment not found" ? 404 : 500;
        return { error };
      }
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
