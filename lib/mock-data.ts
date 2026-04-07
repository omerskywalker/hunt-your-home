import { AlertRecord, ScanRecord } from "./types";

// ─── 5 real Frisco TX listings, 3bd/3ba+, under $650k ────────────────────────
// Photos: Unsplash residential/suburban exteriors

export const MOCK_ALERTS: AlertRecord[] = [
  {
    id: "mock-001",
    emailDelivered: true,
    sentAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 min ago
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
      photos: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      ],
      description:
        "Stunning 4-bed home in coveted Plantation Resort. Open-concept kitchen with quartz counters, stainless appliances, and oversized island. Primary suite has spa-like bath. Extended back patio perfect for entertaining. 3-car garage.",
      latitude: 33.1581,
      longitude: -96.8236,
      // AI fields
      aiScore: 9,
      alertTier: "HOT",
      aiReason:
        "Exceptional value in Plantation Resort — $237/sqft is well below the Frisco median for this subdivision. Only 8 days on market with a 3-car garage is rare under $600k.",
      aiHighlights: [
        "3-car garage — rare under $600k in Frisco",
        "$237/sqft — 12% below neighborhood median",
        "Corner lot with 7,200 sqft — larger than typical",
      ],
      aiConcerns: ["HOA at $125/mo adds ~$1,500/yr to carrying cost"],
      daysOnMarketPenalty: false,
    },
  },
  {
    id: "mock-002",
    emailDelivered: true,
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hrs ago
    listing: {
      id: "zpid-99124002",
      address: "6703 Mockingbird Ln, Frisco, TX 75034",
      price: 515000,
      beds: 3,
      baths: 3,
      sqft: 2150,
      yearBuilt: 2015,
      lotSizeSqft: 6100,
      hoaMonthly: 85,
      daysOnMarket: 3,
      listingType: "FOR_SALE",
      pricePerSqft: 239,
      zillowUrl: "https://www.zillow.com/homes/frisco-tx_rb/",
      photos: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
      ],
      description:
        "Move-in ready gem in Starwood. Freshly painted interior, updated kitchen with new hardware, and hand-scraped hardwood floors throughout main level. Private backyard with mature oaks. Walk to top-rated Frisco ISD schools.",
      latitude: 33.1502,
      longitude: -96.8451,
      aiScore: 8,
      alertTier: "HOT",
      aiReason:
        "Only 3 days on market at a strong price point for Starwood. Updated finishes and Frisco ISD proximity make this a fast mover — similar comps went under contract in under 7 days.",
      aiHighlights: [
        "3 DOM — likely to go under contract this weekend",
        "Frisco ISD — some of the highest-rated schools in Texas",
        "Updated kitchen & hardwoods — move-in ready, no immediate capex",
      ],
      aiConcerns: [],
      daysOnMarketPenalty: false,
    },
  },
  {
    id: "mock-003",
    emailDelivered: true,
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hrs ago
    listing: {
      id: "zpid-99124003",
      address: "4012 Westgate Dr, Frisco, TX 75033",
      price: 627000,
      beds: 4,
      baths: 3.5,
      sqft: 2950,
      yearBuilt: 2021,
      lotSizeSqft: 6500,
      hoaMonthly: 0,
      daysOnMarket: 12,
      listingType: "FOR_SALE",
      pricePerSqft: 213,
      zillowUrl: "https://www.zillow.com/homes/frisco-tx_rb/",
      photos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      ],
      description:
        "Near-new 2021 build — no HOA in Frisco is extraordinarily rare. Modern open floor plan with 10-ft ceilings, chef's kitchen with double ovens, butler's pantry, and dedicated home office. Tankless water heater, spray foam insulation.",
      latitude: 33.1437,
      longitude: -96.8603,
      aiScore: 7,
      alertTier: "MATCH",
      aiReason:
        "2021 build with no HOA is the headline here — that's genuinely uncommon in Frisco and saves $1,000–$2,400/yr vs comparable subdivisions. $213/sqft for a 3-year-old home is solid.",
      aiHighlights: [
        "NO HOA — saves $1,000–$2,400/yr vs comparable Frisco homes",
        "2021 build — still under builder warranty period",
        "$213/sqft — great value for 2021 construction",
      ],
      aiConcerns: [
        "12 days on market — worth understanding why it hasn't moved faster",
      ],
      daysOnMarketPenalty: false,
    },
  },
  {
    id: "mock-004",
    emailDelivered: true,
    sentAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), // 11 hrs ago
    listing: {
      id: "zpid-99124004",
      address: "2845 Newcastle Dr, Frisco, TX 75036",
      price: 498000,
      beds: 3,
      baths: 3,
      sqft: 2100,
      yearBuilt: 2014,
      lotSizeSqft: 5800,
      hoaMonthly: 150,
      daysOnMarket: 21,
      listingType: "FOR_SALE",
      pricePerSqft: 237,
      zillowUrl: "https://www.zillow.com/homes/frisco-tx_rb/",
      photos: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
      ],
      description:
        "Lawler Park beauty with community amenities including resort-style pool, fitness center, and miles of walking trails. Updated bathrooms (2022), new HVAC (2023), and fresh exterior paint. Backs to greenbelt.",
      latitude: 33.1348,
      longitude: -96.8715,
      aiScore: 6,
      alertTier: "MATCH",
      aiReason:
        "Recent major mechanicals (HVAC 2023, baths 2022) reduce short-term maintenance risk. Greenbelt backing adds privacy and long-term value. 21 DOM suggests room for negotiation.",
      aiHighlights: [
        "New HVAC 2023 + updated baths 2022 — low near-term repair risk",
        "Backs to greenbelt — privacy and no rear neighbors",
        "21 DOM — seller likely motivated, negotiate below ask",
      ],
      aiConcerns: [
        "HOA at $150/mo is on the higher end for this price tier",
        "2014 build — roof and major systems approaching 10-yr mark",
      ],
      daysOnMarketPenalty: false,
    },
  },
  {
    id: "mock-005",
    emailDelivered: true,
    sentAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // yesterday
    listing: {
      id: "zpid-99124005",
      address: "7721 Colby Ridge Rd, Frisco, TX 75035",
      price: 643000,
      beds: 5,
      baths: 4,
      sqft: 3280,
      yearBuilt: 2013,
      lotSizeSqft: 8400,
      hoaMonthly: 200,
      daysOnMarket: 5,
      listingType: "FOR_SALE",
      pricePerSqft: 196,
      zillowUrl: "https://www.zillow.com/homes/frisco-tx_rb/",
      photos: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      ],
      description:
        "Exceptional 5-bedroom in Newman Village with media room, game room, and dedicated study. Remodeled kitchen with Carrara marble, farmhouse sink, and commercial-grade range. Resort backyard with pool, spa, and covered outdoor kitchen.",
      latitude: 33.1655,
      longitude: -96.8128,
      aiScore: 9,
      alertTier: "HOT",
      aiReason:
        "Pool + outdoor kitchen at $196/sqft for a 5/4 in Newman Village is exceptional — pool homes in this area routinely list at $220–$240/sqft. The game room and media room are high-demand features for families.",
      aiHighlights: [
        "$196/sqft with pool & outdoor kitchen — rare value",
        "5 beds + game room + media room — maximum usable space",
        "8,400 sqft lot with pool — premium outdoor living",
      ],
      aiConcerns: [
        "HOA $200/mo — highest in this batch, verify what's included",
      ],
      daysOnMarketPenalty: false,
    },
  },
];

export const MOCK_SCAN: ScanRecord = {
  id: "mock-scan-001",
  runAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  listingsFound: 47,
  newListings: 12,
  matchedListings: 5,
  alertsSent: 5,
  durationMs: 14320,
};

export const MOCK_SCAN_HISTORY: ScanRecord[] = [
  {
    id: "mock-scan-003",
    runAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    listingsFound: 47,
    newListings: 12,
    matchedListings: 5,
    alertsSent: 5,
    durationMs: 14320,
  },
  {
    id: "mock-scan-002",
    runAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    listingsFound: 44,
    newListings: 3,
    matchedListings: 1,
    alertsSent: 1,
    durationMs: 11480,
  },
  {
    id: "mock-scan-001",
    runAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    listingsFound: 41,
    newListings: 0,
    matchedListings: 0,
    alertsSent: 0,
    durationMs: 9870,
  },
  {
    id: "mock-scan-y4",
    runAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    listingsFound: 39,
    newListings: 7,
    matchedListings: 2,
    alertsSent: 2,
    durationMs: 13210,
  },
  {
    id: "mock-scan-y3",
    runAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    listingsFound: 37,
    newListings: 1,
    matchedListings: 0,
    alertsSent: 0,
    durationMs: 8950,
  },
  {
    id: "mock-scan-y2",
    runAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    listingsFound: 36,
    newListings: 4,
    matchedListings: 1,
    alertsSent: 1,
    durationMs: 10340,
  },
  {
    id: "mock-scan-y1",
    runAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    listingsFound: 32,
    newListings: 0,
    matchedListings: 0,
    alertsSent: 0,
    durationMs: 8120,
  },
];

export const MOCK_STATS = {
  todayScans: 3,
  seenCount: 127,
  lastScan: MOCK_SCAN,
  totalAlerts: 5,
  recentMatches: 5,
};
