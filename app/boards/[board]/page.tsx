import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/post-card";
import { CreatePostForm } from "@/components/create-post-form";
import { SortTabs } from "@/components/sort-tabs";
import { getAuthUser } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

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
  searchParams: Promise<{ sort?: string; page?: string }>;
}

async function PostFeed({
  board,
  sort,
  page,
}: {
  board: string;
  sort: string;
  page: string;
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
          />
        ),
      )}
    </div>
  );
}

export default async function BoardPage({ params, searchParams }: PageProps) {
  const { board } = await params;
  const { sort = "hot", page = "1" } = await searchParams;

  if (!VALID_BOARDS.includes(board)) notFound();

  const auth = await getAuthUser();
  const meta = BOARD_META[board];

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
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
        </header>

        {auth.isAuthenticated && (
          <CreatePostForm defaultBoard={board} className="mb-4" />
        )}

        <div className="mb-4 flex items-center justify-between">
          <Suspense fallback={null}>
            <SortTabs />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          }
        >
          <PostFeed board={board} sort={sort} page={page} />
        </Suspense>
      </div>
    </main>
  );
}
