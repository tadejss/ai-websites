import { NextResponse } from "next/server";
import { isValidCronToken, readBearerToken } from "@/lib/auth";
import { processOutreachBatch } from "@/outreach/process-batch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));

  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processOutreachBatch();

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
