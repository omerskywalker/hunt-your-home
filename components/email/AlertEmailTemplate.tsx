import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { AIScoredListing } from "@/lib/types";

interface AlertEmailTemplateProps {
  listing: AIScoredListing;
  tier: "HOT" | "MATCH";
}

export function AlertEmailTemplate({ listing, tier }: AlertEmailTemplateProps) {
  const isHot = tier === "HOT";
  const tierLabel = isHot ? "🔥 HOT ALERT" : "✦ NEW MATCH";
  const previewText = `${tierLabel}: ${listing.address} — $${listing.price.toLocaleString()}`;

  const scoreColor =
    listing.aiScore >= 8
      ? "#f97316"
      : listing.aiScore >= 6
      ? "#71717a"
      : "#52525b";

  const photoUrl =
    listing.photos?.[0] ??
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

  const pricePerSqft =
    listing.pricePerSqft ??
    (listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        {/* Header */}
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Row>
              <Column>
                <Text style={styles.logo}>
                  <span style={{ color: "#f97316" }}>HYH</span>
                </Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    ...styles.tierBadge,
                    backgroundColor: isHot ? "#f97316" : "#3f3f46",
                  }}
                >
                  {tierLabel}
                </Text>
              </Column>
            </Row>
            <Text style={styles.headerSubtitle}>
              New listing found in Frisco, TX
            </Text>
          </Section>

          {/* Photo */}
          <Section style={styles.photoSection}>
            <Img
              src={photoUrl}
              alt={listing.address}
              width="600"
              height="320"
              style={styles.photo}
            />
          </Section>

          {/* Address & Price */}
          <Section style={styles.addressSection}>
            <Heading style={styles.address}>{listing.address}</Heading>
            <Text style={styles.price}>
              ${listing.price.toLocaleString()}
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Key Stats */}
          <Section style={styles.statsSection}>
            <Row>
              <Column style={styles.statBox}>
                <Text style={styles.statLabel}>Beds</Text>
                <Text style={styles.statValue}>{listing.beds}</Text>
              </Column>
              <Column style={styles.statBox}>
                <Text style={styles.statLabel}>Baths</Text>
                <Text style={styles.statValue}>{listing.baths}</Text>
              </Column>
              <Column style={styles.statBox}>
                <Text style={styles.statLabel}>Sqft</Text>
                <Text style={styles.statValue}>
                  {listing.sqft.toLocaleString()}
                </Text>
              </Column>
              <Column style={styles.statBox}>
                <Text style={styles.statLabel}>$/sqft</Text>
                <Text style={styles.statValue}>
                  {pricePerSqft ? `$${pricePerSqft}` : "—"}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.divider} />

          {/* AI Score */}
          <Section style={styles.aiSection}>
            <Row>
              <Column style={{ width: "80px" }}>
                <div
                  style={{
                    ...styles.scoreBadge,
                    backgroundColor: scoreColor,
                  }}
                >
                  <Text style={styles.scoreNumber}>{listing.aiScore}</Text>
                  <Text style={styles.scoreDenom}>/10</Text>
                </div>
              </Column>
              <Column>
                <Text style={styles.aiSectionTitle}>AI Analysis</Text>
                <Text style={styles.aiReason}>{listing.aiReason}</Text>
              </Column>
            </Row>

            {listing.aiHighlights.length > 0 && (
              <Section style={{ marginTop: "16px" }}>
                <Text style={styles.aiSubTitle}>Highlights</Text>
                {listing.aiHighlights.map((h, i) => (
                  <Text key={i} style={styles.highlight}>
                    ✓ {h}
                  </Text>
                ))}
              </Section>
            )}

            {listing.aiConcerns.length > 0 && (
              <Section style={{ marginTop: "12px" }}>
                <Text style={styles.aiSubTitle}>Considerations</Text>
                {listing.aiConcerns.map((c, i) => (
                  <Text key={i} style={styles.concern}>
                    ⚠ {c}
                  </Text>
                ))}
              </Section>
            )}
          </Section>

          <Hr style={styles.divider} />

          {/* Details Row */}
          <Section style={styles.detailsSection}>
            <Row>
              <Column style={styles.detailBox}>
                <Text style={styles.detailLabel}>Year Built</Text>
                <Text style={styles.detailValue}>{listing.yearBuilt}</Text>
              </Column>
              <Column style={styles.detailBox}>
                <Text style={styles.detailLabel}>Days on Market</Text>
                <Text style={styles.detailValue}>{listing.daysOnMarket}</Text>
              </Column>
              <Column style={styles.detailBox}>
                <Text style={styles.detailLabel}>HOA/mo</Text>
                <Text style={styles.detailValue}>
                  {listing.hoaMonthly ? `$${listing.hoaMonthly}` : "None"}
                </Text>
              </Column>
              <Column style={styles.detailBox}>
                <Text style={styles.detailLabel}>Lot Size</Text>
                <Text style={styles.detailValue}>
                  {listing.lotSizeSqft
                    ? `${listing.lotSizeSqft.toLocaleString()} sqft`
                    : "—"}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Button href={listing.zillowUrl} style={styles.ctaButton}>
              View on Zillow →
            </Button>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>Powered by HuntYourHome</Text>
            <Text style={styles.footerMuted}>
              You received this because a new listing matched your saved search
              criteria. To manage your preferences, visit your dashboard.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#0f0f0f",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: "20px 0",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#18181b",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #27272a",
  },
  header: {
    backgroundColor: "#0f0f0f",
    padding: "24px 32px 16px",
    borderBottom: "1px solid #27272a",
  },
  logo: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f97316",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  tierBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ffffff",
    margin: 0,
  },
  headerSubtitle: {
    color: "#71717a",
    fontSize: "13px",
    margin: "8px 0 0",
  },
  photoSection: {
    padding: 0,
  },
  photo: {
    width: "100%",
    height: "320px",
    objectFit: "cover",
    display: "block",
  },
  addressSection: {
    padding: "24px 32px 16px",
  },
  address: {
    color: "#f4f4f5",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px",
    lineHeight: "1.3",
  },
  price: {
    color: "#f97316",
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  divider: {
    borderColor: "#27272a",
    margin: "0 32px",
  },
  statsSection: {
    padding: "20px 32px",
  },
  statBox: {
    textAlign: "center" as const,
    padding: "0 8px",
  },
  statLabel: {
    color: "#71717a",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 4px",
  },
  statValue: {
    color: "#f4f4f5",
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
  },
  aiSection: {
    padding: "20px 32px",
  },
  aiSectionTitle: {
    color: "#f97316",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: "600",
    margin: "0 0 6px",
  },
  scoreBadge: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
  },
  scoreNumber: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    lineHeight: "1",
  },
  scoreDenom: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "10px",
    margin: 0,
  },
  aiReason: {
    color: "#a1a1aa",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: 0,
  },
  aiSubTitle: {
    color: "#71717a",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 8px",
  },
  highlight: {
    color: "#4ade80",
    fontSize: "13px",
    margin: "0 0 4px",
  },
  concern: {
    color: "#fbbf24",
    fontSize: "13px",
    margin: "0 0 4px",
  },
  detailsSection: {
    padding: "20px 32px",
  },
  detailBox: {
    textAlign: "center" as const,
    padding: "0 6px",
  },
  detailLabel: {
    color: "#71717a",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 4px",
  },
  detailValue: {
    color: "#d4d4d8",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
  },
  ctaSection: {
    padding: "20px 32px",
    textAlign: "center" as const,
  },
  ctaButton: {
    backgroundColor: "#f97316",
    color: "#ffffff",
    padding: "14px 40px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
  },
  footer: {
    backgroundColor: "#0f0f0f",
    padding: "20px 32px",
    borderTop: "1px solid #27272a",
  },
  footerText: {
    color: "#52525b",
    fontSize: "13px",
    fontWeight: "500",
    margin: "0 0 8px",
  },
  footerMuted: {
    color: "#3f3f46",
    fontSize: "11px",
    lineHeight: "1.5",
    margin: 0,
  },
};

export default AlertEmailTemplate;
