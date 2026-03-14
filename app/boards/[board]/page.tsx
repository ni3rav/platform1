import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/post-card";
import { CreatePostForm } from "@/components/create-post-form";
import { SortTabs } from "@/components/sort-tabs";
import { BoardsHeaderActions } from "@/components/boards-header-actions";
import { BoardComposeBar } from "@/components/board-compose-bar";
import { getAuthUser } from "@/lib/auth";

const VALID_BOARDS = ["random", "confessions", "rant", "knowledge", "hangout"];

const BOARD_META: Record<string, { label: string; emoji: string }> = {
  random: { label: "Random", emoji: "🎲" },
  confessions: { label: "Confessions", emoji: "🤫" },
  rant: { label: "Rant", emoji: "😤" },
  knowledge: { label: "Knowledge", emoji: "📚" },
  hangout: { label: "Hangout", emoji: "☕" },
};

interface PageProps {
  params: Promise<{ board: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    editor?: string;
    title?: string;
    body?: string;
  }>;
}

async function PostFeed({
  board,
  sort,
  page,
  canDelete,
}: {
  board: string;
  sort: string;
  page: string;
  canDelete: boolean;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/posts?board=${board}&sort=${sort}&page=${page}&limit=20`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failed to load posts
      </p>
    );
  }

  const data = await res.json();
  const posts = data.posts ?? [];

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No posts yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Be the first to post something!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map(
        (post: {
          id: string;
          board: string;
          title: string;
          body: string;
          isAdminPost: boolean;
          score: number;
          commentCount: number;
          createdAt: string;
          userVote: number;
        }) => (
          <PostCard
            key={post.id}
            id={post.id}
            board={post.board}
            title={post.title}
            body={post.body}
            isAdminPost={post.isAdminPost}
            score={post.score}
            commentCount={post.commentCount}
            createdAt={post.createdAt}
            userVote={post.userVote}
            canDelete={canDelete}
          />
        ),
      )}
    </div>
  );
}

export default async function BoardPage({ params, searchParams }: PageProps) {
  const { board } = await params;
  const { sort = "hot", page = "1", editor, title, body } = await searchParams;

  if (!VALID_BOARDS.includes(board)) notFound();

  const auth = await getAuthUser();
  if (!auth.isAuthenticated) {
    redirect("/login");
  }
  const meta = BOARD_META[board];
  const isComposing =
    editor === "open" || Boolean(title?.length) || Boolean(body?.length);

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-6 pb-24">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/boards"
              aria-label="Back to boards"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
            <span className="text-xl" aria-hidden="true">
              {meta.emoji}
            </span>
            <h1 className="text-lg font-bold text-foreground">{meta.label}</h1>
          </div>

          <BoardsHeaderActions
            isAuthenticated={auth.isAuthenticated}
            isAdmin={auth.role === "admin"}
            showAdminAction={false}
          />
        </header>

        <CreatePostForm
          defaultBoard={board}
          isAdmin={auth.role === "admin"}
          className="mb-4"
        />

        {!isComposing && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <Suspense fallback={null}>
                <SortTabs />
              </Suspense>
            </div>

            <Suspense
              fallback={
                <div className="space-y-2 py-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-lg border bg-card p-4"
                    >
                      <div className="w-8 shrink-0 space-y-1.5">
                        <div className="h-6 rounded-md bg-muted/20 animate-pulse" />
                        <div className="h-4 rounded-md bg-muted/20 animate-pulse" />
                        <div className="h-6 rounded-md bg-muted/20 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded-md bg-muted/20 animate-pulse" />
                        <div className="h-3 w-full rounded-md bg-muted/20 animate-pulse" />
                        <div className="h-3 w-5/6 rounded-md bg-muted/20 animate-pulse" />
                        <div className="h-3 w-1/3 rounded-md bg-muted/20 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <PostFeed
                board={board}
                sort={sort}
                page={page}
                canDelete={auth.role === "admin"}
              />
            </Suspense>
          </>
        )}
      </div>

      {!isComposing && <BoardComposeBar currentBoard={board} />}
    </main>
  );
}
