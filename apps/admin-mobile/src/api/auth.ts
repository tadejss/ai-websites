import * as SecureStore from "expo-secure-store";

const BASE_URL_KEY = "admin_base_url";
const SECRET_KEY = "admin_secret";

const DEFAULT_BASE_URL = "https://zbrendiraj.si";

export async function getBaseUrl(): Promise<string> {
  const stored = await SecureStore.getItemAsync(BASE_URL_KEY);
  return stored?.trim() || DEFAULT_BASE_URL;
}

export async function getSecret(): Promise<string | null> {
  return SecureStore.getItemAsync(SECRET_KEY);
}

export async function saveCredentials(
  baseUrl: string,
  secret: string,
): Promise<void> {
  await SecureStore.setItemAsync(BASE_URL_KEY, baseUrl.replace(/\/$/, ""));
  await SecureStore.setItemAsync(SECRET_KEY, secret);
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(BASE_URL_KEY);
  await SecureStore.deleteItemAsync(SECRET_KEY);
}

export async function hasCredentials(): Promise<boolean> {
  const secret = await getSecret();
  return Boolean(secret?.trim());
}
