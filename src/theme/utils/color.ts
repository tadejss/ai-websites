type Rgb = { r: number; g: number; b: number };

export function parseHex(hex: string): Rgb {
  const normalized = hex.replace("#", "").trim();

  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16),
    };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function mixHex(a: string, b: string, weight = 0.5): string {
  const colorA = parseHex(a);
  const colorB = parseHex(b);

  return toHex({
    r: colorA.r * (1 - weight) + colorB.r * weight,
    g: colorA.g * (1 - weight) + colorB.g * weight,
    b: colorA.b * (1 - weight) + colorB.b * weight,
  });
}

export function darken(hex: string, amount = 0.12): string {
  const { r, g, b } = parseHex(hex);
  const factor = 1 - amount;

  return toHex({
    r: r * factor,
    g: g * factor,
    b: b * factor,
  });
}

export function lighten(hex: string, amount = 0.12): string {
  const { r, g, b } = parseHex(hex);
  const lightenChannel = (value: number) => value + (255 - value) * amount;

  return toHex({
    r: lightenChannel(r),
    g: lightenChannel(g),
    b: lightenChannel(b),
  });
}

export function contrastForeground(background: string): string {
  return relativeLuminance(background) > 0.45 ? "#1a1410" : "#f7f3ee";
}

export function sortByLightness(swatches: string[]): string[] {
  return [...swatches].sort(
    (a, b) => relativeLuminance(b) - relativeLuminance(a),
  );
}

export function pickAccent(swatches: string[], mode: "light" | "dark"): string {
  const sorted = sortByLightness(swatches);

  if (mode === "light") {
    const candidates = sorted.slice(1, -1).reverse();
    return (
      candidates.find((color) => {
        const luminance = relativeLuminance(color);
        return luminance > 0.15 && luminance < 0.55;
      }) ?? sorted[Math.floor(sorted.length / 2)]
    );
  }

  const candidates = sorted.slice(0, -1);
  return (
    candidates.find((color) => relativeLuminance(color) > 0.35) ??
    sorted[sorted.length - 2] ??
    sorted[sorted.length - 1]
  );
}
