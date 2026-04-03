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

export function PriceRange({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceRangeProps) {
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
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Price Range
        </span>
        <span className="text-sm font-semibold text-zinc-100">
          {formatPrice(localMin)} — {formatPrice(localMax)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 w-6">Min</span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={localMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="flex-1"
            aria-label="Minimum price"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 w-6">Max</span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={localMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="flex-1"
            aria-label="Maximum price"
          />
        </div>
      </div>
    </div>
  );
}
