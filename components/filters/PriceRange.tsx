"use client";

import { useState } from "react";

interface PriceRangeProps {
  minPrice: number;
  maxPrice: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

function formatPrice(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${Math.round(val / 1000)}K`;
  return `$${val}`;
}

const MIN = 0;
const MAX = 2000000;
const STEP = 25000;

export function PriceRange({ minPrice, maxPrice, onMinChange, onMaxChange }: PriceRangeProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  function handleMinChange(val: number) {
    const clamped = Math.min(val, localMax - STEP);
    setLocalMin(clamped);
    onMinChange(clamped);
  }

  function handleMaxChange(val: number) {
    const clamped = Math.max(val, localMin + STEP);
    setLocalMax(clamped);
    onMaxChange(clamped);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: "#484F58",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          Price Range
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#39D353",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {formatPrice(localMin)} — {formatPrice(localMax)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 10,
              color: "#484F58",
              width: 24,
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            min
          </span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={localMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="custom-slider flex-1"
            aria-label="Minimum price"
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 10,
              color: "#484F58",
              width: 24,
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            max
          </span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={localMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="custom-slider flex-1"
            aria-label="Maximum price"
          />
        </div>
      </div>
    </div>
  );
}
