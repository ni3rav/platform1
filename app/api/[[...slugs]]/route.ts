import { Elysia, t } from "elysia";
import { verifyToken, type TokenPayload } from "@/lib/jwt";

export const app = new Elysia({ prefix: "/api" })
  .get("/", "Hello Nextjs")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })
  .post("/verify", ({ body }) => {
    const { token } = body as { token: string };
    if (!token) {
      return { valid: false, error: "No token provided" };
    }
    const payload = verifyToken(token);
    if (!payload) {
      return { valid: false, error: "Invalid token" };
    }
    return { valid: true, payload: payload as TokenPayload };
  }, {
    body: t.Object({
      token: t.String(),
    }),
  });

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
