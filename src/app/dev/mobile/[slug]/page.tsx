import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MobileDemoPage({ params }: Props) {
  const { slug } = await params;
  const sitePath = resolve(process.cwd(), "src/content/clients", slug, "site.json");
  if (!existsSync(sitePath)) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-6 text-zinc-100">
      <header className="mb-4 w-full max-w-[390px]">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Local demo · mobile
        </p>
        <h1 className="mt-1 font-mono text-lg font-semibold">{slug}</h1>
      </header>
      <div className="w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl">
        <iframe
          title={slug}
          src={`/${slug}`}
          className="h-[844px] w-full bg-white"
        />
      </div>
    </main>
  );
}
