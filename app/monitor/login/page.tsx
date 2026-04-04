import { verifyPin } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
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
        <p style={{ fontSize: 13, color: "#484F58", marginBottom: 24 }}>
          This area is restricted.
        </p>

        <PinForm />
      </div>
    </div>
  );
}

function PinForm() {
  return (
    <form action={verifyPin}>
      <input name="from" type="hidden" />
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
            border: "1px solid #21262D",
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
  );
}
