"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ itemId }: { itemId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const router = useRouter();

  async function handleRetry() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/monitor/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Retry failed");
      setState("done");
      setTimeout(() => router.refresh(), 2000);
    } catch (err) {
      console.error(err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const label =
    state === "loading" ? "Re-queuing…" :
    state === "done"    ? "↺ Queued" :
    state === "error"   ? "Failed — retry" :
                          "↺ Retry Agent";

  const color = state === "error" ? "#FF6B35" : state === "done" ? "#39D353" : "#F0C040";

  return (
    <button
      onClick={() => void handleRetry()}
      disabled={state === "loading" || state === "done"}
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: `${color}10`,
        border: `1px solid ${color}40`,
        borderRadius: 6,
        padding: "3px 10px",
        cursor: state === "loading" || state === "done" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.6 : 1,
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      {label}
    </button>
  );
}
