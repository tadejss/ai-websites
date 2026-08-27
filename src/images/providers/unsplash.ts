import type { ImageSearchBrief, UnsplashPhoto } from "../types";
import { acquireUnsplashSearchSlot } from "../unsplash-rate-limit";
import type { StockPhotoCandidate } from "./types";

const UNSPLASH_API = "https://api.unsplash.com";

const FALLBACK_QUERIES: Record<"hero" | "services", string> = {
  hero: "modern hair salon interior natural light",
  services: "professional hair styling salon",
};

type UnsplashSearchPhoto = UnsplashPhoto & {
  links?: { html?: string; download_location?: string };
  user: UnsplashPhoto["user"] & { links?: { html?: string } };
};

function getAccessKey(): string | undefined {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCandidate(
  photo: UnsplashSearchPhoto,
  searchQuery: string,
): StockPhotoCandidate {
  return {
    provider: "unsplash",
    id: photo.id,
    downloadUrl: photo.urls.regular,
    sourceUrl: photo.links?.html || `https://unsplash.com/photos/${photo.id}`,
    photographer: photo.user.name,
    photographerUrl: photo.user.links?.html,
    width: photo.width,
    height: photo.height,
    searchQuery,
  };
}

async function searchPhotos(
  query: string,
  orientation?: ImageSearchBrief["orientation"],
  attempt = 0,
): Promise<UnsplashSearchPhoto[]> {
  const accessKey = getAccessKey();

  if (!accessKey) {
    return [];
  }

  const slot = await acquireUnsplashSearchSlot();

  if (slot === "skipped") {
    return [];
  }

  const params = new URLSearchParams({
    query,
    per_page: "8",
    content_filter: "high",
  });

  if (orientation) {
    params.set("orientation", orientation);
  }

  const response = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (response.status === 403 || response.status === 429) {
    if (attempt < 1) {
      await sleep(5_000);
      return searchPhotos(query, orientation, attempt + 1);
    }

    console.warn(
      `Unsplash quota exhausted (${response.status}); falling back if available.`,
    );
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Unsplash search failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as {
    results?: UnsplashSearchPhoto[];
  };
  return payload.results ?? [];
}

function firstUnused(
  photos: UnsplashSearchPhoto[],
  searchQuery: string,
  excludeIds: Set<string>,
): { candidate: StockPhotoCandidate; photo: UnsplashSearchPhoto } | undefined {
  for (const photo of photos) {
    if (excludeIds.has(`unsplash:${photo.id}`)) {
      continue;
    }
    return { candidate: toCandidate(photo, searchQuery), photo };
  }
  return undefined;
}

async function findPhotoWithMeta(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
  excludeIds: Set<string>,
): Promise<{ candidate: StockPhotoCandidate; photo: UnsplashSearchPhoto } | undefined> {
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

/** Notify Unsplash of a download (API guideline). Best-effort only. */
async function triggerDownload(downloadLocation?: string): Promise<void> {
  const accessKey = getAccessKey();

  if (!accessKey || !downloadLocation) {
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });
  } catch {
    // Non-fatal — attribution URL is still stored.
  }
}

export async function findUnsplashPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
  excludeIds: Set<string> = new Set(),
): Promise<StockPhotoCandidate | undefined> {
  const match = await findPhotoWithMeta(brief, slot, excludeIds);
  return match?.candidate;
}

export async function downloadUnsplashPhoto(
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
  const match = await findPhotoWithMeta(brief, slot, excludeIds);

  if (!match) {
    return undefined;
  }

  await triggerDownload(match.photo.links?.download_location);

  const imageResponse = await fetch(match.candidate.downloadUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Unsplash download failed (${imageResponse.status}) for photo ${match.candidate.id}`,
    );
  }

  return {
    data: Buffer.from(await imageResponse.arrayBuffer()),
    candidate: match.candidate,
  };
}

export function isUnsplashConfigured(): boolean {
  return Boolean(getAccessKey());
}
