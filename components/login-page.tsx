"use client"
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
import { useState } from "react";

export const loginSchema = z.object({
  email: z
    .email()
    .regex(
      VALID_EMAIL_REGEX,
      "Email must assume the format: name.branch.id@adaniuni.ac.in",
    ),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!VALID_EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid institute email");
      return;
    }
    
    toast.success("Login successful!");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <Button type="submit">Login</Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By logging in, you agree to our <a href="#">ToS</a>
      </FieldDescription>
    </div>
  );
}
