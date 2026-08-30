import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  DOLENJSKA_REGION,
  NOTRANJSKA_REGION,
} from "./region";
import {
  LEAD_INDUSTRY_IDS,
  type LeadIndustryId,
} from "./industry-filter";

export type IcpDiscoverySlot = {
  industry: LeadIndustryId;
  region: string;
  /** Slovenian Google Places–style query. */
  query: string;
};

const REGION_LABELS: Record<string, string> = {
  [NOTRANJSKA_REGION]: "Postojna Cerknica Pivka",
  [DOLENJSKA_REGION]: "Novo mesto Krško",
};

const QUERY_BY_INDUSTRY: Record<LeadIndustryId, string> = {
  frizer: "frizer",
  beauty: "kozmetični salon",
  keramicar: "keramičar",
  elektro: "elektroinstalater",
  vulkanizer: "vulkanizer",
  avtoservis: "avtoservis",
  vodovod: "vodoinštalater",
  slikopleskar: "slikopleskar",
  gradbenistvo: "gradbeništvo",
  mizarstvo: "mizarstvo",
  kljucavnicar: "ključavničar",
  ciscenje: "čiščenje",
  vrtnarstvo: "vrtnarstvo",
};

const ICP_REGIONS = [NOTRANJSKA_REGION, DOLENJSKA_REGION] as const;

/** Ordered slots for replenishment rotation (industry × region). */
export function buildIcpDiscoverySlots(): IcpDiscoverySlot[] {
  const slots: IcpDiscoverySlot[] = [];
  for (const industry of LEAD_INDUSTRY_IDS) {
    for (const region of ICP_REGIONS) {
      const place = REGION_LABELS[region] ?? region;
      slots.push({
        industry,
        region,
        query: `${QUERY_BY_INDUSTRY[industry]} ${place}`,
      });
    }
  }
  return slots;
}

const DEFAULT_CURSOR_PATH = resolve(
  process.cwd(),
  "data/replenish-cursor.json",
);

type CursorFile = {
  slotIndex: number;
  updatedAt: string;
};

export function readReplenishCursor(
  path = DEFAULT_CURSOR_PATH,
): number {
  try {
    if (!existsSync(path)) {
      return 0;
    }
    const raw = JSON.parse(readFileSync(path, "utf8")) as CursorFile;
    return Number.isFinite(raw.slotIndex) && raw.slotIndex >= 0
      ? raw.slotIndex
      : 0;
  } catch {
    return 0;
  }
}

export function writeReplenishCursor(
  slotIndex: number,
  path = DEFAULT_CURSOR_PATH,
): void {
  mkdirSync(dirname(path), { recursive: true });
  const payload: CursorFile = {
    slotIndex,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function nextIcpSlot(
  slotIndex: number,
  slots = buildIcpDiscoverySlots(),
): { slot: IcpDiscoverySlot; nextIndex: number } {
  if (slots.length === 0) {
    throw new Error("No ICP discovery slots configured");
  }
  const index = ((slotIndex % slots.length) + slots.length) % slots.length;
  return {
    slot: slots[index]!,
    nextIndex: (index + 1) % slots.length,
  };
}
