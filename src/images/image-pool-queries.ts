import type { ImagePoolCategoryId } from "./image-pool-category";

export type PoolSearchQuery = {
  query: string;
  orientation: "portrait" | "squarish" | "landscape";
};

type CategoryQueries = {
  hero: PoolSearchQuery[];
  services: PoolSearchQuery[];
};

const QUERIES: Record<ImagePoolCategoryId, CategoryQueries> = {
  "nohti-pedikura": {
    hero: [
      { query: "nail salon manicure professional interior", orientation: "portrait" },
      { query: "pedicure spa treatment close up", orientation: "portrait" },
    ],
    services: [
      { query: "nail art tools and polish professional", orientation: "squarish" },
      { query: "manicure hands nail care", orientation: "squarish" },
    ],
  },
  "maserji-wellness": {
    hero: [
      { query: "massage therapy spa wellness room", orientation: "portrait" },
      { query: "relaxing spa treatment professional", orientation: "portrait" },
    ],
    services: [
      { query: "massage therapist hands professional", orientation: "squarish" },
      { query: "wellness spa oils and towels", orientation: "squarish" },
    ],
  },
  vulkanizerji: {
    hero: [
      { query: "tire shop mechanic changing tire", orientation: "portrait" },
      { query: "auto tire service garage professional", orientation: "portrait" },
    ],
    services: [
      { query: "car tires stacked garage workshop", orientation: "squarish" },
      { query: "wheel alignment tire equipment", orientation: "squarish" },
    ],
  },
  "avtokleparji-licarji": {
    hero: [
      { query: "auto body shop car painting professional", orientation: "portrait" },
      { query: "car dent repair bodywork garage", orientation: "portrait" },
    ],
    services: [
      { query: "automotive spray painting booth", orientation: "squarish" },
      { query: "car body repair tools workshop", orientation: "squarish" },
    ],
  },
  avtomehaniki: {
    hero: [
      { query: "auto mechanic working on car engine", orientation: "portrait" },
      { query: "car repair shop professional mechanic", orientation: "portrait" },
    ],
    services: [
      { query: "car diagnostic equipment garage", orientation: "squarish" },
      { query: "automotive tools workshop professional", orientation: "squarish" },
    ],
  },
  frizerji: {
    hero: [
      { query: "modern hair salon interior natural light", orientation: "portrait" },
      { query: "hair stylist working in salon", orientation: "portrait" },
    ],
    services: [
      { query: "professional hair styling salon", orientation: "squarish" },
      { query: "hair cutting scissors salon tools", orientation: "squarish" },
    ],
  },
  kozmeticarji: {
    hero: [
      { query: "cosmetic facial treatment spa salon", orientation: "portrait" },
      { query: "beauty salon skincare professional", orientation: "portrait" },
    ],
    services: [
      { query: "skincare products spa treatment tools", orientation: "squarish" },
      { query: "facial care beauty professional", orientation: "squarish" },
    ],
  },
  "vodovodarji-ogrevanje": {
    hero: [
      { query: "plumber working on pipes installation", orientation: "portrait" },
      { query: "heating system maintenance professional", orientation: "portrait" },
    ],
    services: [
      { query: "plumbing tools and fittings professional", orientation: "squarish" },
      { query: "boiler heating installation service", orientation: "squarish" },
    ],
  },
  elektricarji: {
    hero: [
      { query: "electrician working electrical panel", orientation: "portrait" },
      { query: "professional electrician installing wiring", orientation: "portrait" },
    ],
    services: [
      { query: "electrical tools and wiring professional", orientation: "squarish" },
      { query: "light fixture installation electrician", orientation: "squarish" },
    ],
  },
  keramicarji: {
    hero: [
      { query: "tile installer laying ceramic floor", orientation: "portrait" },
      { query: "professional tiler bathroom renovation", orientation: "portrait" },
    ],
    services: [
      { query: "ceramic tiles and tools construction", orientation: "squarish" },
      { query: "tile cutting installation professional", orientation: "squarish" },
    ],
  },
  slikopleskarji: {
    hero: [
      { query: "house painter working on wall interior", orientation: "portrait" },
      { query: "professional painter painting facade", orientation: "portrait" },
    ],
    services: [
      { query: "paint roller brushes professional tools", orientation: "squarish" },
      { query: "interior painting renovation professional", orientation: "squarish" },
    ],
  },
  suhomontazerji: {
    hero: [
      { query: "drywall installer construction interior", orientation: "portrait" },
      { query: "gypsum board installation professional", orientation: "portrait" },
    ],
    services: [
      { query: "drywall tools plasterboard construction", orientation: "squarish" },
      { query: "interior drywall finishing professional", orientation: "squarish" },
    ],
  },
  "mizarji-tesarji": {
    hero: [
      { query: "carpenter woodworking workshop professional", orientation: "portrait" },
      { query: "joiner crafting wood furniture", orientation: "portrait" },
    ],
    services: [
      { query: "woodworking tools carpentry workshop", orientation: "squarish" },
      { query: "custom wood furniture craftsmanship", orientation: "squarish" },
    ],
  },
  "parketarji-talne-obloge": {
    hero: [
      { query: "hardwood floor installation professional", orientation: "portrait" },
      { query: "flooring installer laying laminate", orientation: "portrait" },
    ],
    services: [
      { query: "floor sanding parquet tools professional", orientation: "squarish" },
      { query: "laminate flooring installation tools", orientation: "squarish" },
    ],
  },
  gradbinci: {
    hero: [
      { query: "construction workers building site professional", orientation: "portrait" },
      { query: "renovation construction team interior", orientation: "portrait" },
    ],
    services: [
      { query: "construction tools building renovation", orientation: "squarish" },
      { query: "building site masonry professional", orientation: "squarish" },
    ],
  },
  "cistilni-servisi": {
    hero: [
      { query: "professional office cleaning service worker", orientation: "portrait" },
      { query: "commercial cleaning team interior", orientation: "portrait" },
    ],
    services: [
      { query: "cleaning supplies and equipment professional", orientation: "squarish" },
      { query: "janitorial service cleaning floor", orientation: "squarish" },
    ],
  },
};

export function getPoolSearchQueries(
  category: ImagePoolCategoryId,
): CategoryQueries {
  return QUERIES[category];
}

export function getAllPoolSearchQueries(
  category: ImagePoolCategoryId,
): PoolSearchQuery[] {
  const { hero, services } = QUERIES[category];
  return [...hero, ...services];
}
