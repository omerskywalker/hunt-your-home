import { kv } from "@vercel/kv";
import {
  UserPreferences,
  AlertRecord,
  ScanRecord,
  BookmarkedListing,
  AIScoredListing,
  PriceHistoryEntry,
  DEFAULT_PREFERENCES,
} from "./types";

const KEYS = {
  PREFERENCES: "hyh:preferences",
  SEEN_IDS: "hyh:seen-ids",
  ALERT_HISTORY: "hyh:alert-history",
  SCAN_HISTORY: "hyh:scan-history",
  ROADMAP_OVERRIDES: "hyh:roadmap-overrides",
  ZERO_SCAN_STREAK: "hyh:zero-scan-streak",
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
    
    // Store timestamps for each zpid with 90-day TTL
    const now = new Date().toISOString();
    const ttlSeconds = 90 * 24 * 60 * 60; // 90 days in seconds
    
    for (const id of ids) {
      await kv.set(`hyh:seen-id-ts:${id}`, now, { ex: ttlSeconds });
    }
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

export async function pruneOldSeenIds(): Promise<string[]> {
  const removedIds: string[] = [];
  try {
    const seenIds = await getSeenIds();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    for (const zpid of seenIds) {
      try {
        const timestampStr = await kv.get<string>(`hyh:seen-id-ts:${zpid}`);
        if (!timestampStr) {
          // No timestamp found - remove from set as it's orphaned
          await kv.srem(KEYS.SEEN_IDS, zpid);
          removedIds.push(zpid);
        } else {
          const scanDate = new Date(timestampStr);
          if (scanDate < cutoffDate) {
            // Remove old entry from set
            await kv.srem(KEYS.SEEN_IDS, zpid);
            removedIds.push(zpid);
          }
        }
      } catch {
        // If we can't read timestamp, remove from set
        await kv.srem(KEYS.SEEN_IDS, zpid);
        removedIds.push(zpid);
      }
    }
  } catch {
    // non-fatal
  }
  
  return removedIds;
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

// ── Zero scan streak (Apify health monitoring) ──────────────────────────────

export async function getZeroScanStreak(): Promise<number> {
  try {
    const streak = await kv.get<number>(KEYS.ZERO_SCAN_STREAK);
    return streak ?? 0;
  } catch {
    return 0;
  }
}

export async function incrementZeroScanStreak(): Promise<number> {
  try {
    return await kv.incr(KEYS.ZERO_SCAN_STREAK);
  } catch {
    return 0;
  }
}

export async function resetZeroScanStreak(): Promise<void> {
  try {
    await kv.set(KEYS.ZERO_SCAN_STREAK, 0);
  } catch {
    // non-fatal
  }
}

// ── Price history tracking (180-day TTL) ──────────────────────────────────

function getPriceHistoryKey(zpid: string): string {
  return `hyh:price-history:${zpid}`;
}

export async function getPriceHistory(zpid: string): Promise<PriceHistoryEntry[]> {
  try {
    const history = await kv.get<PriceHistoryEntry[]>(getPriceHistoryKey(zpid));
    return history ?? [];
  } catch {
    return [];
  }
}

export async function addPriceEntry(zpid: string, price: number, date: string = new Date().toISOString()): Promise<void> {
  try {
    const key = getPriceHistoryKey(zpid);
    const history = await getPriceHistory(zpid);
    const newEntry: PriceHistoryEntry = { price, date };
    
    // Check if the most recent entry has the same price to avoid duplicates
    if (history.length > 0 && history[history.length - 1].price === price) {
      return;
    }
    
    const updated = [...history, newEntry];
    const ttlSeconds = 180 * 24 * 60 * 60; // 180 days in seconds
    
    await kv.set(key, updated, { ex: ttlSeconds });
  } catch {
    // non-fatal
  }
}

export async function getLastPrice(zpid: string): Promise<number | null> {
  try {
    const history = await getPriceHistory(zpid);
    return history.length > 0 ? history[history.length - 1].price : null;
  } catch {
    return null;
  }
}

export function calculatePriceDropPercentage(currentPrice: number, lastPrice: number): number {
  if (lastPrice <= 0) return 0;
  return ((lastPrice - currentPrice) / lastPrice) * 100;
}

export function formatPriceDrop(dropAmount: number): string {
  if (dropAmount >= 1000) {
    return `$${Math.round(dropAmount / 1000)}k`;
  }
  return `$${Math.round(dropAmount).toLocaleString()}`;
}
