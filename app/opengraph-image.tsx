import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HuntYourHome — AI-powered home alerts for Frisco, TX";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const spaceGrotesk = await fetch(
    "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gozuPa5.woff2"
  ).then((res) => res.arrayBuffer());

  const inter = await fetch(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#080C10",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(57,211,83,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57,211,83,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #39D353 0%, rgba(57,211,83,0.2) 60%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Left glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(57,211,83,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "64px 80px",
            position: "relative",
          }}
        >
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#39D353",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#080C10",
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "Space Grotesk, sans-serif",
                  lineHeight: 1,
                }}
              >
                H
              </span>
            </div>
            <span
              style={{
                fontSize: 28,
                fontFamily: "Space Grotesk, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "#8B949E" }}>Hunt</span>
              <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
              <span style={{ color: "#39D353", fontWeight: 700 }}>Home</span>
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontFamily: "Space Grotesk, sans-serif",
              color: "#E6EDF3",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 24,
              maxWidth: 680,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Never miss a{" "}
            <span style={{ color: "#39D353", marginLeft: 16 }}>great listing</span>
            <span style={{ marginLeft: 16 }}>again.</span>
          </div>

          {/* Subheadline */}
          <div
            style={{
              fontSize: 22,
              color: "#8B949E",
              fontFamily: "Inter, sans-serif",
              marginBottom: 56,
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            AI-powered Zillow monitoring for Frisco, TX — alerts 4× daily.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "🔥 HOT Alerts",      bg: "rgba(255,107,53,0.1)",  border: "rgba(255,107,53,0.25)",  color: "#FF6B35" },
              { label: "✦ AI Scoring",        bg: "rgba(57,211,83,0.08)", border: "rgba(57,211,83,0.25)",   color: "#39D353" },
              { label: "⚡ 4× Daily Scans",   bg: "rgba(88,166,255,0.08)",border: "rgba(88,166,255,0.25)",  color: "#58A6FF" },
              { label: "🔖 Bookmark & Track", bg: "rgba(57,211,83,0.06)", border: "rgba(57,211,83,0.15)",   color: "#39D353" },
            ].map(({ label, bg, border, color }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  color,
                  fontFamily: "Inter, sans-serif",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — mock listing card */}
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 64,
            bottom: 64,
            width: 300,
            background: "#161B22",
            border: "1px solid #21262D",
            borderTop: "2px solid #39D353",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Mock photo */}
          <div
            style={{
              height: 140,
              background: "linear-gradient(135deg, #1C2430 0%, #0D1117 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 48,
                display: "flex",
              }}
            >
              🏠
            </div>
            {/* HOT badge */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#FF6B35",
                fontFamily: "Inter, sans-serif",
                display: "flex",
              }}
            >
              🔥 HOT
            </div>
            {/* Score badge */}
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(57,211,83,0.1)",
                border: "1px solid rgba(57,211,83,0.25)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: "#39D353",
                fontFamily: "Inter, sans-serif",
                display: "flex",
              }}
            >
              AI 9/10
            </div>
          </div>

          {/* Card content */}
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#E6EDF3",
                fontFamily: "Space Grotesk, sans-serif",
                marginBottom: 4,
                display: "flex",
              }}
            >
              9124 Saddleridge Dr
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#484F58",
                fontFamily: "Inter, sans-serif",
                marginBottom: 12,
                display: "flex",
              }}
            >
              Frisco, TX 75035
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "#39D353",
                fontFamily: "Space Grotesk, sans-serif",
                letterSpacing: "-0.03em",
                marginBottom: 12,
                display: "flex",
              }}
            >
              $589,000
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: 10,
                fontSize: 11,
                color: "#8B949E",
                fontFamily: "Inter, sans-serif",
                marginBottom: 14,
              }}
            >
              <span style={{ display: "flex" }}>4 bd</span>
              <span style={{ color: "#30363D", display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>3 ba</span>
              <span style={{ color: "#30363D", display: "flex" }}>·</span>
              <span style={{ display: "flex" }}>2,480 sqft</span>
            </div>

            {/* AI reason */}
            <div
              style={{
                fontSize: 10,
                color: "#8B949E",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.5,
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              $237/sqft — 12% below neighborhood median. 3-car garage rare under $600k.
            </div>

            {/* Highlight tag */}
            <div style={{ marginTop: 12, display: "flex" }}>
              <div
                style={{
                  background: "rgba(57,211,83,0.06)",
                  border: "1px solid rgba(57,211,83,0.15)",
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: 9,
                  color: "#39D353",
                  fontFamily: "Inter, sans-serif",
                  display: "flex",
                }}
              >
                3-car garage — rare under $600k
              </div>
            </div>
          </div>
        </div>

        {/* Bottom border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "#21262D",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: spaceGrotesk, weight: 700 },
        { name: "Inter", data: inter, weight: 400 },
        { name: "Inter", data: inter, weight: 600 },
      ],
    }
  );
}
