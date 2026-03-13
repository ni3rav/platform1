"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialValues = useMemo(() => {
    const boardFromQuery = searchParams.get("board") || "";
    const titleFromQuery = searchParams.get("title") || "";
    const bodyFromQuery = searchParams.get("body") || "";
    const board = defaultBoard || boardFromQuery;
    const shouldOpen =
      searchParams.get("editor") === "open" ||
      titleFromQuery.length > 0 ||
      bodyFromQuery.length > 0;

    return {
      board,
      title: titleFromQuery,
      body: bodyFromQuery,
      shouldOpen,
    };
  }, [defaultBoard, searchParams]);

  const [isOpen, setIsOpen] = useState(initialValues.shouldOpen);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      board: initialValues.board,
      title: initialValues.title,
      body: initialValues.body,
    },
  });

  const titleValue = watch("title");
  const bodyValue = watch("body");
  const boardValue = watch("board");

  const syncComposerQuery = useCallback(
    ({
      open,
      title,
      body,
      board,
    }: {
      open: boolean;
      title: string;
      body: string;
      board: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (board) {
        params.set("board", board);
      } else {
        params.delete("board");
      }

      if (open) {
        params.set("editor", "open");
        if (title) params.set("title", title);
        else params.delete("title");
        if (body) params.set("body", body);
        else params.delete("body");
      } else {
        params.delete("editor");
        params.delete("title");
        params.delete("body");
      }

      const current = searchParams.toString();
      const next = params.toString();
      if (current !== next) {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      syncComposerQuery({
        open: true,
        title: titleValue,
        body: bodyValue,
        board: defaultBoard || boardValue || "",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isOpen, titleValue, bodyValue, boardValue, defaultBoard, syncComposerQuery]);

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
      reset({ board: defaultBoard || boardValue || "", title: "", body: "" });
      setIsOpen(false);
      syncComposerQuery({
        open: false,
        title: "",
        body: "",
        board: defaultBoard || boardValue || "",
      });
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
          onClick={() => {
            setIsOpen(true);
            syncComposerQuery({
              open: true,
              title: titleValue,
              body: bodyValue,
              board: defaultBoard || boardValue || "",
            });
          }}
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
                reset({ board: defaultBoard || boardValue || "", title: "", body: "" });
                syncComposerQuery({
                  open: false,
                  title: "",
                  body: "",
                  board: defaultBoard || boardValue || "",
                });
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
            <p className="text-xs text-muted-foreground">
              Title limit: 1 to 300 characters
            </p>
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
              Body limit: 1 to 10000 characters (markdown supported)
            </p>
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

