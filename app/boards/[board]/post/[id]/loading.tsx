export default function PostLoading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <header className="mb-4 flex items-center gap-3">
          <div className="size-7 rounded-md bg-muted/20 animate-pulse" />
          <div className="size-5 rounded-md bg-muted/20 animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-muted/20 animate-pulse" />
        </header>

        <article className="rounded-lg border bg-card p-5">
          <div className="flex gap-3">
            <div className="w-8 shrink-0 space-y-1.5">
              <div className="h-6 rounded-md bg-muted/20 animate-pulse" />
              <div className="h-4 rounded-md bg-muted/20 animate-pulse" />
              <div className="h-6 rounded-md bg-muted/20 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-1/4 rounded-md bg-muted/20 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-11/12 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-5/6 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-2/3 rounded-md bg-muted/20 animate-pulse" />
              </div>

              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-7 w-7 rounded-md bg-muted/20 animate-pulse" />
              </div>
            </div>
          </div>
        </article>

        <section className="mt-6 space-y-4">
          <div className="h-4 w-20 rounded-md bg-muted/20 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-md border bg-card p-3 space-y-2">
                <div className="h-3 w-1/4 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-full rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-5/6 rounded-md bg-muted/20 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
