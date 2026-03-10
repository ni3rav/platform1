import { Elysia, t } from "elysia";
import { db } from "@/db";
import { posts, postVotes } from "@/db/schema/posts";
import { comments, commentVotes } from "@/db/schema/comments";
import { eq, and } from "drizzle-orm";
import { extractAuth, type ApiAuth } from "@/lib/auth-api";
import { tryCatch } from "@/lib/utils";

export const voteRoutes = new Elysia({ prefix: "/votes" })
  .derive(({ headers }) => ({
    auth: extractAuth(headers["cookie"]),
  }))

  // Vote on a post: value = 1 (up), -1 (down), 0 (remove)
  .post(
    "/post/:id",
    async ({ params, body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { value } = body;
      const postId = params.id;
      const { voterHash } = auth;

      const [error, result] = await tryCatch(() =>
        db.transaction(async (tx) => {
          const existing = await tx
            .select()
            .from(postVotes)
            .where(
              and(
                eq(postVotes.postId, postId),
                eq(postVotes.voterHash, voterHash),
              ),
            )
            .limit(1);

          const oldValue = existing[0]?.value ?? 0;
          const scoreDelta = value - oldValue;

          if (value === 0 && existing.length > 0) {
            await tx
              .delete(postVotes)
              .where(
                and(
                  eq(postVotes.postId, postId),
                  eq(postVotes.voterHash, voterHash),
                ),
              );
          } else if (value !== 0 && existing.length > 0) {
            await tx
              .update(postVotes)
              .set({ value })
              .where(
                and(
                  eq(postVotes.postId, postId),
                  eq(postVotes.voterHash, voterHash),
                ),
              );
          } else if (value !== 0) {
            await tx.insert(postVotes).values({ postId, voterHash, value });
          }

          if (scoreDelta !== 0) {
            const currentPost = await tx
              .select({ score: posts.score })
              .from(posts)
              .where(eq(posts.id, postId))
              .limit(1);

            const newScore = (currentPost[0]?.score ?? 0) + scoreDelta;
            await tx
              .update(posts)
              .set({ score: newScore })
              .where(eq(posts.id, postId));
          }

          const [updated] = await tx
            .select({ score: posts.score })
            .from(posts)
            .where(eq(posts.id, postId));

          return { score: updated?.score ?? 0, userVote: value };
        }),
      );

      if (error || !result) {
        set.status = 500;
        return { error: "Failed to vote" };
      }
      return result;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ value: t.Number({ minimum: -1, maximum: 1 }) }),
    },
  )

  // Vote on a comment
  .post(
    "/comment/:id",
    async ({ params, body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const { value } = body;
      const commentId = params.id;
      const { voterHash } = auth;

      const [error, result] = await tryCatch(() =>
        db.transaction(async (tx) => {
          const existing = await tx
            .select()
            .from(commentVotes)
            .where(
              and(
                eq(commentVotes.commentId, commentId),
                eq(commentVotes.voterHash, voterHash),
              ),
            )
            .limit(1);

          const oldValue = existing[0]?.value ?? 0;
          const scoreDelta = value - oldValue;

          if (value === 0 && existing.length > 0) {
            await tx
              .delete(commentVotes)
              .where(
                and(
                  eq(commentVotes.commentId, commentId),
                  eq(commentVotes.voterHash, voterHash),
                ),
              );
          } else if (value !== 0 && existing.length > 0) {
            await tx
              .update(commentVotes)
              .set({ value })
              .where(
                and(
                  eq(commentVotes.commentId, commentId),
                  eq(commentVotes.voterHash, voterHash),
                ),
              );
          } else if (value !== 0) {
            await tx
              .insert(commentVotes)
              .values({ commentId, voterHash, value });
          }

          if (scoreDelta !== 0) {
            const currentComment = await tx
              .select({ score: comments.score })
              .from(comments)
              .where(eq(comments.id, commentId))
              .limit(1);

            const newScore = (currentComment[0]?.score ?? 0) + scoreDelta;
            await tx
              .update(comments)
              .set({ score: newScore })
              .where(eq(comments.id, commentId));
          }

          const [updated] = await tx
            .select({ score: comments.score })
            .from(comments)
            .where(eq(comments.id, commentId));

          return { score: updated?.score ?? 0, userVote: value };
        }),
      );

      if (error || !result) {
        set.status = 500;
        return { error: "Failed to vote" };
      }
      return result;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ value: t.Number({ minimum: -1, maximum: 1 }) }),
    },
  );
