import type { ImageSearchBrief } from "../types";
import type { StockPhotoCandidate } from "./types";

const PEXELS_API = "https://api.pexels.com/v1";

const FALLBACK_QUERIES: Record<"hero" | "services", string> = {
  hero: "modern hair salon interior natural light",
  services: "professional hair styling salon",
};

type PexelsPhoto = {
  id: number;
  photographer: string;
  photographer_url?: string;
  url?: string;
  width: number;
  height: number;
  src: {
    large?: string;
    large2x?: string;
    medium?: string;
    original?: string;
  };
};

function getApiKey(): string | undefined {
  return process.env.PEXELS_API_KEY?.trim() || undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPexelsOrientation(
  orientation?: ImageSearchBrief["orientation"],
): "landscape" | "portrait" | "square" | undefined {
  if (orientation === "landscape") {
    return "landscape";
  }

  if (orientation === "portrait") {
    return "portrait";
  }

  if (orientation === "squarish") {
    return "square";
  }

  return undefined;
}

function pickDownloadUrl(photo: PexelsPhoto): string | undefined {
  return (
    photo.src.large2x ??
    photo.src.large ??
    photo.src.medium ??
    photo.src.original
  );
}

function toCandidate(
  photo: PexelsPhoto,
  searchQuery: string,
): StockPhotoCandidate | undefined {
  const downloadUrl = pickDownloadUrl(photo);

  if (!downloadUrl) {
    return undefined;
  }

  return {
    provider: "pexels",
    id: String(photo.id),
    downloadUrl,
    sourceUrl: photo.url || `https://www.pexels.com/photo/${photo.id}/`,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    width: photo.width,
    height: photo.height,
    searchQuery,
  };
}

async function searchPhotos(
  query: string,
  orientation?: ImageSearchBrief["orientation"],
  attempt = 0,
): Promise<PexelsPhoto[]> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    query,
    per_page: "8",
  });

  const pexelsOrientation = toPexelsOrientation(orientation);

  if (pexelsOrientation) {
    params.set("orientation", pexelsOrientation);
  }

  const response = await fetch(`${PEXELS_API}/search?${params}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (response.status === 403 || response.status === 429) {
    if (attempt < 1) {
      await sleep(5_000);
      return searchPhotos(query, orientation, attempt + 1);
    }

    console.warn(
      `Pexels rate limit (${response.status}); skipping remaining Pexels searches.`,
    );
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Pexels search failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { photos?: PexelsPhoto[] };
  return payload.photos ?? [];
}

function firstUnused(
  photos: PexelsPhoto[],
  searchQuery: string,
  excludeIds: Set<string>,
): StockPhotoCandidate | undefined {
  for (const photo of photos) {
    const id = String(photo.id);
    if (excludeIds.has(`pexels:${id}`)) {
      continue;
    }
    const candidate = toCandidate(photo, searchQuery);
    if (candidate) {
      return candidate;
    }
  }
  return undefined;
}

async function findPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
  excludeIds: Set<string>,
): Promise<StockPhotoCandidate | undefined> {
  const primary = firstUnused(
    await searchPhotos(brief.query, brief.orientation),
    brief.query,
    excludeIds,
  );

  if (primary) {
    return primary;
  }

  if (brief.orientation) {
    const unoriented = firstUnused(
      await searchPhotos(brief.query),
      brief.query,
      excludeIds,
    );

    if (unoriented) {
      return unoriented;
    }
  }

  const fallbackQuery = FALLBACK_QUERIES[slot];
  return firstUnused(
    await searchPhotos(fallbackQuery),
    fallbackQuery,
    excludeIds,
  );
}

export async function searchPexelsPhotos(
  query: string,
  orientation?: ImageSearchBrief["orientation"],
): Promise<PexelsPhoto[]> {
  return searchPhotos(query, orientation);
}

export function pexelsPhotoToCandidate(
  photo: PexelsPhoto,
  searchQuery: string,
): StockPhotoCandidate | undefined {
  return toCandidate(photo, searchQuery);
}

export async function downloadPexelsCandidate(
  candidate: StockPhotoCandidate,
): Promise<Buffer | undefined> {
  const imageResponse = await fetch(candidate.downloadUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Pexels download failed (${imageResponse.status}) for photo ${candidate.id}`,
    );
  }
  return Buffer.from(await imageResponse.arrayBuffer());
}

export async function findPexelsPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
  excludeIds: Set<string> = new Set(),
): Promise<StockPhotoCandidate | undefined> {
  return findPhoto(brief, slot, excludeIds);
}

export async function downloadPexelsPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
  excludeIds: Set<string> = new Set(),
): Promise<
  | {
      data: Buffer;
      candidate: StockPhotoCandidate;
    }
  | undefined
> {
  const candidate = await findPexelsPhoto(brief, slot, excludeIds);

  if (!candidate) {
    return undefined;
  }

  const imageResponse = await fetch(candidate.downloadUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Pexels download failed (${imageResponse.status}) for photo ${candidate.id}`,
    );
  }

  return {
    data: Buffer.from(await imageResponse.arrayBuffer()),
    candidate,
  };
}

export function isPexelsConfigured(): boolean {
  return Boolean(getApiKey());
}
