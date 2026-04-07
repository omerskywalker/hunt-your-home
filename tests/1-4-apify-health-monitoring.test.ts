import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runScrapePipeline } from "@/lib/scrape-pipeline";
import * as apify from "@/lib/apify";
import * as email from "@/lib/email";
import * as storage from "@/lib/storage";
import { DEFAULT_PREFERENCES, ZillowListing } from "@/lib/types";

// Mock modules
vi.mock("@/lib/apify");
vi.mock("@/lib/email");
vi.mock("@/lib/storage", async () => {
  const actual = await vi.importActual("@/lib/storage");
  return {
    ...actual,
    getZeroScanStreak: vi.fn(),
    incrementZeroScanStreak: vi.fn(),
    resetZeroScanStreak: vi.fn(),
    getPreferences: vi.fn(),
    getSeenIds: vi.fn(),
    addSeenIds: vi.fn(),
    pushScanRecord: vi.fn(),
    pushAlertRecord: vi.fn(),
    getBookmarkIds: vi.fn(),
    markBookmarkSold: vi.fn(),
    pruneOldSeenIds: vi.fn(),
  };
});

// Mock scorer and filters
vi.mock("@/lib/scorer", () => ({
  batchScoreListings: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/filters", () => ({
  matchesHardFilters: vi.fn().mockReturnValue(true),
}));

const mockRunZillowScraper = vi.mocked(apify.runZillowScraper);
const mockSendHealthAlert = vi.mocked(email.sendHealthAlert);
const mockGetZeroScanStreak = vi.mocked(storage.getZeroScanStreak);
const mockIncrementZeroScanStreak = vi.mocked(storage.incrementZeroScanStreak);
const mockResetZeroScanStreak = vi.mocked(storage.resetZeroScanStreak);
const mockGetPreferences = vi.mocked(storage.getPreferences);
const mockGetSeenIds = vi.mocked(storage.getSeenIds);
const mockAddSeenIds = vi.mocked(storage.addSeenIds);
const mockPushScanRecord = vi.mocked(storage.pushScanRecord);
const mockPushAlertRecord = vi.mocked(storage.pushAlertRecord);
const mockGetBookmarkIds = vi.mocked(storage.getBookmarkIds);
const mockMarkBookmarkSold = vi.mocked(storage.markBookmarkSold);
const mockPruneOldSeenIds = vi.mocked(storage.pruneOldSeenIds);

const SAMPLE_LISTING: ZillowListing = {
  id: "zpid-123",
  address: "123 Test St, Frisco, TX 75035",
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

describe("Apify Health Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockGetPreferences.mockResolvedValue({
      ...DEFAULT_PREFERENCES,
      alertEmail: "test@example.com",
    });
    mockGetSeenIds.mockResolvedValue(new Set());
    mockAddSeenIds.mockResolvedValue();
    mockPushScanRecord.mockResolvedValue();
    mockPushAlertRecord.mockResolvedValue();
    mockGetBookmarkIds.mockResolvedValue(new Set());
    mockMarkBookmarkSold.mockResolvedValue();
    mockPruneOldSeenIds.mockResolvedValue([]);
    mockSendHealthAlert.mockResolvedValue(true);
    
    // Set NODE_ENV to avoid console warnings
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should increment streak on first zero listing scan", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(1);

    await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockSendHealthAlert).not.toHaveBeenCalled();
    expect(mockResetZeroScanStreak).not.toHaveBeenCalled();
  });

  it("should send health alert when streak reaches 2", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(2);

    await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockSendHealthAlert).toHaveBeenCalledWith("test@example.com");
    expect(mockResetZeroScanStreak).not.toHaveBeenCalled();
  });

  it("should send health alert when streak exceeds 2", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(5);

    await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockSendHealthAlert).toHaveBeenCalledWith("test@example.com");
    expect(mockResetZeroScanStreak).not.toHaveBeenCalled();
  });

  it("should not send alert on first zero listing scan (streak = 1)", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(1);

    await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockSendHealthAlert).not.toHaveBeenCalled();
    expect(mockResetZeroScanStreak).not.toHaveBeenCalled();
  });

  it("should reset streak when listings are found", async () => {
    mockRunZillowScraper.mockResolvedValue([SAMPLE_LISTING]);

    await runScrapePipeline();

    expect(mockResetZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockIncrementZeroScanStreak).not.toHaveBeenCalled();
    expect(mockSendHealthAlert).not.toHaveBeenCalled();
  });

  it("should use ALERT_EMAIL_TO fallback when preferences.alertEmail is empty", async () => {
    mockGetPreferences.mockResolvedValue({
      ...DEFAULT_PREFERENCES,
      alertEmail: "",
    });
    vi.stubEnv("ALERT_EMAIL_TO", "fallback@example.com");
    
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(2);

    await runScrapePipeline();

    expect(mockSendHealthAlert).toHaveBeenCalledWith("fallback@example.com");
  });

  it("should not send health alert when no email is configured", async () => {
    mockGetPreferences.mockResolvedValue({
      ...DEFAULT_PREFERENCES,
      alertEmail: "",
    });
    vi.stubEnv("ALERT_EMAIL_TO", "");
    
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(2);

    await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(mockSendHealthAlert).not.toHaveBeenCalled();
  });

  it("should continue normal pipeline flow after health check with listings", async () => {
    mockRunZillowScraper.mockResolvedValue([SAMPLE_LISTING]);

    const result = await runScrapePipeline();

    expect(mockResetZeroScanStreak).toHaveBeenCalledOnce();
    expect(result.listingsFound).toBe(1);
    expect(result.newListings).toBe(1);
    expect(mockPushScanRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        listingsFound: 1,
        newListings: 1,
      })
    );
  });

  it("should continue normal pipeline flow after health check with zero listings", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(1);

    const result = await runScrapePipeline();

    expect(mockIncrementZeroScanStreak).toHaveBeenCalledOnce();
    expect(result.listingsFound).toBe(0);
    expect(result.newListings).toBe(0);
    expect(mockPushScanRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        listingsFound: 0,
        newListings: 0,
      })
    );
  });

  it("should handle health alert email failure gracefully", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockResolvedValue(2);
    mockSendHealthAlert.mockResolvedValue(false);

    await expect(runScrapePipeline()).resolves.not.toThrow();

    expect(mockSendHealthAlert).toHaveBeenCalledWith("test@example.com");
  });

  it("should handle storage errors gracefully in health monitoring", async () => {
    mockRunZillowScraper.mockResolvedValue([]);
    mockIncrementZeroScanStreak.mockRejectedValue(new Error("Storage error"));

    // Pipeline should continue despite health monitoring error
    await expect(runScrapePipeline()).resolves.not.toThrow();
  });
});