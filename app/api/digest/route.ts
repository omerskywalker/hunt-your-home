import { after } from "next/server";
import { NextRequest } from "next/server";
import { getPreferences, getAlertHistory } from "@/lib/storage";
import { sendMatchDigest } from "@/lib/email";
import { AlertRecord, AIScoredListing } from "@/lib/types";

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

function getRecentMatchAlerts(
  alerts: AlertRecord[], 
  digestHour: number, 
  weeklyDigest: boolean
): AIScoredListing[] {
  const now = new Date();
  const cutoffDate = new Date();
  
  if (weeklyDigest) {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  }

  return alerts
    .filter(alert => {
      if (alert.listing.alertTier !== "MATCH") return false;
      if (!alert.emailDelivered) return false;
      
      const alertDate = new Date(alert.sentAt);
      return alertDate >= cutoffDate;
    })
    .map(alert => alert.listing);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    try {
      const prefs = await getPreferences();
      
      if (!prefs.alertEmail) {
        console.log("Digest: No alert email configured, skipping");
        return;
      }

      const alerts = await getAlertHistory();
      const matchAlerts = getRecentMatchAlerts(alerts, prefs.digestHour, prefs.weeklyDigest);

      if (matchAlerts.length === 0) {
        console.log("Digest: No recent MATCH alerts found, not sending digest");
        return;
      }

      const success = await sendMatchDigest(matchAlerts, prefs.alertEmail);
      
      if (success) {
        console.log(`Digest: Sent digest with ${matchAlerts.length} listings to ${prefs.alertEmail}`);
      } else {
        console.error("Digest: Failed to send digest email");
      }
    } catch (err) {
      console.error("Digest pipeline error:", err);
    }
  });

  return Response.json({ success: true, started: true }, { status: 202 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}