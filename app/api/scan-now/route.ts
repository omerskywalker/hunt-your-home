import { runScrapePipeline } from "@/lib/scrape-pipeline";

// No cron secret required — intended for manual UI-triggered scans.
export async function POST() {
  // Fire and forget — kick off the pipeline without blocking the response.
  // The scan can take 60-120s; holding the HTTP connection that long causes
  // browser timeouts and a poor UX. Results are stored in KV and visible
  // on next page load.
  void runScrapePipeline().catch((err) => {
    console.error("Scan-now pipeline error:", err);
  });

  return Response.json({ success: true, started: true }, { status: 202 });
}
