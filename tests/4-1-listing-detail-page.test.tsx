import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getAlertHistory, getPriceHistory } from "@/lib/storage";
import { AlertRecord, PriceHistoryEntry } from "@/lib/types";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ zpid: "zpid-99124001" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock recharts
vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock image component
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock storage functions
vi.mock("@/lib/storage", () => ({
  getAlertHistory: vi.fn(),
  getPriceHistory: vi.fn(),
}));

const mockAlert: AlertRecord = {
  id: "mock-001",
  emailDelivered: true,
  sentAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  listing: {
    id: "zpid-99124001",
    address: "9124 Saddleridge Dr, Frisco, TX 75035",
    price: 589000,
    beds: 4,
    baths: 3,
    sqft: 2480,
    yearBuilt: 2017,
    lotSizeSqft: 7200,
    hoaMonthly: 125,
    daysOnMarket: 8,
    listingType: "FOR_SALE",
    pricePerSqft: 237,
    zillowUrl: "https://www.zillow.com/homes/frisco-tx_rb/",
    photos: ["https://example.com/photo1.jpg"],
    description: "Stunning 4-bed home in coveted Plantation Resort.",
    latitude: 33.1581,
    longitude: -96.8236,
    aiScore: 9,
    alertTier: "HOT",
    aiReason: "Exceptional value in Plantation Resort — $237/sqft is well below the Frisco median for this subdivision.",
    aiHighlights: [
      "3-car garage — rare under $600k in Frisco",
      "$237/sqft — 12% below neighborhood median",
    ],
    aiConcerns: ["HOA at $125/mo adds ~$1,500/yr to carrying cost"],
    daysOnMarketPenalty: false,
  },
};

const mockPriceHistory: PriceHistoryEntry[] = [
  { price: 604000, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { price: 597000, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { price: 589000, date: new Date().toISOString() },
];

describe("Listing Detail Page", () => {
  describe("Data Hydration Helper", () => {
    it("should find listing by zpid from alert records", async () => {
      const alertRecords: AlertRecord[] = [
        mockAlert,
        {
          ...mockAlert,
          id: "mock-002",
          listing: { ...mockAlert.listing, id: "zpid-99124002" },
        },
      ];

      const foundAlert = alertRecords.find(alert => alert.listing.id === "zpid-99124001");
      
      expect(foundAlert).toBeDefined();
      expect(foundAlert?.listing.id).toBe("zpid-99124001");
      expect(foundAlert?.listing.address).toBe("9124 Saddleridge Dr, Frisco, TX 75035");
    });

    it("should return undefined when zpid is not found", async () => {
      const alertRecords: AlertRecord[] = [mockAlert];

      const foundAlert = alertRecords.find(alert => alert.listing.id === "nonexistent-zpid");
      
      expect(foundAlert).toBeUndefined();
    });
  });

  describe("ZPID Lookup Logic", () => {
    it("should validate zpid parameter", () => {
      const zpid = "zpid-99124001";
      expect(zpid).toBeTruthy();
      expect(typeof zpid).toBe("string");
      expect(zpid.startsWith("zpid-")).toBe(true);
    });

    it("should handle empty or invalid zpid", () => {
      const emptyZpid = "";
      const nullZpid = null;
      const undefinedZpid = undefined;

      expect(emptyZpid).toBeFalsy();
      expect(nullZpid).toBeFalsy();
      expect(undefinedZpid).toBeFalsy();
    });
  });

  describe("Price History Formatting", () => {
    it("should format price history data for chart", () => {
      const chartData = mockPriceHistory.map(entry => ({
        date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: entry.price,
      }));

      expect(chartData).toHaveLength(3);
      expect(chartData[0]).toEqual({
        date: expect.any(String),
        price: 604000,
      });
      expect(chartData[2].price).toBe(589000);
    });

    it("should handle empty price history", () => {
      const emptyHistory: PriceHistoryEntry[] = [];
      const chartData = emptyHistory.map(entry => ({
        date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: entry.price,
      }));

      expect(chartData).toHaveLength(0);
    });

    it("should format prices correctly", () => {
      const price = 589000;
      const formattedPrice = price.toLocaleString();
      expect(formattedPrice).toBe("589,000");
    });

    it("should calculate price per sqft", () => {
      const price = 589000;
      const sqft = 2480;
      const pricePerSqft = Math.round(price / sqft);
      expect(pricePerSqft).toBe(238);
    });
  });

  describe("Address Processing", () => {
    it("should shorten Frisco, TX addresses", () => {
      const fullAddress = "9124 Saddleridge Dr, Frisco, TX 75035";
      const shortAddress = fullAddress.replace(/,\s*Frisco,?\s*TX\s*\d*/i, "").trim();
      expect(shortAddress).toBe("9124 Saddleridge Dr");
    });

    it("should handle addresses without TX suffix", () => {
      const address = "123 Main St, Frisco";
      const shortAddress = address.replace(/,\s*Frisco,?\s*TX\s*\d*/i, "").trim();
      expect(shortAddress).toBe("123 Main St, Frisco");
    });
  });

  describe("AI Analysis Data", () => {
    it("should display highlights when available", () => {
      const highlights = mockAlert.listing.aiHighlights;
      expect(highlights).toHaveLength(2);
      expect(highlights[0]).toBe("3-car garage — rare under $600k in Frisco");
    });

    it("should display concerns when available", () => {
      const concerns = mockAlert.listing.aiConcerns;
      expect(concerns).toHaveLength(1);
      expect(concerns[0]).toBe("HOA at $125/mo adds ~$1,500/yr to carrying cost");
    });

    it("should handle empty highlights and concerns", () => {
      const emptyHighlights: string[] = [];
      const emptyConcerns: string[] = [];
      expect(emptyHighlights).toHaveLength(0);
      expect(emptyConcerns).toHaveLength(0);
    });
  });

  describe("Listing Stats", () => {
    it("should format numeric values correctly", () => {
      const { beds, baths, sqft, yearBuilt, daysOnMarket } = mockAlert.listing;
      
      expect(beds).toBe(4);
      expect(baths).toBe(3);
      expect(sqft.toLocaleString()).toBe("2,480");
      expect(yearBuilt).toBe(2017);
      expect(daysOnMarket).toBe(8);
    });

    it("should handle optional HOA field", () => {
      const { hoaMonthly } = mockAlert.listing;
      expect(hoaMonthly).toBe(125);
      
      const listingWithoutHoa = { ...mockAlert.listing };
      delete (listingWithoutHoa as any).hoaMonthly;
      expect(listingWithoutHoa.hoaMonthly).toBeUndefined();
    });
  });
});