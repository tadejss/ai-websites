export function BeautyHeroWebsitePreview() {
  return (
    <div className="bg-[#F6F0E8] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-[#2A2118] sm:text-base">
          Studio Maja
        </p>
        <div className="hidden gap-4 text-[10px] font-medium uppercase tracking-wider text-[#6B5E52] sm:flex">
          <span>Storitve</span>
          <span>Cenik</span>
          <span>Kontakt</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#2A2118] p-6 text-[#F6F0E8] sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E8C4A8]">
          Frizerski salon · Ljubljana
        </p>
        <h2 className="font-display mt-3 text-2xl leading-tight sm:text-3xl">
          Tvoj stil, naša skrb.
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#F6F0E8]/75">
          Rezerviraj termin in pridi v salon, kjer te poznamo po imenu.
        </p>
        <span className="mt-5 inline-block rounded-full bg-[#E8C4A8] px-4 py-2 text-xs font-semibold text-[#2A2118]">
          Rezerviraj termin
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {["Striženje", "Barvanje", "Nega"].map((item) => (
          <div
            key={item}
            className="rounded-xl bg-white/70 p-3 text-center text-[10px] font-medium text-[#2A2118] sm:text-xs"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
