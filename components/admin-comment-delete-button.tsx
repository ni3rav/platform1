"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface AdminCommentDeleteButtonProps {
  commentId: string;
}

export function AdminCommentDeleteButton({
  commentId,
}: AdminCommentDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to delete comment");
        return;
      }
      toast.success("Comment deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      size="icon-xs"
      variant="destructive"
      aria-label="Delete comment"
      title="Delete comment"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      {isDeleting ? (
        <Spinner className="size-3" />
      ) : (
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      )}
    </Button>
  );
}
