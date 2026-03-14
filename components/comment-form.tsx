"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
});

interface CommentFormProps extends React.ComponentProps<"div"> {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  isAdmin?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus = false,
  placeholder = "Share your thoughts…",
  isAdmin = false,
  className,
  ...props
}: CommentFormProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(!!parentId || autoFocus);
  const [commentAsMod, setCommentAsMod] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (data: z.infer<typeof commentSchema>) => {
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: parentId || undefined,
          body: data.body,
          asMod: isAdmin ? commentAsMod : undefined,
        }),
      });

      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Comment posted!");
      reset();
      setIsExpanded(false);
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Failed to post comment");
    }
  };

  if (!isExpanded) {
    return (
      <div className={cn(className)} {...props}>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2",
            "text-left text-sm text-muted-foreground",
            "transition-colors hover:border-ring hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          {placeholder}
        </button>
      </div>
    );
  }

  return (
    <div className={cn(className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <textarea
          rows={parentId ? 2 : 3}
          placeholder={placeholder}
          autoFocus={autoFocus || !!parentId}
          spellCheck={false}
          className={cn(
            "w-full resize-y rounded-md border border-input bg-background px-3 py-2",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "min-h-16 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
          {...register("body")}
        />
        {errors.body && (
          <p className="text-xs text-destructive">{errors.body.message}</p>
        )}
        <div
          className={cn(
            "flex items-center gap-2",
            isAdmin ? "justify-between" : "justify-end",
          )}
        >
          {isAdmin && (
            <label className="inline-flex w-fit items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm">
              <Switch
                size="sm"
                checked={commentAsMod}
                onCheckedChange={setCommentAsMod}
                aria-label="Comment as moderator"
              />
              <span className={cn(commentAsMod ? "text-primary" : "text-muted-foreground")}>
                {commentAsMod ? "Commenting as MOD" : "Commenting as User"}
              </span>
            </label>
          )}
          <div className="flex items-center gap-2">
            {(parentId || onCancel) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  reset();
                  onCancel?.();
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-1.5 size-3" />}
              {isSubmitting ? "Posting…" : parentId ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
