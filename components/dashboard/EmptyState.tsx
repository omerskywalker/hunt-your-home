"use client";

import { motion } from "framer-motion";

const lines = [
  { prompt: true,  text: "hyh status" },
  { prompt: false, text: "◆ agent online" },
  { prompt: false, text: "◆ scanning zillow 4× daily" },
  { prompt: false, text: "◆ 0 matches found — waiting..." },
];

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] w-full"
    >
      {/* Terminal window */}
      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.08, duration: 0.25 }}
        className="max-w-sm w-full mx-auto rounded-xl overflow-hidden text-left"
        style={{ background: "#0D1510", border: "1px solid #21262D" }}
      >
        {/* macOS title bar */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5"
          style={{ background: "#141C16", borderBottom: "1px solid #21262D" }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
          <span
            className="ml-2 text-xs"
            style={{ color: "#8B949E", fontFamily: "var(--font-mono, monospace)" }}
          >
            hyh-agent — bash
          </span>
        </div>

        {/* Terminal body */}
        <div
          className="px-4 py-4 space-y-1.5"
          style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
        >
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.25 }}
            >
              {line.prompt ? (
                <span style={{ color: "#39D353" }}>
                  <span style={{ color: "#484F58" }}>$ </span>
                  {line.text}
                </span>
              ) : (
                <span style={{ color: "#E6EDF3" }}>{line.text}</span>
              )}
            </motion.p>
          ))}

          {/* Blinking cursor */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.35 }}
            className="flex items-center"
          >
            <span style={{ color: "#484F58", fontFamily: "var(--font-mono, monospace)" }}>$ </span>
            <span
              className="inline-block w-2 h-[14px] bg-accent animate-pulse ml-1 rounded-sm align-middle"
              style={{ background: "#39D353" }}
            />
          </motion.p>
        </div>
      </motion.div>

      {/* Text below terminal */}
      <h3
        className="text-xl font-semibold text-center mt-6 mb-2"
        style={{ color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
      >
        No alerts yet.
      </h3>
      <p
        className="text-sm text-center max-w-xs mx-auto"
        style={{ color: "#8B949E", fontFamily: "var(--font-inter, sans-serif)" }}
      >
        Your agent is watching. New listings matching your criteria will appear here.
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#39D353", boxShadow: "0 0 4px #39D353" }}
        />
        <span
          className="text-xs"
          style={{ color: "#484F58", fontFamily: "var(--font-inter, sans-serif)" }}
        >
          agent active — scanning 4× daily
        </span>
      </div>
    </motion.div>
  );
}
