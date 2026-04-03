export interface ZillowListing {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lotSizeSqft?: number;
  hoaMonthly?: number;
  daysOnMarket: number;
  description?: string;
  photos: string[];
  zillowUrl: string;
  listingType: "FOR_SALE" | "PENDING";
  pricePerSqft?: number;
  latitude?: number;
  longitude?: number;
}

export interface AIScoredListing extends ZillowListing {
  aiScore: number;
  aiReason: string;
  aiHighlights: string[];
  aiConcerns: string[];
  alertTier: "HOT" | "MATCH";
}

export interface UserPreferences {
  minBeds: number;
  minBaths: number;
  maxPrice: number;
  minPrice: number;
  minSqft: number;
  maxHoa: number | null;
  requireGarage: boolean;
  minYearBuilt: number;
  searchArea: string;
  alertEmail: string;
  scoreThreshold: number;
  hotScoreThreshold: number;
}

export interface AlertRecord {
  id: string;
  listing: AIScoredListing;
  sentAt: string;
  emailDelivered: boolean;
}

export interface ScanRecord {
  id: string;
  runAt: string;
  listingsFound: number;
  newListings: number;
  matchedListings: number;
  alertsSent: number;
  durationMs: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  minBeds: 3,
  minBaths: 2,
  maxPrice: 650000,
  minPrice: 0,
  minSqft: 1800,
  maxHoa: null,
  requireGarage: false,
  minYearBuilt: 1990,
  searchArea: "Frisco, TX",
  alertEmail: "",
  scoreThreshold: 6,
  hotScoreThreshold: 8,
};
