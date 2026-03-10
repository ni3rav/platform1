import { Elysia, t } from "elysia";
import { verifyRoutes } from "@/app/api/routes/verify";
import { postRoutes } from "@/app/api/routes/posts";
import { voteRoutes } from "@/app/api/routes/votes";
import { commentRoutes } from "@/app/api/routes/comments";
import { reportRoutes } from "@/app/api/routes/reports";

export const app = new Elysia({ prefix: "/api" })
  .use(verifyRoutes)
  .use(postRoutes)
  .use(voteRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .get("/", "Hello Nextjs")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
