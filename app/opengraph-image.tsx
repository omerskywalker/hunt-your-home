import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HuntYourHome — AI-powered home alerts for Frisco, TX";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [interRegular, interBold, spaceGroteskBold, houseImg] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff2").then((r) => r.arrayBuffer()),
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff2").then((r) => r.arrayBuffer()),
    fetch("https://cdn.jsdelivr.net/npm/@fontsource/space-grotesk@5.0.8/files/space-grotesk-latin-700-normal.woff2").then((r) => r.arrayBuffer()),
    fetch("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80").then((r) => r.arrayBuffer()),
  ]);

  const houseBase64 = Buffer.from(houseImg).toString("base64");
  const houseSrc = `data:image/jpeg;base64,${houseBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#080C10",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Inter",
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
            background: "linear-gradient(90deg, #39D353 0%, rgba(57,211,83,0.4) 60%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Subtle top-left glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(57,211,83,0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "52px 48px 52px 64px",
            width: 620,
            height: "100%",
          }}
        >
          {/* Logo — matches header: Hunt(gray) Your(white) Home(green) */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
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
              <span style={{ color: "#080C10", fontSize: 24, fontWeight: 800, fontFamily: "Space Grotesk" }}>
                H
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ color: "#8B949E", fontSize: 32, fontFamily: "Space Grotesk", fontWeight: 700 }}>Hunt</span>
              <span style={{ color: "#E6EDF3", fontSize: 32, fontFamily: "Space Grotesk", fontWeight: 700 }}>Your</span>
              <span style={{ color: "#39D353", fontSize: 32, fontFamily: "Space Grotesk", fontWeight: 700 }}>Home</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
            <span style={{ fontSize: 58, fontWeight: 700, fontFamily: "Space Grotesk", color: "#E6EDF3", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              Never miss a
            </span>
            <span style={{ fontSize: 58, fontWeight: 700, fontFamily: "Space Grotesk", color: "#39D353", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              great listing.
            </span>
          </div>

          {/* Terminal widget */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#0D1117",
              border: "1px solid #21262D",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 28,
            }}
          >
            {/* Terminal title bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#161B22",
                borderBottom: "1px solid #21262D",
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57", display: "flex" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E", display: "flex" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840", display: "flex" }} />
              </div>
              <span style={{ color: "#484F58", fontSize: 12, fontFamily: "Inter", marginLeft: 8 }}>hyh-agent — bash</span>
            </div>
            {/* Terminal body */}
            <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", gap: 6 }}>
              <div style={{ display: "flex" }}>
                <span style={{ color: "#39D353", fontSize: 13, fontFamily: "Inter" }}>$ hyh status</span>
              </div>
              {[
                "agent online — watching Frisco, TX",
                "scanning Zillow 4× daily for new listings",
                "every match scored by AI (gpt-4o-mini)",
                "alerts delivered straight to your inbox",
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#39D353", fontSize: 13, fontFamily: "Inter" }}>◆</span>
                  <span style={{ color: "#8B949E", fontSize: 13, fontFamily: "Inter" }}>{line}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ color: "#39D353", fontSize: 13, fontFamily: "Inter" }}>$</span>
                <div style={{ width: 8, height: 16, background: "#39D353", display: "flex" }} />
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 10 }}>
            {(
              [
                { label: "🔥 HOT Alerts",     color: "#FF6B35", bg: "rgba(255,107,53,0.1)",  border: "rgba(255,107,53,0.3)" },
                { label: "✦ AI Scoring",       color: "#39D353", bg: "rgba(57,211,83,0.08)", border: "rgba(57,211,83,0.25)" },
                { label: "⚡ 4× Daily Scans",  color: "#58A6FF", bg: "rgba(88,166,255,0.08)",border: "rgba(88,166,255,0.25)" },
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
                  padding: "8px 16px",
                  fontSize: 13,
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

        {/* ── RIGHT COLUMN: listing card ── */}
        <div
          style={{
            position: "absolute",
            right: 56,
            top: 48,
            bottom: 48,
            width: 440,
            background: "#161B22",
            border: "1px solid #21262D",
            borderTop: "2px solid #39D353",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* House photo */}
          <div
            style={{
              height: 220,
              display: "flex",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={houseSrc}
              alt="house"
              width={440}
              height={220}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
            {/* Dark overlay gradient at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background: "linear-gradient(transparent, rgba(22,27,34,0.8))",
                display: "flex",
              }}
            />
            {/* HOT badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                display: "flex",
                background: "rgba(255,107,53,0.18)",
                border: "1px solid rgba(255,107,53,0.4)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 13,
                fontWeight: 700,
                color: "#FF6B35",
                fontFamily: "Inter",
              }}
            >
              🔥 HOT
            </div>
            {/* AI score badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                display: "flex",
                background: "rgba(57,211,83,0.12)",
                border: "1px solid rgba(57,211,83,0.35)",
                borderRadius: 8,
                padding: "5px 12px",
                fontSize: 13,
                fontWeight: 700,
                color: "#39D353",
                fontFamily: "Inter",
              }}
            >
              AI 9/10
            </div>
          </div>

          {/* Card body */}
          <div style={{ display: "flex", flexDirection: "column", padding: "20px 24px", flex: 1 }}>
            {/* Address */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#E6EDF3", fontFamily: "Space Grotesk" }}>
                9124 Saddleridge Dr
              </span>
              <span style={{ fontSize: 13, color: "#484F58", fontFamily: "Inter", marginTop: 2 }}>
                Frisco, TX 75035
              </span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#39D353", fontFamily: "Space Grotesk", letterSpacing: "-0.03em" }}>
                $589,000
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {[["4", "beds"], ["3", "baths"], ["2,480", "sqft"]].map(([val, label]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#E6EDF3", fontFamily: "Space Grotesk" }}>{val}</span>
                  <span style={{ fontSize: 11, color: "#484F58", fontFamily: "Inter" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* AI insight */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(57,211,83,0.05)",
                border: "1px solid rgba(57,211,83,0.15)",
                borderRadius: 8,
                padding: "12px 14px",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#39D353", fontFamily: "Inter", letterSpacing: "0.05em" }}>
                AI HIGHLIGHTS
              </span>
              {["3-car garage — rare under $600k", "$237/sqft — 12% below median"].map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#39D353", display: "flex" }} />
                  <span style={{ fontSize: 12, color: "#8B949E", fontFamily: "Inter" }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter",         data: interRegular,     weight: 400, style: "normal" },
        { name: "Inter",         data: interBold,        weight: 700, style: "normal" },
        { name: "Space Grotesk", data: spaceGroteskBold, weight: 700, style: "normal" },
      ],
    }
  );
}
