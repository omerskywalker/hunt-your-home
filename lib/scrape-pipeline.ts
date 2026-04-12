import { v4 as uuidv4 } from "uuid";
import { runZillowScraper } from "@/lib/apify";
import { batchScoreListings } from "@/lib/scorer";
import { matchesHardFilters, getHardFilterReason } from "@/lib/filters";
import { sendHotAlert, sendMatchDigest, sendHealthAlert, sendNtfyPush } from "@/lib/email";
import {
  getPreferences,
  getSeenIds,
  addSeenIds,
  pushAlertRecord,
  pushScanRecord,
  getBookmarkIds,
  markBookmarkSold,
  pruneOldSeenIds,
  getZeroScanStreak,
  incrementZeroScanStreak,
  resetZeroScanStreak,
  addPriceEntry,
  getLastPrice,
  calculatePriceDropPercentage,
  getDismissedIds,
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
    
    // Determine search areas: use searchAreas if populated, otherwise fallback to searchArea
    const searchAreas = prefs.searchAreas && prefs.searchAreas.length > 0 
      ? prefs.searchAreas 
      : [prefs.searchArea];
    
    // Run parallel searches for all areas
    const allResults = await Promise.all(
      searchAreas.map(area => runZillowScraper(area))
    );
    
    // Merge results and deduplicate by zpid, keeping first occurrence
    const seenZpids = new Set<string>();
    const allListings = allResults
      .flat()
      .filter(listing => {
        if (seenZpids.has(listing.id)) {
          return false;
        }
        seenZpids.add(listing.id);
        return true;
      });
      
    listingsFound = allListings.length;

    // Health monitoring: check for zero listings
    try {
      if (listingsFound === 0) {
        const streak = await incrementZeroScanStreak();
        if (streak >= 2) {
          const alertEmail = prefs.alertEmail || process.env.ALERT_EMAIL_TO || "";
          if (alertEmail) {
            await sendHealthAlert(alertEmail);
          }
        }
      } else {
        await resetZeroScanStreak();
      }
    } catch {
      // Health monitoring errors are non-fatal
    }

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

    // Price drop detection and tracking
    const priceDroppedIds = new Set<string>();
    for (const listing of allListings.filter((l) => l.listingType === "FOR_SALE")) {
      // Track price history for all listings
      await addPriceEntry(listing.id, listing.price);
      
      // Check for price drops
      const lastPrice = await getLastPrice(listing.id);
      if (lastPrice && lastPrice > listing.price) {
        const dropPercentage = calculatePriceDropPercentage(listing.price, lastPrice);
        if (dropPercentage >= 2) {
          priceDroppedIds.add(listing.id);
        }
      }
    }

    const seenIds = await getSeenIds();
    const dismissedIds = await getDismissedIds();
    await pruneOldSeenIds();
    const unseen = allListings.filter((l) => !seenIds.has(l.id));
    newListings = unseen.length;

    // Include unseen listings and price-dropped listings for scoring, but exclude dismissed listings
    const toScore = allListings.filter((l) => 
      (!seenIds.has(l.id) || priceDroppedIds.has(l.id)) && !dismissedIds.has(l.id)
    );

    // Build funnel data - track hard filter rejections
    const hardFilteredOut: Array<{zpid: string; reason: string}> = [];
    const toScoreAfterHardFilter: typeof toScore = [];
    
    for (const listing of toScore) {
      if (matchesHardFilters(listing, prefs)) {
        toScoreAfterHardFilter.push(listing);
      } else {
        const reason = getHardFilterReason(listing, prefs);
        if (reason) {
          hardFilteredOut.push({zpid: listing.id, reason});
        }
      }
    }

    // Cap at 40 per run — prevents runaway AI costs on first run when seenIds is empty.
    // Listings are already sorted newest-first by Zillow (sort=days).
    const filtered = toScoreAfterHardFilter.slice(0, 40);

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
        funnel: {
          found: listingsFound,
          deduped: toScore.length,
          hardFiltered: hardFilteredOut,
          scored: [],
          alerted: [],
        },
      };
      await pushScanRecord(scanRecord);
      return scanRecord;
    }

    const scored = await batchScoreListings(filtered, prefs);
    
    // Add price drop information to scored listings
    for (const listing of scored) {
      if (priceDroppedIds.has(listing.id)) {
        const lastPrice = await getLastPrice(listing.id);
        if (lastPrice && lastPrice > listing.price) {
          const dropAmount = lastPrice - listing.price;
          const dropPercentage = calculatePriceDropPercentage(listing.price, lastPrice);
          listing.priceDrop = {
            amount: dropAmount,
            percentage: dropPercentage,
          };
        }
      }
    }
    
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
        await sendNtfyPush(listing, prefs.ntfyTopic);
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

    // Build scored funnel data
    const scoredFunnelData = scored.map(listing => ({
      zpid: listing.id,
      score: listing.aiScore,
    }));
    
    // Build alerted array
    const alertedIds = aboveThreshold.map(listing => listing.id);

    const scanRecord: ScanRecord = {
      id: scanId,
      runAt: new Date().toISOString(),
      listingsFound,
      newListings,
      matchedListings,
      alertsSent,
      durationMs: Date.now() - startTime,
      funnel: {
        found: listingsFound,
        deduped: toScore.length,
        hardFiltered: hardFilteredOut,
        scored: scoredFunnelData,
        alerted: alertedIds,
      },
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
