import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { tryCatch } from "./utils";

export interface AuthUser {
  role: "admin" | "user";
  isAuthenticated: boolean;
}

export async function getAuthUser(): Promise<AuthUser> {
  const [, payload] = await tryCatch(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return { role: "user", isAuthenticated: false } as AuthUser;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return { role: "user", isAuthenticated: false } as AuthUser;
    }

    return {
      role: payload.role,
      isAuthenticated: true,
    } as AuthUser;
  });

  return payload ?? { role: "user", isAuthenticated: false };
}

export async function verifyAuthUser(token: string) {
  const [error] = await tryCatch(async () => {
    const payload = verifyToken(token);

    if (!payload) {
      return { valid: false, error: "Invalid token" };
    }

    return {
      valid: true,
      user: {
        role: payload.role,
        isAuthenticated: true,
      },
    };
  });

  if (error) {
    return { valid: false, error };
  }

  return { valid: false, error: "Something went wrong" };
}

export async function requireAuth(): Promise<AuthUser> {
  return await getAuthUser();
}

export async function requireAdmin(): Promise<AuthUser> {
  const auth = await getAuthUser();

  if (!auth.isAuthenticated || auth.role !== "admin") {
    return { role: "user", isAuthenticated: false };
  }

  return auth;
}
