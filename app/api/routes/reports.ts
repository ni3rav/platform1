import { Elysia, t } from "elysia";
import { db } from "@/db";
import { reports } from "@/db/schema/reports";
import { posts } from "@/db/schema/posts";
import { comments } from "@/db/schema/comments";
import { eq, sql } from "drizzle-orm";
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

  // List reports (admin only)
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

      const [error, results] = await tryCatch(() =>
        db
          .select()
          .from(reports)
          .where(eq(reports.status, status))
          .orderBy(reports.createdAt),
      );

      if (error || !results) {
        set.status = 500;
        return { error: "Failed to fetch reports" };
      }
      return results;
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
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
              await tx.delete(posts).where(eq(posts.id, report.targetId));
            } else {
              const [comment] = await tx
                .select({ postId: comments.postId })
                .from(comments)
                .where(eq(comments.id, report.targetId))
                .limit(1);

              await tx
                .delete(comments)
                .where(eq(comments.id, report.targetId));

              if (comment) {
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
