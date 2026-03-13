"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="flex-1">
        <label htmlFor="type-filter" className="sr-only">
          Filter by type
        </label>
        <select
          id="type-filter"
          defaultValue={currentFilters.type || ""}
          onChange={(e) => navigate("type", e.target.value)}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
            "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          {TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="board-filter" className="sr-only">
          Filter by board
        </label>
        <select
          id="board-filter"
          defaultValue={currentFilters.board || ""}
          onChange={(e) => navigate("board", e.target.value)}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
            "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          {BOARDS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="sort-filter" className="sr-only">
          Sort order
        </label>
        <select
          id="sort-filter"
          defaultValue={currentFilters.sort || "newest"}
          onChange={(e) => navigate("sort", e.target.value)}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground",
            "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          {SORTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
