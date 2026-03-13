import { Suspense } from "react";
import { LoginForm } from "@/components/login-page";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <Spinner className="size-8" />
              <h1 className="text-xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </Suspense>
  );
}
