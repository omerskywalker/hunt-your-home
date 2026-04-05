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
  const tierLabel = isHot ? "HOT ALERT" : "NEW MATCH";
  const previewText = `${tierLabel}: ${listing.address} — $${listing.price.toLocaleString()}`;

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
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Row>
              <Column style={{ verticalAlign: "middle" }}>
                <Row>
                  <Column style={{ width: 36, verticalAlign: "middle" }}>
                    <div style={styles.iconBox}>
                      <span style={styles.iconLetter}>H</span>
                    </div>
                  </Column>
                  <Column style={{ verticalAlign: "middle", paddingLeft: 10 }}>
                    <Text style={styles.logo}>
                      <span style={{ color: "#8B949E" }}>Hunt</span>
                      <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
                      <span style={{ color: "#39D353", fontWeight: 700 }}>Home</span>
                    </Text>
                  </Column>
                </Row>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    ...styles.tierBadge,
                    backgroundColor: isHot ? "#FF6B35" : "#58A6FF",
                  }}
                >
                  {tierLabel}
                </Text>
              </Column>
            </Row>
            <Text style={styles.headerSubtitle}>
              New listing found in {listing.address.split(",").slice(-2).join(",").trim()}
            </Text>
          </Section>

          {/* Photo */}
          <Section style={styles.photoSection}>
            <Img
              src={photoUrl}
              alt={listing.address}
              width="600"
              height="300"
              style={styles.photo}
            />
          </Section>

          {/* Address & Price */}
          <Section style={styles.addressSection}>
            <Heading style={styles.address}>{listing.address}</Heading>
            <Text style={{ ...styles.price, color: isHot ? "#39D353" : "#E6EDF3" }}>
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
                <Text style={styles.statValue}>{listing.sqft.toLocaleString()}</Text>
              </Column>
              <Column style={styles.statBox}>
                <Text style={styles.statLabel}>$/sqft</Text>
                <Text style={styles.statValue}>{pricePerSqft ? `$${pricePerSqft}` : "—"}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.divider} />

          {/* Highlights & Considerations */}
          <Section style={styles.aiSection}>
            {listing.aiHighlights.length > 0 && (
              <Section>
                <Text style={styles.aiSubTitle}>Highlights</Text>
                {listing.aiHighlights.map((h, i) => (
                  <Text key={i} style={styles.highlight}>+ {h}</Text>
                ))}
              </Section>
            )}
            {listing.aiConcerns.length > 0 && (
              <Section style={{ marginTop: "12px" }}>
                <Text style={styles.aiSubTitle}>Considerations</Text>
                {listing.aiConcerns.map((c, i) => (
                  <Text key={i} style={styles.concern}>- {c}</Text>
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
                  {listing.lotSizeSqft ? `${listing.lotSizeSqft.toLocaleString()} sqft` : "—"}
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
            <Button
              href={process.env.NEXT_PUBLIC_APP_URL ?? "https://hunt-your-home.vercel.app"}
              style={styles.ctaButtonSecondary}
            >
              Open Dashboard →
            </Button>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <span style={{ color: "#8B949E" }}>Hunt</span>
              <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
              <span style={{ color: "#39D353", fontWeight: 700 }}>Home</span>
            </Text>
            <Text style={styles.footerMuted}>
              You received this because a new listing matched your saved search criteria.{" "}
              <a
                href={process.env.NEXT_PUBLIC_APP_URL ?? "https://hunt-your-home.vercel.app"}
                style={{ color: "#39D353" }}
              >
                Manage preferences →
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#080E0A",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: "20px 0",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#141C16",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #21262D",
  },
  header: {
    backgroundColor: "#0D1510",
    padding: "24px 32px 16px",
    borderBottom: "1px solid #21262D",
  },
  iconBox: {
    display: "inline-block",
    width: 32,
    height: 32,
    backgroundColor: "#39D353",
    borderRadius: 7,
    textAlign: "center" as const,
    lineHeight: "32px",
  },
  iconLetter: {
    color: "#080E0A",
    fontSize: 16,
    fontWeight: 800,
    lineHeight: "32px",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#E6EDF3",
    margin: 0,
    letterSpacing: "-0.3px",
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
    color: "#484F58",
    fontSize: "13px",
    margin: "8px 0 0",
  },
  photoSection: {
    padding: 0,
  },
  photo: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
  },
  addressSection: {
    padding: "24px 32px 16px",
  },
  address: {
    color: "#E6EDF3",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px",
    lineHeight: "1.3",
  },
  price: {
    fontSize: "32px",
    fontWeight: "900",
    fontFamily: "'Space Grotesk', Inter, sans-serif",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  divider: {
    borderColor: "#21262D",
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
    color: "#484F58",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    fontWeight: "600",
    margin: "0 0 4px",
  },
  statValue: {
    color: "#E6EDF3",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  aiSection: {
    padding: "20px 32px",
  },
  aiSubTitle: {
    color: "#484F58",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    fontWeight: "600",
    margin: "0 0 8px",
  },
  highlight: {
    color: "#39D353",
    fontSize: "13px",
    margin: "0 0 4px",
  },
  concern: {
    color: "#FF6B35",
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
    color: "#484F58",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    fontWeight: "600",
    margin: "0 0 4px",
  },
  detailValue: {
    color: "#8B949E",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0,
  },
  ctaSection: {
    padding: "20px 32px",
    textAlign: "center" as const,
  },
  ctaButton: {
    backgroundColor: "#39D353",
    color: "#080E0A",
    padding: "14px 40px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
    marginBottom: "12px",
  },
  ctaButtonSecondary: {
    backgroundColor: "transparent",
    color: "#8B949E",
    padding: "12px 40px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
    border: "1px solid #30363D",
  },
  footer: {
    backgroundColor: "#0D1510",
    padding: "20px 32px",
    borderTop: "1px solid #21262D",
  },
  footerText: {
    fontSize: "13px",
    fontWeight: "500",
    margin: "0 0 8px",
  },
  footerMuted: {
    color: "#484F58",
    fontSize: "11px",
    lineHeight: "1.5",
    margin: 0,
  },
};

export default AlertEmailTemplate;
