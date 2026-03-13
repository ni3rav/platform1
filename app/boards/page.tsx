import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { BoardsHeaderActions } from "@/components/boards-header-actions";

const BOARDS = [
  {
    slug: "random",
    label: "Random",
    description: "Anything and everything",
    emoji: "🎲",
  },
  {
    slug: "confessions",
    label: "Confessions",
    description: "Get it off your chest",
    emoji: "🤫",
  },
  {
    slug: "rant",
    label: "Rant",
    description: "Let it all out",
    emoji: "😤",
  },
  {
    slug: "knowledge",
    label: "Knowledge",
    description: "Share what you know",
    emoji: "📚",
  },
  {
    slug: "hangout",
    label: "Hangout",
    description: "Chill and chat",
    emoji: "☕",
  },
];

export default async function BoardsPage() {
  const auth = await getAuthUser();
  if (!auth.isAuthenticated) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground text-pretty">
              Boards
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a board and start browsing
            </p>
          </div>
          <BoardsHeaderActions
            isAuthenticated={auth.isAuthenticated}
            isAdmin={auth.role === "admin"}
          />
        </header>

        <nav aria-label="Board categories" className="grid gap-2">
          {BOARDS.map((board) => (
            <Link
              key={board.slug}
              href={`/boards/${board.slug}`}
              className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="text-2xl" aria-hidden="true">
                {board.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {board.label}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {board.description}
                </p>
              </div>
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </nav>

      </div>
    </main>
  );
}
