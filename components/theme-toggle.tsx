"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_KEY = "platform1-theme";

type Theme = "light" | "dark";

interface ThemeToggleProps extends React.ComponentProps<"button"> {}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const resolved: Theme =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(resolved);
    applyTheme(resolved);
    setReady(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  };

  return (
    <button
      type="button"
      aria-label={
        ready
          ? `Switch to ${theme === "dark" ? "light" : "dark"} theme`
          : "Toggle theme"
      }
      title={ready ? `Theme: ${theme}` : "Toggle theme"}
      onClick={toggleTheme}
      className={cn(
        "fixed right-4 top-4 z-50 rounded-full border border-input bg-background p-2",
        "text-muted-foreground shadow-sm transition-colors hover:text-foreground hover:bg-muted",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      {...props}
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
        {theme === "dark" ? (
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </>
        )}
      </svg>
    </button>
  );
}
