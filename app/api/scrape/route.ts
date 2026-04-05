import { after } from "next/server";
import { NextRequest } from "next/server";
import { runScrapePipeline } from "@/lib/scrape-pipeline";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "development") return true;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === cronSecret) return true;

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    await runScrapePipeline().catch((err) => {
      console.error("Scrape pipeline error:", err);
    });
  });

  return Response.json({ success: true, started: true }, { status: 202 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
