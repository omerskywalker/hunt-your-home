import { describe, it, expect } from "vitest";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { BookmarkedListing, AIScoredListing } from "@/lib/types";

// Pure bookmark state helpers (mirrors logic in page components)
function addToBookmarks(
  bookmarks: BookmarkedListing[],
  listing: AIScoredListing
): BookmarkedListing[] {
  if (bookmarks.some((b) => b.listing.id === listing.id)) return bookmarks;
  return [...bookmarks, { listing, savedAt: new Date().toISOString(), sold: false }];
}

function removeFromBookmarks(
  bookmarks: BookmarkedListing[],
  zpid: string
): BookmarkedListing[] {
  return bookmarks.filter((b) => b.listing.id !== zpid);
}

function markSold(bookmarks: BookmarkedListing[], zpid: string): BookmarkedListing[] {
  return bookmarks.map((b) =>
    b.listing.id === zpid ? { ...b, sold: true } : b
  );
}

function filterSoldFromFeed(
  alerts: typeof MOCK_ALERTS,
  bookmarks: BookmarkedListing[]
): typeof MOCK_ALERTS {
  const soldZpids = new Set(
    bookmarks.filter((b) => b.sold).map((b) => b.listing.id)
  );
  return alerts.filter((a) => !soldZpids.has(a.listing.id));
}

const listing1 = MOCK_ALERTS[0].listing;
const listing2 = MOCK_ALERTS[1].listing;
const listing3 = MOCK_ALERTS[2].listing;

describe("Bookmark add / remove", () => {
  it("adds a listing to bookmarks", () => {
    const result = addToBookmarks([], listing1);
    expect(result).toHaveLength(1);
    expect(result[0].listing.id).toBe(listing1.id);
    expect(result[0].sold).toBe(false);
  });

  it("does not duplicate an already-bookmarked listing", () => {
    const once = addToBookmarks([], listing1);
    const twice = addToBookmarks(once, listing1);
    expect(twice).toHaveLength(1);
  });

  it("adds multiple different listings", () => {
    let bm: BookmarkedListing[] = [];
    bm = addToBookmarks(bm, listing1);
    bm = addToBookmarks(bm, listing2);
    expect(bm).toHaveLength(2);
  });

  it("removes a listing by zpid", () => {
    const bm = addToBookmarks([], listing1);
    const result = removeFromBookmarks(bm, listing1.id);
    expect(result).toHaveLength(0);
  });

  it("removing a non-existent zpid is a no-op", () => {
    const bm = addToBookmarks([], listing1);
    const result = removeFromBookmarks(bm, "zpid-does-not-exist");
    expect(result).toHaveLength(1);
  });

  it("savedAt is a valid ISO date string", () => {
    const result = addToBookmarks([], listing1);
    expect(() => new Date(result[0].savedAt)).not.toThrow();
    expect(new Date(result[0].savedAt).getTime()).not.toBeNaN();
  });
});

describe("Bookmark sold state", () => {
  it("marks a listing as sold", () => {
    let bm = addToBookmarks([], listing1);
    bm = markSold(bm, listing1.id);
    expect(bm[0].sold).toBe(true);
  });

  it("marking sold does not affect other bookmarks", () => {
    let bm: BookmarkedListing[] = [];
    bm = addToBookmarks(bm, listing1);
    bm = addToBookmarks(bm, listing2);
    bm = markSold(bm, listing1.id);
    expect(bm.find((b) => b.listing.id === listing2.id)!.sold).toBe(false);
  });

  it("marking an unknown zpid as sold is a no-op", () => {
    let bm = addToBookmarks([], listing1);
    bm = markSold(bm, "zpid-unknown");
    expect(bm[0].sold).toBe(false);
  });
});

describe("Dashboard feed filtering of sold bookmarks", () => {
  it("does not filter listings when no bookmarks are sold", () => {
    const bm = addToBookmarks([], listing1);
    const result = filterSoldFromFeed(MOCK_ALERTS, bm);
    expect(result).toHaveLength(MOCK_ALERTS.length);
  });

  it("removes a sold listing from the feed", () => {
    let bm = addToBookmarks([], listing1);
    bm = markSold(bm, listing1.id);
    const result = filterSoldFromFeed(MOCK_ALERTS, bm);
    expect(result).toHaveLength(MOCK_ALERTS.length - 1);
    expect(result.find((a) => a.listing.id === listing1.id)).toBeUndefined();
  });

  it("removes multiple sold listings from the feed", () => {
    let bm: BookmarkedListing[] = [];
    bm = addToBookmarks(bm, listing1);
    bm = addToBookmarks(bm, listing2);
    bm = markSold(bm, listing1.id);
    bm = markSold(bm, listing2.id);
    const result = filterSoldFromFeed(MOCK_ALERTS, bm);
    expect(result).toHaveLength(MOCK_ALERTS.length - 2);
  });

  it("keeps non-sold bookmarked listings in the feed", () => {
    let bm: BookmarkedListing[] = [];
    bm = addToBookmarks(bm, listing1);
    bm = addToBookmarks(bm, listing2);
    bm = markSold(bm, listing1.id); // only sold listing1
    const result = filterSoldFromFeed(MOCK_ALERTS, bm);
    expect(result.find((a) => a.listing.id === listing2.id)).toBeDefined();
  });

  it("returns full feed when bookmarks list is empty", () => {
    const result = filterSoldFromFeed(MOCK_ALERTS, []);
    expect(result).toHaveLength(MOCK_ALERTS.length);
  });

  it("bookmarks page splits active vs sold correctly", () => {
    let bm: BookmarkedListing[] = [];
    bm = addToBookmarks(bm, listing1);
    bm = addToBookmarks(bm, listing2);
    bm = addToBookmarks(bm, listing3);
    bm = markSold(bm, listing1.id);

    const active = bm.filter((b) => !b.sold);
    const sold = bm.filter((b) => b.sold);

    expect(active).toHaveLength(2);
    expect(sold).toHaveLength(1);
    expect(sold[0].listing.id).toBe(listing1.id);
  });
});

describe("Sold detection logic (scrape route simulation)", () => {
  it("detects a bookmarked listing missing from active FOR_SALE results", () => {
    const bookmarkIds = new Set([listing1.id, listing2.id]);
    // Active scrape results only contain listing2
    const activeForSaleIds = new Set([listing2.id, listing3.id]);

    const soldZpids: string[] = [];
    for (const zpid of bookmarkIds) {
      if (!activeForSaleIds.has(zpid)) {
        soldZpids.push(zpid);
      }
    }

    expect(soldZpids).toEqual([listing1.id]);
  });

  it("does not mark listings as sold when all bookmarks appear in active results", () => {
    const bookmarkIds = new Set([listing1.id, listing2.id]);
    const activeForSaleIds = new Set([listing1.id, listing2.id, listing3.id]);

    const soldZpids: string[] = [];
    for (const zpid of bookmarkIds) {
      if (!activeForSaleIds.has(zpid)) {
        soldZpids.push(zpid);
      }
    }

    expect(soldZpids).toHaveLength(0);
  });

  it("marks all bookmarks as sold when scrape returns empty results", () => {
    const bookmarkIds = new Set([listing1.id, listing2.id]);
    const activeForSaleIds = new Set<string>();

    const soldZpids: string[] = [];
    for (const zpid of bookmarkIds) {
      if (!activeForSaleIds.has(zpid)) {
        soldZpids.push(zpid);
      }
    }

    expect(soldZpids).toHaveLength(2);
  });
});
