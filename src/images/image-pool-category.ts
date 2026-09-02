export const IMAGE_POOL_CATEGORY_IDS = [
  "nohti-pedikura",
  "maserji-wellness",
  "vulkanizerji",
  "avtokleparji-licarji",
  "avtomehaniki",
  "frizerji",
  "kozmeticarji",
  "vodovodarji-ogrevanje",
  "elektricarji",
  "keramicarji",
  "slikopleskarji",
  "suhomontazerji",
  "mizarji-tesarji",
  "parketarji-talne-obloge",
  "gradbinci",
  "cistilni-servisi",
] as const;

export type ImagePoolCategoryId = (typeof IMAGE_POOL_CATEGORY_IDS)[number];

export function isImagePoolCategoryId(
  value: string,
): value is ImagePoolCategoryId {
  return (IMAGE_POOL_CATEGORY_IDS as readonly string[]).includes(value);
}

type CategoryRule = {
  id: ImagePoolCategoryId;
  test: RegExp;
  exclude?: RegExp;
};

/** Priority-ordered: first match wins. */
const CATEGORY_RULES: CategoryRule[] = [
  {
    id: "nohti-pedikura",
    test: /nail|noht|pedik|manik|manicure|pedicure/i,
  },
  {
    id: "maserji-wellness",
    test: /masaž|masaz|spa|wellness|fizioterap|masažni|masazni|refleksolog|relaksacij|massage/i,
  },
  {
    id: "vulkanizerji",
    test: /vulkaniz|gumar|pnevmatik|tire|avtovulkan/i,
  },
  {
    id: "avtokleparji-licarji",
    test: /avtoklepar|ličar|licar|body\s*shop|car\s*paint/i,
  },
  {
    id: "avtomehaniki",
    test: /avtoservis|avtomehan|mehanik|auto\s*repair|servis\s+avto|car_repair|auto_repair|popravilo.*vozil|vzdr[žz]evanje.*vozil|prodaja.*vozil/i,
    exclude: /vulkaniz|avtoklepar|ličar|licar/i,
  },
  {
    id: "frizerji",
    test: /friz|hair|barber|brivnic|hair_salon|barber_shop/i,
    exclude: /kozmet|nail|noht|pedik|manik|lepot|beauty/i,
  },
  {
    id: "kozmeticarji",
    test: /kozmet|lepot|beauty|skin_care|kozmetolog|nega\s+kože|cosmetic/i,
    exclude: /friz|hair|barber|brivnic|nail|noht|pedik|manik/i,
  },
  {
    id: "vodovodarji-ogrevanje",
    test: /vodovod|vodoinštal|vodoinstal|ogrevan|kuril|plumbing/i,
  },
  {
    id: "elektricarji",
    test: /elektro|električ|elektric|electrician|ožičenj|ozicenj|razsvetlj|stikaln|elektroinštal|elektroinstal/i,
    exclude: /vodovod|ogrevan|kuril|plumbing/i,
  },
  {
    id: "keramicarji",
    test: /keramič|keramic|tile|polaganje\s+keramik|ploščic|ploscic|keramika|kamna|tlakov/i,
    exclude: /parket|laminat|talne\s+oblog/i,
  },
  {
    id: "slikopleskarji",
    test: /slikopleskar|fasader|plasterer|painter|barvanje|fasad|soboslikar/i,
  },
  {
    id: "suhomontazerji",
    test: /suhomontaž|suhomontaz|mavč|mavc/i,
  },
  {
    id: "mizarji-tesarji",
    test: /mizar|tesar|furniture|pohišt|pohist|woodwork/i,
    exclude: /suhomontaž|suhomontaz/i,
  },
  {
    id: "parketarji-talne-obloge",
    test: /parket|laminat|talne\s+oblog|vinil\s*tal|floor\s*install|talna\s+obloga/i,
  },
  {
    id: "gradbinci",
    test: /gradben|renovac|zidar|krov|streh|kritina|adaptation|gradnja|general_contractor|construction/i,
    exclude: /keramič|keramic|mizar|slikopleskar|fasader/i,
  },
  {
    id: "cistilni-servisi",
    test: /cistilni|čiščenj|ciscenj|cleaning|cleaning\s+service|higien|higienič|higienic|čistiln|vzdr[žz]evanje\s+objektov/i,
  },
];

export function resolveImagePoolCategory(input: {
  industry?: string;
  companyName?: string;
}): ImagePoolCategoryId | undefined {
  const haystack = `${input.industry ?? ""} ${input.companyName ?? ""}`.trim();
  if (!haystack) {
    return undefined;
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(haystack) && !(rule.exclude?.test(haystack) ?? false)) {
      return rule.id;
    }
  }

  return undefined;
}

/** Hint regex for seeding pool from existing cache searchQuery text. */
export function categorySearchHint(category: ImagePoolCategoryId): RegExp {
  const rule = CATEGORY_RULES.find((entry) => entry.id === category);
  return rule?.test ?? /^$/i;
}
