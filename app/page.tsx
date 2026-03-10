import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken } from "@/lib/jwt";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  return (
    <main className="size-full grid place-items-center">
      {payload ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold">You are logged in</h1>
          <p className="text-muted-foreground mt-2">Email: {payload.email}</p>
          <p className="text-muted-foreground">Role: {payload.role}</p>
          {payload.role === "admin" && (
            <Link
              href="/admin"
              className="block mt-4 text-purple-600 hover:underline"
            >
              Go to Admin Panel
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <Link
            href="/login"
            className="block mt-4 text-purple-600 hover:underline"
          >
            Go to Login
          </Link>
        </div>
      )}
    </main>
  );
}
