import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { VoteButton } from "@/components/vote-button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { getAuthUser } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

const BOARD_META: Record<string, { label: string; emoji: string }> = {
  random: { label: "Random", emoji: "🎲" },
  confessions: { label: "Confessions", emoji: "🤫" },
  rant: { label: "Rant", emoji: "😤" },
  knowledge: { label: "Knowledge", emoji: "📚" },
  hangout: { label: "Hangout", emoji: "☕" },
};

interface PageProps {
  params: Promise<{ board: string; id: string }>;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

async function CommentsSection({
  postId,
  isAuthenticated,
}: {
  postId: string;
  isAuthenticated: boolean;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/comments/post/${postId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Failed to load comments
      </p>
    );
  }

  const comments = await res.json();

  return (
    <CommentThread
      comments={comments}
      postId={postId}
      isAuthenticated={isAuthenticated}
    />
  );
}

export default async function PostDetailPage({ params }: PageProps) {
  const { board, id } = await params;
  const meta = BOARD_META[board];
  if (!meta) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();

  const post = await res.json();
  if (post.error) notFound();

  const auth = await getAuthUser();

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        {/* Header */}
        <header className="mb-4 flex items-center gap-3">
          <Link
            href={`/boards/${board}`}
            aria-label={`Back to ${meta.label}`}
            className={cn(
              "rounded-md p-1 text-muted-foreground",
              "transition-colors hover:text-foreground hover:bg-muted",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="text-lg" aria-hidden="true">
            {meta.emoji}
          </span>
          <span className="text-sm text-muted-foreground">{meta.label}</span>
        </header>

        {/* Post */}
        <article className="rounded-lg border bg-card p-5">
          <div className="flex gap-3">
            <VoteButton
              targetType="post"
              targetId={post.id}
              initialScore={post.score}
              initialUserVote={post.userVote ?? 0}
            />

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground text-pretty">
                    {post.title}
                  </h1>
                  {post.isAdminPost && (
                    <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                      MOD
                    </span>
                  )}
                </div>
                <time
                  dateTime={post.createdAt}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {timeAgo(post.createdAt)}
                </time>
              </div>

              <div className="text-sm text-foreground">
                <MarkdownRenderer content={post.body} />
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                <span>
                  {post.commentCount}{" "}
                  {post.commentCount === 1 ? "comment" : "comments"}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Comment Form */}
        <section aria-label="Comments" className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Comments</h2>

          {auth.isAuthenticated && (
            <CommentForm postId={id} className="mb-2" />
          )}

          {!auth.isAuthenticated && (
            <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                <Link
                  href="/login"
                  className="text-primary underline underline-offset-2 transition-colors hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Login
                </Link>{" "}
                to join the discussion
              </p>
            </div>
          )}

          {/* Comments Thread */}
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Spinner className="size-5" />
              </div>
            }
          >
            <CommentsSection
              postId={id}
              isAuthenticated={auth.isAuthenticated}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
