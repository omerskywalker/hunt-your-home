import { Resend } from "resend";
import { AIScoredListing } from "./types";
import { AlertEmailTemplate } from "@/components/email/AlertEmailTemplate";
import { DigestEmailTemplate } from "@/components/email/DigestEmailTemplate";

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
    const count = listings.length;
    const subject =
      count === 1
        ? `New Match: ${listings[0].address} — $${listings[0].price.toLocaleString()}`
        : `${count} New Matches in Frisco, TX`;

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      react: DigestEmailTemplate({ listings }),
    });

    if (error) {
      console.error("Match digest email failed:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendMatchDigest failed:", err);
    return false;
  }
}
