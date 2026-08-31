import { createClientFromLead } from "@/clients/create-client-from-lead";
import { clientSiteExists } from "@/leads/client-exists";
import { discoverLeads } from "@/leads/discover";
import {
  DISCOVERY_MAX_SEARCHES_PER_RUN,
  DISCOVERY_PLACES_LIMIT_PER_QUERY,
  DISCOVERY_ZERO_YIELD_COMPLETION_STREAK,
} from "@/leads/discovery-config";
import {
  allHighValueCompleted,
  buildSearchSurface,
  nextQueryInSurface,
  type SearchSurface,
} from "@/leads/discovery-matrix";
import {
  advancePointer,
  completedQuerySet,
  findActiveCombination,
  getCombinationProgress,
  isAllCombinationsComplete,
  markQueryCompleted,
  readDiscoveryProgress,
  setCombinationProgress,
  syncPointerToCombination,
  writeDiscoveryProgress,
  type CombinationProgress,
  type DiscoveryProgress,
  type RunStopReason,
} from "@/leads/discovery-progress";
import {
  getDiscoveryProfessionName,
  type DiscoveryProfessionId,
} from "@/leads/discovery-professions";
import {
  getDiscoveryRegionName,
  type DiscoveryRegionId,
} from "@/leads/discovery-regions";
import { readLead } from "@/leads/store";
import {
  getSmsConfig,
  smsLeadReplenishToGenerate,
  smsLeadReplenishmentNeeded,
} from "@/outreach/sms/config";
import {
  countActionableSmsLeads,
  isSmsGenerationCandidate,
} from "@/outreach/sms/relevance";
import { isSlovenianMobilePhone, normalizeSlovenianPhone } from "@/outreach/sms/phone";

export { getReplenishStatus } from "./replenish-status";

export type QueryRunStats = {
  region: string;
  profession: string;
  query: string;
  newCandidates: number;
  rejectedWebsite: number;
  rejectedNonMobile: number;
  duplicates: number;
};

export type ReplenishStats = {
  actionableBefore: number;
  target: number;
  needed: number;
  toGenerate: number;
  candidatesDiscovered: number;
  rejectedExistingWebsite: number;
  rejectedMissingPhone: number;
  rejectedInvalidOrLandline: number;
  duplicates: number;
  demosGenerated: number;
  actionableAfter: number | null;
  errors: string[];
  queriesAttempted: number;
  queriesCompleted: number;
  region: string;
  profession: string;
  nextRegion: string | null;
  nextProfession: string | null;
  runStopReason?: RunStopReason;
};

export type ReplenishDependencies = {
  countActionable: () => Promise<number>;
  discover: typeof discoverLeads;
  createFromLead: typeof createClientFromLead;
  readLeadBySlug: typeof readLead;
  siteExists: typeof clientSiteExists;
  readProgress: () => DiscoveryProgress | Promise<DiscoveryProgress>;
  writeProgress: (
    progress: DiscoveryProgress,
  ) => void | Promise<void>;
  placesLimitPerQuery: number;
  maxSearchesPerRun: number;
  zeroYieldCompletionStreak: number;
  onQueryComplete?: (stats: QueryRunStats) => void;
};

const DEFAULT_DEPS: ReplenishDependencies = {
  countActionable: countActionableSmsLeads,
  discover: discoverLeads,
  createFromLead: createClientFromLead,
  readLeadBySlug: readLead,
  siteExists: clientSiteExists,
  readProgress: readDiscoveryProgress,
  writeProgress: writeDiscoveryProgress,
  placesLimitPerQuery: DISCOVERY_PLACES_LIMIT_PER_QUERY,
  maxSearchesPerRun: DISCOVERY_MAX_SEARCHES_PER_RUN,
  zeroYieldCompletionStreak: DISCOVERY_ZERO_YIELD_COMPLETION_STREAK,
};

function classifyRejectReason(lead: {
  existingWebsite?: string;
  phone?: string;
}):
  | "website"
  | "missing_phone"
  | "invalid_or_landline"
  | null {
  if (lead.existingWebsite?.trim()) {
    return "website";
  }
  if (!lead.phone?.trim()) {
    return "missing_phone";
  }
  if (!normalizeSlovenianPhone(lead.phone).ok || !isSlovenianMobilePhone(lead.phone)) {
    return "invalid_or_landline";
  }
  return null;
}

function comboSurface(combo: CombinationProgress): SearchSurface {
  return {
    highValueQueries: combo.highValueQueries,
    optionalQueries: combo.optionalQueries,
    allQueries: [...combo.highValueQueries, ...combo.optionalQueries],
  };
}

function activateCombination(
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
  combo: CombinationProgress,
): CombinationProgress {
  const surface = buildSearchSurface(regionId, professionId);
  return {
    ...combo,
    status: "active",
    highValueQueries: surface.highValueQueries,
    optionalQueries: surface.optionalQueries,
  };
}

function shouldCompleteCombination(
  combo: CombinationProgress,
  surface: SearchSurface,
  zeroYieldStreak: number,
  zeroYieldCompletionStreak: number,
): boolean {
  if (zeroYieldStreak >= zeroYieldCompletionStreak) {
    return true;
  }
  const completed = completedQuerySet(combo);
  if (allHighValueCompleted(surface, completed)) {
    return true;
  }
  return nextQueryInSurface(surface, completed) === null;
}

function completionReasonFor(
  zeroYieldStreak: number,
  zeroYieldCompletionStreak: number,
): CombinationProgress["completionReason"] {
  if (zeroYieldStreak >= zeroYieldCompletionStreak) {
    return "zero_yield_streak";
  }
  return "all_queries_exhausted";
}

function pointerLabels(progress: DiscoveryProgress): {
  region: string;
  profession: string;
  nextRegion: string | null;
  nextProfession: string | null;
} {
  if (isAllCombinationsComplete(progress)) {
    return {
      region: getDiscoveryRegionName(progress.currentRegionId),
      profession: getDiscoveryProfessionName(progress.currentProfessionId),
      nextRegion: null,
      nextProfession: null,
    };
  }

  const next = advancePointer(progress);
  return {
    region: getDiscoveryRegionName(progress.currentRegionId),
    profession: getDiscoveryProfessionName(progress.currentProfessionId),
    nextRegion: getDiscoveryRegionName(next.currentRegionId),
    nextProfession: getDiscoveryProfessionName(next.currentProfessionId),
  };
}

/**
 * Top up actionable SMS leads toward SMS_LEAD_TARGET, capped by batch.
 * Mines the region × profession discovery matrix with persistent progress.
 */
export async function replenishSmsLeads(
  deps: Partial<ReplenishDependencies> = {},
): Promise<ReplenishStats> {
  const d: ReplenishDependencies = { ...DEFAULT_DEPS, ...deps };
  const config = getSmsConfig();
  const target = config.leadTarget;
  const batch = config.leadReplenishBatch;

  const actionableBefore = await d.countActionable();
  const needed = smsLeadReplenishmentNeeded(actionableBefore, target);
  const toGenerate = smsLeadReplenishToGenerate(actionableBefore, {
    target,
    batch,
  });

  let progress = await d.readProgress();
  const labels = pointerLabels(progress);

  const stats: ReplenishStats = {
    actionableBefore,
    target,
    needed,
    toGenerate,
    candidatesDiscovered: 0,
    rejectedExistingWebsite: 0,
    rejectedMissingPhone: 0,
    rejectedInvalidOrLandline: 0,
    duplicates: 0,
    demosGenerated: 0,
    actionableAfter: null,
    errors: [],
    queriesAttempted: 0,
    queriesCompleted: 0,
    region: labels.region,
    profession: labels.profession,
    nextRegion: labels.nextRegion,
    nextProfession: labels.nextProfession,
  };

  if (toGenerate <= 0) {
    stats.actionableAfter = actionableBefore;
    return stats;
  }

  let searchesThisRun = 0;
  let runStopReason: RunStopReason | undefined;

  while (
    stats.demosGenerated < toGenerate
    && searchesThisRun < d.maxSearchesPerRun
    && !isAllCombinationsComplete(progress)
  ) {
    const active = findActiveCombination(progress);
    progress = syncPointerToCombination(
      progress,
      active.regionId,
      active.professionId,
    );

    let combo = getCombinationProgress(
      progress,
      active.regionId,
      active.professionId,
    );

    if (combo.status === "pending") {
      combo = activateCombination(active.regionId, active.professionId, combo);
      progress = setCombinationProgress(
        progress,
        active.regionId,
        active.professionId,
        combo,
      );
      await d.writeProgress(progress);
    }

    const surface = comboSurface(combo);
    const query = nextQueryInSurface(surface, completedQuerySet(combo));

    if (!query) {
      combo = {
        ...combo,
        status: "completed",
        completionReason: "all_queries_exhausted",
      };
      progress = setCombinationProgress(
        progress,
        active.regionId,
        active.professionId,
        combo,
      );
      progress = advancePointer(progress);
      await d.writeProgress(progress);
      continue;
    }

    searchesThisRun += 1;
    stats.queriesAttempted += 1;

    const regionName = getDiscoveryRegionName(active.regionId);
    const professionName = getDiscoveryProfessionName(active.professionId);
    stats.region = regionName;
    stats.profession = professionName;

    let discovered;
    let queryNewCandidates = 0;
    let queryRejectedWebsite = 0;
    let queryRejectedNonMobile = 0;
    let queryDuplicates = 0;

    try {
      discovered = await d.discover(query, d.placesLimitPerQuery, {
        withoutWebsiteOnly: true,
        requireMobilePhone: true,
        profession: active.professionId,
        region: active.regionId,
        sourceQuery: query,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push(`discover "${query}": ${message}`);
      combo = markQueryCompleted(combo, query, 0);
      progress = setCombinationProgress(
        progress,
        active.regionId,
        active.professionId,
        combo,
      );
      await d.writeProgress(progress);
      runStopReason = "global_search_limit";
      break;
    }

    combo.rawPlacesProcessed += discovered.length;

    for (const result of discovered) {
      if (result.outcome === "skipped") {
        if (result.reason === "already known") {
          stats.duplicates += 1;
          queryDuplicates += 1;
          combo.duplicates += 1;
        } else if (result.reason === "already has a website") {
          stats.rejectedExistingWebsite += 1;
          queryRejectedWebsite += 1;
          combo.rejectedWebsite += 1;
        } else if (
          result.reason === "missing phone"
          || result.reason === "no valid Slovenian mobile phone"
        ) {
          stats.rejectedMissingPhone += result.reason === "missing phone" ? 1 : 0;
          stats.rejectedInvalidOrLandline +=
            result.reason === "no valid Slovenian mobile phone" ? 1 : 0;
          queryRejectedNonMobile += 1;
          combo.rejectedNonMobile += 1;
        }
        continue;
      }

      if (stats.demosGenerated >= toGenerate) {
        break;
      }

      stats.candidatesDiscovered += 1;
      queryNewCandidates += 1;
      combo.newLeads += 1;

      const lead = d.readLeadBySlug(result.slug);
      if (!lead) {
        stats.errors.push(`missing lead file after discover: ${result.slug}`);
        continue;
      }

      const reject = classifyRejectReason(lead);
      if (reject === "website") {
        stats.rejectedExistingWebsite += 1;
        continue;
      }
      if (reject === "missing_phone") {
        stats.rejectedMissingPhone += 1;
        continue;
      }
      if (reject === "invalid_or_landline") {
        stats.rejectedInvalidOrLandline += 1;
        continue;
      }

      if (!isSmsGenerationCandidate(lead)) {
        stats.rejectedInvalidOrLandline += 1;
        continue;
      }

      if (d.siteExists(lead.slug)) {
        stats.duplicates += 1;
        continue;
      }

      try {
        const created = await d.createFromLead(lead.slug);
        if (created.outcome === "created") {
          stats.demosGenerated += 1;
          combo.actionableLeads += 1;
        } else {
          if (created.reason.includes("website")) {
            stats.rejectedExistingWebsite += 1;
          } else if (created.reason.includes("mobile")) {
            stats.rejectedInvalidOrLandline += 1;
          } else if (created.reason.includes("already exists")) {
            stats.duplicates += 1;
          } else {
            stats.errors.push(`${lead.slug}: ${created.reason}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stats.errors.push(`${lead.slug}: ${message}`);
      }
    }

    combo = markQueryCompleted(combo, query, queryNewCandidates);
    stats.queriesCompleted += 1;

    d.onQueryComplete?.({
      region: regionName,
      profession: professionName,
      query,
      newCandidates: queryNewCandidates,
      rejectedWebsite: queryRejectedWebsite,
      rejectedNonMobile: queryRejectedNonMobile,
      duplicates: queryDuplicates,
    });

    if (
      shouldCompleteCombination(
        combo,
        surface,
        combo.zeroYieldStreak,
        d.zeroYieldCompletionStreak,
      )
    ) {
      combo = {
        ...combo,
        status: "completed",
        completionReason: completionReasonFor(
          combo.zeroYieldStreak,
          d.zeroYieldCompletionStreak,
        ),
      };
      progress = advancePointer(progress);
    }

    progress = setCombinationProgress(
      progress,
      active.regionId,
      active.professionId,
      combo,
    );
    await d.writeProgress(progress);
  }

  if (!runStopReason) {
    if (stats.demosGenerated >= toGenerate) {
      runStopReason = "target_met";
    } else if (isAllCombinationsComplete(progress)) {
      runStopReason = "all_combinations_exhausted";
    } else if (searchesThisRun >= d.maxSearchesPerRun) {
      runStopReason = "global_search_limit";
    }
  }

  const finalLabels = pointerLabels(progress);
  stats.region = finalLabels.region;
  stats.profession = finalLabels.profession;
  stats.nextRegion = finalLabels.nextRegion;
  stats.nextProfession = finalLabels.nextProfession;
  stats.runStopReason = runStopReason;

  try {
    stats.actionableAfter = await d.countActionable();
  } catch {
    stats.actionableAfter = null;
  }

  return stats;
}
