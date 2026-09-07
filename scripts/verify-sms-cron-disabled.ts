import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

async function main() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("no local CRON_SECRET");
    process.exit(1);
  }

  const res = await fetch("https://zbrendiraj.si/api/cron/sms-outreach", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text.slice(0, 200) };
  }

  console.log(
    JSON.stringify(
      {
        http: res.status,
        ok: body.ok,
        skipped: body.skipped,
        reason: body.reason,
        queued: body.queued,
        considered: body.considered,
        channel: body.channel,
        skippedCount: body.skippedCount,
      },
      null,
      2,
    ),
  );

  const { countSmsMessagesByStatuses } = await import(
    "../src/outreach/sms/store"
  );
  console.log(
    JSON.stringify({
      queueCounts: await countSmsMessagesByStatuses([
        "queued",
        "claimed",
        "sending",
      ]),
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
