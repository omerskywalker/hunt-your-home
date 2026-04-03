import Anthropic from "@anthropic-ai/sdk";
import { ZillowListing, AIScoredListing, UserPreferences } from "./types";

const client = new Anthropic();

interface ScoreResult {
  score: number;
  reason: string;
  highlights: string[];
  concerns: string[];
}

const SYSTEM_PROMPT = `You are a real estate analyst helping a homebuyer in Frisco TX. Score listings 1-10 based on value for money, condition indicators, size, lot, HOA if any, days on market (lower = better), and general desirability. Be critical but fair. Respond ONLY with valid JSON matching this schema: { "score": number, "reason": string, "highlights": string[], "concerns": string[] }`;

function buildListingPrompt(
  listing: ZillowListing,
  prefs: UserPreferences
): string {
  return `Please score this Frisco TX home listing:

Address: ${listing.address}
Price: $${listing.price.toLocaleString()}
Beds: ${listing.beds} | Baths: ${listing.baths}
Sqft: ${listing.sqft.toLocaleString()} | Price/sqft: $${listing.pricePerSqft ?? Math.round(listing.price / listing.sqft)}/sqft
Year Built: ${listing.yearBuilt}
Days on Market: ${listing.daysOnMarket}
HOA: ${listing.hoaMonthly ? `$${listing.hoaMonthly}/mo` : "None"}
Lot Size: ${listing.lotSizeSqft ? `${listing.lotSizeSqft.toLocaleString()} sqft` : "Unknown"}
${listing.description ? `Description: ${listing.description}` : ""}

Buyer's preferences: max price $${prefs.maxPrice.toLocaleString()}, min ${prefs.minBeds} beds, min ${prefs.minSqft.toLocaleString()} sqft, built after ${prefs.minYearBuilt}.`;
}

async function scoreListingOnce(
  listing: ZillowListing,
  prefs: UserPreferences
): Promise<ScoreResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildListingPrompt(listing, prefs),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const text = content.text.trim();
  // Extract JSON — handle markdown code fences if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? null;
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonText) as ScoreResult;
}

export async function scoreListing(
  listing: ZillowListing,
  prefs: UserPreferences
): Promise<ScoreResult> {
  try {
    return await scoreListingOnce(listing, prefs);
  } catch {
    // Retry once
    try {
      return await scoreListingOnce(listing, prefs);
    } catch {
      return {
        score: 5,
        reason: "Unable to score this listing automatically.",
        highlights: [],
        concerns: ["Score unavailable — review manually."],
      };
    }
  }
}

export async function batchScoreListings(
  listings: ZillowListing[],
  prefs: UserPreferences,
  concurrency = 5
): Promise<AIScoredListing[]> {
  const results: AIScoredListing[] = [];

  for (let i = 0; i < listings.length; i += concurrency) {
    const batch = listings.slice(i, i + concurrency);
    const scored = await Promise.all(
      batch.map(async (listing) => {
        const scoreResult = await scoreListing(listing, prefs);
        const alertTier: "HOT" | "MATCH" =
          scoreResult.score >= prefs.hotScoreThreshold ? "HOT" : "MATCH";
        return {
          ...listing,
          aiScore: scoreResult.score,
          aiReason: scoreResult.reason,
          aiHighlights: scoreResult.highlights,
          aiConcerns: scoreResult.concerns,
          alertTier,
        } satisfies AIScoredListing;
      })
    );
    results.push(...scored);
  }

  return results;
}
