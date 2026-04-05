import { kv } from "@vercel/kv";
import {
  UserPreferences,
  AlertRecord,
  ScanRecord,
  BookmarkedListing,
  AIScoredListing,
  DEFAULT_PREFERENCES,
} from "./types";

const KEYS = {
  PREFERENCES: "hyh:preferences",
  SEEN_IDS: "hyh:seen-ids",
  ALERT_HISTORY: "hyh:alert-history",
  SCAN_HISTORY: "hyh:scan-history",
  ROADMAP_OVERRIDES: "hyh:roadmap-overrides",
} as const;

const MAX_ALERT_HISTORY = 500;
const MAX_SCAN_HISTORY = 100;

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const prefs = await kv.get<UserPreferences>(KEYS.PREFERENCES);
    return prefs ? { ...DEFAULT_PREFERENCES, ...prefs } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(
  prefs: Partial<UserPreferences>
): Promise<void> {
  const current = await getPreferences();
  await kv.set(KEYS.PREFERENCES, { ...current, ...prefs });
}

export async function getSeenIds(): Promise<Set<string>> {
  try {
    const members = await kv.smembers(KEYS.SEEN_IDS);
    return new Set(members as string[]);
  } catch {
    return new Set();
  }
}

export async function addSeenIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    // @vercel/kv sadd accepts a single member or array via cast
    await (kv.sadd as (key: string, ...members: string[]) => Promise<number>)(KEYS.SEEN_IDS, ...ids);
  } catch {
    // non-fatal
  }
}

export async function getSeenIdsCount(): Promise<number> {
  try {
    return await kv.scard(KEYS.SEEN_IDS);
  } catch {
    return 0;
  }
}

export async function pushAlertRecord(record: AlertRecord): Promise<void> {
  try {
    await kv.lpush(KEYS.ALERT_HISTORY, JSON.stringify(record));
    await kv.ltrim(KEYS.ALERT_HISTORY, 0, MAX_ALERT_HISTORY - 1);
  } catch {
    // non-fatal
  }
}

export async function getAlertHistory(): Promise<AlertRecord[]> {
  try {
    const items = await kv.lrange(KEYS.ALERT_HISTORY, 0, -1);
    return items.map((item) => {
      if (typeof item === "string") return JSON.parse(item) as AlertRecord;
      return item as AlertRecord;
    });
  } catch {
    return [];
  }
}

export async function pushScanRecord(record: ScanRecord): Promise<void> {
  try {
    await kv.lpush(KEYS.SCAN_HISTORY, JSON.stringify(record));
    await kv.ltrim(KEYS.SCAN_HISTORY, 0, MAX_SCAN_HISTORY - 1);
  } catch {
    // non-fatal
  }
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  try {
    const items = await kv.lrange(KEYS.SCAN_HISTORY, 0, -1);
    return items.map((item) => {
      if (typeof item === "string") return JSON.parse(item) as ScanRecord;
      return item as ScanRecord;
    });
  } catch {
    return [];
  }
}

export async function getTodayScanCount(): Promise<number> {
  try {
    const scans = await getScanHistory();
    const today = new Date().toDateString();
    return scans.filter((s) => new Date(s.runAt).toDateString() === today)
      .length;
  } catch {
    return 0;
  }
}

export async function getLastScanRecord(): Promise<ScanRecord | null> {
  try {
    const items = await kv.lrange(KEYS.SCAN_HISTORY, 0, 0);
    if (!items.length) return null;
    const item = items[0];
    if (typeof item === "string") return JSON.parse(item) as ScanRecord;
    return item as ScanRecord;
  } catch {
    return null;
  }
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

const BOOKMARKS_KEY = "hyh:bookmarks";

export async function getBookmarks(): Promise<BookmarkedListing[]> {
  try {
    const data = await kv.hgetall(BOOKMARKS_KEY);
    if (!data) return [];
    return Object.values(data).map((v) => {
      if (typeof v === "string") return JSON.parse(v) as BookmarkedListing;
      return v as BookmarkedListing;
    });
  } catch {
    return [];
  }
}

export async function addBookmark(listing: AIScoredListing): Promise<void> {
  try {
    const bookmark: BookmarkedListing = {
      listing,
      savedAt: new Date().toISOString(),
      sold: false,
    };
    await kv.hset(BOOKMARKS_KEY, { [listing.id]: JSON.stringify(bookmark) });
  } catch {
    // non-fatal
  }
}

export async function removeBookmark(zpid: string): Promise<void> {
  try {
    await kv.hdel(BOOKMARKS_KEY, zpid);
  } catch {
    // non-fatal
  }
}

export async function markBookmarkSold(zpid: string): Promise<void> {
  try {
    const raw = await kv.hget<string>(BOOKMARKS_KEY, zpid);
    if (!raw) return;
    const bookmark: BookmarkedListing =
      typeof raw === "string" ? JSON.parse(raw) : (raw as BookmarkedListing);
    bookmark.sold = true;
    await kv.hset(BOOKMARKS_KEY, { [zpid]: JSON.stringify(bookmark) });
  } catch {
    // non-fatal
  }
}

export async function getBookmarkIds(): Promise<Set<string>> {
  try {
    const keys = await kv.hkeys(BOOKMARKS_KEY);
    return new Set(keys as string[]);
  } catch {
    return new Set();
  }
}

// ── Roadmap overrides (runtime status from kickoff API) ───────────────────

export interface RoadmapOverride {
  status: "in-progress" | "done" | "paused";
  pr?: number;
  startedAt?: string;
}

export async function getRoadmapOverrides(): Promise<Record<string, RoadmapOverride>> {
  try {
    const raw = await kv.get<Record<string, RoadmapOverride>>(KEYS.ROADMAP_OVERRIDES);
    return raw ?? {};
  } catch {
    return {};
  }
}

export async function setRoadmapOverride(itemId: string, data: RoadmapOverride): Promise<void> {
  const current = await getRoadmapOverrides();
  await kv.set(KEYS.ROADMAP_OVERRIDES, { ...current, [itemId]: data });
}

// ── Rate limiting ──────────────────────────────────────────────────────────────

const SCAN_RATE_LIMIT_MAX = 10;
const SCAN_RATE_LIMIT_TTL = 86400; // 24 hours in seconds

function getRateLimitKey(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `hyh:scan-ratelimit:${today}`;
}

export async function checkScanRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
}> {
  try {
    const key = getRateLimitKey();
    const current = await kv.get<number>(key) || 0;
    
    const remaining = Math.max(0, SCAN_RATE_LIMIT_MAX - current);
    const allowed = current < SCAN_RATE_LIMIT_MAX;
    
    // Calculate reset time (start of next day)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    return {
      allowed,
      remaining,
      resetAt: tomorrow.toISOString(),
    };
  } catch {
    // On error, allow the request
    return {
      allowed: true,
      remaining: SCAN_RATE_LIMIT_MAX,
      resetAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }
}

export async function incrementScanRateLimit(): Promise<void> {
  try {
    const key = getRateLimitKey();
    const current = await kv.incr(key);
    
    // Set TTL only on first increment (when current === 1)
    if (current === 1) {
      await kv.expire(key, SCAN_RATE_LIMIT_TTL);
    }
  } catch {
    // non-fatal
  }
}
