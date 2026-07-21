import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="mx-auto grid w-full max-w-6xl gap-10 rounded-[2rem] border bg-card/80 p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div className="flex flex-col justify-center gap-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Food insight, simplified
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              CalorieLens
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Upload a food photo and get a practical calorie range estimate to support mindful tracking.
            </p>
          </div>
          <div>
            <Button size="lg" aria-label="Upload a food image">
              Upload Image
            </Button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border bg-muted/60 p-6">
          <div className="flex aspect-[4/3] items-center justify-center rounded-[1.25rem] border border-dashed bg-background/80 text-center">
            <div className="max-w-xs space-y-3 px-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                🍽️
              </div>
              <p className="font-medium text-foreground">Image preview placeholder</p>
              <p className="text-sm leading-6 text-muted-foreground">
                AI-powered analysis will be added after the MVP foundation is ready.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
