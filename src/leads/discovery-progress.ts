import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  combinationKey,
  parseCombinationKey,
} from "./discovery-matrix";
import {
  DISCOVERY_PROFESSION_ORDER,
  getDiscoveryProfessionName,
  type DiscoveryProfessionId,
} from "./discovery-professions";
import {
  DISCOVERY_REGION_ORDER,
  getDiscoveryRegionName,
  type DiscoveryRegionId,
} from "./discovery-regions";

export type CombinationCompletionReason =
  | "all_queries_exhausted"
  | "zero_yield_streak";

export type CombinationStatus = "pending" | "active" | "completed";

export type CombinationProgress = {
  status: CombinationStatus;
  highValueQueries: string[];
  optionalQueries: string[];
  queriesCompleted: string[];
  queriesAttempted: number;
  lastQuery?: string;
  lastRunAt?: string;
  zeroYieldStreak: number;
  completionReason?: CombinationCompletionReason;
  newLeads: number;
  actionableLeads: number;
  rawPlacesProcessed: number;
  rejectedWebsite: number;
  rejectedNonMobile: number;
  duplicates: number;
};

export type RunStopReason =
  | "target_met"
  | "global_search_limit"
  | "all_combinations_exhausted";

export type DiscoveryProgress = {
  version: 1;
  regionOrder: DiscoveryRegionId[];
  professionOrder: DiscoveryProfessionId[];
  currentRegionId: DiscoveryRegionId;
  currentProfessionId: DiscoveryProfessionId;
  combinations: Record<string, CombinationProgress>;
  updatedAt: string;
};

const DEFAULT_PATH = resolve(process.cwd(), "data/lead-discovery-progress.json");

function emptyCombination(): CombinationProgress {
  return {
    status: "pending",
    highValueQueries: [],
    optionalQueries: [],
    queriesCompleted: [],
    queriesAttempted: 0,
    zeroYieldStreak: 0,
    newLeads: 0,
    actionableLeads: 0,
    rawPlacesProcessed: 0,
    rejectedWebsite: 0,
    rejectedNonMobile: 0,
    duplicates: 0,
  };
}

export function createInitialProgress(): DiscoveryProgress {
  const combinations: Record<string, CombinationProgress> = {};
  for (const regionId of DISCOVERY_REGION_ORDER) {
    for (const professionId of DISCOVERY_PROFESSION_ORDER) {
      combinations[combinationKey(regionId, professionId)] = emptyCombination();
    }
  }

  return {
    version: 1,
    regionOrder: [...DISCOVERY_REGION_ORDER],
    professionOrder: [...DISCOVERY_PROFESSION_ORDER],
    currentRegionId: DISCOVERY_REGION_ORDER[0]!,
    currentProfessionId: DISCOVERY_PROFESSION_ORDER[0]!,
    combinations,
    updatedAt: new Date().toISOString(),
  };
}

export function readDiscoveryProgress(
  path = DEFAULT_PATH,
): DiscoveryProgress {
  try {
    if (!existsSync(path)) {
      return createInitialProgress();
    }
    const raw = JSON.parse(readFileSync(path, "utf8")) as DiscoveryProgress;
    if (raw?.version !== 1 || !raw.combinations) {
      return createInitialProgress();
    }
    return raw;
  } catch {
    return createInitialProgress();
  }
}

export function writeDiscoveryProgress(
  progress: DiscoveryProgress,
  path = DEFAULT_PATH,
): void {
  mkdirSync(dirname(path), { recursive: true });
  const payload: DiscoveryProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function resetDiscoveryProgress(path = DEFAULT_PATH): void {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

export function getCombinationProgress(
  progress: DiscoveryProgress,
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
): CombinationProgress {
  const key = combinationKey(regionId, professionId);
  return progress.combinations[key] ?? emptyCombination();
}

export function setCombinationProgress(
  progress: DiscoveryProgress,
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
  combo: CombinationProgress,
): DiscoveryProgress {
  const key = combinationKey(regionId, professionId);
  return {
    ...progress,
    combinations: {
      ...progress.combinations,
      [key]: combo,
    },
  };
}

export function completedQuerySet(combo: CombinationProgress): Set<string> {
  return new Set(combo.queriesCompleted);
}

export function markQueryCompleted(
  combo: CombinationProgress,
  query: string,
  newCandidates: number,
): CombinationProgress {
  const completed = new Set(
    combo.queriesCompleted.map((entry) => entry.toLowerCase()),
  );
  if (!completed.has(query.toLowerCase())) {
    combo.queriesCompleted.push(query);
  }

  return {
    ...combo,
    queriesAttempted: combo.queriesAttempted + 1,
    lastQuery: query,
    lastRunAt: new Date().toISOString(),
    zeroYieldStreak: newCandidates > 0 ? 0 : combo.zeroYieldStreak + 1,
  };
}

export function advancePointer(
  progress: DiscoveryProgress,
): DiscoveryProgress {
  const regionIndex = progress.regionOrder.indexOf(progress.currentRegionId);
  const professionIndex = progress.professionOrder.indexOf(
    progress.currentProfessionId,
  );

  if (professionIndex < progress.professionOrder.length - 1) {
    return {
      ...progress,
      currentProfessionId: progress.professionOrder[professionIndex + 1]!,
    };
  }

  if (regionIndex < progress.regionOrder.length - 1) {
    return {
      ...progress,
      currentRegionId: progress.regionOrder[regionIndex + 1]!,
      currentProfessionId: progress.professionOrder[0]!,
    };
  }

  return progress;
}

export function isAllCombinationsComplete(
  progress: DiscoveryProgress,
): boolean {
  return Object.values(progress.combinations).every(
    (combo) => combo.status === "completed",
  );
}

export type ProgressStatusSummary = {
  currentRegion: string;
  currentProfession: string;
  currentRegionId: DiscoveryRegionId;
  currentProfessionId: DiscoveryProfessionId;
  combinationsCompleted: number;
  combinationsTotal: number;
  nextRegion: string | null;
  nextProfession: string | null;
  combinations: Array<{
    key: string;
    status: CombinationStatus;
    completionReason?: CombinationCompletionReason;
    queriesCompleted: number;
    queriesPlanned: number;
    newLeads: number;
  }>;
};

export function formatProgressStatus(
  progress: DiscoveryProgress,
): ProgressStatusSummary {
  const currentKey = combinationKey(
    progress.currentRegionId,
    progress.currentProfessionId,
  );
  const current = progress.combinations[currentKey];
  const completedCount = Object.values(progress.combinations).filter(
    (combo) => combo.status === "completed",
  ).length;

  const pointer = advancePointer({
    ...progress,
    combinations: {
      ...progress.combinations,
      [currentKey]: { ...current!, status: "completed" },
    },
  });

  const nextRegion =
    pointer.currentRegionId !== progress.currentRegionId ||
    current?.status === "completed"
      ? getDiscoveryRegionName(pointer.currentRegionId)
      : getDiscoveryRegionName(progress.currentRegionId);

  const nextProfession =
    pointer.currentProfessionId !== progress.currentProfessionId ||
    current?.status === "completed"
      ? getDiscoveryProfessionDisplay(pointer.currentProfessionId)
      : getDiscoveryProfessionDisplay(progress.currentProfessionId);

  const combinations = Object.entries(progress.combinations).map(([key, combo]) => ({
    key,
    status: combo.status,
    completionReason: combo.completionReason,
    queriesCompleted: combo.queriesCompleted.length,
    queriesPlanned: combo.highValueQueries.length + combo.optionalQueries.length,
    newLeads: combo.newLeads,
  }));

  return {
    currentRegion: getDiscoveryRegionName(progress.currentRegionId),
    currentProfession: getDiscoveryProfessionDisplay(progress.currentProfessionId),
    currentRegionId: progress.currentRegionId,
    currentProfessionId: progress.currentProfessionId,
    combinationsCompleted: completedCount,
    combinationsTotal: Object.keys(progress.combinations).length,
    nextRegion: isAllCombinationsComplete(progress) ? null : nextRegion,
    nextProfession: isAllCombinationsComplete(progress) ? null : nextProfession,
    combinations,
  };
}

function getDiscoveryProfessionDisplay(id: DiscoveryProfessionId): string {
  return getDiscoveryProfessionName(id);
}

export function findActiveCombination(
  progress: DiscoveryProgress,
): { regionId: DiscoveryRegionId; professionId: DiscoveryProfessionId } {
  const key = combinationKey(
    progress.currentRegionId,
    progress.currentProfessionId,
  );
  const combo = progress.combinations[key];
  if (combo && combo.status !== "completed") {
    return {
      regionId: progress.currentRegionId,
      professionId: progress.currentProfessionId,
    };
  }

  for (const regionId of progress.regionOrder) {
    for (const professionId of progress.professionOrder) {
      const entry = progress.combinations[combinationKey(regionId, professionId)];
      if (entry && entry.status !== "completed") {
        return { regionId, professionId };
      }
    }
  }

  return {
    regionId: progress.currentRegionId,
    professionId: progress.currentProfessionId,
  };
}

export function syncPointerToCombination(
  progress: DiscoveryProgress,
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
): DiscoveryProgress {
  return {
    ...progress,
    currentRegionId: regionId,
    currentProfessionId: professionId,
  };
}

export function describeCombinationKey(key: string): string {
  const parsed = parseCombinationKey(key);
  if (!parsed) {
    return key;
  }
  return `${getDiscoveryRegionName(parsed.regionId)} × ${getDiscoveryProfessionDisplay(parsed.professionId)}`;
}
