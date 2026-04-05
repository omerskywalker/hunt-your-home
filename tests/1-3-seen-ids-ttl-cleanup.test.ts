import { describe, it, expect, vi, beforeEach } from "vitest";
import { kv } from "@vercel/kv";
import { addSeenIds, pruneOldSeenIds, getSeenIds } from "@/lib/storage";

// Mock @vercel/kv
vi.mock("@vercel/kv", () => ({
  kv: {
    sadd: vi.fn(),
    set: vi.fn(),
    smembers: vi.fn(),
    get: vi.fn(),
    srem: vi.fn(),
  },
}));

const mockKv = vi.mocked(kv);

describe("Seen-IDs TTL Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addSeenIds", () => {
    it("stores timestamps with 90-day TTL for each zpid", async () => {
      const testIds = ["zpid-1", "zpid-2", "zpid-3"];
      const mockDate = new Date("2026-04-05T10:00:00.000Z");
      vi.setSystemTime(mockDate);

      mockKv.sadd.mockResolvedValue(3);
      mockKv.set.mockResolvedValue("OK");

      await addSeenIds(testIds);

      // Check that sadd was called with correct params
      expect(mockKv.sadd).toHaveBeenCalledWith("hyh:seen-ids", ...testIds);

      // Check that timestamps were stored with TTL for each zpid
      const expectedTtl = 90 * 24 * 60 * 60; // 90 days in seconds
      testIds.forEach((id) => {
        expect(mockKv.set).toHaveBeenCalledWith(
          `hyh:seen-id-ts:${id}`,
          mockDate.toISOString(),
          { ex: expectedTtl }
        );
      });

      expect(mockKv.set).toHaveBeenCalledTimes(3);
    });

    it("handles empty array gracefully", async () => {
      await addSeenIds([]);

      expect(mockKv.sadd).not.toHaveBeenCalled();
      expect(mockKv.set).not.toHaveBeenCalled();
    });
  });

  describe("pruneOldSeenIds", () => {
    it("removes zpids older than 90 days", async () => {
      const now = new Date("2026-04-05T10:00:00.000Z");
      const oldDate = new Date("2026-01-01T10:00:00.000Z"); // More than 90 days ago
      const recentDate = new Date("2026-04-01T10:00:00.000Z"); // Less than 90 days ago
      
      vi.setSystemTime(now);

      const testIds = ["old-zpid", "recent-zpid", "orphaned-zpid"];
      mockKv.smembers.mockResolvedValue(testIds);
      
      // Mock timestamp responses
      mockKv.get.mockImplementation((key: string) => {
        if (key === "hyh:seen-id-ts:old-zpid") return Promise.resolve(oldDate.toISOString());
        if (key === "hyh:seen-id-ts:recent-zpid") return Promise.resolve(recentDate.toISOString());
        if (key === "hyh:seen-id-ts:orphaned-zpid") return Promise.resolve(null); // orphaned
        return Promise.resolve(null);
      });

      mockKv.srem.mockResolvedValue(1);

      const result = await pruneOldSeenIds();

      // Should remove old and orphaned zpids
      expect(result).toEqual(["old-zpid", "orphaned-zpid"]);
      
      // Verify SREM calls
      expect(mockKv.srem).toHaveBeenCalledWith("hyh:seen-ids", "old-zpid");
      expect(mockKv.srem).toHaveBeenCalledWith("hyh:seen-ids", "orphaned-zpid");
      expect(mockKv.srem).not.toHaveBeenCalledWith("hyh:seen-ids", "recent-zpid");
      
      expect(mockKv.srem).toHaveBeenCalledTimes(2);
    });

    it("is no-op when all IDs are recent", async () => {
      const now = new Date("2026-04-05T10:00:00.000Z");
      const recentDate1 = new Date("2026-04-01T10:00:00.000Z"); // 4 days ago
      const recentDate2 = new Date("2026-03-20T10:00:00.000Z"); // 16 days ago
      
      vi.setSystemTime(now);

      const testIds = ["recent-zpid-1", "recent-zpid-2"];
      mockKv.smembers.mockResolvedValue(testIds);
      
      // Mock timestamp responses - all recent
      mockKv.get.mockImplementation((key: string) => {
        if (key === "hyh:seen-id-ts:recent-zpid-1") return Promise.resolve(recentDate1.toISOString());
        if (key === "hyh:seen-id-ts:recent-zpid-2") return Promise.resolve(recentDate2.toISOString());
        return Promise.resolve(null);
      });

      const result = await pruneOldSeenIds();

      // Should not remove any IDs
      expect(result).toEqual([]);
      expect(mockKv.srem).not.toHaveBeenCalled();
    });

    it("removes zpids when timestamp fetch throws error", async () => {
      const testIds = ["error-zpid"];
      mockKv.smembers.mockResolvedValue(testIds);
      
      // Mock get to throw error
      mockKv.get.mockRejectedValue(new Error("Redis error"));
      mockKv.srem.mockResolvedValue(1);

      const result = await pruneOldSeenIds();

      // Should remove zpid when timestamp can't be read
      expect(result).toEqual(["error-zpid"]);
      expect(mockKv.srem).toHaveBeenCalledWith("hyh:seen-ids", "error-zpid");
      expect(mockKv.srem).toHaveBeenCalledTimes(1);
    });

    it("handles empty seen IDs gracefully", async () => {
      mockKv.smembers.mockResolvedValue([]);

      const result = await pruneOldSeenIds();

      expect(result).toEqual([]);
      expect(mockKv.get).not.toHaveBeenCalled();
      expect(mockKv.srem).not.toHaveBeenCalled();
    });

    it("continues processing when individual SREM fails", async () => {
      const now = new Date("2026-04-05T10:00:00.000Z");
      const oldDate = new Date("2026-01-01T10:00:00.000Z");
      
      vi.setSystemTime(now);

      const testIds = ["zpid-1", "zpid-2"];
      mockKv.smembers.mockResolvedValue(testIds);
      
      mockKv.get.mockResolvedValue(oldDate.toISOString());
      
      // Reset srem mock and set specific behavior for each call
      mockKv.srem.mockReset();
      mockKv.srem
        .mockResolvedValueOnce(1) // First call succeeds
        .mockRejectedValueOnce(new Error("SREM failed")) // Second call fails
        .mockResolvedValue(1); // Additional calls succeed

      const result = await pruneOldSeenIds();

      // Should still return both IDs even though one SREM failed
      expect(result).toEqual(["zpid-1", "zpid-2"]);
      // The function may call srem more than twice due to error handling, verify at least 2 calls
      expect(mockKv.srem).toHaveBeenCalledWith("hyh:seen-ids", "zpid-1");
      expect(mockKv.srem).toHaveBeenCalledWith("hyh:seen-ids", "zpid-2");
    });
  });
});