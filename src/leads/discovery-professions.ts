import {
  IMAGE_POOL_CATEGORY_IDS,
  type ImagePoolCategoryId,
} from "@/images/image-pool-category";
import { categorySearchHint } from "@/images/image-pool-category";

export type DiscoveryProfessionId = ImagePoolCategoryId;

export const DISCOVERY_PROFESSION_ORDER: DiscoveryProfessionId[] = [
  ...IMAGE_POOL_CATEGORY_IDS,
];

export type DiscoveryProfession = {
  id: DiscoveryProfessionId;
  displayName: string;
  googleTerm: string;
  matchPattern: RegExp;
  excludePattern?: RegExp;
  /** Optional extra queries appended after town queries (region name appended at runtime). */
  extraQueryTerms?: string[];
};

const PROFESSION_CONFIG: Record<
  DiscoveryProfessionId,
  Omit<DiscoveryProfession, "id" | "matchPattern"> & { matchHint: DiscoveryProfessionId }
> = {
  "nohti-pedikura": {
    displayName: "nohti/pedikura",
    googleTerm: "manikura",
    matchHint: "nohti-pedikura",
    extraQueryTerms: ["nohti"],
  },
  "maserji-wellness": {
    displayName: "maserji/wellness",
    googleTerm: "masaža",
    matchHint: "maserji-wellness",
  },
  vulkanizerji: {
    displayName: "vulkanizerji",
    googleTerm: "vulkanizer",
    matchHint: "vulkanizerji",
  },
  "avtokleparji-licarji": {
    displayName: "avtokleparji/ličarji",
    googleTerm: "avtoklepar",
    matchHint: "avtokleparji-licarji",
  },
  avtomehaniki: {
    displayName: "avtomehaniki",
    googleTerm: "avtoservis",
    matchHint: "avtomehaniki",
  },
  frizerji: {
    displayName: "frizerji",
    googleTerm: "frizer",
    matchHint: "frizerji",
  },
  kozmeticarji: {
    displayName: "kozmetičarji",
    googleTerm: "kozmetični salon",
    matchHint: "kozmeticarji",
  },
  "vodovodarji-ogrevanje": {
    displayName: "vodovodarji/ogrevanje",
    googleTerm: "vodoinštalater",
    matchHint: "vodovodarji-ogrevanje",
  },
  elektricarji: {
    displayName: "električarji",
    googleTerm: "elektroinstalater",
    matchHint: "elektricarji",
  },
  keramicarji: {
    displayName: "keramičarji",
    googleTerm: "keramičar",
    matchHint: "keramicarji",
  },
  slikopleskarji: {
    displayName: "slikopleskarji",
    googleTerm: "slikopleskar",
    matchHint: "slikopleskarji",
  },
  suhomontazerji: {
    displayName: "suhomontažerji",
    googleTerm: "suhomontaža",
    matchHint: "suhomontazerji",
  },
  "mizarji-tesarji": {
    displayName: "mizarji/tesarji",
    googleTerm: "mizarstvo",
    matchHint: "mizarji-tesarji",
  },
  "parketarji-talne-obloge": {
    displayName: "parketarji",
    googleTerm: "parket",
    matchHint: "parketarji-talne-obloge",
  },
  gradbinci: {
    displayName: "gradbinci",
    googleTerm: "gradbeništvo",
    matchHint: "gradbinci",
  },
  "cistilni-servisi": {
    displayName: "čistilni servisi",
    googleTerm: "čiščenje",
    matchHint: "cistilni-servisi",
  },
};

const EXCLUDE_BY_PROFESSION: Partial<Record<DiscoveryProfessionId, RegExp>> = {
  avtomehaniki: /vulkaniz|avtoklepar|ličar|licar/i,
  frizerji: /kozmet|nail|noht|pedik|manik|lepot|beauty/i,
  kozmeticarji: /friz|hair|barber|brivnic|nail|noht|pedik|manik/i,
  elektricarji: /vodovod|ogrevan|kuril|plumbing/i,
  keramicarji: /parket|laminat|talne\s+oblog/i,
  "mizarji-tesarji": /suhomontaž|suhomontaz/i,
  gradbinci: /keramič|keramic|mizar|slikopleskar|fasader/i,
};

function buildProfession(id: DiscoveryProfessionId): DiscoveryProfession {
  const config = PROFESSION_CONFIG[id];
  return {
    id,
    displayName: config.displayName,
    googleTerm: config.googleTerm,
    matchPattern: categorySearchHint(config.matchHint),
    excludePattern: EXCLUDE_BY_PROFESSION[id],
    extraQueryTerms: config.extraQueryTerms,
  };
}

const PROFESSIONS = new Map(
  DISCOVERY_PROFESSION_ORDER.map((id) => [id, buildProfession(id)]),
);

export function getDiscoveryProfession(
  id: string,
): DiscoveryProfession | undefined {
  return PROFESSIONS.get(id as DiscoveryProfessionId);
}

export function getDiscoveryProfessionName(id: string): string {
  return getDiscoveryProfession(id)?.displayName ?? id;
}

export function isDiscoveryProfessionId(
  value: string,
): value is DiscoveryProfessionId {
  return PROFESSIONS.has(value as DiscoveryProfessionId);
}

export function professionMatchesBusiness(
  professionId: DiscoveryProfessionId,
  business: { industry?: string; companyName?: string },
): boolean {
  const profession = getDiscoveryProfession(professionId);
  if (!profession) {
    return false;
  }

  const haystack = `${business.industry ?? ""} ${business.companyName ?? ""}`;
  if (!profession.matchPattern.test(haystack)) {
    return false;
  }
  if (profession.excludePattern?.test(haystack)) {
    return false;
  }
  return true;
}
