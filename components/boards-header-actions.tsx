"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logout } from "@/actions/login";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface BoardsHeaderActionsProps extends React.ComponentProps<"div"> {
  isAuthenticated: boolean;
  isAdmin: boolean;
  showAdminAction?: boolean;
}

const actionClassName = cn(
  "inline-flex size-9 items-center justify-center rounded-full border border-input bg-background p-2",
  "text-muted-foreground shadow-sm transition-colors",
  "hover:text-foreground hover:bg-muted",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
);

export function BoardsHeaderActions({
  isAuthenticated,
  isAdmin,
  showAdminAction = true,
  className,
  ...props
}: BoardsHeaderActionsProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear known auth-like keys (if they ever exist client-side).
      const localKeys = [
        "auth-token",
        "token",
        "access-token",
        "accessToken",
        "platform1-token",
      ];
      for (const key of localKeys) {
        window.localStorage.removeItem(key);
      }

      await logout();
      toast.success("Logged out");
      router.refresh();
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <ThemeToggle className={actionClassName} />

      {isAdmin && showAdminAction && (
        <Link
          href="/admin"
          aria-label="Admin dashboard"
          title="Admin"
          className={actionClassName}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l8 4v6c0 5-3.4 7.7-8 8-4.6-.3-8-3-8-8V7l8-4z" />
            <path d="M9.5 12l1.7 1.7L14.8 10" />
          </svg>
        </Link>
      )}

      {isAuthenticated && (
        <button
          type="button"
          aria-label="Logout"
          title="Logout"
          onClick={handleLogout}
          className={actionClassName}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      )}
    </div>
  );
}
