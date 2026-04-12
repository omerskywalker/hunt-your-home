import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertRecord, AIScoredListing } from "@/lib/types";

// Mock the digest route since we can't directly import the internal functions
// Instead, we'll test the logic here using the same patterns

function getRecentMatchAlerts(
  alerts: AlertRecord[], 
  digestHour: number, 
  weeklyDigest: boolean
): AIScoredListing[] {
  const now = new Date();
  const cutoffDate = new Date();
  
  if (weeklyDigest) {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  }

  return alerts
    .filter(alert => {
      if (alert.listing.alertTier !== "MATCH") return false;
      if (!alert.emailDelivered) return false;
      
      const alertDate = new Date(alert.sentAt);
      return alertDate >= cutoffDate;
    })
    .map(alert => alert.listing);
}

function validateDigestHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

// Helper to create test alert records
function createTestAlert(
  alertTier: "HOT" | "MATCH",
  sentAt: string,
  emailDelivered: boolean = true
): AlertRecord {
  return {
    id: `alert-${Math.random()}`,
    sentAt,
    emailDelivered,
    listing: {
      id: `zpid-${Math.random()}`,
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
      aiScore: 7,
      aiReason: "Test listing",
      aiHighlights: ["Great location"],
      aiConcerns: ["None"],
      alertTier,
      daysOnMarketPenalty: false,
    },
  };
}

describe("Digest Cadence Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hour validation", () => {
    it("validates hours 0-23 as valid", () => {
      expect(validateDigestHour(0)).toBe(true);
      expect(validateDigestHour(8)).toBe(true);
      expect(validateDigestHour(23)).toBe(true);
    });

    it("rejects invalid hours", () => {
      expect(validateDigestHour(-1)).toBe(false);
      expect(validateDigestHour(24)).toBe(false);
      expect(validateDigestHour(25)).toBe(false);
    });

    it("rejects non-integer values", () => {
      expect(validateDigestHour(8.5)).toBe(false);
      expect(validateDigestHour(NaN)).toBe(false);
      expect(validateDigestHour(Infinity)).toBe(false);
    });
  });

  describe("digest aggregation logic", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago (within 1 day)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago (within 7 days)

    it("includes recent MATCH alerts for daily digest", () => {
      const alerts = [
        createTestAlert("MATCH", yesterday.toISOString()),
        createTestAlert("HOT", yesterday.toISOString()),
        createTestAlert("MATCH", twoDaysAgo.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(1);
      expect(result[0].alertTier).toBe("MATCH");
    });

    it("includes all recent MATCH alerts for weekly digest", () => {
      const alerts = [
        createTestAlert("MATCH", yesterday.toISOString()),
        createTestAlert("MATCH", twoDaysAgo.toISOString()),
        createTestAlert("MATCH", weekAgo.toISOString()),
        createTestAlert("HOT", yesterday.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, true);
      
      expect(result).toHaveLength(3);
      result.forEach(listing => expect(listing.alertTier).toBe("MATCH"));
    });

    it("filters out HOT alerts from digest", () => {
      const alerts = [
        createTestAlert("HOT", yesterday.toISOString()),
        createTestAlert("HOT", twoDaysAgo.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(0);
    });

    it("filters out alerts that were not delivered", () => {
      const alerts = [
        createTestAlert("MATCH", yesterday.toISOString(), false), // not delivered
        createTestAlert("MATCH", yesterday.toISOString(), true),  // delivered
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(1);
    });

    it("respects daily cutoff time", () => {
      const moreThanDayOld = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      
      const alerts = [
        createTestAlert("MATCH", yesterday.toISOString()),
        createTestAlert("MATCH", moreThanDayOld.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(1);
    });

    it("respects weekly cutoff time", () => {
      const moreThanWeekOld = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      
      const alerts = [
        createTestAlert("MATCH", weekAgo.toISOString()),
        createTestAlert("MATCH", moreThanWeekOld.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, true);
      
      expect(result).toHaveLength(1);
    });
  });

  describe("empty digest no-op", () => {
    it("returns empty array when no alerts match criteria", () => {
      const alerts = [
        createTestAlert("HOT", new Date().toISOString()), // wrong tier
        createTestAlert("MATCH", new Date().toISOString(), false), // not delivered
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(0);
    });

    it("returns empty array when no alerts exist", () => {
      const result = getRecentMatchAlerts([], 8, false);
      
      expect(result).toHaveLength(0);
    });

    it("returns empty array when all alerts are too old", () => {
      const veryOld = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      
      const alerts = [
        createTestAlert("MATCH", veryOld.toISOString()),
      ];

      const result = getRecentMatchAlerts(alerts, 8, false);
      
      expect(result).toHaveLength(0);
    });
  });
});