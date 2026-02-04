"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { verifyOtp } from "@/actions/login";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Spinner } from "@/components/ui/spinner";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const [otpValue, setOtpValue] = useState("");

  if (!email) {
    toast.error("Invalid verification request");
    router.push("/login");
    return null;
  }

  const onSubmit = async (data: z.infer<typeof otpSchema>) => {
    try {
      const result = await verifyOtp(email, data.otp);
      
      if (result.success) {
        toast.success("Login successful!");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to verify OTP",
      );
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpValue(value);
    setValue("otp", value);
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center mb-6">
              <h1 className="text-xl font-bold">Verify Your Email</h1>
              <p className="text-muted-foreground text-sm">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            
            <Field>
              <FieldLabel className="text-center block mb-4">Verification Code</FieldLabel>
              <div className="flex justify-center mb-6">
                <InputOTP 
                  maxLength={6} 
                  value={otpValue}
                  onChange={handleOtpChange}
                  disabled={isSubmitting}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <input 
                type="hidden" 
                {...register("otp")} 
              />
              {errors.otp && (
                <p className="text-destructive text-sm text-center mb-4">
                  {errors.otp.message}
                </p>
              )}
            </Field>
            
            <Field>
              <Button type="submit" className="w-full" disabled={isSubmitting || otpValue?.length !== 6}>
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
      <VerifyContent />
    </Suspense>
  );
}
