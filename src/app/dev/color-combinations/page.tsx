import {
  CURATED_PALETTES,
  allPalettes,
  getLegacyPaletteDefinition,
} from "@/theme/palettes";

export const dynamic = "force-dynamic";

export default function ColorCombinationsPage() {
  const curatedLight = CURATED_PALETTES.filter((p) => p.mode === "light");
  const curatedDark = CURATED_PALETTES.filter((p) => p.mode === "dark");
  const curatedIds = new Set(CURATED_PALETTES.map((p) => p.id));
  const legacy = allPalettes.filter(
    (p) => !curatedIds.has(p.id) || p.id === "zbrendiraj",
  );
  // Prefer exact zbrendiraj definition for the legacy section.
  const legacyUnique = [
    ...legacy.filter((p) => p.id !== "zbrendiraj"),
    getLegacyPaletteDefinition("zbrendiraj")!,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Local design reference
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Color combinations
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Active system: {CURATED_PALETTES.length} curated palettes (
          {curatedLight.length} light · {curatedDark.length} dark). Legacy
          catalog below is for reference only — render remaps unknown ids onto
          curated.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-zinc-200">
            Curated — light
          </h2>
          <PaletteGrid palettes={curatedLight} />
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-medium text-zinc-200">
            Curated — dark
          </h2>
          <PaletteGrid palettes={curatedDark} />
        </section>

        <details className="mt-14 group">
          <summary className="cursor-pointer list-none text-lg font-medium text-zinc-400 hover:text-zinc-200">
            Legacy palettes ({legacyUnique.length}) — collapsible
          </summary>
          <div className="mt-4">
            <PaletteGrid palettes={legacyUnique} />
          </div>
        </details>

        <p className="mt-12 text-xs text-zinc-600">
          Source: <code>src/theme/palettes/curated.ts</code> (+ legacy under{" "}
          <code>src/theme/palettes/</code> / <code>src/catalog/palettes/</code>)
        </p>
      </div>
    </main>
  );
}

function PaletteGrid({
  palettes,
}: {
  palettes: typeof allPalettes;
}) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {palettes.map((palette) => (
        <li
          key={palette.id}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
        >
          <div className="flex h-16">
            {palette.swatches.map((hex) => (
              <div
                key={`${palette.id}-${hex}`}
                className="h-full flex-1"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
          <div className="space-y-1 px-3 py-3">
            <p className="text-sm font-medium">{palette.name}</p>
            <p className="font-mono text-[11px] text-zinc-500">{palette.id}</p>
            <p className="font-mono text-[10px] leading-relaxed text-zinc-600">
              {palette.swatches.join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
