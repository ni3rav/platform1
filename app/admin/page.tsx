import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    redirect("/login");
  }
  
  const payload = verifyToken(token);
  
  if (!payload || payload.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="size-full grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Welcome, {payload.email}</p>
      </div>
    </main>
  );
}
