import { Elysia, t } from "elysia";
import { db } from "@/db";
import { comments, commentVotes } from "@/db/schema/comments";
import { posts } from "@/db/schema/posts";
import { eq, asc, sql, and, isNull, desc, inArray } from "drizzle-orm";
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
              isAdminComment:
                auth.role === "admin" ? (body.asMod ?? true) : false,
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
        asMod: t.Optional(t.Boolean()),
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
          const [target] = await tx
            .select({ id: comments.id, postId: comments.postId })
            .from(comments)
            .where(eq(comments.id, params.id))
            .limit(1);

          if (!target) throw new Error("Comment not found");

          const allPostComments = await tx
            .select({
              id: comments.id,
              parentId: comments.parentId,
              deletedAt: comments.deletedAt,
            })
            .from(comments)
            .where(eq(comments.postId, target.postId));

          const childMap = new Map<string, string[]>();
          const rowMap = new Map(
            allPostComments.map((row) => [row.id, row] as const),
          );

          for (const row of allPostComments) {
            if (!row.parentId) continue;
            const list = childMap.get(row.parentId) ?? [];
            list.push(row.id);
            childMap.set(row.parentId, list);
          }

          const stack = [target.id];
          const subtreeIds: string[] = [];
          while (stack.length > 0) {
            const id = stack.pop()!;
            subtreeIds.push(id);
            const children = childMap.get(id);
            if (children?.length) {
              for (const childId of children) stack.push(childId);
            }
          }

          const activeIds = subtreeIds.filter((id) => !rowMap.get(id)?.deletedAt);
          if (activeIds.length > 0) {
            await tx
              .update(comments)
              .set({ deletedAt: new Date() })
              .where(and(inArray(comments.id, activeIds), isNull(comments.deletedAt)));

            await tx
              .update(posts)
              .set({
                commentCount: sql`GREATEST(${posts.commentCount} - ${activeIds.length}, 0)`,
              })
              .where(eq(posts.id, target.postId));
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
