import {
  getAlertHistory,
  getScanHistory,
  getTodayScanCount,
  getSeenIdsCount,
  getLastScanRecord,
} from "@/lib/storage";

export async function GET() {
  try {
    const [alerts, scans, todayScans, seenCount, lastScan] = await Promise.all([
      getAlertHistory(),
      getScanHistory(),
      getTodayScanCount(),
      getSeenIdsCount(),
      getLastScanRecord(),
    ]);

    return Response.json({
      success: true,
      data: {
        alerts,
        scans,
        stats: {
          todayScans,
          seenCount,
          lastScan,
          totalAlerts: alerts.length,
          recentMatches: alerts.filter((a) => {
            const oneDayAgo = new Date(Date.now() - 86400000);
            return new Date(a.sentAt) > oneDayAgo;
          }).length,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/history error:", err);
    return Response.json(
      { success: false, error: "Failed to load history" },
      { status: 500 }
    );
  }
}
