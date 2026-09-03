export const DEFAULT_GROK_MODEL = "grok-4.6";

const INPUT_USD_PER_MILLION = 2;
const OUTPUT_USD_PER_MILLION = 6;

export function estimateGrokCostUsd(input: {
  inputTokens: number;
  outputTokens: number;
}): number {
  const cost =
    (input.inputTokens / 1_000_000) * INPUT_USD_PER_MILLION +
    (input.outputTokens / 1_000_000) * OUTPUT_USD_PER_MILLION;
  return Number(cost.toFixed(6));
}
