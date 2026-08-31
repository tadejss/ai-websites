import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { IcpDiscoverySlot } from "./icp";

/** Consecutive zero-candidate searches before a slot enters cooldown. */
export const SLOT_ZERO_STREAK_COOLDOWN = 3;

/** Cooldown duration after a slot hits the zero streak threshold. */
export const SLOT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type SlotYieldEntry = {
  searches: number;
  candidates: number;
  demos: number;
  consecutiveZeroCandidates: number;
  /** ISO timestamp; slot is skipped until this time passes. */
  cooldownUntil?: string;
  lastSearchAt?: string;
};

export type SlotYieldState = {
  slots: Record<string, SlotYieldEntry>;
  updatedAt: string;
};

const DEFAULT_PATH = resolve(process.cwd(), "data/replenish-slot-yield.json");

export function slotKey(slot: IcpDiscoverySlot): string {
  return `${slot.industry}:${slot.region}`;
}

export function emptySlotYieldState(): SlotYieldState {
  return { slots: {}, updatedAt: new Date().toISOString() };
}

export function readSlotYieldState(path = DEFAULT_PATH): SlotYieldState {
  try {
    if (!existsSync(path)) {
      return emptySlotYieldState();
    }
    const raw = JSON.parse(readFileSync(path, "utf8")) as SlotYieldState;
    if (!raw.slots || typeof raw.slots !== "object") {
      return emptySlotYieldState();
    }
    return raw;
  } catch {
    return emptySlotYieldState();
  }
}

export function writeSlotYieldState(
  state: SlotYieldState,
  path = DEFAULT_PATH,
): void {
  mkdirSync(dirname(path), { recursive: true });
  const payload: SlotYieldState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getOrCreateEntry(
  state: SlotYieldState,
  key: string,
): SlotYieldEntry {
  return (
    state.slots[key] ?? {
      searches: 0,
      candidates: 0,
      demos: 0,
      consecutiveZeroCandidates: 0,
    }
  );
}

export function isSlotOnCooldown(
  state: SlotYieldState,
  key: string,
  now = Date.now(),
): boolean {
  const until = state.slots[key]?.cooldownUntil;
  if (!until) {
    return false;
  }
  const expires = Date.parse(until);
  if (!Number.isFinite(expires) || expires <= now) {
    return false;
  }
  return true;
}

/** Clear expired cooldown metadata so the slot re-enters normal rotation. */
export function refreshSlotCooldown(
  state: SlotYieldState,
  key: string,
  now = Date.now(),
): void {
  const entry = state.slots[key];
  if (!entry?.cooldownUntil) {
    return;
  }
  const expires = Date.parse(entry.cooldownUntil);
  if (Number.isFinite(expires) && expires <= now) {
    entry.cooldownUntil = undefined;
    entry.consecutiveZeroCandidates = 0;
  }
}

export function recordSlotSearch(
  state: SlotYieldState,
  key: string,
  outcome: { candidates: number; demos: number },
): SlotYieldState {
  const next: SlotYieldState = {
    slots: { ...state.slots },
    updatedAt: state.updatedAt,
  };
  const entry = { ...getOrCreateEntry(next, key) };
  const now = new Date();

  entry.searches += 1;
  entry.candidates += outcome.candidates;
  entry.demos += outcome.demos;
  entry.lastSearchAt = now.toISOString();

  if (outcome.candidates <= 0) {
    entry.consecutiveZeroCandidates += 1;
    if (entry.consecutiveZeroCandidates >= SLOT_ZERO_STREAK_COOLDOWN) {
      entry.cooldownUntil = new Date(
        now.getTime() + SLOT_COOLDOWN_MS,
      ).toISOString();
    }
  } else {
    entry.consecutiveZeroCandidates = 0;
    entry.cooldownUntil = undefined;
  }

  next.slots[key] = entry;
  return next;
}

export type SelectedReplenishSlot = {
  slot: IcpDiscoverySlot;
  nextIndex: number;
  /** How many cooled-down slots were skipped before picking this one. */
  skippedCooldown: number;
  /** True when every slot was on cooldown and we picked one anyway. */
  forced: boolean;
};

/**
 * Pick the next slot for replenishment. Skips cooled-down slots when
 * alternatives exist; never permanently excludes a slot.
 */
export function selectReplenishSlot(
  cursor: number,
  slots: IcpDiscoverySlot[],
  state: SlotYieldState,
  now = Date.now(),
): SelectedReplenishSlot {
  if (slots.length === 0) {
    throw new Error("No ICP discovery slots configured");
  }

  for (const slot of slots) {
    refreshSlotCooldown(state, slotKey(slot), now);
  }

  const start = ((cursor % slots.length) + slots.length) % slots.length;

  for (let offset = 0; offset < slots.length; offset += 1) {
    const index = (start + offset) % slots.length;
    const slot = slots[index]!;
    const key = slotKey(slot);
    if (!isSlotOnCooldown(state, key, now)) {
      return {
        slot,
        nextIndex: (index + 1) % slots.length,
        skippedCooldown: offset,
        forced: false,
      };
    }
  }

  const index = start;
  return {
    slot: slots[index]!,
    nextIndex: (index + 1) % slots.length,
    skippedCooldown: slots.length - 1,
    forced: true,
  };
}
