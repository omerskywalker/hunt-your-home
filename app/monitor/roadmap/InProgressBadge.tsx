"use client";

import { motion } from "framer-motion";

export function InProgressBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: "#58A6FF",
        background: "rgba(88,166,255,0.08)",
        border: "1px solid rgba(88,166,255,0.25)",
        borderRadius: 6,
        padding: "2px 8px",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      {/* Pulsing dot — matches ScanningBanner style */}
      <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0, display: "inline-flex" }}>
        <motion.span
          animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#58A6FF",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 2,
            borderRadius: "50%",
            background: "#58A6FF",
          }}
        />
      </span>
      In Progress
    </span>
  );
}
