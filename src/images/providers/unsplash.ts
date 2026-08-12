import type { ImageSearchBrief, UnsplashPhoto } from "../types";

const UNSPLASH_API = "https://api.unsplash.com";

const FALLBACK_QUERIES: Record<"hero" | "services", string> = {
  hero: "modern hair salon interior natural light",
  services: "professional hair styling salon",
};

function getAccessKey(): string | undefined {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchPhotos(
  query: string,
  orientation?: ImageSearchBrief["orientation"],
  attempt = 0,
): Promise<UnsplashPhoto | undefined> {
  const accessKey = getAccessKey();

  if (!accessKey) {
    return undefined;
  }

  const params = new URLSearchParams({
    query,
    per_page: "5",
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

  if ((response.status === 403 || response.status === 429) && attempt < 2) {
    await sleep(1000 * (attempt + 1));
    return searchPhotos(query, orientation, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(
      `Unsplash search failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { results?: UnsplashPhoto[] };
  return payload.results?.[0];
}

async function findPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
): Promise<UnsplashPhoto | undefined> {
  const queries = [brief.query, FALLBACK_QUERIES[slot]];
  const orientations: Array<ImageSearchBrief["orientation"] | undefined> = [
    brief.orientation,
    undefined,
  ];

  for (const query of queries) {
    for (const orientation of orientations) {
      const photo = await searchPhotos(query, orientation);

      if (photo) {
        return photo;
      }
    }
  }

  return undefined;
}

export async function downloadUnsplashPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
): Promise<{ data: Buffer; photographer: string } | undefined> {
  const photo = await findPhoto(brief, slot);

  if (!photo) {
    return undefined;
  }

  const imageResponse = await fetch(photo.urls.regular);

  if (!imageResponse.ok) {
    throw new Error(
      `Unsplash download failed (${imageResponse.status}) for photo ${photo.id}`,
    );
  }

  const data = Buffer.from(await imageResponse.arrayBuffer());

  return {
    data,
    photographer: photo.user.name,
  };
}

export function isUnsplashConfigured(): boolean {
  return Boolean(getAccessKey());
}
