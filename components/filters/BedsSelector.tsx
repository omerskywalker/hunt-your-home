"use client";

interface BedsSelectorProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  options: Array<{ label: string; value: number }>;
}

export function BedsSelector({
  label,
  value,
  onChange,
  options,
}: BedsSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs text-zinc-400">min</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value === opt.value
                ? "bg-brand text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
            aria-label={`${label}: ${opt.label}`}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
