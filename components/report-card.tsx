"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useRouter } from "next/navigation";

interface ReportTarget {
  title?: string;
  body?: string;
  board?: string | null;
  postId?: string | null;
}

interface Report {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt: string | null;
  targetContent?: ReportTarget;
}

interface ReportCardProps extends React.ComponentProps<"article"> {
  report: Report;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ReportCard({ report, className, ...props }: ReportCardProps) {
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);
  const isPending = report.status === "pending";
  const content = report.targetContent;
  const preview =
    content?.body && content.body.length > 250
      ? content.body.slice(0, 250) + "…"
      : content?.body || "";

  const handleAction = async (action: "resolve" | "reject") => {
    setIsActing(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(
        action === "resolve"
          ? "Content removed and report resolved"
          : "Report rejected",
      );
      router.refresh();
    } catch {
      toast.error("Failed to process report");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3",
        !isPending && "opacity-60",
        className,
      )}
      {...props}
    >
      {/* Header badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "rounded-sm px-1.5 py-px text-[10px] font-medium",
              report.targetType === "post"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {report.targetType.toUpperCase()}
          </span>
          {content?.board && (
            <span className="rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
              {content.board}
            </span>
          )}
          <span
            className={cn(
              "rounded-sm px-1.5 py-px text-[10px] font-medium",
              report.status === "pending" && "bg-chart-1/10 text-chart-1",
              report.status === "resolved" && "bg-primary/10 text-primary",
              report.status === "rejected" && "bg-muted text-muted-foreground",
            )}
          >
            {report.status}
          </span>
        </div>
        <time
          dateTime={report.createdAt}
          className="shrink-0 text-[11px] text-muted-foreground"
        >
          {timeAgo(report.createdAt)}
        </time>
      </div>

      {/* Reported content */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Reported content
        </p>
        {content?.title && (
          <p className="text-xs font-semibold text-foreground">{content.title}</p>
        )}
        {preview && (
          <div className="text-xs text-foreground/80 line-clamp-4">
            <MarkdownRenderer content={preview} />
          </div>
        )}
        {!preview && !content?.title && (
          <p className="text-xs italic text-muted-foreground">[Content deleted]</p>
        )}
      </div>

      {/* Reason */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Reason
        </p>
        <p className="text-xs text-foreground">{report.reason}</p>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="destructive"
            disabled={isActing}
            onClick={() => handleAction("resolve")}
            className="flex-1"
          >
            {isActing && <Spinner className="mr-1.5 size-3" />}
            Remove Content
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isActing}
            onClick={() => handleAction("reject")}
            className="flex-1"
          >
            Dismiss
          </Button>
        </div>
      )}

      {report.resolvedAt && (
        <p className="text-[11px] text-muted-foreground">
          Resolved {timeAgo(report.resolvedAt)}
        </p>
      )}
    </article>
  );
}
