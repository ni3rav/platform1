import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-background px-6"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
       <h1
          id="not-found-title"
          className="mt-3 text-5xl font-bold leading-none tracking-tight text-foreground sm:text-6xl"
        >
          Page not found
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
          The page you were looking for doesn&apos;t exist, was moved, or the
          link you followed is broken.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/boards" aria-label="Go to boards">
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                data-icon="inline-start"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to boards
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="ghost"
            className="w-full sm:w-auto"
          >
            <Link href="/" aria-label="Go to home">
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
