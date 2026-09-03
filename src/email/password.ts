import { randomBytes } from "node:crypto";

/** MXroute requires 8+ chars with upper, lower, and number. */
export function generateMailboxPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const pick = (chars: string) => chars[randomBytes(1)[0] % chars.length];

  const required = [pick(upper), pick(lower), pick(digits)];
  const rest = Array.from({ length: 13 }, () => pick(all));
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
