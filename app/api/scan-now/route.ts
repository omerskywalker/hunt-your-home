import { runScrapePipeline } from "@/lib/scrape-pipeline";

// No cron secret required — intended for manual UI-triggered scans.
// The cost of an unauthorized call is one Apify scrape run; acceptable
// for a single-user personal tool.
export async function POST() {
  try {
    const data = await runScrapePipeline();
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Scan-now pipeline error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
