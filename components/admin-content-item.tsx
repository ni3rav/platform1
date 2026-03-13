"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MarkdownRenderer } from "@/components/markdown-renderer";

type AdminPostItem = {
  id: string;
  board: string;
  title: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
};

type AdminCommentItem = {
  id: string;
  postId: string;
  postBoard: string;
  postTitle: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
};

interface AdminContentItemProps extends React.ComponentProps<"article"> {
  itemType: "post" | "comment";
  item: AdminPostItem | AdminCommentItem;
}

export function AdminContentItem({
  itemType,
  item,
  className,
  ...props
}: AdminContentItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeleted = Boolean(item.deletedAt);

  const preview =
    item.body.length > 220 ? `${item.body.slice(0, 220)}…` : item.body;

  const handleDelete = async () => {
    if (isDeleted) return;

    setIsDeleting(true);
    try {
      const endpoint =
        itemType === "post" ? `/api/posts/${item.id}` : `/api/comments/${item.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success(`${itemType === "post" ? "Post" : "Comment"} deleted`);
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      className={cn("rounded-lg border bg-card p-3 space-y-2.5", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
            {itemType.toUpperCase()}
          </span>
          <span className="rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
            {itemType === "post"
              ? (item as AdminPostItem).board
              : (item as AdminCommentItem).postBoard}
          </span>
          {isDeleted && (
            <span className="rounded-sm bg-destructive/10 px-1.5 py-px text-[10px] font-medium text-destructive">
              deleted
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isDeleting || isDeleted}
          onClick={handleDelete}
        >
          {isDeleting && <Spinner className="mr-1.5 size-3" />}
          {isDeleted ? "Deleted" : "Delete"}
        </Button>
      </div>

      {itemType === "post" ? (
        <Link
          href={`/boards/${(item as AdminPostItem).board}/post/${item.id}`}
          className="block text-xs font-semibold text-foreground hover:underline"
        >
          {(item as AdminPostItem).title}
        </Link>
      ) : (
        <p className="text-xs font-semibold text-foreground">
          {(item as AdminCommentItem).postTitle}
        </p>
      )}

      <div className="text-xs text-foreground/80 line-clamp-4">
        <MarkdownRenderer content={preview} />
      </div>
    </article>
  );
}
