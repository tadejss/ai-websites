import type { Palette } from "../types";

/** Hand-tuned palettes for published zbrendiraj.si showcase demos. */
export const showcasePalettes: Palette[] = [
  {
    id: "showcase-elektro-green",
    name: "Showcase Elektro Green",
    mode: "light",
    swatches: ["#f4faf6", "#b7dcc4", "#1f7a4d", "#14532d", "#0a1f14"],
    tokens: {
      background: "#f4faf6",
      foreground: "#0a1f14",
      muted: "#3d5c4a",
      accent: "#1f7a4d",
      accentHover: "#16653f",
      accentForeground: "#ffffff",
      surface: "#e8f5ec",
      surfaceElevated: "#ffffff",
      border: "rgba(10, 31, 20, 0.14)",
    },
  },
  {
    id: "showcase-krovec-signal",
    name: "Showcase Krovec Signal",
    mode: "light",
    swatches: ["#ffffff", "#f3f4f6", "#b91c1c", "#1c1917", "#0a0a0a"],
    tokens: {
      background: "#ffffff",
      foreground: "#0a0a0a",
      muted: "#44403c",
      accent: "#b91c1c",
      accentHover: "#991b1b",
      accentForeground: "#ffffff",
      surface: "#f5f5f4",
      surfaceElevated: "#ffffff",
      border: "rgba(10, 10, 10, 0.16)",
    },
  },
  {
    id: "showcase-keramik-dark",
    name: "Showcase Keramik Dark",
    mode: "dark",
    swatches: ["#f5f5f4", "#a8a29e", "#d6d3d1", "#1c1917", "#0c0a09"],
    tokens: {
      background: "#0c0a09",
      foreground: "#f5f5f4",
      muted: "#a8a29e",
      accent: "#d6a77a",
      accentHover: "#e4b88c",
      accentForeground: "#0c0a09",
      surface: "#1c1917",
      surfaceElevated: "#292524",
      border: "rgba(245, 245, 244, 0.12)",
    },
  },
];
