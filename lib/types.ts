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
  daysOnMarketPenalty: boolean;
  priceDrop?: {
    amount: number;
    percentage: number;
  };
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
  searchAreas: string[];
  alertEmail: string;
  scoreThreshold: number;
  hotScoreThreshold: number;
  ntfyTopic: string;
  digestHour: number;
  weeklyDigest: boolean;
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

export interface BookmarkedListing {
  listing: AIScoredListing;
  savedAt: string;
  sold: boolean;
}

export interface PriceHistoryEntry {
  price: number;
  date: string;
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
  searchAreas: [],
  alertEmail: "",
  scoreThreshold: 6,
  hotScoreThreshold: 8,
  ntfyTopic: "",
  digestHour: 8,
  weeklyDigest: false,
};
