import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkScanRateLimit, incrementScanRateLimit } from "@/lib/storage";
import { POST } from "@/app/api/scan-now/route";
import { kv } from "@vercel/kv";

// Mock the @vercel/kv module
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

// Mock the scrape pipeline
vi.mock("@/lib/scrape-pipeline", () => ({
  runScrapePipeline: vi.fn().mockResolvedValue(undefined),
}));

// Mock next/server
vi.mock("next/server", () => ({
  after: vi.fn((callback) => callback()),
}));

const mockKv = kv as any;

describe("Rate Limiting on /api/scan-now", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkScanRateLimit", () => {
    it("allows requests when no previous scans", async () => {
      mockKv.get.mockResolvedValue(null);

      const result = await checkScanRateLimit();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(result.resetAt).toBe("2026-04-06T00:00:00.000Z"); // next day at midnight
      expect(mockKv.get).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05");
    });

    it("allows requests when under limit", async () => {
      mockKv.get.mockResolvedValue(5);

      const result = await checkScanRateLimit();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBe("2026-04-06T00:00:00.000Z");
    });

    it("blocks requests when at limit", async () => {
      mockKv.get.mockResolvedValue(10);

      const result = await checkScanRateLimit();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBe("2026-04-06T00:00:00.000Z");
    });

    it("blocks requests when over limit", async () => {
      mockKv.get.mockResolvedValue(15);

      const result = await checkScanRateLimit();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBe("2026-04-06T00:00:00.000Z");
    });

    it("handles errors gracefully by allowing requests", async () => {
      mockKv.get.mockRejectedValue(new Error("KV error"));

      const result = await checkScanRateLimit();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });

    it("generates different keys for different dates", async () => {
      mockKv.get.mockResolvedValue(0);

      // Test today
      await checkScanRateLimit();
      expect(mockKv.get).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05");

      // Test tomorrow
      vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));
      await checkScanRateLimit();
      expect(mockKv.get).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-06");
    });
  });

  describe("incrementScanRateLimit", () => {
    it("increments counter and sets TTL on first increment", async () => {
      mockKv.incr.mockResolvedValue(1);

      await incrementScanRateLimit();

      expect(mockKv.incr).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05");
      expect(mockKv.expire).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05", 86400);
    });

    it("increments counter without setting TTL on subsequent increments", async () => {
      mockKv.incr.mockResolvedValue(5);

      await incrementScanRateLimit();

      expect(mockKv.incr).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05");
      expect(mockKv.expire).not.toHaveBeenCalled();
    });

    it("handles errors gracefully", async () => {
      mockKv.incr.mockRejectedValue(new Error("KV error"));

      await expect(incrementScanRateLimit()).resolves.not.toThrow();
    });
  });

  describe("POST /api/scan-now", () => {
    it("allows request when under rate limit", async () => {
      // First check returns allowed
      mockKv.get.mockResolvedValueOnce(5); // checkScanRateLimit
      mockKv.incr.mockResolvedValue(6); // incrementScanRateLimit
      mockKv.get.mockResolvedValueOnce(6); // final checkScanRateLimit

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toEqual({
        success: true,
        started: true,
        remaining: 4,
        resetAt: "2026-04-06T00:00:00.000Z",
      });
      expect(mockKv.incr).toHaveBeenCalledWith("hyh:scan-ratelimit:2026-04-05");
    });

    it("blocks request when at rate limit", async () => {
      mockKv.get.mockResolvedValue(10);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({
        success: false,
        error: "Rate limit reached",
        remaining: 0,
        resetAt: "2026-04-06T00:00:00.000Z",
      });
      expect(mockKv.incr).not.toHaveBeenCalled();
    });

    it("blocks request when over rate limit", async () => {
      mockKv.get.mockResolvedValue(15);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({
        success: false,
        error: "Rate limit reached",
        remaining: 0,
        resetAt: "2026-04-06T00:00:00.000Z",
      });
      expect(mockKv.incr).not.toHaveBeenCalled();
    });

    it("correctly decrements remaining count after increment", async () => {
      // Starting with 9 scans used (1 remaining)
      mockKv.get.mockResolvedValueOnce(9); // Initial check - 1 remaining, allowed
      mockKv.incr.mockResolvedValue(10); // After increment - now at limit
      mockKv.get.mockResolvedValueOnce(10); // Final check - 0 remaining

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toEqual({
        success: true,
        started: true,
        remaining: 0,
        resetAt: "2026-04-06T00:00:00.000Z",
      });
    });

    it("resets count for new day", async () => {
      // First day - reach limit
      mockKv.get.mockResolvedValue(10);
      let response = await POST();
      expect(response.status).toBe(429);

      // Next day - should allow again
      vi.setSystemTime(new Date('2026-04-06T12:00:00.000Z'));
      mockKv.get.mockResolvedValueOnce(0); // Fresh day, no scans
      mockKv.incr.mockResolvedValue(1);
      mockKv.get.mockResolvedValueOnce(1);

      response = await POST();
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.remaining).toBe(9);
      expect(data.resetAt).toBe("2026-04-07T00:00:00.000Z"); // Next day's reset
    });
  });
});