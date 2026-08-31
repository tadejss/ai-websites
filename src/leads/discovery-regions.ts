import type { PlacesLocationBias } from "@/sources/google-places-source";

export type DiscoveryRegionId =
  | "osrednjeslovenska"
  | "podravska"
  | "gorenjska"
  | "pomurska"
  | "savinjska"
  | "zasavska"
  | "posavska"
  | "jugovzhodna-slovenija"
  | "primorsko-notranjska"
  | "goriska"
  | "obalno-kraska"
  | "koroska";

export type DiscoveryRegion = {
  id: DiscoveryRegionId;
  name: string;
  locationBias: PlacesLocationBias;
  addressPattern: RegExp;
  towns: string[];
};

/** Density-first processing order, then remaining SURS regions. */
export const DISCOVERY_REGION_ORDER: DiscoveryRegionId[] = [
  "osrednjeslovenska",
  "podravska",
  "gorenjska",
  "pomurska",
  "savinjska",
  "zasavska",
  "posavska",
  "jugovzhodna-slovenija",
  "primorsko-notranjska",
  "goriska",
  "obalno-kraska",
  "koroska",
];

function patternFromTowns(towns: string[], extra: string[] = []): RegExp {
  const parts = [...towns, ...extra]
    .map((town) => town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(parts, "i");
}

const REGIONS: DiscoveryRegion[] = [
  {
    id: "osrednjeslovenska",
    name: "Osrednjeslovenska",
    locationBias: { latitude: 46.0569, longitude: 14.5058, radiusMeters: 35_000 },
    towns: [
      "Ljubljana",
      "Domžale",
      "Kamnik",
      "Grosuplje",
      "Vrhnika",
      "Litija",
      "Medvode",
      "Škofljica",
      "Ig",
      "Logatec",
    ],
    addressPattern: patternFromTowns(
      [
        "Ljubljana",
        "Domžale",
        "Domzale",
        "Kamnik",
        "Grosuplje",
        "Vrhnika",
        "Litija",
        "Medvode",
        "Škofljica",
        "Skofljica",
        "Ig",
        "Logatec",
        "Vič",
        "Vic",
        "Bežigrad",
        "Bezigrad",
      ],
      ["osrednjeslovenska", "osrednja slovenija"],
    ),
  },
  {
    id: "podravska",
    name: "Podravska",
    locationBias: { latitude: 46.5547, longitude: 15.6459, radiusMeters: 45_000 },
    towns: [
      "Maribor",
      "Ptuj",
      "Slovenska Bistrica",
      "Ruše",
      "Lenart",
      "Ormož",
      "Ljutomer",
      "Majšperk",
    ],
    addressPattern: patternFromTowns(
      [
        "Maribor",
        "Ptuj",
        "Slovenska Bistrica",
        "Ruše",
        "Ruse",
        "Lenart",
        "Ormož",
        "Ormoz",
        "Ljutomer",
        "Majšperk",
        "Majsperk",
        "Pesnica",
        "Kidričevo",
        "Kodric",
      ],
      ["podravska"],
    ),
  },
  {
    id: "gorenjska",
    name: "Gorenjska",
    locationBias: { latitude: 46.2389, longitude: 14.3556, radiusMeters: 40_000 },
    towns: [
      "Kranj",
      "Škofja Loka",
      "Jesenice",
      "Radovljica",
      "Tržič",
      "Bled",
      "Bohinj",
      "Žiri",
    ],
    addressPattern: patternFromTowns(
      [
        "Kranj",
        "Škofja Loka",
        "Skofja Loka",
        "Jesenice",
        "Radovljica",
        "Tržič",
        "Trzic",
        "Bled",
        "Bohinj",
        "Žiri",
        "Ziri",
        "Cerklje",
      ],
      ["gorenjska"],
    ),
  },
  {
    id: "pomurska",
    name: "Pomurska",
    locationBias: { latitude: 46.6517, longitude: 16.1656, radiusMeters: 40_000 },
    towns: [
      "Murska Sobota",
      "Lendava",
      "Gornja Radgona",
      "Ljutomer",
      "Beltinci",
      "Črenšovci",
    ],
    addressPattern: patternFromTowns(
      [
        "Murska Sobota",
        "Lendava",
        "Gornja Radgona",
        "Beltinci",
        "Črenšovci",
        "Crensovci",
        "Turnišče",
        "Turnisce",
      ],
      ["pomurska", "prekmurje"],
    ),
  },
  {
    id: "savinjska",
    name: "Savinjska",
    locationBias: { latitude: 46.2397, longitude: 15.2677, radiusMeters: 45_000 },
    towns: [
      "Celje",
      "Velenje",
      "Žalec",
      "Slovenske Konjice",
      "Šentjur",
      "Laško",
      "Mozirje",
    ],
    addressPattern: patternFromTowns(
      [
        "Celje",
        "Velenje",
        "Žalec",
        "Zalec",
        "Slovenske Konjice",
        "Šentjur",
        "Sentjur",
        "Laško",
        "Lasko",
        "Mozirje",
        "Šoštanj",
        "Sostanj",
      ],
      ["savinjska"],
    ),
  },
  {
    id: "zasavska",
    name: "Zasavska",
    locationBias: { latitude: 46.1319, longitude: 15.005, radiusMeters: 30_000 },
    towns: [
      "Trbovlje",
      "Zagorje ob Savi",
      "Hrastnik",
      "Litija",
      "Radeče",
      "Izlake",
    ],
    addressPattern: patternFromTowns(
      [
        "Trbovlje",
        "Zagorje ob Savi",
        "Zagorje",
        "Hrastnik",
        "Radeče",
        "Radece",
        "Izlake",
      ],
      ["zasavska"],
    ),
  },
  {
    id: "posavska",
    name: "Posavska",
    locationBias: { latitude: 45.95, longitude: 15.6, radiusMeters: 40_000 },
    towns: [
      "Krško",
      "Brežice",
      "Sevnica",
      "Kostanjevica na Krki",
      "Radeče",
    ],
    addressPattern: patternFromTowns(
      [
        "Krško",
        "Krsko",
        "Brežice",
        "Brezice",
        "Sevnica",
        "Kostanjevica",
        "Posavje",
      ],
      ["posavska"],
    ),
  },
  {
    id: "jugovzhodna-slovenija",
    name: "Jugovzhodna Slovenija",
    locationBias: { latitude: 45.8, longitude: 15.17, radiusMeters: 50_000 },
    towns: [
      "Novo mesto",
      "Krško",
      "Črnomelj",
      "Kočevje",
      "Trebnje",
      "Metlika",
      "Semič",
      "Ribnica",
    ],
    addressPattern: patternFromTowns(
      [
        "Novo mesto",
        "Črnomelj",
        "Crnomel",
        "Kočevje",
        "Kocevje",
        "Trebnje",
        "Metlika",
        "Semič",
        "Semic",
        "Ribnica",
        "Dolenjska",
        "jugovzhodna",
      ],
      ["otočec", "otocec", "mirna peč", "mirna pec"],
    ),
  },
  {
    id: "primorsko-notranjska",
    name: "Primorsko-notranjska",
    locationBias: { latitude: 45.7757, longitude: 14.2136, radiusMeters: 40_000 },
    towns: [
      "Postojna",
      "Cerknica",
      "Pivka",
      "Ilirska Bistrica",
      "Logatec",
      "Rakek",
    ],
    addressPattern: patternFromTowns(
      [
        "Postojna",
        "Cerknica",
        "Pivka",
        "Ilirska Bistrica",
        "Rakek",
        "Bloke",
        "Notranjska",
        "primorsko-notranjska",
      ],
      ["prestranek", "unec"],
    ),
  },
  {
    id: "goriska",
    name: "Goriška",
    locationBias: { latitude: 45.955, longitude: 13.648, radiusMeters: 35_000 },
    towns: [
      "Nova Gorica",
      "Ajdovščina",
      "Tolmin",
      "Kanal",
      "Šempeter",
      "Vipava",
    ],
    addressPattern: patternFromTowns(
      [
        "Nova Gorica",
        "Ajdovščina",
        "Ajdovscina",
        "Tolmin",
        "Kanal",
        "Šempeter",
        "Sempeter",
        "Vipava",
        "Goriška",
        "Goriska",
      ],
      ["gorica"],
    ),
  },
  {
    id: "obalno-kraska",
    name: "Obalno-kraška",
    locationBias: { latitude: 45.5481, longitude: 13.7302, radiusMeters: 35_000 },
    towns: [
      "Koper",
      "Izola",
      "Piran",
      "Sežana",
      "Divača",
      "Ankaran",
    ],
    addressPattern: patternFromTowns(
      [
        "Koper",
        "Izola",
        "Piran",
        "Sežana",
        "Sezana",
        "Divača",
        "Divaca",
        "Ankaran",
        "obalno-kraška",
        "obalno-kraska",
        "kras",
      ],
      ["portorož", "portoroz"],
    ),
  },
  {
    id: "koroska",
    name: "Koroška",
    locationBias: { latitude: 46.4414, longitude: 14.9789, radiusMeters: 35_000 },
    towns: [
      "Slovenj Gradec",
      "Ravne na Koroškem",
      "Dravograd",
      "Mežica",
      "Prevalje",
    ],
    addressPattern: patternFromTowns(
      [
        "Slovenj Gradec",
        "Ravne na Koroškem",
        "Ravne",
        "Dravograd",
        "Mežica",
        "Mezica",
        "Prevalje",
        "Koroška",
        "Koroska",
      ],
      ["mislinja"],
    ),
  },
];

const REGION_BY_ID = new Map(REGIONS.map((region) => [region.id, region]));

export function getDiscoveryRegion(id: string): DiscoveryRegion | undefined {
  return REGION_BY_ID.get(id as DiscoveryRegionId);
}

export function getAllDiscoveryRegions(): DiscoveryRegion[] {
  return DISCOVERY_REGION_ORDER.map(
    (id) => REGION_BY_ID.get(id)!,
  );
}

export function matchesDiscoveryRegion(
  regionId: string | undefined,
  address: string | undefined,
): boolean {
  if (!regionId) {
    return true;
  }

  const region = getDiscoveryRegion(regionId);
  if (!region) {
    return true;
  }

  return region.addressPattern.test(address ?? "");
}

export function getDiscoveryRegionLocationBias(
  regionId: string | undefined,
): PlacesLocationBias | undefined {
  if (!regionId) {
    return undefined;
  }
  return getDiscoveryRegion(regionId)?.locationBias;
}

export function getDiscoveryRegionName(regionId: string): string {
  return getDiscoveryRegion(regionId)?.name ?? regionId;
}
