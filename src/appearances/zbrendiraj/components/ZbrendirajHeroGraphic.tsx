export function ZbrendirajHeroGraphic() {
  return (
    <div
      className="relative flex h-full min-h-[480px] items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-black p-6 sm:min-h-[640px] sm:p-10"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute left-8 top-10 h-28 w-28 rounded-full border border-accent/20 bg-accent/5 blur-2xl" />
      <div className="absolute bottom-12 right-10 h-36 w-36 rounded-full border border-white/10 bg-white/[0.03] blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/15 bg-[#0A0A0A] p-4 shadow-[0_0_60px_rgba(199,255,61,0.08)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#FF5F57]" />
            <span className="size-2 rounded-full bg-[#FEBC2E]" />
            <span className="size-2 rounded-full bg-[#28C840]" />
            <div className="ml-2 h-6 flex-1 rounded-md border border-white/10 bg-black px-3 text-[10px] leading-6 text-[#9A9A9A]">
              zbrendiraj.si/build
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-accent/30 bg-black p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Live preview
              </span>
              <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[9px] text-accent">
                98%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {["Hero", "Storitve", "Kontakt", "SEO"].map((block, index) => (
                <div
                  key={block}
                  className={`rounded-lg border p-2 text-center text-[9px] font-medium ${
                    index === 0
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-white/10 text-[#D0D0D0]"
                  }`}
                >
                  {block}
                </div>
              ))}
            </div>

            <div className="h-24 rounded-lg border border-white/10 bg-gradient-to-br from-[#111] via-[#0A0A0A] to-[#151515] p-3">
              <div className="h-2 w-16 rounded-full bg-accent/80" />
              <div className="mt-3 h-2 w-28 rounded-full bg-white/20" />
              <div className="mt-2 h-2 w-20 rounded-full bg-white/10" />
              <div className="mt-4 inline-block rounded-full border border-accent px-3 py-1 text-[9px] font-semibold text-accent">
                Objavi stran
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-4 top-16 hidden rounded-xl border border-accent/50 bg-black px-3 py-2 text-[10px] font-medium text-accent sm:block">
          &lt;/&gt; Next.js
        </div>

        <div className="absolute -left-3 bottom-20 hidden rounded-xl border border-white/15 bg-[#111] px-3 py-2 text-[10px] text-[#D0D0D0] sm:block">
          Mobilno ✓
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9A9A9A]">
            Spletna stran v živo
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </div>
      </div>
    </div>
  );
}
