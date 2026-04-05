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
  getBookmarkIds,
  markBookmarkSold,
  pruneOldSeenIds,
} from "@/lib/storage";
import { AlertRecord, ScanRecord } from "@/lib/types";

export async function runScrapePipeline(): Promise<ScanRecord> {
  const startTime = Date.now();
  const scanId = uuidv4();
  let listingsFound = 0;
  let newListings = 0;
  let matchedListings = 0;
  let alertsSent = 0;

  try {
    const prefs = await getPreferences();
    const allListings = await runZillowScraper(prefs.searchArea);
    listingsFound = allListings.length;

    // Sold detection for bookmarked listings
    const bookmarkIds = await getBookmarkIds();
    if (bookmarkIds.size > 0) {
      const activeForSaleIds = new Set(
        allListings.filter((l) => l.listingType === "FOR_SALE").map((l) => l.id)
      );
      for (const zpid of bookmarkIds) {
        if (!activeForSaleIds.has(zpid)) {
          await markBookmarkSold(zpid);
        }
      }
    }

    const seenIds = await getSeenIds();
    await pruneOldSeenIds();
    const unseen = allListings.filter((l) => !seenIds.has(l.id));
    newListings = unseen.length;

    // Cap at 40 per run — prevents runaway AI costs on first run when seenIds is empty.
    // Listings are already sorted newest-first by Zillow (sort=days).
    const filtered = unseen.filter((l) => matchesHardFilters(l, prefs)).slice(0, 40);

    if (unseen.length > 0) {
      await addSeenIds(unseen.map((l) => l.id));
    }

    if (filtered.length === 0) {
      const scanRecord: ScanRecord = {
        id: scanId,
        runAt: new Date().toISOString(),
        listingsFound,
        newListings,
        matchedListings: 0,
        alertsSent: 0,
        durationMs: Date.now() - startTime,
      };
      await pushScanRecord(scanRecord);
      return scanRecord;
    }

    const scored = await batchScoreListings(filtered, prefs);
    const aboveThreshold = scored.filter((l) => l.aiScore >= prefs.scoreThreshold);
    matchedListings = aboveThreshold.length;

    const alertEmail = prefs.alertEmail || process.env.ALERT_EMAIL_TO || "";
    const hotListings = aboveThreshold.filter((l) => l.alertTier === "HOT");
    const matchListings = aboveThreshold.filter((l) => l.alertTier === "MATCH");

    const alertRecords: AlertRecord[] = [];

    if (alertEmail) {
      for (const listing of hotListings) {
        const delivered = await sendHotAlert(listing, alertEmail);
        if (delivered) alertsSent++;
        alertRecords.push({ id: uuidv4(), listing, sentAt: new Date().toISOString(), emailDelivered: delivered });
      }
      if (matchListings.length > 0) {
        const delivered = await sendMatchDigest(matchListings, alertEmail);
        if (delivered) alertsSent += matchListings.length;
        for (const listing of matchListings) {
          alertRecords.push({ id: uuidv4(), listing, sentAt: new Date().toISOString(), emailDelivered: delivered });
        }
      }
    } else {
      for (const listing of aboveThreshold) {
        alertRecords.push({ id: uuidv4(), listing, sentAt: new Date().toISOString(), emailDelivered: false });
      }
    }

    for (const record of alertRecords) {
      await pushAlertRecord(record);
    }

    const scanRecord: ScanRecord = {
      id: scanId,
      runAt: new Date().toISOString(),
      listingsFound,
      newListings,
      matchedListings,
      alertsSent,
      durationMs: Date.now() - startTime,
    };
    await pushScanRecord(scanRecord);
    return scanRecord;
  } catch (err) {
    const scanRecord: ScanRecord = {
      id: scanId,
      runAt: new Date().toISOString(),
      listingsFound,
      newListings,
      matchedListings,
      alertsSent,
      durationMs: Date.now() - startTime,
    };
    try { await pushScanRecord(scanRecord); } catch { /* ignore */ }
    throw err;
  }
}
