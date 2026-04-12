import { ZillowListing, UserPreferences } from "./types";

export function matchesHardFilters(
  listing: ZillowListing,
  prefs: UserPreferences
): boolean {
  // Must be FOR_SALE
  if (listing.listingType !== "FOR_SALE") return false;

  // Price range
  if (listing.price < prefs.minPrice) return false;
  if (listing.price > prefs.maxPrice) return false;

  // Beds
  if (listing.beds < prefs.minBeds) return false;

  // Baths
  if (listing.baths < prefs.minBaths) return false;

  // Sqft
  if (listing.sqft < prefs.minSqft) return false;

  // Year built
  if (listing.yearBuilt < prefs.minYearBuilt) return false;

  // HOA
  if (prefs.maxHoa !== null && listing.hoaMonthly !== undefined) {
    if (listing.hoaMonthly > prefs.maxHoa) return false;
  }

  return true;
}

export function getHardFilterReason(
  listing: ZillowListing,
  prefs: UserPreferences
): string | null {
  // Must be FOR_SALE
  if (listing.listingType !== "FOR_SALE") {
    return `Status: ${listing.listingType}`;
  }

  // Price range
  if (listing.price < prefs.minPrice) {
    return `Below min price ($${prefs.minPrice.toLocaleString()})`;
  }
  if (listing.price > prefs.maxPrice) {
    return `Above max price ($${prefs.maxPrice.toLocaleString()})`;
  }

  // Beds
  if (listing.beds < prefs.minBeds) {
    return `Only ${listing.beds} beds (need ${prefs.minBeds}+)`;
  }

  // Baths
  if (listing.baths < prefs.minBaths) {
    return `Only ${listing.baths} baths (need ${prefs.minBaths}+)`;
  }

  // Sqft
  if (listing.sqft < prefs.minSqft) {
    return `Only ${listing.sqft.toLocaleString()} sqft (need ${prefs.minSqft.toLocaleString()}+)`;
  }

  // Year built
  if (listing.yearBuilt < prefs.minYearBuilt) {
    return `Built in ${listing.yearBuilt} (need ${prefs.minYearBuilt}+)`;
  }

  // HOA
  if (prefs.maxHoa !== null && listing.hoaMonthly !== undefined) {
    if (listing.hoaMonthly > prefs.maxHoa) {
      return `HOA $${listing.hoaMonthly}/mo (max $${prefs.maxHoa}/mo)`;
    }
  }

  return null; // Passed all filters
}
