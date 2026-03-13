import { Elysia, t } from "elysia";
import { db } from "@/db";
import { reports } from "@/db/schema/reports";
import { posts } from "@/db/schema/posts";
import { comments } from "@/db/schema/comments";
import { eq, sql, and, isNull } from "drizzle-orm";
import { extractAuth } from "@/lib/auth-api";
import { tryCatch } from "@/lib/utils";

export const reportRoutes = new Elysia({ prefix: "/reports" })
  .derive(({ headers }) => ({
    auth: extractAuth(headers["cookie"]),
  }))

  // Submit a report (auth required)
  .post(
    "/",
    async ({ body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const [error, rows] = await tryCatch(() =>
        db
          .insert(reports)
          .values({
            targetType: body.targetType as "post" | "comment",
            targetId: body.targetId,
            reason: body.reason,
          })
          .returning(),
      );

      if (error || !rows) {
        set.status = 500;
        return { error: "Failed to submit report" };
      }
      set.status = 201;
      return rows[0];
    },
    {
      body: t.Object({
        targetType: t.String(),
        targetId: t.String(),
        reason: t.String({ minLength: 1, maxLength: 1000 }),
      }),
    },
  )

  // List reports (admin only) — includes target content
  .get(
    "/",
    async ({ query, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (auth.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const status =
        (query.status as "pending" | "resolved" | "rejected") || "pending";
      const typeFilter = query.type as "post" | "comment" | undefined;
      const boardFilter = query.board || undefined;
      const sortOrder = query.sort === "oldest" ? "asc" : "desc";

      // Build conditions
      const conditions = [eq(reports.status, status)];
      if (typeFilter) {
        conditions.push(eq(reports.targetType, typeFilter));
      }

      const orderBy =
        sortOrder === "asc"
          ? sql`${reports.createdAt} ASC`
          : sql`${reports.createdAt} DESC`;

      const [error, results] = await tryCatch(() =>
        db
          .select()
          .from(reports)
          .where(sql`${sql.join(conditions, sql` AND `)}`)
          .orderBy(orderBy),
      );

      if (error || !results) {
        set.status = 500;
        return { error: "Failed to fetch reports" };
      }

      // Batch fetch target content (2 queries max, no N+1)
      const postIds = results
        .filter((r) => r.targetType === "post")
        .map((r) => r.targetId);
      const commentIds = results
        .filter((r) => r.targetType === "comment")
        .map((r) => r.targetId);

      let postMap: Record<
        string,
        {
          title: string;
          body: string;
          board: string;
          deletedAt: Date | null;
        }
      > = {};
      let commentMap: Record<
        string,
        { body: string; postId: string; deletedAt: Date | null }
      > = {};

      if (postIds.length > 0) {
        const [, postRows] = await tryCatch(() =>
          db
            .select({
              id: posts.id,
              title: posts.title,
              body: posts.body,
              board: posts.board,
              deletedAt: posts.deletedAt,
            })
            .from(posts)
            .where(
              sql`${posts.id} IN (${sql.join(
                postIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            ),
        );
        if (postRows) {
          for (const p of postRows) {
            postMap[p.id] = {
              title: p.title,
              body: p.body,
              board: p.board,
              deletedAt: p.deletedAt,
            };
          }
        }
      }

      if (commentIds.length > 0) {
        const [, commentRows] = await tryCatch(() =>
          db
            .select({
              id: comments.id,
              body: comments.body,
              postId: comments.postId,
              deletedAt: comments.deletedAt,
            })
            .from(comments)
            .where(
              sql`${comments.id} IN (${sql.join(
                commentIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            ),
        );
        if (commentRows) {
          for (const c of commentRows) {
            commentMap[c.id] = {
              body: c.body,
              postId: c.postId,
              deletedAt: c.deletedAt,
            };
          }
        }
      }

      // If board filter is set, get post IDs for those comments
      let commentPostBoards: Record<string, string> = {};
      if (boardFilter && commentIds.length > 0) {
        const commentPostIds = Object.values(commentMap).map((c) => c.postId);
        if (commentPostIds.length > 0) {
          const [, boardRows] = await tryCatch(() =>
            db
              .select({ id: posts.id, board: posts.board })
              .from(posts)
              .where(
                sql`${posts.id} IN (${sql.join(
                  commentPostIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`,
              ),
          );
          if (boardRows) {
            for (const b of boardRows) {
              commentPostBoards[b.id] = b.board;
            }
          }
        }
      }

      // Enrich and filter
      let enriched = results.map((r) => {
        if (r.targetType === "post") {
          const target = postMap[r.targetId];
          return {
            ...r,
            targetContent: target
              ? {
                  title: target.title,
                  body: target.body,
                  board: target.board,
                  deletedAt: target.deletedAt,
                }
              : { title: "[Deleted]", body: "", board: null },
          };
        } else {
          const target = commentMap[r.targetId];
          const board = target
            ? commentPostBoards[target.postId] ||
              postMap[target.postId]?.board ||
              null
            : null;
          return {
            ...r,
            targetContent: target
              ? {
                  body: target.body,
                  postId: target.postId,
                  board,
                  deletedAt: target.deletedAt,
                }
              : { body: "[Deleted]", postId: null, board: null },
          };
        }
      });

      // Apply board filter
      if (boardFilter) {
        enriched = enriched.filter((r) => {
          const board = r.targetContent?.board;
          return board === boardFilter;
        });
      }

      return enriched;
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        type: t.Optional(t.String()),
        board: t.Optional(t.String()),
        sort: t.Optional(t.String()),
      }),
    },
  )

  // Resolve/reject a report (admin only)
  .patch(
    "/:id",
    async ({ params, body, auth, set }) => {
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (auth.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const action = body.action as "resolve" | "reject";

      const [error, updated] = await tryCatch(() =>
        db.transaction(async (tx) => {
          if (action === "resolve") {
            const [report] = await tx
              .select()
              .from(reports)
              .where(eq(reports.id, params.id))
              .limit(1);

            if (!report) throw new Error("Report not found");

            if (report.targetType === "post") {
              await tx
                .update(posts)
                .set({ deletedAt: new Date() })
                .where(and(eq(posts.id, report.targetId), isNull(posts.deletedAt)));
            } else {
              const [comment] = await tx
                .select({ postId: comments.postId, deletedAt: comments.deletedAt })
                .from(comments)
                .where(eq(comments.id, report.targetId))
                .limit(1);

              if (comment && !comment.deletedAt) {
                await tx
                  .update(comments)
                  .set({ deletedAt: new Date() })
                  .where(
                    and(eq(comments.id, report.targetId), isNull(comments.deletedAt)),
                  );

                await tx
                  .update(posts)
                  .set({
                    commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
                  })
                  .where(eq(posts.id, comment.postId));
              }
            }
          }

          const [result] = await tx
            .update(reports)
            .set({
              status: action === "resolve" ? "resolved" : "rejected",
              resolvedAt: new Date(),
            })
            .where(eq(reports.id, params.id))
            .returning();

          return result;
        }),
      );

      if (error || !updated) {
        set.status = error === "Report not found" ? 404 : 500;
        return { error: error || "Failed to process report" };
      }
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ action: t.String() }),
    },
  );
