import { UserPreferences, DEFAULT_PREFERENCES } from "./types";

const COOKIE_NAME = "hyh_preferences";
const COOKIE_DAYS = 30;

export function savePrefsToookie(prefs: UserPreferences): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(prefs))}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

export function getPrefsFromCookie(): UserPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`)
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as UserPreferences;
  } catch {
    return null;
  }
}

export function clearPrefsCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

/** Merge cookie prefs on top of defaults — cookie wins for any key present */
export function mergeWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_PREFERENCES, ...partial };
}
