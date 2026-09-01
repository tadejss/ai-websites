import { loadDiscoveryProgress } from "@/factory/discovery-progress-store";
import { combinationKey } from "@/leads/discovery-matrix";
import { DISCOVERY_PROFESSION_ORDER } from "@/leads/discovery-professions";
import { DISCOVERY_REGION_ORDER } from "@/leads/discovery-regions";
import { DiscoveryHeatmapGrid } from "./discovery-heatmap-grid";

export type HeatmapCell = {
  key: string;
  region: string;
  profession: string;
  status: "pending" | "active" | "completed";
};

export async function buildDiscoveryHeatmapCells(): Promise<HeatmapCell[]> {
  const progress = await loadDiscoveryProgress();
  const cells: HeatmapCell[] = [];

  for (const regionId of DISCOVERY_REGION_ORDER) {
    for (const professionId of DISCOVERY_PROFESSION_ORDER) {
      const key = combinationKey(regionId, professionId);
      const combo = progress.combinations[key];
      cells.push({
        key,
        region: regionId,
        profession: professionId,
        status:
          combo?.status === "completed"
            ? "completed"
            : combo?.status === "active"
              ? "active"
              : "pending",
      });
    }
  }

  return cells;
}

export async function DiscoveryHeatmap() {
  const cells = await buildDiscoveryHeatmapCells();
  return <DiscoveryHeatmapGrid cells={cells} />;
}
