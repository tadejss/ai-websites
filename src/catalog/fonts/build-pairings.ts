import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { FontPairing, ThemeMode } from "@/theme/types";
import { LOOK_ARCHETYPES } from "@/catalog/archetypes";

type BaseFontSlot = {
  id: string;
  name: string;
  modes: ThemeMode[];
  body: { family: string; variable: string };
  display: { family: string; variable: string };
};

/** Base font slots rotated per category for within-category uniqueness. */
export const BASE_FONT_SLOTS: BaseFontSlot[] = [
  {
    id: "slot-sora-instrument",
    name: "Sora + Instrument Serif",
    modes: ["light"],
    body: { family: "Sora", variable: "--font-sora" },
    display: { family: "Instrument Serif", variable: "--font-instrument-serif" },
  },
  {
    id: "slot-rubik-fraunces",
    name: "Rubik + Fraunces",
    modes: ["light"],
    body: { family: "Rubik", variable: "--font-rubik" },
    display: { family: "Fraunces", variable: "--font-fraunces" },
  },
  {
    id: "slot-nunito-lora",
    name: "Nunito Sans + Lora",
    modes: ["light"],
    body: { family: "Nunito Sans", variable: "--font-nunito-sans" },
    display: { family: "Lora", variable: "--font-lora" },
  },
  {
    id: "slot-lexend-source-serif",
    name: "Lexend + Source Serif 4",
    modes: ["light"],
    body: { family: "Lexend", variable: "--font-lexend" },
    display: { family: "Source Serif 4", variable: "--font-source-serif-4" },
  },
  {
    id: "slot-albert-newsreader",
    name: "Albert Sans + Newsreader",
    modes: ["light"],
    body: { family: "Albert Sans", variable: "--font-albert-sans" },
    display: { family: "Newsreader", variable: "--font-newsreader" },
  },
  {
    id: "slot-onest-cormorant",
    name: "Onest + Cormorant Garamond",
    modes: ["light"],
    body: { family: "Onest", variable: "--font-onest" },
    display: { family: "Cormorant Garamond", variable: "--font-cormorant" },
  },
  {
    id: "slot-archivo-playfair",
    name: "Archivo + Playfair Display",
    modes: ["light"],
    body: { family: "Archivo", variable: "--font-archivo" },
    display: { family: "Playfair Display", variable: "--font-playfair" },
  },
  {
    id: "slot-raleway-merriweather",
    name: "Raleway + Merriweather",
    modes: ["light"],
    body: { family: "Raleway", variable: "--font-raleway" },
    display: { family: "Merriweather", variable: "--font-merriweather" },
  },
  {
    id: "slot-public-libre",
    name: "Public Sans + Libre Baskerville",
    modes: ["light"],
    body: { family: "Public Sans", variable: "--font-public-sans" },
    display: { family: "Libre Baskerville", variable: "--font-libre-baskerville" },
  },
  {
    id: "slot-manrope-bodoni",
    name: "Manrope + Bodoni Moda",
    modes: ["light"],
    body: { family: "Manrope", variable: "--font-manrope" },
    display: { family: "Bodoni Moda", variable: "--font-bodoni" },
  },
  {
    id: "slot-inter-space-dark",
    name: "Inter + Space Grotesk",
    modes: ["dark"],
    body: { family: "Inter", variable: "--font-inter" },
    display: { family: "Space Grotesk", variable: "--font-space-grotesk" },
  },
  {
    id: "slot-dm-syne",
    name: "DM Sans + Syne",
    modes: ["dark"],
    body: { family: "DM Sans", variable: "--font-dm-sans" },
    display: { family: "Syne", variable: "--font-syne" },
  },
  {
    id: "slot-outfit-bitter",
    name: "Outfit + Bitter",
    modes: ["dark"],
    body: { family: "Outfit", variable: "--font-outfit" },
    display: { family: "Bitter", variable: "--font-bitter" },
  },
  {
    id: "slot-geist",
    name: "Geist Sans",
    modes: ["dark"],
    body: { family: "Geist", variable: "--font-geist-sans" },
    display: { family: "Geist", variable: "--font-geist-sans" },
  },
];

function categoryOffset(categoryId: ImagePoolCategoryId): number {
  let sum = 0;
  for (const char of categoryId) {
    sum += char.charCodeAt(0);
  }
  return sum;
}

function slotForLook(
  categoryId: ImagePoolCategoryId,
  index: number,
  mode: ThemeMode,
): BaseFontSlot {
  const modeSlots = BASE_FONT_SLOTS.filter((slot) => slot.modes.includes(mode));
  const offset = categoryOffset(categoryId);
  return modeSlots[(offset + index) % modeSlots.length]!;
}

export function buildCategoryFontPairings(
  categoryId: ImagePoolCategoryId,
  appearanceMode: "beauty" | "trade",
): FontPairing[] {
  const pairings: FontPairing[] = [];

  for (let index = 0; index < LOOK_ARCHETYPES.length; index += 1) {
    const archetype = LOOK_ARCHETYPES[index]!;
    const num = String(index + 1).padStart(2, "0");
    const preferDark =
      appearanceMode === "trade" && archetype.preferDark === true;
    const mode: ThemeMode =
      appearanceMode === "beauty" ? "light" : preferDark ? "dark" : "light";
    const slot = slotForLook(categoryId, index, mode);

    pairings.push({
      id: `look-${categoryId}-${num}`,
      name: `${categoryId} ${slot.name}`,
      modes: [mode],
      body: slot.body,
      display: slot.display,
    });
  }

  return pairings;
}
