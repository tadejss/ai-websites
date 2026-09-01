import { NextResponse } from "next/server";
import { z } from "zod";
import {
  queryAdminLeads,
  searchAdminEntities,
} from "@/admin/leads-query";
import { resolveAdminPipelineView } from "@/admin/leads-filters";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(10).max(100).optional(),
  pipeline: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["company", "demo_age", "views", "activity"]).optional(),
  search: z.string().optional(),
});

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { search, pipeline, ...rest } = parsed.data;

  if (search?.trim()) {
    const results = await searchAdminEntities(search.trim());
    return NextResponse.json({ results });
  }

  const pipelineView = pipeline
    ? resolveAdminPipelineView(pipeline)
    : undefined;

  const result = await queryAdminLeads({
    ...rest,
    pipeline: pipelineView,
  });

  return NextResponse.json(result);
}
