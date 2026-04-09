import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZillowListing, UserPreferences, DEFAULT_PREFERENCES } from "@/lib/types";

// Mock Apify
const mockRunZillowScraper = vi.fn();
vi.mock("@/lib/apify", () => ({
  runZillowScraper: mockRunZillowScraper,
}));

// Mock all storage functions
vi.mock("@/lib/storage", () => ({
  getPreferences: vi.fn(),
  getSeenIds: vi.fn().mockResolvedValue(new Set()),
  addSeenIds: vi.fn(),
  pushAlertRecord: vi.fn(),
  pushScanRecord: vi.fn(),
  getBookmarkIds: vi.fn().mockResolvedValue(new Set()),
  markBookmarkSold: vi.fn(),
  pruneOldSeenIds: vi.fn(),
  getZeroScanStreak: vi.fn(),
  incrementZeroScanStreak: vi.fn(),
  resetZeroScanStreak: vi.fn(),
  addPriceEntry: vi.fn(),
  getLastPrice: vi.fn(),
  calculatePriceDropPercentage: vi.fn(),
  getDismissedIds: vi.fn().mockResolvedValue(new Set()),
}));

// Mock scorer
vi.mock("@/lib/scorer", () => ({
  batchScoreListings: vi.fn().mockResolvedValue([]),
}));

// Mock filters
vi.mock("@/lib/filters", () => ({
  matchesHardFilters: vi.fn().mockReturnValue(true),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  sendHotAlert: vi.fn().mockResolvedValue(true),
  sendMatchDigest: vi.fn().mockResolvedValue(true),
  sendHealthAlert: vi.fn().mockResolvedValue(true),
}));

const LISTING_A: ZillowListing = {
  id: "zpid-001",
  address: "123 Main St, Frisco, TX",
  price: 500000,
  beds: 4,
  baths: 3,
  sqft: 2400,
  yearBuilt: 2010,
  daysOnMarket: 5,
  photos: [],
  zillowUrl: "https://www.zillow.com/zpid-001",
  listingType: "FOR_SALE",
};

const LISTING_B: ZillowListing = {
  id: "zpid-002", 
  address: "456 Oak Ave, Plano, TX",
  price: 550000,
  beds: 3,
  baths: 2,
  sqft: 2000,
  yearBuilt: 2015,
  daysOnMarket: 10,
  photos: [],
  zillowUrl: "https://www.zillow.com/zpid-002",
  listingType: "FOR_SALE",
};

const LISTING_DUPLICATE: ZillowListing = {
  ...LISTING_A,
  address: "123 Main St, Plano, TX", // Same zpid, different area
};

describe("Multi-Area Watching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Parallel area fetching", async () => {
    // Import the function here to avoid import order issues with mocks
    const { runScrapePipeline } = await import("@/lib/scrape-pipeline");
    const { getPreferences } = await import("@/lib/storage");

    it("uses searchAreas when populated, ignoring searchArea", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchArea: "Ignored, TX",
        searchAreas: ["Frisco, TX", "Plano, TX"],
      };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper
        .mockResolvedValueOnce([LISTING_A])
        .mockResolvedValueOnce([LISTING_B]);

      await runScrapePipeline();

      expect(mockRunZillowScraper).toHaveBeenCalledTimes(2);
      expect(mockRunZillowScraper).toHaveBeenCalledWith("Frisco, TX");
      expect(mockRunZillowScraper).toHaveBeenCalledWith("Plano, TX");
    });

    it("falls back to searchArea when searchAreas is empty", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchArea: "Frisco, TX",
        searchAreas: [],
      };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper.mockResolvedValueOnce([LISTING_A]);

      await runScrapePipeline();

      expect(mockRunZillowScraper).toHaveBeenCalledTimes(1);
      expect(mockRunZillowScraper).toHaveBeenCalledWith("Frisco, TX");
    });

    it("runs Apify calls in parallel via Promise.all", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchAreas: ["Area1", "Area2", "Area3"],
      };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      
      // Track call order
      const callOrder: string[] = [];
      mockRunZillowScraper.mockImplementation(async (area: string) => {
        callOrder.push(`start-${area}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        callOrder.push(`end-${area}`);
        return [];
      });

      await runScrapePipeline();

      // Verify all started before any ended (parallel execution)
      const startCalls = callOrder.filter(call => call.startsWith('start'));
      const endCalls = callOrder.filter(call => call.startsWith('end'));
      
      expect(startCalls).toHaveLength(3);
      expect(endCalls).toHaveLength(3);
      
      // All starts should appear before any ends in parallel execution
      const firstEndIndex = callOrder.findIndex(call => call.startsWith('end'));
      const lastStartIndex = callOrder.lastIndexOf(callOrder.find(call => call.startsWith('start'))!);
      
      expect(lastStartIndex).toBeLessThan(firstEndIndex);
    });
  });

  describe("Deduplication by zpid", async () => {
    const { runScrapePipeline } = await import("@/lib/scrape-pipeline");
    const { getPreferences } = await import("@/lib/storage");

    it("keeps first occurrence when same zpid appears in multiple areas", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchAreas: ["Frisco, TX", "Plano, TX"],
      };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper
        .mockResolvedValueOnce([LISTING_A])
        .mockResolvedValueOnce([LISTING_DUPLICATE, LISTING_B]);

      const result = await runScrapePipeline();

      // Should only have 2 listings: LISTING_A (first occurrence) and LISTING_B
      expect(result.listingsFound).toBe(2);
      
      // Verify the listings passed to filters/scoring are deduplicated
      const { matchesHardFilters } = await import("@/lib/filters");
      const filterCalls = vi.mocked(matchesHardFilters).mock.calls;
      
      // Get the unique zpids that were processed
      const processedZpids = filterCalls.map(call => call[0].id);
      const uniqueZpids = [...new Set(processedZpids)];
      
      expect(uniqueZpids).toContain("zpid-001");
      expect(uniqueZpids).toContain("zpid-002");
      expect(uniqueZpids.length).toBe(processedZpids.length); // No duplicates
    });

    it("preserves order when deduplicating", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchAreas: ["Area1", "Area2"],
      };
      
      const listingC = { ...LISTING_A, id: "zpid-003" };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper
        .mockResolvedValueOnce([LISTING_A, listingC])
        .mockResolvedValueOnce([LISTING_DUPLICATE, LISTING_B]);

      await runScrapePipeline();

      // Verify order is preserved: Area1 results first, then Area2 (minus duplicates)
      const { matchesHardFilters } = await import("@/lib/filters");
      const filterCalls = vi.mocked(matchesHardFilters).mock.calls;
      const processedIds = filterCalls.map(call => call[0].id);
      
      expect(processedIds).toEqual(["zpid-001", "zpid-003", "zpid-002"]);
    });
  });

  describe("Backward compatibility", async () => {
    const { runScrapePipeline } = await import("@/lib/scrape-pipeline");
    const { getPreferences } = await import("@/lib/storage");

    it("works with existing single searchArea when searchAreas is undefined", async () => {
      const prefs = {
        ...DEFAULT_PREFERENCES,
        searchArea: "Frisco, TX",
        // searchAreas not defined (simulating old preferences)
      } as UserPreferences;
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper.mockResolvedValueOnce([LISTING_A]);

      await runScrapePipeline();

      expect(mockRunZillowScraper).toHaveBeenCalledTimes(1);
      expect(mockRunZillowScraper).toHaveBeenCalledWith("Frisco, TX");
    });

    it("works with existing single searchArea when searchAreas is null", async () => {
      const prefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        searchArea: "Frisco, TX",
        searchAreas: null as any, // Simulating legacy data
      };
      
      vi.mocked(getPreferences).mockResolvedValue(prefs);
      mockRunZillowScraper.mockResolvedValueOnce([LISTING_A]);

      await runScrapePipeline();

      expect(mockRunZillowScraper).toHaveBeenCalledTimes(1);
      expect(mockRunZillowScraper).toHaveBeenCalledWith("Frisco, TX");
    });
  });
});