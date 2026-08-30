import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminToken, readBearerToken } from "@/lib/auth";

export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  return isValidAdminToken(session);
}
