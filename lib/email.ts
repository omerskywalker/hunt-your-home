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
      console.error("Resend HOT alert error:", error);
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
    // Send individual emails for each MATCH listing
    const resend = getResend();
    const results = await Promise.all(
      listings.map((listing) =>
        resend.emails.send({
          from: FROM,
          to,
          subject: `✦ NEW MATCH: ${listing.address} — $${listing.price.toLocaleString()}`,
          react: AlertEmailTemplate({ listing, tier: "MATCH" }),
        })
      )
    );
    const hasError = results.some((r) => r.error);
    if (hasError) {
      console.error("Some match digest emails failed");
    }
    return !hasError;
  } catch (err) {
    console.error("sendMatchDigest failed:", err);
    return false;
  }
}
