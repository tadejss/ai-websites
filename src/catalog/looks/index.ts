import { IMAGE_POOL_CATEGORY_IDS } from "@/images/image-pool-category";
import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { SiteLookDefinition, SiteLookId } from "@/catalog/types";
import { buildCategoryLooks } from "./build-category-looks";

import { frizerjiLooks } from "./frizerji";
import { avtomehanikiLooks } from "./avtomehaniki";
import { nohtiPedikuraLooks } from "./nohti-pedikura";
import { maserjiWellnessLooks } from "./maserji-wellness";
import { vulkanizerjiLooks } from "./vulkanizerji";
import { avtokleparjiLicarjiLooks } from "./avtokleparji-licarji";
import { kozmeticarjiLooks } from "./kozmeticarji";
import { vodovodarjiOgrevanjeLooks } from "./vodovodarji-ogrevanje";
import { elektricarjiLooks } from "./elektricarji";
import { keramicarjiLooks } from "./keramicarji";
import { slikopleskarjiLooks } from "./slikopleskarji";
import { suhomontazerjiLooks } from "./suhomontazerji";
import { mizarjiTesarjiLooks } from "./mizarji-tesarji";
import { parketarjiTalneOblogeLooks } from "./parketarji-talne-obloge";
import { gradbinciLooks } from "./gradbinci";
import { cistilniServisiLooks } from "./cistilni-servisi";

const looksByCategory: Record<ImagePoolCategoryId, SiteLookDefinition[]> = {
  frizerji: frizerjiLooks,
  avtomehaniki: avtomehanikiLooks,
  "nohti-pedikura": nohtiPedikuraLooks,
  "maserji-wellness": maserjiWellnessLooks,
  vulkanizerji: vulkanizerjiLooks,
  "avtokleparji-licarji": avtokleparjiLicarjiLooks,
  kozmeticarji: kozmeticarjiLooks,
  "vodovodarji-ogrevanje": vodovodarjiOgrevanjeLooks,
  elektricarji: elektricarjiLooks,
  keramicarji: keramicarjiLooks,
  slikopleskarji: slikopleskarjiLooks,
  suhomontazerji: suhomontazerjiLooks,
  "mizarji-tesarji": mizarjiTesarjiLooks,
  "parketarji-talne-obloge": parketarjiTalneOblogeLooks,
  gradbinci: gradbinciLooks,
  "cistilni-servisi": cistilniServisiLooks,
};

export const allLooks: SiteLookDefinition[] = IMAGE_POOL_CATEGORY_IDS.flatMap(
  (categoryId) => looksByCategory[categoryId],
);

const lookById = new Map(allLooks.map((look) => [look.id, look]));

export function getLook(id: SiteLookId): SiteLookDefinition | undefined {
  return lookById.get(id);
}

export function getLooksForCategory(
  categoryId: ImagePoolCategoryId,
): SiteLookDefinition[] {
  return looksByCategory[categoryId] ?? [];
}

export function getApprovedLooksForCategory(
  categoryId: ImagePoolCategoryId,
): SiteLookDefinition[] {
  return getLooksForCategory(categoryId).filter(
    (look) => look.status === "approved",
  );
}

export const lookIds = allLooks.map((look) => look.id);
