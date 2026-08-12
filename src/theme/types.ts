export type ThemeMode = "light" | "dark";

export type ThemeTokens = {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  radiusCard: string;
};

export type Palette = {
  id: string;
  name: string;
  mode: ThemeMode;
  swatches: [string, string, string, string, string];
  tokens?: Partial<ThemeTokens>;
};

export type FontPairing = {
  id: string;
  name: string;
  modes: ThemeMode[];
  body: { family: string; variable: string };
  display: { family: string; variable: string };
};

export type SiteTheme = {
  paletteId: string;
  fontPairingId: string;
};

export const THEME_CSS_VAR_NAMES = [
  "--background",
  "--foreground",
  "--muted",
  "--accent",
  "--accent-hover",
  "--accent-foreground",
  "--surface",
  "--surface-elevated",
  "--border",
  "--radius-card",
  "--font-body",
  "--font-display",
] as const;
