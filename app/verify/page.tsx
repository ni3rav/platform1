"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyOtp } from "@/actions/login";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: NodeJS.Timeout;

    const autoVerify = async () => {
      if (!email || !otp) {
        toast.error("Invalid verification link");
        redirectTimer = setTimeout(() => {
          if (isMounted) router.push("/login");
        }, 2000);
        return;
      }

      try {
        const result = await verifyOtp(email, otp);

        if (!isMounted) return;

        if (result.success) {
          toast.success("Login successful!");
          setTimeout(() => {
            if (isMounted) router.push("/");
          }, 1000);
        }
      } catch (error) {
        if (!isMounted) return;
        
        toast.error(
          error instanceof Error ? error.message : "Failed to verify OTP",
        );
        redirectTimer = setTimeout(() => {
          if (isMounted) router.push("/login");
        }, 2000);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    autoVerify();

    return () => {
      isMounted = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [email, otp, router]);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8" />
          <h1 className="text-xl font-bold">
            {isVerifying ? "Verifying..." : "Redirecting..."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isVerifying
              ? "Please wait while we verify your login"
              : "You will be redirected shortly"}
          </p>
        </div>
      </div>
    </div>
  );
}
