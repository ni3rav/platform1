import Link from "next/link";
import { getAuthUser } from "@/lib/auth";

export default async function HomePage() {
  const auth = await getAuthUser();

  return (
    <main className="size-full grid place-items-center">
      {auth.isAuthenticated ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold">You are logged in</h1>
          <p className="text-muted-foreground">Role: {auth.role}</p>
          {auth.role === "admin" && (
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
