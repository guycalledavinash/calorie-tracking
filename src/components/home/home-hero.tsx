import { ImageUploader } from "@/components/upload/image-uploader";

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
          <p className="text-sm font-medium text-muted-foreground">
            Upload Image below to preview your food photo. AI analysis is intentionally not implemented yet.
          </p>
        </div>

        <div className="rounded-[1.5rem] border bg-muted/60 p-6">
          <ImageUploader />
        </div>
      </section>
    </main>
  );
}
