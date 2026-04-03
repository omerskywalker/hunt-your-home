import { describe, it, expect } from "vitest";
import { matchesHardFilters } from "@/lib/filters";
import { ZillowListing, UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";

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

describe("matchesHardFilters", () => {
  it("passes a listing that meets all default criteria", () => {
    expect(matchesHardFilters(BASE_LISTING, PREFS)).toBe(true);
  });

  // listingType
  it("rejects a PENDING listing", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, listingType: "PENDING" }, PREFS)).toBe(false);
  });

  // Price
  it("rejects listing above maxPrice", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, price: 700000 }, PREFS)).toBe(false);
  });

  it("rejects listing below minPrice", () => {
    const prefs: UserPreferences = { ...PREFS, minPrice: 400000 };
    expect(matchesHardFilters({ ...BASE_LISTING, price: 300000 }, prefs)).toBe(false);
  });

  it("accepts listing exactly at maxPrice boundary", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, price: 650000 }, PREFS)).toBe(true);
  });

  it("accepts listing exactly at minPrice boundary", () => {
    const prefs: UserPreferences = { ...PREFS, minPrice: 400000 };
    expect(matchesHardFilters({ ...BASE_LISTING, price: 400000 }, prefs)).toBe(true);
  });

  // Beds
  it("rejects listing with fewer beds than minBeds", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, beds: 2 }, PREFS)).toBe(false);
  });

  it("accepts listing with exactly minBeds", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, beds: PREFS.minBeds }, PREFS)).toBe(true);
  });

  // Baths
  it("rejects listing with fewer baths than minBaths", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, baths: 1 }, PREFS)).toBe(false);
  });

  // Sqft
  it("rejects listing below minSqft", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, sqft: 1000 }, PREFS)).toBe(false);
  });

  it("accepts listing exactly at minSqft", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, sqft: PREFS.minSqft }, PREFS)).toBe(true);
  });

  // Year built
  it("rejects listing built before minYearBuilt", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, yearBuilt: 1980 }, PREFS)).toBe(false);
  });

  it("accepts listing built exactly at minYearBuilt", () => {
    expect(matchesHardFilters({ ...BASE_LISTING, yearBuilt: PREFS.minYearBuilt }, PREFS)).toBe(true);
  });

  // HOA
  it("rejects listing with HOA over maxHoa when maxHoa is set", () => {
    const prefs: UserPreferences = { ...PREFS, maxHoa: 100 };
    expect(matchesHardFilters({ ...BASE_LISTING, hoaMonthly: 200 }, prefs)).toBe(false);
  });

  it("accepts listing with HOA under maxHoa", () => {
    const prefs: UserPreferences = { ...PREFS, maxHoa: 200 };
    expect(matchesHardFilters({ ...BASE_LISTING, hoaMonthly: 150 }, prefs)).toBe(true);
  });

  it("accepts listing with HOA when maxHoa is null (no restriction)", () => {
    const prefs: UserPreferences = { ...PREFS, maxHoa: null };
    expect(matchesHardFilters({ ...BASE_LISTING, hoaMonthly: 999 }, prefs)).toBe(true);
  });

  it("accepts listing with no HOA field regardless of maxHoa", () => {
    const prefs: UserPreferences = { ...PREFS, maxHoa: 0 };
    const listingNoHoa = { ...BASE_LISTING };
    delete (listingNoHoa as Partial<ZillowListing>).hoaMonthly;
    expect(matchesHardFilters(listingNoHoa, prefs)).toBe(true);
  });
});
