import { after } from "next/server";
import { runScrapePipeline } from "@/lib/scrape-pipeline";

// No cron secret required — intended for manual UI-triggered scans.
export async function POST() {
  // after() keeps the serverless function alive until the callback completes
  // even after the response has been sent. Without it, Vercel cuts the function
  // as soon as the response is returned, killing the pipeline mid-run.
  after(async () => {
    await runScrapePipeline().catch((err) => {
      console.error("Scan-now pipeline error:", err);
    });
  });

  return Response.json({ success: true, started: true }, { status: 202 });
}
