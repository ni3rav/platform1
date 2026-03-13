"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { MarkdownEditor } from "@/components/markdown-editor";

const BOARDS = [
  { value: "random", label: "Random" },
  { value: "confessions", label: "Confessions" },
  { value: "rant", label: "Rant" },
  { value: "knowledge", label: "Knowledge" },
  { value: "hangout", label: "Hangout" },
] as const;

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  body: z.string().min(1, "Body is required").max(10000),
  board: z.string().min(1, "Select a board"),
});

interface CreatePostFormProps extends React.ComponentProps<"div"> {
  defaultBoard?: string;
  onSuccess?: () => void;
}

export function CreatePostForm({
  defaultBoard,
  onSuccess,
  className,
  ...props
}: CreatePostFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: { board: defaultBoard || "", title: "", body: "" },
  });

  const bodyValue = watch("body");

  const onSubmit = async (data: z.infer<typeof createPostSchema>) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Post created!");
      reset();
      setIsOpen(false);
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Failed to create post");
    }
  };

  if (!isOpen) {
    return (
      <div className={cn(className)} {...props}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full justify-start text-muted-foreground"
        >
          What&apos;s on your mind?
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg border bg-card p-4", className)}
      {...props}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              New Post
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                reset();
              }}
              className={cn(
                "rounded-md px-2 py-1 text-xs text-muted-foreground",
                "transition-colors hover:text-foreground hover:bg-muted",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
            >
              Cancel
            </button>
          </div>

          {!defaultBoard && (
            <Field>
              <FieldLabel htmlFor="board">Board</FieldLabel>
              <select
                id="board"
                {...register("board")}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                  "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                <option value="">Select a board…</option>
                {BOARDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              {errors.board && (
                <p className="text-xs text-destructive">
                  {errors.board.message}
                </p>
              )}
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="Give it a title…"
              autoComplete="off"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="body">Body</FieldLabel>
            <Controller
              control={control}
              name="body"
              render={({ field }) => (
                <MarkdownEditor
                  id="body"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write your post…"
                  rows={5}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {bodyValue.length}/10000 characters
            </p>
            {errors.body && (
              <p className="text-xs text-destructive">
                {errors.body.message}
              </p>
            )}
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {isSubmitting ? "Posting…" : "Post"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}

