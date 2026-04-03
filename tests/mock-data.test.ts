import { describe, it, expect } from "vitest";
import { MOCK_ALERTS, MOCK_STATS, MOCK_SCAN, MOCK_SCAN_HISTORY } from "@/lib/mock-data";

describe("MOCK_ALERTS", () => {
  it("contains 5 listings", () => {
    expect(MOCK_ALERTS).toHaveLength(5);
  });

  it("every listing has a unique id", () => {
    const ids = MOCK_ALERTS.map((r) => r.listing.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every listing is FOR_SALE", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.listingType).toBe("FOR_SALE");
    });
  });

  it("all prices are under $650k (our max)", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.price).toBeLessThanOrEqual(650000);
    });
  });

  it("all listings have 3+ beds", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.beds).toBeGreaterThanOrEqual(3);
    });
  });

  it("all listings have 3+ baths", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.baths).toBeGreaterThanOrEqual(3);
    });
  });

  it("every alert has a valid alertTier", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(["HOT", "MATCH"]).toContain(r.listing.alertTier);
    });
  });

  it("every alert has an aiScore between 1 and 10", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.aiScore).toBeGreaterThanOrEqual(1);
      expect(r.listing.aiScore).toBeLessThanOrEqual(10);
    });
  });

  it("HOT tier listings have aiScore >= 8", () => {
    MOCK_ALERTS.filter((r) => r.listing.alertTier === "HOT").forEach((r) => {
      expect(r.listing.aiScore).toBeGreaterThanOrEqual(8);
    });
  });

  it("every listing has at least one photo", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(r.listing.photos.length).toBeGreaterThan(0);
    });
  });

  it("every listing has aiHighlights array", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(Array.isArray(r.listing.aiHighlights)).toBe(true);
    });
  });

  it("every alert record has sentAt as valid ISO string", () => {
    MOCK_ALERTS.forEach((r) => {
      expect(() => new Date(r.sentAt)).not.toThrow();
      expect(new Date(r.sentAt).getTime()).not.toBeNaN();
    });
  });
});

describe("MOCK_SCAN_HISTORY", () => {
  it("contains 7 scan records", () => {
    expect(MOCK_SCAN_HISTORY).toHaveLength(7);
  });

  it("every scan has a unique id", () => {
    const ids = MOCK_SCAN_HISTORY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every scan has a positive durationMs", () => {
    MOCK_SCAN_HISTORY.forEach((s) => {
      expect(s.durationMs).toBeGreaterThan(0);
    });
  });

  it("alertsSent is always <= matchedListings", () => {
    MOCK_SCAN_HISTORY.forEach((s) => {
      expect(s.alertsSent).toBeLessThanOrEqual(s.matchedListings);
    });
  });

  it("matchedListings is always <= newListings", () => {
    MOCK_SCAN_HISTORY.forEach((s) => {
      expect(s.matchedListings).toBeLessThanOrEqual(s.newListings);
    });
  });

  it("newListings is always <= listingsFound", () => {
    MOCK_SCAN_HISTORY.forEach((s) => {
      expect(s.newListings).toBeLessThanOrEqual(s.listingsFound);
    });
  });
});

describe("MOCK_STATS", () => {
  it("has all required stat fields", () => {
    expect(MOCK_STATS).toHaveProperty("todayScans");
    expect(MOCK_STATS).toHaveProperty("seenCount");
    expect(MOCK_STATS).toHaveProperty("lastScan");
    expect(MOCK_STATS).toHaveProperty("totalAlerts");
    expect(MOCK_STATS).toHaveProperty("recentMatches");
  });

  it("todayScans is a non-negative number", () => {
    expect(MOCK_STATS.todayScans).toBeGreaterThanOrEqual(0);
  });

  it("lastScan matches MOCK_SCAN shape", () => {
    expect(MOCK_STATS.lastScan).toEqual(MOCK_SCAN);
  });
});
