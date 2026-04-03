"use client";

interface BedsSelectorProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  options: Array<{ label: string; value: number }>;
}

export function BedsSelector({ label, value, onChange, options }: BedsSelectorProps) {
  return (
    <div className="space-y-2.5">
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
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#484F58",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          min
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="rounded-md transition-all duration-150"
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontFamily: "var(--font-inter, sans-serif)",
                cursor: "pointer",
                ...(selected
                  ? {
                      background: "#39D353",
                      color: "#080C10",
                      fontWeight: 600,
                      border: "1px solid #39D353",
                    }
                  : {
                      background: "#1C2430",
                      color: "#8B949E",
                      fontWeight: 400,
                      border: "1px solid #21262D",
                    }),
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363D";
                  (e.currentTarget as HTMLButtonElement).style.color = "#E6EDF3";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#21262D";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8B949E";
                }
              }}
              aria-label={`${label}: ${opt.label}`}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
