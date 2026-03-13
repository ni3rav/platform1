"use client";

import { useRouter } from "next/navigation";
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
  { value: "", label: "All boards" },
  { value: "random", label: "Random" },
  { value: "confessions", label: "Confessions" },
  { value: "rant", label: "Rant" },
  { value: "knowledge", label: "Knowledge" },
  { value: "hangout", label: "Hangout" },
] as const;

const TYPES = [
  { value: "", label: "All types" },
  { value: "post", label: "Posts" },
  { value: "comment", label: "Comments" },
] as const;

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

interface AdminFiltersProps extends React.ComponentProps<"div"> {
  currentFilters: Record<string, string>;
}

export function AdminFilters({
  currentFilters,
  className,
  ...props
}: AdminFiltersProps) {
  const router = useRouter();

  const navigate = (key: string, value: string) => {
    const params = new URLSearchParams(currentFilters);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin?${params.toString()}`);
  };

  const selectedType = TYPES.find((type) => type.value === (currentFilters.type || ""));
  const selectedBoard = BOARDS.find(
    (board) => board.value === (currentFilters.board || ""),
  );
  const selectedSort = SORTS.find(
    (sort) => sort.value === (currentFilters.sort || "newest"),
  );

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex min-h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
              "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            aria-label="Filter by type"
          >
            <span>{selectedType?.label || "All types"}</span>
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TYPES.map(({ value, label }) => (
              <DropdownMenuItem key={value} onClick={() => navigate("type", value)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex min-h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
              "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            aria-label="Filter by board"
          >
            <span>{selectedBoard?.label || "All boards"}</span>
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by board</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {BOARDS.map(({ value, label }) => (
              <DropdownMenuItem key={value} onClick={() => navigate("board", value)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex min-h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
              "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            aria-label="Sort order"
          >
            <span>{selectedSort?.label || "Newest first"}</span>
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORTS.map(({ value, label }) => (
              <DropdownMenuItem key={value} onClick={() => navigate("sort", value)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
