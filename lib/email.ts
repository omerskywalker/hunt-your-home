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

export async function sendNtfyPush(
  listing: AIScoredListing,
  topic: string
): Promise<boolean> {
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) {
    return true;
  }

  try {
    const title = `🔥 HOT: ${listing.address}`;
    const message = `$${listing.price.toLocaleString()} • ${listing.beds}bd/${listing.baths}ba • ${listing.sqft} sqft • Score: ${listing.aiScore}/10`;
    
    const response = await fetch(`https://ntfy.sh/${trimmedTopic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        priority: 'urgent',
        tags: ['house'],
      }),
    });

    if (!response.ok) {
      console.error("ntfy push failed:", response.status, response.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendNtfyPush failed:", err);
    return false;
  }
}

export async function sendHealthAlert(to: string): Promise<boolean> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "⚠️ HuntYourHome Alert: Zillow Scraper Health Issue",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B35; margin-bottom: 20px;">⚠️ Scraper Health Alert</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            HuntYourHome has detected a potential issue with the Zillow scraper. 
            No new listings have been found in the last 2+ scans.
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This could indicate:
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.5;">
            <li>Apify service issues</li>
            <li>Zillow blocking our scraper</li>
            <li>Network connectivity problems</li>
            <li>Configuration changes needed</li>
          </ul>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Please check the application logs and monitoring dashboard for more details.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            <span style="color: #8B949E;">Hunt</span><span style="color: #E6EDF3; font-weight: 700;">Your</span><span style="color: #39D353; font-weight: 700;">Home</span> Health Monitoring
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Health alert email failed:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendHealthAlert failed:", err);
    return false;
  }
}
