import {
  Archivo,
  Manrope,
  Outfit,
  Space_Grotesk,
} from "next/font/google";
import type { TemplateId } from "./types";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Only the fonts required by the selected template (max 2). */
export function templateFontClassName(
  templateId: TemplateId,
  _options?: { beautySerif?: boolean },
): string {
  switch (templateId) {
    case "bento":
      return outfit.variable;
    case "outlined":
      return spaceGrotesk.variable;
    case "type":
      return archivo.variable;
    case "floating":
      return manrope.variable;
    default:
      return outfit.variable;
  }
}
