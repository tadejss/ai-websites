/**
 * Canonical GSM-7 alphabet check for SMS encoding decisions.
 * Shared by app-layer analyzeSmsLength and HiLink Reserved selection.
 */

/** Basic GSM-7 + common extension chars used by our outreach templates. */
const GSM7_CHARS = new Set(
  "€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà".split(
    "",
  ),
);

/**
 * True when every character fits GSM-7 (plus CR/LF).
 * Slovenian š/č/ž (and similar) return false → UCS2 path.
 */
export function isGsm7Text(text: string): boolean {
  for (const char of text) {
    if (char === "\n" || char === "\r") {
      continue;
    }
    if (!GSM7_CHARS.has(char) && char.charCodeAt(0) > 127) {
      return false;
    }
  }
  return true;
}

/** Huawei HiLink TextModeEnum / &lt;Reserved&gt;: UCS2=0, SEVEN_BIT=1 */
export type HilinkSmsReserved = 0 | 1;

export function hilinkReservedForText(text: string): HilinkSmsReserved {
  return isGsm7Text(text) ? 1 : 0;
}
