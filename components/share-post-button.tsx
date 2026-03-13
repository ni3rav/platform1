"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SharePostButtonProps extends React.ComponentProps<"button"> {
  title: string;
}

export function SharePostButton({
  title,
  className,
  ...props
}: SharePostButtonProps) {
  const handleShare = async () => {
    try {
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Post link copied");
    } catch {
      toast.error("Could not share this post");
    }
  };

  return (
    <button
      type="button"
      aria-label="Share post"
      title="Share post"
      onClick={handleShare}
      className={cn(
        "rounded-md p-1 text-muted-foreground transition-colors",
        "hover:text-foreground hover:bg-muted",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      {...props}
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
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51 15.42 17.49" />
        <path d="M15.41 6.51 8.59 10.49" />
      </svg>
    </button>
  );
}
