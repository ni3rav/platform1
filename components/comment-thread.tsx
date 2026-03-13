"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VoteButton } from "@/components/vote-button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { CommentForm } from "@/components/comment-form";
import { ReportButton } from "@/components/report-button";

interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  isAdminComment: boolean;
  score: number;
  createdAt: string;
  userVote: number;
}

interface CommentThreadProps extends React.ComponentProps<"div"> {
  comments: Comment[];
  postId: string;
  isAuthenticated: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function buildTree(comments: Comment[]): Map<string | null, Comment[]> {
  const tree = new Map<string | null, Comment[]>();
  for (const c of comments) {
    const key = c.parentId;
    if (!tree.has(key)) tree.set(key, []);
    tree.get(key)!.push(c);
  }
  return tree;
}

function countDirectChildren(
  commentId: string,
  tree: Map<string | null, Comment[]>,
): number {
  return (tree.get(commentId) || []).length;
}

/** Chevron icon that rotates based on expanded state */
function CollapseIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "transition-transform duration-150",
        expanded ? "rotate-90" : "rotate-0",
      )}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CommentNode({
  comment,
  tree,
  postId,
  isAuthenticated,
}: {
  comment: Comment;
  tree: Map<string | null, Comment[]>;
  postId: string;
  isAuthenticated: boolean;
}) {
  const children = tree.get(comment.id) || [];
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const hasChildren = children.length > 0;

  return (
    <article className="group/comment">
      <div className="flex gap-2 py-2">
        <VoteButton
          targetType="comment"
          targetId={comment.id}
          initialScore={comment.score}
          initialUserVote={comment.userVote}
          isAuthenticated={isAuthenticated}
          compact
        />

        <div className="min-w-0 flex-1 space-y-1">
          {/* Meta row */}
          <div className="flex items-center gap-1.5">
            {hasChildren && (
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? "Collapse replies" : "Expand replies"}
                aria-expanded={isExpanded}
                className={cn(
                  "rounded p-0.5 text-muted-foreground",
                  "transition-colors hover:text-foreground hover:bg-muted",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                <CollapseIcon expanded={isExpanded} />
              </button>
            )}
            {comment.isAdminComment && (
              <span className="rounded-sm bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                MOD
              </span>
            )}
            <time
              dateTime={comment.createdAt}
              className="text-[11px] text-muted-foreground"
            >
              {timeAgo(comment.createdAt)}
            </time>
            {/* Collapsed summary */}
            {!isExpanded && hasChildren && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] text-primary",
                  "transition-colors hover:bg-primary/10",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                {countDirectChildren(comment.id, tree)}{" "}
                {countDirectChildren(comment.id, tree) === 1
                  ? "reply"
                  : "replies"}
              </button>
            )}
          </div>

          {/* Comment body + actions — always visible */}
          <div className="text-xs text-foreground">
            <MarkdownRenderer content={comment.body} />
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            {isAuthenticated && !showReply && (
              <button
                type="button"
                onClick={() => setShowReply(true)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground",
                  "transition-colors hover:text-foreground hover:bg-muted",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                Reply
              </button>
            )}
            <ReportButton
              targetType="comment"
              targetId={comment.id}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {showReply && (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder="Write a reply…"
              autoFocus
              onCancel={() => setShowReply(false)}
              onSuccess={() => setShowReply(false)}
              className="pt-1"
            />
          )}
        </div>
      </div>

      {/* Child comments — each level independently expandable */}
      {isExpanded && hasChildren && (
        <div className="ml-4 border-l-2 border-border pl-2">
          {children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              tree={tree}
              postId={postId}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export function CommentThread({
  comments,
  postId,
  isAuthenticated,
  className,
  ...props
}: CommentThreadProps) {
  const tree = buildTree(comments);
  const rootComments = tree.get(null) || [];

  if (comments.length === 0) {
    return (
      <div
        className={cn(
          "py-8 text-center text-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        No comments yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div
      className={cn("divide-y divide-border", className)}
      {...props}
    >
      {rootComments.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          tree={tree}
          postId={postId}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
