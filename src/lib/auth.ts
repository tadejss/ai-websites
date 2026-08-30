const ADMIN_COOKIE = "admin_session";

export function getAdminSecret(): string | null {
  return process.env.ADMIN_SECRET?.trim() || null;
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

export function isValidAdminToken(token: string | null | undefined): boolean {
  const secret = getAdminSecret();

  if (!secret || !token) {
    return false;
  }

  return safeCompare(token, secret);
}

export function isValidCronToken(token: string | null | undefined): boolean {
  const secret = getCronSecret();

  if (!secret || !token) {
    return false;
  }

  return safeCompare(token, secret);
}

export function getSmsGatewaySecret(): string | null {
  return process.env.SMS_GATEWAY_SECRET?.trim() || null;
}

export function isValidSmsGatewayToken(
  token: string | null | undefined,
): boolean {
  const secret = getSmsGatewaySecret();
  if (!secret || !token) {
    return false;
  }
  return safeCompare(token, secret);
}

export function readBearerToken(
  authorizationHeader: string | null,
): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
}

export { ADMIN_COOKIE };
