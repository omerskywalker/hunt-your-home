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

interface DigestEmailTemplateProps {
  listings: AIScoredListing[];
}

function ListingCard({ listing }: { listing: AIScoredListing }) {
  const photoUrl =
    listing.photos?.[0] ??
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

  const pricePerSqft =
    listing.pricePerSqft ??
    (listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null);

  return (
    <Section style={cardStyles.card}>
      {/* Photo */}
      <Img
        src={photoUrl}
        alt={listing.address}
        width="536"
        height="240"
        style={cardStyles.photo}
      />

      {/* Address & price */}
      <Row style={{ padding: "16px 24px 0" }}>
        <Column>
          <Heading style={cardStyles.address}>{listing.address}</Heading>
          <Text style={cardStyles.price}>${listing.price.toLocaleString()}</Text>
        </Column>
      </Row>

      {/* Stats */}
      <Row style={{ padding: "12px 24px" }}>
        {[
          ["Beds", String(listing.beds)],
          ["Baths", String(listing.baths)],
          ["Sqft", listing.sqft.toLocaleString()],
          ["$/sqft", pricePerSqft ? `$${pricePerSqft}` : "—"],
        ].map(([label, value]) => (
          <Column key={label} style={cardStyles.statBox}>
            <Text style={cardStyles.statLabel}>{label}</Text>
            <Text style={cardStyles.statValue}>{value}</Text>
          </Column>
        ))}
      </Row>

      {/* Highlights */}
      {listing.aiHighlights.length > 0 && (
        <Section style={{ padding: "0 24px 12px" }}>
          {listing.aiHighlights.slice(0, 2).map((h, i) => (
            <Text key={i} style={cardStyles.highlight}>+ {h}</Text>
          ))}
        </Section>
      )}

      {/* CTA */}
      <Section style={{ padding: "0 24px 20px" }}>
        <Button href={listing.zillowUrl} style={cardStyles.ctaButton}>
          View on Zillow →
        </Button>
      </Section>
    </Section>
  );
}

export function DigestEmailTemplate({ listings }: DigestEmailTemplateProps) {
  const count = listings.length;
  const previewText =
    count === 1
      ? `New match: ${listings[0].address} — $${listings[0].price.toLocaleString()}`
      : `${count} new listings matched your search in Frisco, TX`;

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
                <Text style={styles.badge}>
                  {count} NEW {count === 1 ? "MATCH" : "MATCHES"}
                </Text>
              </Column>
            </Row>
            <Text style={styles.subtitle}>
              {count === 1
                ? "A new listing matched your saved search"
                : `${count} new listings matched your saved search in Frisco, TX`}
            </Text>
          </Section>

          {/* Listing cards */}
          {listings.map((listing, i) => (
            <Section key={listing.id}>
              <ListingCard listing={listing} />
              {i < listings.length - 1 && <Hr style={styles.divider} />}
            </Section>
          ))}

          {/* Footer */}
          <Section style={styles.footer}>
            <Button
              href={process.env.NEXT_PUBLIC_APP_URL ?? "https://hunt-your-home.vercel.app"}
              style={styles.dashboardButton}
            >
              Open Dashboard →
            </Button>
            <Text style={styles.footerText}>
              <span style={{ color: "#39D353" }}>Hunt</span>
              <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
              <span style={{ color: "#39D353" }}>Home</span>
            </Text>
            <Text style={styles.footerMuted}>
              You received this because new listings matched your saved search criteria.{" "}
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
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#080E0A",
    backgroundColor: "#39D353",
    margin: 0,
  },
  subtitle: {
    color: "#484F58",
    fontSize: "13px",
    margin: "8px 0 0",
  },
  divider: {
    borderColor: "#21262D",
    margin: "0 32px",
  },
  footer: {
    backgroundColor: "#0D1510",
    padding: "24px 32px",
    borderTop: "1px solid #21262D",
    textAlign: "center" as const,
  },
  dashboardButton: {
    backgroundColor: "transparent",
    color: "#39D353",
    padding: "10px 28px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
    border: "1px solid #39D353",
    marginBottom: "16px",
  },
  footerText: {
    color: "#8B949E",
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

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    padding: "0",
  },
  photo: {
    width: "100%",
    height: "240px",
    objectFit: "cover",
    display: "block",
  },
  address: {
    color: "#E6EDF3",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 4px",
    lineHeight: "1.3",
  },
  price: {
    color: "#E6EDF3",
    fontSize: "26px",
    fontWeight: "900",
    fontFamily: "'Space Grotesk', Inter, sans-serif",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  statBox: {
    textAlign: "center" as const,
    padding: "0 8px",
  },
  statLabel: {
    color: "#484F58",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    fontWeight: "600",
    margin: "0 0 2px",
  },
  statValue: {
    color: "#E6EDF3",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  },
  highlight: {
    color: "#39D353",
    fontSize: "12px",
    margin: "0 0 3px",
  },
  ctaButton: {
    backgroundColor: "#39D353",
    color: "#080E0A",
    padding: "10px 28px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-block",
  },
};

export default DigestEmailTemplate;
