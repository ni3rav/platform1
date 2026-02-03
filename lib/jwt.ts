import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/lib/env";
import { VALID_EMAIL_REGEX } from "@/lib/constants";

export interface User {
  email: string;
  role: "admin" | "user";
} 

interface TokenPayload extends JwtPayload {
  email: string;
  role: "admin" | "user";
}

export function signToken(user: User): string {
  if (!VALID_EMAIL_REGEX.test(user.email)) {
    throw new Error("invalid email");
  }

  return jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as TokenPayload;
  } catch {
    return null;
  }
}
