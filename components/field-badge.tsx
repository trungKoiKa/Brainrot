import { fieldColorVar } from "@/lib/fields";

export function FieldBadge({ field }: { field: string | null }) {
  const color = `var(${fieldColorVar(field)})`;
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {field ?? "Chưa phân loại"}
    </span>
  );
}
