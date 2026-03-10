import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/lib/env";

export type UserRole = "admin" | "user";

export interface User {
  role: UserRole;
}

export interface TokenPayload extends JwtPayload {
  role: UserRole;
  jti: string;
  iat: number;
}

export function signToken(user: User): string {
  const jti = crypto.randomUUID();
  
  return jwt.sign({ role: user.role, jti }, env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  }) as TokenPayload | null;
}
