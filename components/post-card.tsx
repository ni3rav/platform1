"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { VoteButton } from "@/components/vote-button";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface PostCardProps extends React.ComponentProps<"article"> {
  id: string;
  board: string;
  title: string;
  body: string;
  isAdminPost: boolean;
  score: number;
  commentCount: number;
  createdAt: string;
  userVote: number;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PostCard({
  id,
  board,
  title,
  body,
  isAdminPost,
  score,
  commentCount,
  createdAt,
  userVote,
  className,
  ...props
}: PostCardProps) {
  const preview = body.length > 200 ? body.slice(0, 200) + "…" : body;

  return (
    <article
      className={cn(
        "group flex gap-3 rounded-lg border bg-card p-4",
        "transition-colors hover:bg-muted/50",
        className,
      )}
      {...props}
    >
      <VoteButton
        targetType="post"
        targetId={id}
        initialScore={score}
        initialUserVote={userVote}
      />

      <Link
        href={`/boards/${board}/post/${id}`}
        className="flex-1 min-w-0 space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground truncate text-pretty">
            {title}
          </h2>
          {isAdminPost && (
            <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
              MOD
            </span>
          )}
        </div>

        <div className="line-clamp-2 text-xs text-muted-foreground">
          <MarkdownRenderer content={preview} />
        </div>

        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {commentCount}
          </span>
          <time dateTime={createdAt}>{timeAgo(createdAt)}</time>
        </div>
      </Link>
    </article>
  );
}
