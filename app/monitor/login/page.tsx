import { verifyPin } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#080E0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#141C16",
          border: "1px solid #21262D",
          borderTop: "2px solid #39D353",
          borderRadius: 16,
          padding: "32px 28px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#39D353",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "#080E0A",
              fontFamily: "var(--font-space-grotesk, sans-serif)",
              flexShrink: 0,
            }}
          >
            H
          </div>
          <span style={{ fontSize: 15, color: "#8B949E" }}>
            <span style={{ color: "#8B949E" }}>Hunt</span>
            <span style={{ color: "#E6EDF3", fontWeight: 700 }}>Your</span>
            <span style={{ color: "#39D353", fontWeight: 700 }}>Home</span>
            <span style={{ color: "#484F58", fontWeight: 400 }}> / monitor</span>
          </span>
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#E6EDF3",
            marginBottom: 6,
            fontFamily: "var(--font-space-grotesk, sans-serif)",
          }}
        >
          Enter PIN
        </h1>
        <p style={{ fontSize: 13, color: "#484F58", marginBottom: error ? 12 : 24 }}>
          This area is restricted.
        </p>

        {error && (
          <div
            style={{
              background: "rgba(255,107,53,0.08)",
              border: "1px solid rgba(255,107,53,0.25)",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
              color: "#FF6B35",
              marginBottom: 16,
            }}
          >
            Incorrect PIN — try again.
          </div>
        )}

        <form action={verifyPin}>
          <input name="from" type="hidden" value={from ?? "/monitor/roadmap"} />
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              name="pin"
              placeholder="••••••"
              autoComplete="current-password"
              inputMode="numeric"
              required
              style={{
                width: "100%",
                background: "#0D1510",
                border: `1px solid ${error ? "rgba(255,107,53,0.4)" : "#21262D"}`,
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 18,
                letterSpacing: "0.3em",
                color: "#E6EDF3",
                fontFamily: "var(--font-inter, sans-serif)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#39D353",
              color: "#080E0A",
              border: "none",
              borderRadius: 8,
              padding: "11px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
