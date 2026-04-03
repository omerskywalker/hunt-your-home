import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { runZillowScraper } from "@/lib/apify";
import { batchScoreListings } from "@/lib/scorer";
import { matchesHardFilters } from "@/lib/filters";
import { sendHotAlert, sendMatchDigest } from "@/lib/email";
import {
  getPreferences,
  getSeenIds,
  addSeenIds,
  pushAlertRecord,
  pushScanRecord,
} from "@/lib/storage";
import { AlertRecord, ScanRecord } from "@/lib/types";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // Allow in development without secret
  if (!cronSecret && process.env.NODE_ENV === "development") return true;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Also allow explicit header form used by Vercel cron
  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === cronSecret) return true;

  return false;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const scanId = uuidv4();
  let listingsFound = 0;
  let newListings = 0;
  let matchedListings = 0;
  let alertsSent = 0;

  try {
    // 1. Load preferences
    const prefs = await getPreferences();

    // 2. Run Apify scraper
    const allListings = await runZillowScraper(prefs.searchArea);
    listingsFound = allListings.length;

    // 3. Deduplicate
    const seenIds = await getSeenIds();
    const unseen = allListings.filter((l) => !seenIds.has(l.id));
    newListings = unseen.length;

    // 4. Hard filters (FOR_SALE, price, beds, baths, sqft, yearBuilt, hoa)
    const filtered = unseen.filter((l) => matchesHardFilters(l, prefs));

    // 5. Mark ALL new listings as seen (even unmatched)
    if (unseen.length > 0) {
      await addSeenIds(unseen.map((l) => l.id));
    }

    if (filtered.length === 0) {
      const durationMs = Date.now() - startTime;
      const scanRecord: ScanRecord = {
        id: scanId,
        runAt: new Date().toISOString(),
        listingsFound,
        newListings,
        matchedListings: 0,
        alertsSent: 0,
        durationMs,
      };
      await pushScanRecord(scanRecord);
      return Response.json({ success: true, data: scanRecord });
    }

    // 6. AI score — filter by threshold
    const scored = await batchScoreListings(filtered, prefs);
    const aboveThreshold = scored.filter(
      (l) => l.aiScore >= prefs.scoreThreshold
    );
    matchedListings = aboveThreshold.length;

    // 7. Send emails and store alert records
    const alertEmail = prefs.alertEmail || process.env.ALERT_EMAIL_TO || "";
    const hotListings = aboveThreshold.filter((l) => l.alertTier === "HOT");
    const matchListings = aboveThreshold.filter((l) => l.alertTier === "MATCH");

    const alertRecords: AlertRecord[] = [];

    if (alertEmail) {
      // HOT alerts — individual emails
      for (const listing of hotListings) {
        const delivered = await sendHotAlert(listing, alertEmail);
        if (delivered) alertsSent++;
        alertRecords.push({
          id: uuidv4(),
          listing,
          sentAt: new Date().toISOString(),
          emailDelivered: delivered,
        });
      }

      // MATCH alerts — batch digest
      if (matchListings.length > 0) {
        const delivered = await sendMatchDigest(matchListings, alertEmail);
        if (delivered) alertsSent += matchListings.length;
        for (const listing of matchListings) {
          alertRecords.push({
            id: uuidv4(),
            listing,
            sentAt: new Date().toISOString(),
            emailDelivered: delivered,
          });
        }
      }
    } else {
      // No email — still record
      for (const listing of aboveThreshold) {
        alertRecords.push({
          id: uuidv4(),
          listing,
          sentAt: new Date().toISOString(),
          emailDelivered: false,
        });
      }
    }

    // 8. Store alert records
    for (const record of alertRecords) {
      await pushAlertRecord(record);
    }

    // 9. Store scan record
    const durationMs = Date.now() - startTime;
    const scanRecord: ScanRecord = {
      id: scanId,
      runAt: new Date().toISOString(),
      listingsFound,
      newListings,
      matchedListings,
      alertsSent,
      durationMs,
    };
    await pushScanRecord(scanRecord);

    return Response.json({ success: true, data: scanRecord });
  } catch (err) {
    console.error("Scrape pipeline error:", err);

    const durationMs = Date.now() - startTime;
    const scanRecord: ScanRecord = {
      id: scanId,
      runAt: new Date().toISOString(),
      listingsFound,
      newListings,
      matchedListings,
      alertsSent,
      durationMs,
    };

    // Try to save the failed scan record
    try {
      await pushScanRecord(scanRecord);
    } catch {
      // ignore
    }

    return Response.json(
      { success: false, error: String(err), data: scanRecord },
      { status: 500 }
    );
  }
}

// Allow GET for manual triggering in dev
export async function GET(request: NextRequest) {
  return POST(request);
}
