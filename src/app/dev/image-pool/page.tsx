import { IMAGE_POOL_CATEGORY_IDS } from "@/images/image-pool-category";
import { readAssetCache } from "@/images/asset-cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ImagePoolIndexPage() {
  const cache = await readAssetCache();
  const rows = IMAGE_POOL_CATEGORY_IDS.map((id) => ({
    id,
    count: (cache.pools[id] ?? []).filter((key) => Boolean(cache.assets[key]))
      .length,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6">
      <header className="mx-auto mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Local image pool QA
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Photos by profession
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Open one profession, then reply with OK / remove numbers.
        </p>
      </header>

      <ul className="mx-auto max-w-3xl divide-y divide-white/10 border-y border-white/10">
        {rows.map((row, index) => (
          <li key={row.id}>
            <Link
              href={`/dev/image-pool/${row.id}`}
              className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-white/5"
            >
              <span className="font-mono">
                <span className="text-zinc-500">{index + 1}.</span> {row.id}
              </span>
              <span
                className={
                  row.count > 0 ? "text-zinc-300" : "text-zinc-600"
                }
              >
                {row.count} photos
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
