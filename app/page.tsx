import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getAuthUser();

  if (auth.isAuthenticated) {
    redirect("/boards");
  }

  redirect("/login");
}
