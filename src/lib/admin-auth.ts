import { cookies } from "next/headers";
import { isValidAdminToken, readBearerToken } from "@/lib/auth";
import {
  ADMIN_SESSION_COOKIE,
  validateAdminSessionToken,
} from "@/lib/admin-session";

/**
 * Admin API authorization:
 * - Bearer ADMIN_SECRET (intentional machine/ops access)
 * - OR a valid hashed server-side session cookie (browser ops console)
 *
 * Cookie value must never be compared to ADMIN_SECRET.
 */
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return validateAdminSessionToken(session);
}
