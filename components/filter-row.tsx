"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Hàng chip lọc một lựa chọn ("Tất cả" + các giá trị). Dùng ở Tasks và Knowledge. */
export function FilterRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  onChange: (v: T | null) => void;
}) {
  const ALL = "__all";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 font-mono text-xs text-muted-foreground uppercase">{label}</span>
      <ToggleGroup
        aria-label={`Lọc theo ${label}`}
        variant="outline"
        size="sm"
        className="flex-wrap"
        value={[value ?? ALL]}
        onValueChange={(v: unknown[]) => {
          const next = v[0] as string | undefined;
          if (next === undefined) return; // bấm lại mục đang chọn: giữ nguyên
          onChange(next === ALL ? null : (next as T));
        }}
      >
        <ToggleGroupItem value={ALL} className="max-md:h-10 data-pressed:border-primary data-pressed:bg-accent-soft data-pressed:text-primary">
          Tất cả
        </ToggleGroupItem>
        {options.map((o) => (
          <ToggleGroupItem key={o} value={o} className="max-md:h-10 data-pressed:border-primary data-pressed:bg-accent-soft data-pressed:text-primary">
            {o}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
