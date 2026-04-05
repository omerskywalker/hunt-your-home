import { after } from "next/server";
import { runScrapePipeline } from "@/lib/scrape-pipeline";
import { checkScanRateLimit, incrementScanRateLimit } from "@/lib/storage";

// No cron secret required — intended for manual UI-triggered scans.
export async function POST() {
  // Check rate limit first
  const rateLimit = await checkScanRateLimit();
  
  if (!rateLimit.allowed) {
    return Response.json(
      {
        success: false,
        error: "Rate limit reached",
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
      { status: 429 }
    );
  }

  // Increment the counter
  await incrementScanRateLimit();

  // after() keeps the serverless function alive until the callback completes
  // even after the response has been sent. Without it, Vercel cuts the function
  // as soon as the response is returned, killing the pipeline mid-run.
  after(async () => {
    await runScrapePipeline().catch((err) => {
      console.error("Scan-now pipeline error:", err);
    });
  });

  const updatedRateLimit = await checkScanRateLimit();
  return Response.json(
    {
      success: true,
      started: true,
      remaining: updatedRateLimit.remaining,
      resetAt: updatedRateLimit.resetAt,
    },
    { status: 202 }
  );
}
