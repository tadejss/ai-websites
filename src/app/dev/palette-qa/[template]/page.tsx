import { CURATED_PALETTES } from "@/theme/palettes/curated";
import { TEMPLATE_IDS, type TemplateId } from "@/templates/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ template: string }>;
};

const PREVIEW_SLUG: Record<TemplateId, string> = {
  bento: "preview-bento",
  outlined: "preview-outlined",
  type: "preview-type",
  floating: "preview-floating",
  mono: "preview-mono",
};

export default async function PaletteQaPage({ params }: Props) {
  const { template } = await params;
  if (!TEMPLATE_IDS.includes(template as TemplateId)) {
    notFound();
  }
  const templateId = template as TemplateId;
  const slug = PREVIEW_SLUG[templateId];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6">
      <header className="mx-auto mb-6 max-w-[1280px]">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Local palette QA · desktop
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {templateId} · 14 palettes
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Reply with 1–14: OK or what to change. Scroll the column.
        </p>
      </header>

      <ol className="mx-auto flex max-w-[1280px] flex-col gap-12">
        {CURATED_PALETTES.map((palette, index) => {
          const n = index + 1;
          const src = `/dev/palette-preview/${slug}/${encodeURIComponent(palette.id)}`;
          return (
            <li key={palette.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-zinc-200">
                  {n}. {palette.id}
                </p>
                <p className="text-xs text-zinc-500">
                  {palette.mode} · {palette.name}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
                <iframe
                  title={`${n} ${palette.id}`}
                  src={src}
                  className="h-[900px] w-full bg-white"
                  loading={n <= 2 ? "eager" : "lazy"}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
