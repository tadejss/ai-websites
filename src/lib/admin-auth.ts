import { cookies } from "next/headers";
import { isValidAdminToken, readBearerToken } from "@/lib/auth";
import {
  ADMIN_SESSION_COOKIE,
  validateAdminSessionToken,
} from "@/lib/admin-session";
import { isTrustedMutationOrigin } from "@/lib/csrf";

/**
 * Admin API authorization (reads / non-mutations):
 * - Bearer ADMIN_SECRET (intentional machine/ops access)
 * - OR a valid hashed server-side session cookie (browser ops console)
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

/**
 * Admin state-changing authorization:
 * - Bearer ADMIN_SECRET → allowed without Origin (server-to-server)
 * - Cookie session → requires trusted Origin/Referer (CSRF defense)
 */
export async function authorizeAdminMutation(
  request: Request,
): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }

  if (!isTrustedMutationOrigin(request)) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return validateAdminSessionToken(session);
}
