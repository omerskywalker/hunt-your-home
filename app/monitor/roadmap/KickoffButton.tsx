"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function KickoffButton({ itemId, disabled }: { itemId: string; disabled: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const router = useRouter();

  if (disabled) return null;

  async function handleStart() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/monitor/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json() as { success?: boolean; prUrl?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Kickoff failed");
      setPrUrl(data.prUrl ?? null);
      setState("done");
      // Refresh server data after a short delay (KV write propagation)
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      console.error(err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done" && prUrl) {
    return (
      <a
        href={prUrl}
        target="_blank"
        rel="noopener"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#39D353",
          background: "rgba(57,211,83,0.1)",
          border: "1px solid rgba(57,211,83,0.3)",
          borderRadius: 6,
          padding: "3px 10px",
          textDecoration: "none",
          fontFamily: "var(--font-inter, sans-serif)",
        }}
      >
        ✓ PR opened →
      </a>
    );
  }

  return (
    <button
      onClick={() => void handleStart()}
      disabled={state === "loading"}
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: state === "error" ? "#FF6B35" : "#39D353",
        background: state === "error" ? "rgba(255,107,53,0.08)" : "rgba(57,211,83,0.08)",
        border: `1px solid ${state === "error" ? "rgba(255,107,53,0.3)" : "rgba(57,211,83,0.25)"}`,
        borderRadius: 6,
        padding: "3px 10px",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.6 : 1,
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      {state === "loading" ? "Starting…" : state === "error" ? "Failed — retry" : "▶ Start"}
    </button>
  );
}
