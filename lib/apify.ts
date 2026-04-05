import { ZillowListing } from "./types";

const APIFY_BASE = "https://api.apify.com/v2";
// apify~zillow-scraper was removed; maxcopell~zillow-scraper is the active public actor
const ACTOR_ID = "maxcopell~zillow-scraper";

interface RawListing {
  // IDs
  id?: string;
  zpid?: string | number;
  // Address
  address?: string;
  streetAddress?: string;
  street_address?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  // Price — actor returns numeric unformattedPrice and string price like "$995,000"
  price?: number | string;
  unformattedPrice?: number;
  // Beds/baths
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  // Sqft — actor uses "area", older actors use "livingArea"
  area?: number;
  livingArea?: number;
  living_area?: number;
  sqft?: number;
  // Year built
  yearBuilt?: number;
  year_built?: number;
  // Lot
  lotAreaValue?: number;
  lot_area_value?: number;
  lotSizeSqft?: number;
  // HOA
  hoaMonthly?: number;
  hoa_monthly?: number;
  // Days on market — actor uses variableData for this; fall back to 0
  daysOnMarket?: number;
  days_on_market?: number;
  variableData?: { type?: string; text?: string };
  // Description
  description?: string;
  // Photos
  imgSrc?: string;
  img_src?: string;
  photos?: Array<{ url?: string; href?: string } | string>;
  // URL — actor uses "detailUrl"
  detailUrl?: string;
  hdpUrl?: string;
  hdp_url?: string;
  zillowUrl?: string;
  url?: string;
  // Status
  statusType?: string;
  status_type?: string;
  homeStatus?: string;
  // Price per sqft
  pricePerSquareFoot?: number;
  price_per_square_foot?: number;
  // Coordinates — actor nests these under latLong
  latitude?: number;
  longitude?: number;
  latLong?: { latitude?: number; longitude?: number };
}

function normalizeListings(raw: RawListing[]): ZillowListing[] {
  const results: ZillowListing[] = [];

  for (const item of raw) {
    try {
      const id = String(
        item.zpid ?? item.id ?? Math.random().toString(36).slice(2)
      );

      const address =
        item.address ??
        item.addressStreet ??
        item.streetAddress ??
        item.street_address ??
        [item.addressCity ?? item.city, item.addressState ?? item.state, item.addressZipcode ?? item.zipcode]
          .filter(Boolean).join(", ") ??
        "Unknown Address";

      // Prefer unformattedPrice (always a number); fall back to parsing string price
      const priceRaw = item.unformattedPrice ?? item.price ?? 0;
      const price =
        typeof priceRaw === "string"
          ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) || 0
          : priceRaw;

      const beds = item.bedrooms ?? item.beds ?? 0;
      const baths = item.bathrooms ?? item.baths ?? 0;
      // Actor uses "area"; older actors used "livingArea"
      const sqft = item.area ?? item.livingArea ?? item.living_area ?? item.sqft ?? 0;
      const yearBuilt = item.yearBuilt ?? item.year_built ?? 1990;
      const lotSizeSqft =
        item.lotAreaValue ?? item.lot_area_value ?? item.lotSizeSqft;
      const hoaMonthly = item.hoaMonthly ?? item.hoa_monthly;
      const daysOnMarket = item.daysOnMarket ?? item.days_on_market ?? 0;
      const description = item.description;

      // Photos
      const photoSources: string[] = [];
      if (item.imgSrc ?? item.img_src) {
        photoSources.push((item.imgSrc ?? item.img_src) as string);
      }
      if (Array.isArray(item.photos)) {
        for (const p of item.photos) {
          if (typeof p === "string") photoSources.push(p);
          else if (p.url) photoSources.push(p.url);
          else if (p.href) photoSources.push(p.href);
        }
      }

      // Actor uses "detailUrl"; older variants used hdpUrl / zillowUrl
      const zillowUrl =
        item.detailUrl ??
        item.hdpUrl ??
        item.hdp_url ??
        item.zillowUrl ??
        item.url ??
        `https://www.zillow.com/homes/${id}`;

      const statusRaw = (
        item.statusType ??
        item.status_type ??
        item.homeStatus ??
        "FOR_SALE"
      )
        .toUpperCase()
        .replace(/\s+/g, "_");

      const listingType: "FOR_SALE" | "PENDING" =
        statusRaw.includes("PENDING") ? "PENDING" : "FOR_SALE";

      const pricePerSqft =
        item.pricePerSquareFoot ??
        item.price_per_square_foot ??
        (sqft > 0 ? Math.round(price / sqft) : undefined);

      // Actor nests coordinates under latLong; fall back to top-level fields
      const latitude = item.latLong?.latitude ?? item.latitude;
      const longitude = item.latLong?.longitude ?? item.longitude;

      if (price <= 0 || sqft <= 0) continue;

      results.push({
        id,
        address,
        price,
        beds,
        baths,
        sqft,
        yearBuilt,
        lotSizeSqft,
        hoaMonthly,
        daysOnMarket,
        description,
        photos: photoSources,
        zillowUrl,
        listingType,
        pricePerSqft,
        latitude,
        longitude,
      });
    } catch {
      // skip malformed items
    }
  }

  return results;
}

/**
 * Build a Zillow search URL with searchQueryState required by the actor.
 * "Frisco, TX" → https://www.zillow.com/frisco-tx/?searchQueryState=...
 * filterState: ah=true (for sale), sort=days (newest first)
 */
function toZillowUrl(searchArea: string): string {
  const slug = searchArea
    .toLowerCase()
    .replace(/,\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  // mapBounds are required — Zillow returns 0 results without them.
  // These bounds cover Frisco TX (zip codes 75033/75034/75035).
  const searchQueryState = JSON.stringify({
    pagination: {},
    isMapVisible: true,
    mapBounds: {
      west: -96.9697,
      east: -96.6729,
      south: 33.0901,
      north: 33.2259,
    },
    filterState: {
      sort: { value: "days" },
      ah: { value: true },
    },
    isListVisible: true,
  });

  return `https://www.zillow.com/${slug}/?searchQueryState=${encodeURIComponent(searchQueryState)}`;
}

/**
 * Use Apify's run-sync-get-dataset-items endpoint.
 * Apify runs the actor and streams results back directly — no polling needed.
 * waitSecs tells Apify how long to hold the connection before timing out.
 */
async function runSyncAndFetchItems(searchArea: string): Promise<RawListing[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const url = new URL(
    `${APIFY_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", token);
  url.searchParams.set("clean", "true");
  url.searchParams.set("limit", "200");
  url.searchParams.set("waitSecs", "280");

  const zillowUrl = toZillowUrl(searchArea);
  console.log("Apify: scraping", zillowUrl);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchUrls: [{ url: zillowUrl }],
      maxItems: 100,
      extractionMethod: "MAP_MARKERS",
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "(unreadable)");
    console.error(`Apify sync ${response.status}:`, errBody);
    return [];
  }

  return response.json() as Promise<RawListing[]>;
}

export async function runZillowScraper(
  searchArea: string
): Promise<ZillowListing[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn("APIFY_API_TOKEN not set, returning mock data for development");
    return getMockListings();
  }

  try {
    const rawItems = await runSyncAndFetchItems(searchArea);
    return normalizeListings(rawItems);
  } catch (err) {
    console.error("Apify scraper error:", err);
    return [];
  }
}

function getMockListings(): ZillowListing[] {
  return [
    {
      id: "mock-001",
      address: "4521 Falcon Ridge Dr, Frisco, TX 75034",
      price: 589000,
      beds: 4,
      baths: 3,
      sqft: 2850,
      yearBuilt: 2015,
      lotSizeSqft: 7200,
      hoaMonthly: 75,
      daysOnMarket: 2,
      description:
        "Beautiful 4/3 in Frisco with updated kitchen, open floor plan, and 3-car garage.",
      photos: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
      ],
      zillowUrl: "https://www.zillow.com/homes/4521-Falcon-Ridge-Dr_rb/",
      listingType: "FOR_SALE",
      pricePerSqft: 207,
    },
    {
      id: "mock-002",
      address: "7803 Preston Meadows Pkwy, Frisco, TX 75035",
      price: 625000,
      beds: 5,
      baths: 4,
      sqft: 3200,
      yearBuilt: 2018,
      lotSizeSqft: 8500,
      hoaMonthly: 120,
      daysOnMarket: 1,
      description:
        "Stunning 5-bed home in master-planned community. Chef kitchen, game room, media room.",
      photos: [
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
      ],
      zillowUrl: "https://www.zillow.com/homes/7803-Preston-Meadows_rb/",
      listingType: "FOR_SALE",
      pricePerSqft: 195,
    },
    {
      id: "mock-003",
      address: "2109 Arbor Glen Dr, Frisco, TX 75033",
      price: 498000,
      beds: 3,
      baths: 2.5,
      sqft: 2100,
      yearBuilt: 2008,
      lotSizeSqft: 6000,
      hoaMonthly: 55,
      daysOnMarket: 5,
      description: "Well-maintained 3/2.5 in established neighborhood. New roof 2022.",
      photos: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      ],
      zillowUrl: "https://www.zillow.com/homes/2109-Arbor-Glen_rb/",
      listingType: "FOR_SALE",
      pricePerSqft: 237,
    },
  ];
}
