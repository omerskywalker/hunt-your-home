import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HuntYourHome — AI-powered home alerts for Frisco, TX";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [interRegular, interBold, spaceGroteskBold] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff2").then((r) => r.arrayBuffer()),
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff2").then((r) => r.arrayBuffer()),
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@5.0.8/files/space-grotesk-latin-700-normal.woff2").then((r) => r.arrayBuffer()),
  ]);

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
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(57,211,83,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57,211,83,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
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
            background: "linear-gradient(90deg, #39D353 0%, rgba(57,211,83,0.3) 50%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(57,211,83,0.07) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 64px 64px 72px",
            width: 740,
            height: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <div
              style={{
                width: 46,
                height: 46,
                background: "#39D353",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#080C10", fontSize: 22, fontWeight: 800, fontFamily: "Space Grotesk" }}>
                H
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span style={{ color: "#8B949E", fontSize: 26, fontFamily: "Space Grotesk", fontWeight: 700 }}>Hunt</span>
              <span style={{ color: "#E6EDF3", fontSize: 26, fontFamily: "Space Grotesk", fontWeight: 700 }}>Your</span>
              <span style={{ color: "#39D353", fontSize: 26, fontFamily: "Space Grotesk", fontWeight: 700 }}>Home</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            <span style={{ fontSize: 60, fontWeight: 700, fontFamily: "Space Grotesk", color: "#E6EDF3", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Never miss a
            </span>
            <span style={{ fontSize: 60, fontWeight: 700, fontFamily: "Space Grotesk", color: "#39D353", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              great listing.
            </span>
          </div>

          {/* Subheadline */}
          <div style={{ display: "flex", marginBottom: 48 }}>
            <span style={{ fontSize: 20, color: "#8B949E", fontFamily: "Inter", letterSpacing: "-0.01em" }}>
              AI-powered Zillow monitoring for Frisco, TX — alerts 4× daily.
            </span>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 12, flexWrap: "nowrap" }}>
            {(
              [
                { label: "🔥 HOT Alerts",    color: "#FF6B35", bg: "rgba(255,107,53,0.1)",  border: "rgba(255,107,53,0.3)" },
                { label: "✦ AI Scoring",      color: "#39D353", bg: "rgba(57,211,83,0.08)", border: "rgba(57,211,83,0.25)" },
                { label: "⚡ 4× Daily Scans", color: "#58A6FF", bg: "rgba(88,166,255,0.08)",border: "rgba(88,166,255,0.25)" },
              ] as const
            ).map(({ label, color, bg, border }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontSize: 14,
                  fontWeight: 700,
                  color,
                  fontFamily: "Inter",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: mock listing card */}
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 60,
            bottom: 60,
            width: 296,
            background: "#161B22",
            border: "1px solid #21262D",
            borderTop: "2px solid #39D353",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Photo area */}
          <div
            style={{
              height: 148,
              background: "linear-gradient(135deg, #1C2430 0%, #0D1117 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 52, display: "flex" }}>🏠</span>

            {/* HOT badge */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                display: "flex",
                background: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.35)",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#FF6B35",
                fontFamily: "Inter",
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
                display: "flex",
                background: "rgba(57,211,83,0.1)",
                border: "1px solid rgba(57,211,83,0.3)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: "#39D353",
                fontFamily: "Inter",
              }}
            >
              AI 9/10
            </div>
          </div>

          {/* Card body */}
          <div style={{ display: "flex", flexDirection: "column", padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: "Space Grotesk", marginBottom: 2 }}>
              9124 Saddleridge Dr
            </div>
            <div style={{ display: "flex", fontSize: 11, color: "#484F58", fontFamily: "Inter", marginBottom: 12 }}>
              Frisco, TX 75035
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#39D353", fontFamily: "Space Grotesk", letterSpacing: "-0.03em", marginBottom: 10 }}>
              $589,000
            </div>

            <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#8B949E", fontFamily: "Inter", marginBottom: 12 }}>
              <span style={{ display: "flex" }}>4 bd</span>
              <span style={{ display: "flex", color: "#30363D" }}>·</span>
              <span style={{ display: "flex" }}>3 ba</span>
              <span style={{ display: "flex", color: "#30363D" }}>·</span>
              <span style={{ display: "flex" }}>2,480 sqft</span>
            </div>

            <div style={{ display: "flex", fontSize: 10, color: "#8B949E", fontFamily: "Inter", lineHeight: 1.5, marginBottom: 12 }}>
              $237/sqft — 12% below median. 3-car garage rare under $600k.
            </div>

            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  background: "rgba(57,211,83,0.06)",
                  border: "1px solid rgba(57,211,83,0.15)",
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: 9,
                  color: "#39D353",
                  fontFamily: "Inter",
                }}
              >
                3-car garage — rare under $600k
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter",         data: interRegular,    weight: 400, style: "normal" },
        { name: "Inter",         data: interBold,       weight: 700, style: "normal" },
        { name: "Space Grotesk", data: spaceGroteskBold, weight: 700, style: "normal" },
      ],
    }
  );
}
