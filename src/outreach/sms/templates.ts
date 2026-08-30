import {
  GSM7_CONCAT_SEGMENT,
  GSM7_SINGLE_SEGMENT,
  UCS2_SINGLE_SEGMENT,
  type SmsStep,
} from "./types";

export type SmsTemplateContext = {
  companyName: string;
  demoUrl: string;
  hasExistingWebsite: boolean;
  step: SmsStep;
};

export type RenderedSms = {
  text: string;
  encoding: "gsm7" | "ucs2";
  segments: number;
  length: number;
  overLimit: boolean;
};

const GSM7_EXTRA = new Set(
  "€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà".split(
    "",
  ),
);

function isGsm7(text: string): boolean {
  for (const char of text) {
    if (char === "\n" || char === "\r") {
      continue;
    }
    if (!GSM7_EXTRA.has(char) && char.charCodeAt(0) > 127) {
      return false;
    }
  }
  return true;
}

export function analyzeSmsLength(text: string): Omit<RenderedSms, "text"> {
  const gsm7 = isGsm7(text);
  const length = text.length;

  if (gsm7) {
    if (length <= GSM7_SINGLE_SEGMENT) {
      return { encoding: "gsm7", segments: 1, length, overLimit: false };
    }
    const segments = Math.ceil(length / GSM7_CONCAT_SEGMENT);
    return {
      encoding: "gsm7",
      segments,
      length,
      overLimit: segments > 3,
    };
  }

  if (length <= UCS2_SINGLE_SEGMENT) {
    return { encoding: "ucs2", segments: 1, length, overLimit: false };
  }

  const segments = Math.ceil(length / 67);
  return {
    encoding: "ucs2",
    segments,
    length,
    overLimit: segments > 3,
  };
}

function initialCopy(ctx: SmsTemplateContext): string {
  if (ctx.hasExistingWebsite) {
    return `Živjo! Opazil sem, da bi spletna stran za ${ctx.companyName} lahko bila jasnejša. Pripravil sem vam brezplačen demo: ${ctx.demoUrl} Če vam je všeč, jo lahko objavimo. LP, Tadej`;
  }

  return `Živjo! Opazil sem, da ${ctx.companyName} še nima spletne strani. Pripravil sem vam brezplačen demo: ${ctx.demoUrl} Če vam je všeč, jo lahko objavimo. LP, Tadej`;
}

function followup1Copy(ctx: SmsTemplateContext): string {
  return `Živjo, še enkrat glede ${ctx.companyName} — demo spletne strani je še vedno tukaj: ${ctx.demoUrl} Če želite, jo skupaj uredimo. LP, Tadej`;
}

function followup2Copy(ctx: SmsTemplateContext): string {
  return `Živjo, zadnji kratek ping za ${ctx.companyName}. Demo: ${ctx.demoUrl} Če ni zanimivo, se oglasite z NE in vas ne motim več. LP, Tadej`;
}

function manualCopy(ctx: SmsTemplateContext): string {
  return initialCopy(ctx);
}

const TEMPLATES: Record<SmsStep, (ctx: SmsTemplateContext) => string> = {
  initial: initialCopy,
  followup_1: followup1Copy,
  followup_2: followup2Copy,
  manual: manualCopy,
};

export function renderSms(ctx: SmsTemplateContext): RenderedSms {
  const renderer = TEMPLATES[ctx.step] ?? TEMPLATES.initial;
  const text = renderer(ctx).trim();
  return { text, ...analyzeSmsLength(text) };
}

export function listSmsTemplateSteps(): SmsStep[] {
  return Object.keys(TEMPLATES) as SmsStep[];
}
