import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { ReportCard } from "@/components/report-card";
import { AdminContentItem } from "@/components/admin-content-item";
import { AdminFilters } from "@/components/admin-filters";
import { getAuthUser } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    board?: string;
    sort?: string;
  }>;
}

type ModerationPost = {
  id: string;
  board: string;
  title: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
};

type ModerationComment = {
  id: string;
  postId: string;
  postBoard: string;
  postTitle: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
};

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

function buildFilterUrl(
  current: Record<string, string>,
  override: Record<string, string>,
) {
  const params = new URLSearchParams({ ...current, ...override });
  for (const [key, val] of params.entries()) {
    if (!val) params.delete(key);
  }
  return `/admin?${params.toString()}`;
}

async function ReportsList({
  status,
  type,
  board,
  sort,
}: {
  status: string;
  type: string;
  board: string;
  sort: string;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const params = new URLSearchParams({ status });
  if (type) params.set("type", type);
  if (board) params.set("board", board);
  if (sort) params.set("sort", sort);

  const res = await fetch(`${baseUrl}/api/reports?${params.toString()}`, {
    cache: "no-store",
    headers: { Cookie: cookieHeader },
  });

  if (!res.ok) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failed to load reports
      </p>
    );
  }

  const reports = await res.json();

  if (reports.error) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {reports.error}
      </p>
    );
  }

  if (!Array.isArray(reports) || reports.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No {status} reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map(
        (report: {
          id: string;
          targetType: "post" | "comment";
          targetId: string;
          reason: string;
          status: "pending" | "resolved" | "rejected";
          createdAt: string;
          resolvedAt: string | null;
          targetContent?: {
            title?: string;
            body?: string;
            board?: string | null;
            postId?: string | null;
          };
        }) => (
          <ReportCard key={report.id} report={report} />
        ),
      )}
    </div>
  );
}

async function DirectModerationList() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const [postsRes, commentsRes] = await Promise.all([
    fetch(`${baseUrl}/api/posts/admin?limit=8&includeDeleted=1`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    }),
    fetch(`${baseUrl}/api/comments/admin?limit=8&includeDeleted=1`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    }),
  ]);

  const [postsData, commentsData] = await Promise.all([
    postsRes.json().catch(() => []),
    commentsRes.json().catch(() => []),
  ]);

  const posts = Array.isArray(postsData) ? postsData : [];
  const comments = Array.isArray(commentsData) ? commentsData : [];

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Direct moderation</h2>
        <p className="text-[11px] text-muted-foreground">
          Delete posts or comments without reports
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Recent posts</h3>
          {posts.length === 0 ? (
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              No posts found
            </p>
          ) : (
            posts.map((post: ModerationPost) => (
              <AdminContentItem key={post.id} itemType="post" item={post} />
            ))
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Recent comments
          </h3>
          {comments.length === 0 ? (
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              No comments found
            </p>
          ) : (
            comments.map((comment: ModerationComment) => (
              <AdminContentItem
                key={comment.id}
                itemType="comment"
                item={comment}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }: PageProps) {
  const auth = await getAuthUser();

  if (!auth.isAuthenticated || auth.role !== "admin") {
    redirect("/boards");
  }

  const {
    status = "pending",
    type = "",
    board = "",
    sort = "newest",
  } = await searchParams;

  const currentFilters = { status, type, board, sort };

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/boards"
            aria-label="Back to boards"
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
          <h1 className="text-lg font-bold text-foreground">Reports</h1>
        </header>

        {/* Status tabs */}
        <nav
          aria-label="Filter reports by status"
          className="mb-4 flex gap-1 rounded-lg bg-muted/50 p-1"
        >
          {STATUS_TABS.map(({ value, label }) => (
            <Link
              key={value}
              href={buildFilterUrl(currentFilters, { status: value })}
              aria-current={status === value ? "page" : undefined}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                status === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Type / Board / Sort filters */}
        <AdminFilters currentFilters={currentFilters} className="mb-4" />

        <Suspense
          fallback={
            <div className="mb-6 flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          }
        >
          <DirectModerationList />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          }
        >
          <ReportsList status={status} type={type} board={board} sort={sort} />
        </Suspense>
      </div>
    </main>
  );
}
