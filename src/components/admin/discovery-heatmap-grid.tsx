"use client";

import { cn } from "@/lib/utils";
import type { HeatmapCell } from "./discovery-heatmap";

export function DiscoveryHeatmapGrid({ cells }: { cells: HeatmapCell[] }) {
  const regions = [...new Set(cells.map((cell) => cell.region))];
  const professions = [...new Set(cells.map((cell) => cell.profession))];
  const cellMap = new Map(cells.map((cell) => [cell.key, cell]));

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-0.5"
        style={{
          gridTemplateColumns: `72px repeat(${professions.length}, 10px)`,
        }}
      >
        <div />
        {professions.map((profession) => (
          <div
            key={profession}
            className="h-10 truncate text-[7px] leading-none text-[var(--admin-muted)] [writing-mode:vertical-rl]"
            title={profession}
          >
            {profession.slice(0, 6)}
          </div>
        ))}
        {regions.map((region) => (
          <RegionRow
            key={region}
            region={region}
            professions={professions}
            cellMap={cellMap}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-[var(--admin-muted)]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> completed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 animate-pulse rounded-sm bg-cyan-500/80" /> active
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-zinc-700" /> pending
        </span>
      </div>
    </div>
  );
}

function RegionRow({
  region,
  professions,
  cellMap,
}: {
  region: string;
  professions: string[];
  cellMap: Map<string, HeatmapCell>;
}) {
  return (
    <>
      <div
        className="truncate pr-1 text-[9px] text-[var(--admin-muted)]"
        title={region}
      >
        {region.slice(0, 8)}
      </div>
      {professions.map((profession) => {
        const key = `${region}:${profession}`;
        const cell = cellMap.get(key);
        const status = cell?.status ?? "pending";
        return (
          <div
            key={`${region}-${profession}`}
            title={`${region} × ${profession}: ${status}`}
            className={cn(
              "h-2.5 w-2.5 rounded-sm",
              status === "completed" && "bg-emerald-500/80",
              status === "active" && "animate-pulse bg-cyan-500/80",
              status === "pending" && "bg-zinc-700",
            )}
          />
        );
      })}
    </>
  );
}
