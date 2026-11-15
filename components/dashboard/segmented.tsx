"use client";

// Nút chọn kiểu phân đoạn (Thật / Mẫu, 7 / 30 / 90 ngày) trên Dashboard.


export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs text-muted-foreground uppercase">{label}</span>
      <div className="flex rounded-lg border border-line bg-surface p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-10 px-3 py-1 text-sm transition-colors md:min-h-0 ${
              o.value === value ? "bg-accent-soft font-medium text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
