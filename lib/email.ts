import { Resend } from "resend";
import { AIScoredListing } from "./types";
import { AlertEmailTemplate } from "@/components/email/AlertEmailTemplate";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM = process.env.ALERT_EMAIL_FROM ?? "HuntYourHome <alerts@huntyourhome.app>";

export async function sendHotAlert(
  listing: AIScoredListing,
  to: string
): Promise<boolean> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `🔥 HOT ALERT: ${listing.address} — $${listing.price.toLocaleString()}`,
      react: AlertEmailTemplate({ listing, tier: "HOT" }),
    });
    if (error) {
      console.error("HOT alert email failed:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendHotAlert failed:", err);
    return false;
  }
}

export async function sendMatchDigest(
  listings: AIScoredListing[],
  to: string
): Promise<boolean> {
  if (listings.length === 0) return true;

  try {
    const resend = getResend();
    let allOk = true;

    // Send sequentially — Resend's free plan caps at 5 req/sec.
    // Promise.all across 7+ listings reliably hits the rate limit.
    for (const listing of listings) {
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `New Match: ${listing.address} — $${listing.price.toLocaleString()}`,
        react: AlertEmailTemplate({ listing, tier: "MATCH" }),
      });
      if (error) {
        console.error("Match email failed:", JSON.stringify(error));
        allOk = false;
      }
      // Brief pause to stay under rate limit
      await new Promise((r) => setTimeout(r, 250));
    }

    return allOk;
  } catch (err) {
    console.error("sendMatchDigest failed:", err);
    return false;
  }
}
