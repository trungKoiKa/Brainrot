"use client";

import { selectClass } from "@/components/form-bits";

/**
 * Ô chọn gốc của trình duyệt (bàn phím, trình đọc màn hình, điện thoại đều dùng sẵn) với kiểu chung của app.
 * Chưa chọn → chữ mờ như ô ngày trống, để không trông như đã chọn.
 */
export function NativeSelect({
  name,
  label,
  value,
  options,
  empty,
  labels,
  onChange,
  className = "",
}: {
  name?: string;
  label: string;
  value: string;
  options: readonly string[];
  /** Có → thêm lựa chọn rỗng ở đầu với nhãn này */
  empty?: string;
  /** Nhãn hiển thị khác giá trị (vd. id → tên) */
  labels?: Record<string, string>;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClass} ${value ? "" : "text-muted-foreground"} ${className}`}
    >
      {empty !== undefined && <option value="">{empty}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
