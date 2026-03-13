"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BOARDS = [
  { value: "random", label: "Random" },
  { value: "confessions", label: "Confessions" },
  { value: "rant", label: "Rant" },
  { value: "knowledge", label: "Knowledge" },
  { value: "hangout", label: "Hangout" },
] as const;

interface BoardComposeBarProps extends React.ComponentProps<"div"> {
  currentBoard: string;
}

export function BoardComposeBar({
  currentBoard,
  className,
  ...props
}: BoardComposeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isComposing = searchParams.get("editor") === "open";

  const activeBoardLabel = useMemo(
    () => BOARDS.find((board) => board.value === currentBoard)?.label ?? "Board",
    [currentBoard],
  );

  const toggleComposer = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isComposing) {
      params.delete("editor");
      params.delete("title");
      params.delete("body");
    } else {
      params.set("editor", "open");
    }

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const switchBoard = (board: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("editor");
    params.delete("title");
    params.delete("body");
    const next = params.toString();
    router.push(next ? `/boards/${board}?${next}` : `/boards/${board}`);
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleComposer}
          aria-label={isComposing ? "Close editor" : "Open post editor"}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-input bg-card px-3",
            "text-foreground transition-colors active:scale-[0.98]",
            "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isComposing ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M12 5v14M5 12h14" />}
          </svg>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl border border-input bg-card px-3",
              "text-sm text-foreground transition-colors active:scale-[0.98]",
              "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            aria-label="Switch board"
          >
            <span className="truncate">{activeBoardLabel}</span>
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Switch board</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {BOARDS.map((board) => (
              <DropdownMenuItem
                key={board.value}
                onClick={() => switchBoard(board.value)}
                className={cn(currentBoard === board.value && "text-primary font-medium")}
              >
                {board.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
