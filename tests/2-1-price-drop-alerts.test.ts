import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculatePriceDropPercentage,
  formatPriceDrop,
  addPriceEntry,
  getLastPrice,
  getPriceHistory,
} from "@/lib/storage";
import { PriceHistoryEntry } from "@/lib/types";

// Mock KV
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

const { kv } = await import("@vercel/kv");

describe("Price Drop Alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculatePriceDropPercentage", () => {
    it("calculates price drop percentage correctly", () => {
      expect(calculatePriceDropPercentage(480000, 500000)).toBe(4);
      expect(calculatePriceDropPercentage(490000, 500000)).toBe(2);
      expect(calculatePriceDropPercentage(495000, 500000)).toBe(1);
    });

    it("handles zero drop (same price)", () => {
      expect(calculatePriceDropPercentage(500000, 500000)).toBe(0);
    });

    it("handles price increase (negative drop)", () => {
      expect(calculatePriceDropPercentage(520000, 500000)).toBe(-4);
    });

    it("returns 0 when lastPrice is 0", () => {
      expect(calculatePriceDropPercentage(500000, 0)).toBe(0);
    });

    it("returns 0 when lastPrice is negative", () => {
      expect(calculatePriceDropPercentage(500000, -100)).toBe(0);
    });
  });

  describe("2% threshold boundary", () => {
    it("identifies drops exactly at 2% threshold", () => {
      const currentPrice = 490000;
      const lastPrice = 500000;
      const dropPercentage = calculatePriceDropPercentage(currentPrice, lastPrice);
      expect(dropPercentage).toBe(2);
      expect(dropPercentage >= 2).toBe(true);
    });

    it("identifies drops just below 2% threshold", () => {
      const currentPrice = 495000;
      const lastPrice = 500000;
      const dropPercentage = calculatePriceDropPercentage(currentPrice, lastPrice);
      expect(dropPercentage).toBe(1);
      expect(dropPercentage >= 2).toBe(false);
    });

    it("identifies drops just above 2% threshold", () => {
      const currentPrice = 489000;
      const lastPrice = 500000;
      const dropPercentage = calculatePriceDropPercentage(currentPrice, lastPrice);
      expect(dropPercentage).toBeCloseTo(2.2, 1);
      expect(dropPercentage >= 2).toBe(true);
    });
  });

  describe("formatPriceDrop", () => {
    it("formats amounts >= $1000 as $Xk", () => {
      expect(formatPriceDrop(15000)).toBe("$15k");
      expect(formatPriceDrop(25000)).toBe("$25k");
      expect(formatPriceDrop(1000)).toBe("$1k");
    });

    it("formats amounts < $1000 as full dollar amount", () => {
      expect(formatPriceDrop(500)).toBe("$500");
      expect(formatPriceDrop(999)).toBe("$999");
      expect(formatPriceDrop(123)).toBe("$123");
    });

    it("rounds to nearest dollar for k format", () => {
      expect(formatPriceDrop(15678)).toBe("$16k");
      expect(formatPriceDrop(15123)).toBe("$15k");
    });

    it("handles edge cases", () => {
      expect(formatPriceDrop(0)).toBe("$0");
      expect(formatPriceDrop(1)).toBe("$1");
      expect(formatPriceDrop(999.9)).toBe("$1,000");
    });
  });

  describe("price history storage", () => {
    it("stores price entry with TTL", async () => {
      const mockHistory: PriceHistoryEntry[] = [
        { price: 500000, date: "2026-04-01T00:00:00.000Z" }
      ];
      
      vi.mocked(kv.get).mockResolvedValueOnce(mockHistory);
      
      await addPriceEntry("zpid-123", 480000, "2026-04-07T00:00:00.000Z");
      
      expect(kv.set).toHaveBeenCalledWith(
        "hyh:price-history:zpid-123",
        [
          ...mockHistory,
          { price: 480000, date: "2026-04-07T00:00:00.000Z" }
        ],
        { ex: 180 * 24 * 60 * 60 } // 180 days in seconds
      );
    });

    it("skips storing duplicate price", async () => {
      const mockHistory: PriceHistoryEntry[] = [
        { price: 500000, date: "2026-04-01T00:00:00.000Z" }
      ];
      
      vi.mocked(kv.get).mockResolvedValueOnce(mockHistory);
      
      await addPriceEntry("zpid-123", 500000, "2026-04-07T00:00:00.000Z");
      
      expect(kv.set).not.toHaveBeenCalled();
    });

    it("retrieves last price correctly", async () => {
      const mockHistory: PriceHistoryEntry[] = [
        { price: 520000, date: "2026-04-01T00:00:00.000Z" },
        { price: 500000, date: "2026-04-05T00:00:00.000Z" },
        { price: 480000, date: "2026-04-07T00:00:00.000Z" }
      ];
      
      vi.mocked(kv.get).mockResolvedValueOnce(mockHistory);
      
      const lastPrice = await getLastPrice("zpid-123");
      expect(lastPrice).toBe(480000);
    });

    it("returns null when no price history exists", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);
      
      const lastPrice = await getLastPrice("zpid-123");
      expect(lastPrice).toBe(null);
    });

    it("returns empty array when no history exists", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);
      
      const history = await getPriceHistory("zpid-123");
      expect(history).toEqual([]);
    });

    it("handles storage errors gracefully", async () => {
      vi.mocked(kv.get).mockRejectedValueOnce(new Error("KV error"));
      
      const lastPrice = await getLastPrice("zpid-123");
      expect(lastPrice).toBe(null);
      
      const history = await getPriceHistory("zpid-123");
      expect(history).toEqual([]);
    });
  });

  describe("re-queue logic", () => {
    it("should include listing in scoring queue when drop >= 2%", () => {
      const currentPrice = 480000;
      const lastPrice = 500000;
      const dropPercentage = calculatePriceDropPercentage(currentPrice, lastPrice);
      const priceDroppedIds = new Set<string>();
      
      // Simulate the scrape pipeline logic
      if (dropPercentage >= 2) {
        priceDroppedIds.add("zpid-123");
      }
      
      const seenIds = new Set(["zpid-123"]);
      const allListings = [{ id: "zpid-123", price: currentPrice }];
      
      // Should include in toScore even if already seen
      const toScore = allListings.filter(l => 
        !seenIds.has(l.id) || priceDroppedIds.has(l.id)
      );
      
      expect(toScore).toHaveLength(1);
      expect(toScore[0].id).toBe("zpid-123");
    });

    it("should not include listing in scoring queue when drop < 2%", () => {
      const currentPrice = 495000;
      const lastPrice = 500000;
      const dropPercentage = calculatePriceDropPercentage(currentPrice, lastPrice);
      const priceDroppedIds = new Set<string>();
      
      // Simulate the scrape pipeline logic
      if (dropPercentage >= 2) {
        priceDroppedIds.add("zpid-123");
      }
      
      const seenIds = new Set(["zpid-123"]);
      const allListings = [{ id: "zpid-123", price: currentPrice }];
      
      // Should not include in toScore if already seen and no significant drop
      const toScore = allListings.filter(l => 
        !seenIds.has(l.id) || priceDroppedIds.has(l.id)
      );
      
      expect(toScore).toHaveLength(0);
    });
  });
});