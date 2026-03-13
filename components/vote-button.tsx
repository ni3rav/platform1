"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VoteButtonProps extends React.ComponentProps<"div"> {
  targetType: "post" | "comment";
  targetId: string;
  initialScore: number;
  initialUserVote: number;
  isAuthenticated?: boolean;
  compact?: boolean;
}

export function VoteButton({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
  isAuthenticated = true,
  compact = false,
  className,
  ...props
}: VoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const vote = (value: number) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    const newValue = userVote === value ? 0 : value;
    const scoreDelta = newValue - userVote;

    setScore((s) => s + scoreDelta);
    setUserVote(newValue);

    startTransition(async () => {
      try {
        const endpoint =
          targetType === "post"
            ? `/api/votes/post/${targetId}`
            : `/api/votes/comment/${targetId}`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newValue }),
        });

        const data = await res.json();

        if (!res.ok && data.error === "Unauthorized") {
          setShowAuthDialog(true);
          setScore(initialScore);
          setUserVote(initialUserVote);
          return;
        }

        if (data.error) {
          setScore(initialScore);
          setUserVote(initialUserVote);
        } else {
          setScore(data.score);
          setUserVote(data.userVote);
        }
      } catch {
        setScore(initialScore);
        setUserVote(initialUserVote);
      }
    });
  };

  const iconSize = compact ? 14 : 16;

  return (
    <>
      <div
        className={cn(
          "flex items-center select-none",
          compact ? "flex-row gap-0.5" : "flex-col gap-0",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => vote(1)}
          disabled={isPending}
          aria-label="Upvote"
          className={cn(
            "rounded-md p-1 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            userVote === 1
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill={userVote === 1 ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>

        <span
          className={cn(
            "font-semibold text-center tabular-nums",
            compact ? "text-xs min-w-6" : "text-sm min-w-8",
            score > 0 && "text-primary",
            score < 0 && "text-destructive",
            score === 0 && "text-muted-foreground",
          )}
        >
          {score}
        </span>

        <button
          type="button"
          onClick={() => vote(-1)}
          disabled={isPending}
          aria-label="Downvote"
          className={cn(
            "rounded-md p-1 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            userVote === -1
              ? "text-destructive"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill={userVote === -1 ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login required</DialogTitle>
            <DialogDescription>
              Login with your institute email to vote, comment, and report posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild>
              <Link href="/login">Login with institute email</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
