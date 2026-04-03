import { describe, it, expect, beforeEach } from "vitest";
import {
  savePrefsToookie,
  getPrefsFromCookie,
  clearPrefsCookie,
  mergeWithDefaults,
} from "@/lib/cookie-prefs";
import { DEFAULT_PREFERENCES } from "@/lib/types";

// jsdom provides document.cookie — reset between tests
beforeEach(() => {
  // Clear all cookies by expiring them
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }
  }
});

describe("savePrefsToookie / getPrefsFromCookie", () => {
  it("round-trips preferences through cookie", () => {
    const prefs = { ...DEFAULT_PREFERENCES, alertEmail: "test@example.com" };
    savePrefsToookie(prefs);
    const result = getPrefsFromCookie();
    expect(result).not.toBeNull();
    expect(result!.alertEmail).toBe("test@example.com");
  });

  it("returns null when no cookie is set", () => {
    expect(getPrefsFromCookie()).toBeNull();
  });

  it("persists all preference fields accurately", () => {
    const prefs = {
      ...DEFAULT_PREFERENCES,
      minBeds: 4,
      maxPrice: 600000,
      scoreThreshold: 7,
    };
    savePrefsToookie(prefs);
    const result = getPrefsFromCookie();
    expect(result!.minBeds).toBe(4);
    expect(result!.maxPrice).toBe(600000);
    expect(result!.scoreThreshold).toBe(7);
  });
});

describe("clearPrefsCookie", () => {
  it("removes the cookie so getPrefsFromCookie returns null", () => {
    savePrefsToookie(DEFAULT_PREFERENCES);
    expect(getPrefsFromCookie()).not.toBeNull();
    clearPrefsCookie();
    expect(getPrefsFromCookie()).toBeNull();
  });
});

describe("mergeWithDefaults", () => {
  it("fills missing keys from DEFAULT_PREFERENCES", () => {
    const partial = { alertEmail: "hello@test.com" };
    const merged = mergeWithDefaults(partial);
    expect(merged.minBeds).toBe(DEFAULT_PREFERENCES.minBeds);
    expect(merged.maxPrice).toBe(DEFAULT_PREFERENCES.maxPrice);
    expect(merged.alertEmail).toBe("hello@test.com");
  });

  it("partial value overrides default", () => {
    const merged = mergeWithDefaults({ minBeds: 5 });
    expect(merged.minBeds).toBe(5);
  });

  it("returns a complete UserPreferences object", () => {
    const merged = mergeWithDefaults({});
    const requiredKeys: (keyof typeof DEFAULT_PREFERENCES)[] = [
      "minBeds",
      "minBaths",
      "maxPrice",
      "minPrice",
      "minSqft",
      "maxHoa",
      "requireGarage",
      "minYearBuilt",
      "searchArea",
      "alertEmail",
      "scoreThreshold",
      "hotScoreThreshold",
    ];
    requiredKeys.forEach((key) => {
      expect(merged).toHaveProperty(key);
    });
  });
});
