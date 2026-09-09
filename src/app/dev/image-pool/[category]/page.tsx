import {
  IMAGE_POOL_CATEGORY_IDS,
  isImagePoolCategoryId,
  type ImagePoolCategoryId,
} from "@/images/image-pool-category";
import { readAssetCache } from "@/images/asset-cache";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function ImagePoolQaPage({ params }: Props) {
  const { category } = await params;
  if (!isImagePoolCategoryId(category)) {
    notFound();
  }
  const categoryId = category as ImagePoolCategoryId;
  const cache = await readAssetCache();
  const keys = cache.pools[categoryId] ?? [];
  const items = keys
    .map((key, index) => {
      const asset = cache.assets[key];
      if (!asset) return null;
      return { n: index + 1, key, asset };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const catIndex = IMAGE_POOL_CATEGORY_IDS.indexOf(categoryId);
  const prev = IMAGE_POOL_CATEGORY_IDS[catIndex - 1];
  const next = IMAGE_POOL_CATEGORY_IDS[catIndex + 1];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6">
      <header className="mx-auto mb-6 max-w-[1280px]">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Local image pool QA
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {categoryId} · {items.length} photos
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Reply with numbers: OK / remove. Example:{" "}
          <span className="font-mono text-zinc-300">
            OK: 1,3,5 · remove: 2,4
          </span>
        </p>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/dev/image-pool" className="text-zinc-400 hover:text-white">
            ← all professions
          </Link>
          {prev ? (
            <Link
              href={`/dev/image-pool/${prev}`}
              className="text-zinc-400 hover:text-white"
            >
              ← {prev}
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/dev/image-pool/${next}`}
              className="text-zinc-400 hover:text-white"
            >
              {next} →
            </Link>
          ) : null}
        </nav>
      </header>

      {items.length === 0 ? (
        <p className="mx-auto max-w-[1280px] text-zinc-500">
          No photos in this pool yet.
        </p>
      ) : (
        <ol className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ n, key, asset }) => (
            <li key={key} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-zinc-200">
                  {n}. {key}
                </p>
                <p className="text-xs text-zinc-500">uses {asset.usageCount}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.srcFallback || asset.src}
                  alt={asset.searchQuery}
                  className="aspect-[4/3] w-full object-cover"
                  loading={n <= 6 ? "eager" : "lazy"}
                />
              </div>
              <p className="line-clamp-2 text-xs text-zinc-500">
                {asset.searchQuery}
              </p>
              <p className="text-xs text-zinc-600">{asset.photographer}</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
