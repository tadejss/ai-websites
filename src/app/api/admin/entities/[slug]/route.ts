import { NextResponse } from "next/server";
import { loadAdminEntity } from "@/admin/load-entity";
import { serializeAdminEntity } from "@/admin/serialize-entity";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const entity = await loadAdminEntity(slug);

  if (!entity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const serialized = await serializeAdminEntity(entity);
  return NextResponse.json(serialized);
}
