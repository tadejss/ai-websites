import type { BenefitVariant } from "@/content/types/site";

const variantStyles: Record<
  BenefitVariant,
  { bg: string; text: string; accent: string; muted: string }
> = {
  warm: {
    bg: "#F6F0E8",
    text: "#2A2118",
    accent: "#C4785A",
    muted: "#8A7568",
  },
  dark: {
    bg: "#171717",
    text: "#F6F4EF",
    accent: "#C7FF3D",
    muted: "#9A9A96",
  },
  minimal: {
    bg: "#FAF8F5",
    text: "#2C2C2A",
    accent: "#D4B5A8",
    muted: "#8A8580",
  },
  natural: {
    bg: "#EDE6DA",
    text: "#3D3428",
    accent: "#8B6F47",
    muted: "#7A6E60",
  },
  editorial: {
    bg: "#1A1A1A",
    text: "#F6F4EF",
    accent: "#E8E4DC",
    muted: "#9A9894",
  },
  premium: {
    bg: "#F0EBE3",
    text: "#1F1F1D",
    accent: "#B8A090",
    muted: "#7A7570",
  },
};

type Props = {
  title: string;
  label: string;
  variant: BenefitVariant;
};

export function BeautyExamplePreview({ title, label, variant }: Props) {
  const style = variantStyles[variant];

  return (
    <div className="p-4" style={{ backgroundColor: style.bg }}>
      <div className="mb-3 flex items-center justify-between">
        <p
          className="font-display truncate text-xs font-semibold sm:text-sm"
          style={{ color: style.text }}
        >
          {title}
        </p>
        <span
          className="hidden text-[9px] font-medium uppercase tracking-wider sm:inline"
          style={{ color: style.muted }}
        >
          Domov
        </span>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: style.text, color: style.bg }}
      >
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: style.accent }}
        >
          {label}
        </p>
        <p className="font-display mt-2 text-sm leading-tight sm:text-base">
          Profesionalno. Lokalno. Tvoje.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {["Storitve", "Kontakt"].map((item) => (
          <div
            key={item}
            className="rounded-md px-2 py-1.5 text-center text-[9px] font-medium"
            style={{ backgroundColor: `${style.accent}33`, color: style.text }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
