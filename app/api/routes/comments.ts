import { Elysia, t } from "elysia";
import { db } from "@/db";
import { comments, commentVotes } from "@/db/schema/comments";
import { posts } from "@/db/schema/posts";
import { eq, asc, sql } from "drizzle-orm";
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
          .where(eq(comments.postId, params.postId))
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
            .select({ postId: comments.postId })
            .from(comments)
            .where(eq(comments.id, params.id))
            .limit(1);

          if (!comment) throw new Error("Comment not found");

          await tx.delete(comments).where(eq(comments.id, params.id));

          await tx
            .update(posts)
            .set({
              commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
            })
            .where(eq(posts.id, comment.postId));
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
