"use client";

interface ToggleFilterProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  description?: string;
}

export function ToggleFilter({ label, checked, onChange, description }: ToggleFilterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div
          className="text-sm"
          style={{
            color: "#E6EDF3",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          {label}
        </div>
        {description && (
          <div
            className="mt-0.5"
            style={{
              fontSize: 11,
              color: "#484F58",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            {description}
          </div>
        )}
      </div>

      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-all duration-200 focus-visible:outline-none"
        style={{
          width: 36,
          height: 20,
          padding: 2,
          background: checked ? "#1A7F37" : "#30363D",
          border: checked ? "1px solid rgba(57,211,83,0.3)" : "1px solid #484F58",
          boxShadow: checked ? "0 0 8px rgba(57,211,83,0.2)" : "none",
        }}
      >
        <span
          className="inline-block rounded-full shadow transition-all duration-200"
          style={{
            width: 14,
            height: 14,
            background: checked ? "#39D353" : "#8B949E",
            transform: checked ? "translateX(16px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}
