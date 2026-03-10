import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function AdminPage() {
  const auth = await getAuthUser();

  if (!auth.isAuthenticated || auth.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="size-full grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Welcome, Admin</p>
      </div>
    </main>
  );
}
