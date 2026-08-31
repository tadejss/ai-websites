import type { GenerativeModel } from "@google/generative-ai";

process.env.GEMINI_MIN_REQUEST_INTERVAL_MS = "150";
process.env.GEMINI_MAX_429_RETRIES = "3";

import {
  acquireGeminiSlot,
  generateGeminiContent,
  isGeminiRateLimitError,
  parseGeminiRetryDelayMs,
  resetGeminiRequestStateForTests,
} from "../src/ai/gemini-request";

let failures = 0;

function ok(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function make429Error(retryDelay?: string, message?: string): Error & {
  status: number;
  errorDetails: Array<{ "@type": string; retryDelay?: string }>;
} {
  return Object.assign(new Error(message ?? "429 Too Many Requests"), {
    status: 429,
    errorDetails: retryDelay
      ? [
          {
            "@type": "type.googleapis.com/google.rpc.RetryInfo",
            retryDelay,
          },
        ]
      : [],
  });
}

function successResult(text = "ok") {
  return {
    response: {
      text() {
        return text;
      },
    },
  };
}

async function runTests(): Promise<void> {
  console.log("== RetryInfo parsing ==");

  ok(
    parseGeminiRetryDelayMs(make429Error("34s")) === 34_000,
    "RetryInfo.retryDelay parsed from errorDetails",
  );
  ok(
    parseGeminiRetryDelayMs(new Error("Please retry in 7.5s")) === 7500,
    "retry-in message parsed",
  );
  ok(
    parseGeminiRetryDelayMs(new Error("something else")) === undefined,
    "unknown errors return undefined delay",
  );

  console.log("\n== minimum interval ==");

  resetGeminiRequestStateForTests();
  const intervalStart = Date.now();
  await acquireGeminiSlot();
  await acquireGeminiSlot();
  const intervalElapsed = Date.now() - intervalStart;
  ok(
    intervalElapsed >= 140,
    `minimum interval enforced between slots (${intervalElapsed}ms)`,
  );

  console.log("\n== request serialization ==");

  resetGeminiRequestStateForTests();
  const callLog: Array<{ id: number; start: number; end: number }> = [];
  let active = 0;
  let maxActive = 0;

  function trackingModel(id: number): GenerativeModel {
    return {
      async generateContent() {
        const start = Date.now();
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 40));
        active -= 1;
        callLog.push({ id, start, end: Date.now() });
        return successResult(`ok-${id}`);
      },
    } as unknown as GenerativeModel;
  }

  await Promise.all([
    generateGeminiContent(trackingModel(1), "a"),
    generateGeminiContent(trackingModel(2), "b"),
  ]);

  ok(maxActive === 1, "concurrent wrapper calls never overlap");
  ok(callLog.length === 2, "both serialized requests completed");
  ok(
    callLog[1]!.start >= callLog[0]!.end,
    "second request starts after first finishes",
  );

  console.log("\n== 429 retry ==");

  resetGeminiRequestStateForTests();
  let retryCalls = 0;
  const retryModel = {
    async generateContent() {
      retryCalls += 1;
      if (retryCalls === 1) {
        throw make429Error("0.08s", "429 on first attempt");
      }
      return successResult("recovered");
    },
  } as unknown as GenerativeModel;

  const retryStart = Date.now();
  const retryResult = await generateGeminiContent(retryModel, "prompt");
  const retryElapsed = Date.now() - retryStart;

  ok(retryResult.response.text() === "recovered", "429 retry succeeds");
  ok(retryCalls === 2, "429 is retried once");
  ok(retryElapsed >= 80, `429 retry waits for RetryInfo delay (${retryElapsed}ms)`);

  console.log("\n== retry passes through rate gate ==");

  resetGeminiRequestStateForTests();
  process.env.GEMINI_MIN_REQUEST_INTERVAL_MS = "250";
  let gateCalls = 0;
  const gateTimestamps: number[] = [];
  const gateModel = {
    async generateContent() {
      gateCalls += 1;
      gateTimestamps.push(Date.now());
      if (gateCalls === 1) {
        throw make429Error("0.05s");
      }
      return successResult("gated");
    },
  } as unknown as GenerativeModel;

  const gateStart = Date.now();
  await generateGeminiContent(gateModel, "prompt");
  const gateElapsed = Date.now() - gateStart;

  ok(gateCalls === 2, "retry attempt calls generateContent again");
  ok(
    gateTimestamps.length === 2
      && gateTimestamps[1]! - gateTimestamps[0]! >= 240,
    `retry re-acquires slot after delay (${gateTimestamps[1]! - gateTimestamps[0]!}ms between attempts)`,
  );
  ok(
    gateElapsed >= 300,
    `total elapsed includes RetryInfo delay plus rate gate (${gateElapsed}ms)`,
  );

  console.log("\n== non-429 errors ==");

  resetGeminiRequestStateForTests();
  process.env.GEMINI_MIN_REQUEST_INTERVAL_MS = "150";
  let nonRetryCalls = 0;
  const nonRetryModel = {
    async generateContent() {
      nonRetryCalls += 1;
      throw new Error("invalid JSON from model");
    },
  } as unknown as GenerativeModel;

  let nonRetryThrew = false;
  try {
    await generateGeminiContent(nonRetryModel, "prompt");
  } catch (error) {
    nonRetryThrew = true;
    ok(!isGeminiRateLimitError(error), "non-429 error is not classified as rate limit");
  }

  ok(nonRetryThrew, "non-429 error propagates");
  ok(nonRetryCalls === 1, "non-429 error is not retried by wrapper");

  console.log("\n== exhausted 429 retries ==");

  resetGeminiRequestStateForTests();
  let exhaustedCalls = 0;
  const exhaustedModel = {
    async generateContent() {
      exhaustedCalls += 1;
      throw make429Error("0.01s");
    },
  } as unknown as GenerativeModel;

  let exhaustedThrew = false;
  try {
    await generateGeminiContent(exhaustedModel, "prompt");
  } catch (error) {
    exhaustedThrew = true;
    ok(isGeminiRateLimitError(error), "exhausted retries rethrow 429");
  }

  ok(exhaustedThrew, "generateGeminiContent throws after max retries");
  ok(exhaustedCalls === 3, "max 429 retries honored (3 attempts)");
}

runTests()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} test(s) failed`);
      process.exit(1);
    }
    console.log("\nAll Gemini rate limit tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
