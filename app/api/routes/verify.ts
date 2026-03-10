import { Elysia, t } from "elysia";
import { verifyAuthUser } from "@/lib/auth";

export const verifyRoutes = new Elysia({ prefix: "/verify" })
  .post("/", async ({ body }) => {
    const { token } = body as { token: string };
    if (!token) {
      return { valid: false, error: "No token provided" };
    }
    return await verifyAuthUser(token);
  }, {
    body: t.Object({
      token: t.String(),
    }),
  });
