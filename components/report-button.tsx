"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const reportSchema = z.object({
  reason: z.string().min(1, "Please provide a reason").max(1000),
});

interface ReportButtonProps extends React.ComponentProps<"div"> {
  targetType: "post" | "comment";
  targetId: string;
}

export function ReportButton({
  targetType,
  targetId,
  className,
  ...props
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = async (data: z.infer<typeof reportSchema>) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: data.reason,
        }),
      });

      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Report submitted. Thanks for helping keep things clean.");
      reset();
      setIsOpen(false);
    } catch {
      toast.error("Failed to submit report");
    }
  };

  return (
    <div className={cn(className)} {...props}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Report this ${targetType}`}
          className={cn(
            "rounded-md p-1 text-muted-foreground",
            "transition-colors hover:text-destructive hover:bg-destructive/10",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" x2="4" y1="22" y2="15" />
          </svg>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-2 space-y-2 rounded-md border bg-card p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Report this {targetType}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                reset();
              }}
              className={cn(
                "rounded-md p-0.5 text-muted-foreground",
                "transition-colors hover:text-foreground hover:bg-muted",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              aria-label="Cancel report"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <textarea
            rows={2}
            placeholder="What's the issue?…"
            spellCheck={false}
            className={cn(
              "w-full resize-y rounded-md border border-input bg-background px-3 py-2",
              "text-xs text-foreground placeholder:text-muted-foreground",
              "min-h-12 transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            {...register("reason")}
          />
          {errors.reason && (
            <p className="text-[11px] text-destructive">
              {errors.reason.message}
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Spinner className="mr-1.5 size-3" />}
            {isSubmitting ? "Submitting…" : "Submit Report"}
          </Button>
        </form>
      )}
    </div>
  );
}
