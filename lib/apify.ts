import { ZillowListing } from "./types";

const APIFY_BASE = "https://api.apify.com/v2";
// apify~zillow-scraper was removed; maxcopell~zillow-scraper is the active public actor
const ACTOR_ID = "maxcopell~zillow-scraper";

interface ApifyRun {
  id: string;
  status: string;
  defaultDatasetId: string;
}

interface RawListing {
  // camelCase variants
  id?: string;
  zpid?: string | number;
  address?: string;
  streetAddress?: string;
  street_address?: string;
  price?: number | string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  livingArea?: number;
  living_area?: number;
  sqft?: number;
  yearBuilt?: number;
  year_built?: number;
  lotAreaValue?: number;
  lot_area_value?: number;
  lotSizeSqft?: number;
  hoaMonthly?: number;
  hoa_monthly?: number;
  daysOnMarket?: number;
  days_on_market?: number;
  description?: string;
  imgSrc?: string;
  img_src?: string;
  photos?: Array<{ url?: string; href?: string } | string>;
  hdpUrl?: string;
  hdp_url?: string;
  zillowUrl?: string;
  url?: string;
  statusType?: string;
  status_type?: string;
  homeStatus?: string;
  pricePerSquareFoot?: number;
  price_per_square_foot?: number;
  latitude?: number;
  longitude?: number;
  // city/state for address construction
  city?: string;
  state?: string;
  zipcode?: string;
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
        item.streetAddress ??
        item.street_address ??
        [item.city, item.state, item.zipcode].filter(Boolean).join(", ") ??
        "Unknown Address";

      const priceRaw = item.price ?? 0;
      const price =
        typeof priceRaw === "string"
          ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) || 0
          : priceRaw;

      const beds = item.bedrooms ?? item.beds ?? 0;
      const baths = item.bathrooms ?? item.baths ?? 0;
      const sqft = item.livingArea ?? item.living_area ?? item.sqft ?? 0;
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

      const zillowUrl =
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
        latitude: item.latitude,
        longitude: item.longitude,
      });
    } catch {
      // skip malformed items
    }
  }

  return results;
}

/** Convert "Frisco, TX" → "https://www.zillow.com/frisco-tx/" */
function toZillowUrl(searchArea: string): string {
  const slug = searchArea
    .toLowerCase()
    .replace(/,\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://www.zillow.com/${slug}/`;
}

async function startApifyRun(
  actorId: string,
  searchArea: string
): Promise<ApifyRun | null> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const response = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        searchUrls: [{ url: toZillowUrl(searchArea) }],
        maxItems: 100,
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "(unreadable)");
    console.error(`Apify ${response.status} from ${actorId}:`, errBody);
    return null;
  }
  const json = await response.json() as { data: ApifyRun };
  return json.data;
}

async function pollRunCompletion(
  runId: string,
  timeoutMs = 120000
): Promise<string | null> {
  const token = process.env.APIFY_API_TOKEN;
  const interval = 3000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));

    const resp = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) continue;

    const json = await resp.json() as { data: ApifyRun };
    const run = json.data;

    if (run.status === "SUCCEEDED") return run.defaultDatasetId;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) return null;
  }

  return null;
}

async function fetchDatasetItems(datasetId: string): Promise<RawListing[]> {
  const token = process.env.APIFY_API_TOKEN;
  const resp = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?clean=true&limit=200`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!resp.ok) return [];
  return resp.json() as Promise<RawListing[]>;
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
    const run = await startApifyRun(ACTOR_ID, searchArea);
    if (!run) {
      console.error("Apify: failed to start actor run");
      return [];
    }

    const datasetId = await pollRunCompletion(run.id);
    if (!datasetId) {
      console.error("Apify: run did not complete successfully");
      return [];
    }

    const rawItems = await fetchDatasetItems(datasetId);
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
