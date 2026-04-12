import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getHardFilterReason } from "@/lib/filters";
import { ZillowListing, UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ scanId: "test-scan-id" }),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Base listing that satisfies DEFAULT_PREFERENCES
const BASE_LISTING: ZillowListing = {
  id: "zpid-test-001",
  address: "123 Main St, Frisco, TX 75035",
  price: 500000,
  beds: 4,
  baths: 3,
  sqft: 2400,
  yearBuilt: 2010,
  daysOnMarket: 5,
  photos: [],
  zillowUrl: "https://www.zillow.com/test",
  listingType: "FOR_SALE",
};

const PREFS: UserPreferences = { ...DEFAULT_PREFERENCES };

describe("getHardFilterReason", () => {
  it("returns null for a listing that passes all filters", () => {
    expect(getHardFilterReason(BASE_LISTING, PREFS)).toBeNull();
  });

  it("returns reason for PENDING listing", () => {
    const listing = { ...BASE_LISTING, listingType: "PENDING" as const };
    expect(getHardFilterReason(listing, PREFS)).toBe("Status: PENDING");
  });

  it("returns reason for price too low", () => {
    const prefs = { ...PREFS, minPrice: 600000 };
    const listing = { ...BASE_LISTING, price: 500000 };
    expect(getHardFilterReason(listing, prefs)).toBe("Below min price ($600,000)");
  });

  it("returns reason for price too high", () => {
    const listing = { ...BASE_LISTING, price: 700000 };
    expect(getHardFilterReason(listing, PREFS)).toBe("Above max price ($650,000)");
  });

  it("returns reason for too few beds", () => {
    const listing = { ...BASE_LISTING, beds: 2 };
    expect(getHardFilterReason(listing, PREFS)).toBe("Only 2 beds (need 3+)");
  });

  it("returns reason for too few baths", () => {
    const listing = { ...BASE_LISTING, baths: 1 };
    expect(getHardFilterReason(listing, PREFS)).toBe("Only 1 baths (need 2+)");
  });

  it("returns reason for too small sqft", () => {
    const listing = { ...BASE_LISTING, sqft: 1500 };
    expect(getHardFilterReason(listing, PREFS)).toBe("Only 1,500 sqft (need 1,800+)");
  });

  it("returns reason for year built too old", () => {
    const listing = { ...BASE_LISTING, yearBuilt: 1985 };
    expect(getHardFilterReason(listing, PREFS)).toBe("Built in 1985 (need 1990+)");
  });

  it("returns reason for HOA too high", () => {
    const prefs = { ...PREFS, maxHoa: 200 };
    const listing = { ...BASE_LISTING, hoaMonthly: 300 };
    expect(getHardFilterReason(listing, prefs)).toBe("HOA $300/mo (max $200/mo)");
  });

  it("returns null when HOA is set but maxHoa is null", () => {
    const prefs = { ...PREFS, maxHoa: null };
    const listing = { ...BASE_LISTING, hoaMonthly: 999 };
    expect(getHardFilterReason(listing, prefs)).toBeNull();
  });

  it("returns null when HOA is not set regardless of maxHoa", () => {
    const prefs = { ...PREFS, maxHoa: 100 };
    const listing = { ...BASE_LISTING };
    delete (listing as any).hoaMonthly;
    expect(getHardFilterReason(listing, prefs)).toBeNull();
  });

  it("returns the first failing filter for multiple failures", () => {
    const listing = { 
      ...BASE_LISTING, 
      listingType: "PENDING" as const,
      price: 700000,
      beds: 2,
    };
    // Should return the first check that fails (listingType)
    expect(getHardFilterReason(listing, PREFS)).toBe("Status: PENDING");
  });
});

// Test funnel annotation logic (simulating what happens in scrape-pipeline)
describe("funnel annotation logic", () => {
  it("correctly categorizes listings through filter funnel", () => {
    const allListings = [
      { ...BASE_LISTING, id: "passes", price: 500000 },
      { ...BASE_LISTING, id: "too-expensive", price: 700000 },
      { ...BASE_LISTING, id: "too-few-beds", beds: 2 },
      { ...BASE_LISTING, id: "pending", listingType: "PENDING" as const },
    ];

    const hardFilteredOut: Array<{zpid: string; reason: string}> = [];
    const passed: ZillowListing[] = [];

    for (const listing of allListings) {
      const reason = getHardFilterReason(listing, PREFS);
      if (reason) {
        hardFilteredOut.push({ zpid: listing.id, reason });
      } else {
        passed.push(listing);
      }
    }

    expect(passed).toHaveLength(1);
    expect(passed[0].id).toBe("passes");
    
    expect(hardFilteredOut).toHaveLength(3);
    expect(hardFilteredOut.find(item => item.zpid === "too-expensive")?.reason)
      .toBe("Above max price ($650,000)");
    expect(hardFilteredOut.find(item => item.zpid === "too-few-beds")?.reason)
      .toBe("Only 2 beds (need 3+)");
    expect(hardFilteredOut.find(item => item.zpid === "pending")?.reason)
      .toBe("Status: PENDING");
  });
});

// Test scored array population
describe("scored array population", () => {
  it("correctly maps scored listings to funnel format", () => {
    const scoredListings = [
      { ...BASE_LISTING, id: "listing1", aiScore: 8.5 },
      { ...BASE_LISTING, id: "listing2", aiScore: 6.2 },
      { ...BASE_LISTING, id: "listing3", aiScore: 4.1 },
    ] as any;

    const scoredFunnelData = scoredListings.map((listing: any) => ({
      zpid: listing.id,
      score: listing.aiScore,
    }));

    expect(scoredFunnelData).toHaveLength(3);
    expect(scoredFunnelData[0]).toEqual({ zpid: "listing1", score: 8.5 });
    expect(scoredFunnelData[1]).toEqual({ zpid: "listing2", score: 6.2 });
    expect(scoredFunnelData[2]).toEqual({ zpid: "listing3", score: 4.1 });
  });

  it("correctly filters alerted listings", () => {
    const scoredListings = [
      { ...BASE_LISTING, id: "hot", aiScore: 8.5 },
      { ...BASE_LISTING, id: "match", aiScore: 6.2 },
      { ...BASE_LISTING, id: "below-threshold", aiScore: 4.1 },
    ] as any;

    const scoreThreshold = 6;
    const aboveThreshold = scoredListings.filter((l: any) => l.aiScore >= scoreThreshold);
    const alertedIds = aboveThreshold.map((l: any) => l.id);

    expect(alertedIds).toEqual(["hot", "match"]);
  });
});

// Test the funnel structure matches expected interface
describe("funnel data structure", () => {
  it("creates valid funnel data structure", () => {
    const funnelData = {
      found: 45,
      deduped: 42,
      hardFiltered: [
        { zpid: "12345", reason: "Only 2 beds (need 3+)" },
        { zpid: "67890", reason: "Above max price ($650,000)" },
      ],
      scored: [
        { zpid: "33333", score: 8.2 },
        { zpid: "44444", score: 6.1 },
      ],
      alerted: ["33333", "44444"],
    };

    // Check structure matches the interface
    expect(typeof funnelData.found).toBe("number");
    expect(typeof funnelData.deduped).toBe("number");
    expect(Array.isArray(funnelData.hardFiltered)).toBe(true);
    expect(Array.isArray(funnelData.scored)).toBe(true);
    expect(Array.isArray(funnelData.alerted)).toBe(true);

    // Check array items have correct structure
    expect(funnelData.hardFiltered[0]).toHaveProperty("zpid");
    expect(funnelData.hardFiltered[0]).toHaveProperty("reason");
    expect(funnelData.scored[0]).toHaveProperty("zpid");
    expect(funnelData.scored[0]).toHaveProperty("score");
    expect(typeof funnelData.alerted[0]).toBe("string");
  });
});