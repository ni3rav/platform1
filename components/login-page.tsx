"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VALID_EMAIL_REGEX } from "@/lib/constants";
import z from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateOtp } from "@/actions/login";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export const loginSchema = z.object({
  email: z.email().regex(VALID_EMAIL_REGEX).transform(val => val.toLowerCase()),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    const result = await generateOtp(data.email);
    
    if (result.success) {
      toast.success("Please check your inbox for verification code");
      reset(); // Clear the input field
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } else {
      if (result.error?.includes("minutes before requesting another OTP")) {
        toast.warning(result.error);
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    }
  };

  const onError = () => {
    toast.error("Please enter a valid institute email");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome to Platform1</h1>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Enter your institute email address"
              {...register("email")}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              {isSubmitting ? "Sending OTP..." : "Login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By logging in, you agree to our <a href="#">ToS</a>
      </FieldDescription>
    </div>
  );
}
