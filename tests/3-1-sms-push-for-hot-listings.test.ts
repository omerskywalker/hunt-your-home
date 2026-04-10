import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendNtfyPush } from "@/lib/email";
import { AIScoredListing } from "@/lib/types";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console.error to avoid cluttering test output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

const MOCK_LISTING: AIScoredListing = {
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
  aiScore: 9,
  aiReason: "Great value property",
  aiHighlights: ["Recently updated", "Good location"],
  aiConcerns: ["Minor repairs needed"],
  alertTier: "HOT",
  daysOnMarketPenalty: false,
};

describe("sendNtfyPush", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should no-op when topic is empty", async () => {
    const result = await sendNtfyPush(MOCK_LISTING, "");
    
    expect(result).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should no-op when topic is only whitespace", async () => {
    const result = await sendNtfyPush(MOCK_LISTING, "   ");
    
    expect(result).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should send push notification with correct payload for HOT listing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const result = await sendNtfyPush(MOCK_LISTING, "my-home-alerts");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://ntfy.sh/my-home-alerts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "🔥 HOT: 123 Main St, Frisco, TX 75035",
          message: "$500,000 • 4bd/3ba • 2400 sqft • Score: 9/10",
          priority: "urgent",
          tags: ["house"],
        }),
      }
    );
  });

  it("should handle different listing data correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const customListing: AIScoredListing = {
      ...MOCK_LISTING,
      address: "456 Oak Ave, Dallas, TX 75001",
      price: 1250000,
      beds: 5,
      baths: 3.5,
      sqft: 3200,
      aiScore: 8,
    };

    const result = await sendNtfyPush(customListing, "test-topic");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://ntfy.sh/test-topic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "🔥 HOT: 456 Oak Ave, Dallas, TX 75001",
          message: "$1,250,000 • 5bd/3.5ba • 3200 sqft • Score: 8/10",
          priority: "urgent",
          tags: ["house"],
        }),
      }
    );
  });

  it("should return false when ntfy.sh request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    const result = await sendNtfyPush(MOCK_LISTING, "my-home-alerts");

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "ntfy push failed:",
      400,
      "Bad Request"
    );
  });

  it("should return false and log error when fetch throws", async () => {
    const error = new Error("Network error");
    mockFetch.mockRejectedValueOnce(error);

    const result = await sendNtfyPush(MOCK_LISTING, "my-home-alerts");

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith("sendNtfyPush failed:", error);
  });

  it("should use priority urgent for HOT tier listings", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const hotListing: AIScoredListing = {
      ...MOCK_LISTING,
      alertTier: "HOT",
    };

    await sendNtfyPush(hotListing, "test-topic");

    const fetchCall = mockFetch.mock.calls[0];
    const payload = JSON.parse(fetchCall[1].body);
    expect(payload.priority).toBe("urgent");
  });

  it("should trim whitespace from topic", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await sendNtfyPush(MOCK_LISTING, "  my-topic  ");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://ntfy.sh/my-topic",
      expect.any(Object)
    );
  });
});