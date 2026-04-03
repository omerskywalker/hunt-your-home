"use client";

interface ToggleFilterProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  description?: string;
}

export function ToggleFilter({
  label,
  checked,
  onChange,
  description,
}: ToggleFilterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-zinc-300">{label}</div>
        {description && (
          <div className="text-xs text-zinc-600 mt-0.5">{description}</div>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
          checked ? "bg-brand" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
