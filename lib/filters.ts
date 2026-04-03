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
