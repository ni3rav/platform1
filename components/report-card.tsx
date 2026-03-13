"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt: string | null;
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

export function ReportCard({
  report,
  className,
  ...props
}: ReportCardProps) {
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);

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

  const isPending = report.status === "pending";

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3",
        !isPending && "opacity-60",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          className="text-[11px] text-muted-foreground"
        >
          {timeAgo(report.createdAt)}
        </time>
      </div>

      {/* Target ID */}
      <p className="text-[11px] text-muted-foreground font-mono truncate">
        Target: {report.targetId}
      </p>

      {/* Reason */}
      <div className="rounded-md bg-muted/50 px-3 py-2">
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
