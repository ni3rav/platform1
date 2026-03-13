"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "hot", label: "Hot" },
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
] as const;

interface SortTabsProps extends React.ComponentProps<"nav"> {}

export function SortTabs({ className, ...props }: SortTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "hot";

  const buildHref = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav
      aria-label="Sort posts"
      className={cn("flex gap-1 rounded-lg bg-muted/50 p-1", className)}
      {...props}
    >
      {SORT_OPTIONS.map(({ value, label }) => (
        <Link
          key={value}
          href={buildHref(value)}
          aria-current={currentSort === value ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            currentSort === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
