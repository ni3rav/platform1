import { createHash } from "node:crypto";
import { verifyToken, type TokenPayload } from "@/lib/jwt";

export interface ApiAuth {
  role: "admin" | "user";
  voterHash: string;
  jti: string;
}

/**
 * Extract and verify JWT from cookie header string.
 * Returns null if unauthenticated.
 */
export function extractAuth(cookieHeader: string | undefined): ApiAuth | null {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/auth-token=([^;]+)/);
  if (!match) return null;

  let payload: TokenPayload | null;
  try {
    payload = verifyToken(match[1]);
  } catch {
    return null;
  }

  if (!payload) return null;

  return {
    role: payload.role,
    voterHash: createHash("sha256").update(payload.jti).digest("hex"),
    jti: payload.jti,
  };
}
