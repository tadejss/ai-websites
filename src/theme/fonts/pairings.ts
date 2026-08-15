import type { FontPairing } from "../types";

export const fontPairings: FontPairing[] = [
  {
    id: "manrope-bodoni",
    name: "Manrope + Bodoni Moda",
    modes: ["light"],
    body: { family: "Manrope", variable: "--font-manrope" },
    display: { family: "Bodoni Moda", variable: "--font-bodoni" },
  },
  {
    id: "dm-sans-playfair",
    name: "DM Sans + Playfair Display",
    modes: ["light"],
    body: { family: "DM Sans", variable: "--font-dm-sans" },
    display: { family: "Playfair Display", variable: "--font-playfair" },
  },
  {
    id: "outfit-cormorant",
    name: "Outfit + Cormorant Garamond",
    modes: ["light"],
    body: { family: "Outfit", variable: "--font-outfit" },
    display: { family: "Cormorant Garamond", variable: "--font-cormorant" },
  },
  {
    id: "jakarta-fraunces",
    name: "Plus Jakarta Sans + Fraunces",
    modes: ["light"],
    body: { family: "Plus Jakarta Sans", variable: "--font-jakarta" },
    display: { family: "Fraunces", variable: "--font-fraunces" },
  },
  {
    id: "lato-libre",
    name: "Lato + Libre Baskerville",
    modes: ["light"],
    body: { family: "Lato", variable: "--font-lato" },
    display: { family: "Libre Baskerville", variable: "--font-libre-baskerville" },
  },
  {
    id: "work-sans-lora",
    name: "Work Sans + Lora",
    modes: ["light"],
    body: { family: "Work Sans", variable: "--font-work-sans" },
    display: { family: "Lora", variable: "--font-lora" },
  },
  {
    id: "inter-eb-garamond",
    name: "Inter + EB Garamond",
    modes: ["light"],
    body: { family: "Inter", variable: "--font-inter" },
    display: { family: "EB Garamond", variable: "--font-eb-garamond" },
  },
  {
    id: "inter-space-grotesk-light",
    name: "Inter + Space Grotesk",
    modes: ["light"],
    body: { family: "Inter", variable: "--font-inter" },
    display: { family: "Space Grotesk", variable: "--font-space-grotesk" },
  },
  {
    id: "figtree-dm-serif",
    name: "Figtree + DM Serif Display",
    modes: ["light"],
    body: { family: "Figtree", variable: "--font-figtree" },
    display: { family: "DM Serif Display", variable: "--font-dm-serif" },
  },
  {
    id: "geist-geist",
    name: "Geist Sans",
    modes: ["dark"],
    body: { family: "Geist", variable: "--font-geist-sans" },
    display: { family: "Geist", variable: "--font-geist-sans" },
  },
  {
    id: "inter-space-grotesk",
    name: "Inter + Space Grotesk",
    modes: ["dark"],
    body: { family: "Inter", variable: "--font-inter" },
    display: { family: "Space Grotesk", variable: "--font-space-grotesk" },
  },
  {
    id: "dm-sans-syne",
    name: "DM Sans + Syne",
    modes: ["dark"],
    body: { family: "DM Sans", variable: "--font-dm-sans" },
    display: { family: "Syne", variable: "--font-syne" },
  },
  {
    id: "outfit-bitter",
    name: "Outfit + Bitter",
    modes: ["dark"],
    body: { family: "Outfit", variable: "--font-outfit" },
    display: { family: "Bitter", variable: "--font-bitter" },
  },
];

const pairingById = new Map(
  fontPairings.map((pairing) => [pairing.id, pairing]),
);

export function getFontPairing(id: string): FontPairing | undefined {
  return pairingById.get(id);
}

export function getFontPairingsForMode(mode: "light" | "dark"): FontPairing[] {
  return fontPairings.filter((pairing) => pairing.modes.includes(mode));
}

export const fontPairingIds = fontPairings.map((pairing) => pairing.id);
