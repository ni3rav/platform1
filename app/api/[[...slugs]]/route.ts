import { Elysia, t } from "elysia";
import { verifyRoutes } from "@/app/api/routes/verify";

export const app = new Elysia({ prefix: "/api" })
  .use(verifyRoutes)
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
