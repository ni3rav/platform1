import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { ReportCard } from "@/components/report-card";
import { getAuthUser } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

async function ReportsList({ status }: { status: string }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/reports?status=${status}`, {
    cache: "no-store",
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
        <p className="text-sm text-muted-foreground">
          No {status} reports
        </p>
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
        }) => (
          <ReportCard key={report.id} report={report} />
        ),
      )}
    </div>
  );
}

export default async function AdminPage({ searchParams }: PageProps) {
  const auth = await getAuthUser();

  if (!auth.isAuthenticated || auth.role !== "admin") {
    redirect("/boards");
  }

  const { status = "pending" } = await searchParams;

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
              href={`/admin?status=${value}`}
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

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          }
        >
          <ReportsList status={status} />
        </Suspense>
      </div>
    </main>
  );
}
