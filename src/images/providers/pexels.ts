import type { ImageSearchBrief } from "../types";

const PEXELS_API = "https://api.pexels.com/v1";

const FALLBACK_QUERIES: Record<"hero" | "services", string> = {
  hero: "modern hair salon interior natural light",
  services: "professional hair styling salon",
};

type PexelsPhoto = {
  id: number;
  photographer: string;
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

async function searchPhotos(
  query: string,
  orientation?: ImageSearchBrief["orientation"],
  attempt = 0,
): Promise<PexelsPhoto | undefined> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return undefined;
  }

  const params = new URLSearchParams({
    query,
    per_page: "5",
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
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `Pexels search failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { photos?: PexelsPhoto[] };
  return payload.photos?.[0];
}

async function findPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
): Promise<PexelsPhoto | undefined> {
  const primary = await searchPhotos(brief.query, brief.orientation);

  if (primary) {
    return primary;
  }

  if (brief.orientation) {
    const unoriented = await searchPhotos(brief.query);

    if (unoriented) {
      return unoriented;
    }
  }

  return searchPhotos(FALLBACK_QUERIES[slot]);
}

function pickDownloadUrl(photo: PexelsPhoto): string | undefined {
  return (
    photo.src.large2x ??
    photo.src.large ??
    photo.src.medium ??
    photo.src.original
  );
}

export async function downloadPexelsPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
): Promise<{ data: Buffer; photographer: string } | undefined> {
  const photo = await findPhoto(brief, slot);

  if (!photo) {
    return undefined;
  }

  const url = pickDownloadUrl(photo);

  if (!url) {
    return undefined;
  }

  const imageResponse = await fetch(url);

  if (!imageResponse.ok) {
    throw new Error(
      `Pexels download failed (${imageResponse.status}) for photo ${photo.id}`,
    );
  }

  const data = Buffer.from(await imageResponse.arrayBuffer());

  return {
    data,
    photographer: `${photo.photographer} (Pexels)`,
  };
}

export function isPexelsConfigured(): boolean {
  return Boolean(getApiKey());
}
