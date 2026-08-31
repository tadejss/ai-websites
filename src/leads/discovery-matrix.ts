import {
  getDiscoveryRegion,
  type DiscoveryRegionId,
} from "./discovery-regions";
import {
  getDiscoveryProfession,
  type DiscoveryProfessionId,
} from "./discovery-professions";

export type SearchSurface = {
  highValueQueries: string[];
  optionalQueries: string[];
  allQueries: string[];
};

export function combinationKey(
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
): string {
  return `${regionId}:${professionId}`;
}

export function parseCombinationKey(
  key: string,
): { regionId: DiscoveryRegionId; professionId: DiscoveryProfessionId } | null {
  const index = key.indexOf(":");
  if (index <= 0) {
    return null;
  }
  return {
    regionId: key.slice(0, index) as DiscoveryRegionId,
    professionId: key.slice(index + 1) as DiscoveryProfessionId,
  };
}

function dedupeQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const normalized = query.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(query.trim());
  }
  return result;
}

/**
 * Deterministic search surface for one region × profession cell.
 * Order: regional query → main towns → optional profession extras.
 */
export function buildSearchSurface(
  regionId: DiscoveryRegionId,
  professionId: DiscoveryProfessionId,
): SearchSurface {
  const region = getDiscoveryRegion(regionId);
  const profession = getDiscoveryProfession(professionId);

  if (!region || !profession) {
    return { highValueQueries: [], optionalQueries: [], allQueries: [] };
  }

  const highValueQueries = dedupeQueries([
    `${profession.googleTerm} ${region.name}`,
    ...region.towns.map((town) => `${profession.googleTerm} ${town}`),
  ]);

  const optionalQueries = dedupeQueries(
    (profession.extraQueryTerms ?? []).flatMap((term) => [
      `${term} ${region.name}`,
      ...region.towns.slice(0, 3).map((town) => `${term} ${town}`),
    ]),
  ).filter((query) => !highValueQueries.some(
    (high) => high.toLowerCase() === query.toLowerCase(),
  ));

  return {
    highValueQueries,
    optionalQueries,
    allQueries: [...highValueQueries, ...optionalQueries],
  };
}

export function nextQueryInSurface(
  surface: SearchSurface,
  completed: Set<string>,
): string | null {
  const completedLower = new Set(
    [...completed].map((query) => query.toLowerCase()),
  );

  for (const query of surface.allQueries) {
    if (!completedLower.has(query.toLowerCase())) {
      return query;
    }
  }

  return null;
}

export function allHighValueCompleted(
  surface: SearchSurface,
  completed: Set<string>,
): boolean {
  const completedLower = new Set(
    [...completed].map((query) => query.toLowerCase()),
  );
  return surface.highValueQueries.every((query) =>
    completedLower.has(query.toLowerCase()),
  );
}
