"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "react-day-picker/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay } from "@/lib/date";

/** "2026-12-06" → Date lúc 0h giờ máy (chỉ dùng để tô ngày trên lịch, không đổi múi giờ). */
function toDate(day: string): Date | undefined {
  if (!day) return undefined;
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Ô chọn deadline: nút mở lịch trong popover (mẫu ReUI c-calendar-24).
 * Giá trị vẫn gửi đi dạng "YYYY-MM-DD" qua input ẩn, giống <input type="date"> cũ.
 */
export function DeadlineField({
  value,
  onChange,
  triggerClass,
  name = "deadline",
  label = "Deadline",
}: {
  value: string;
  onChange: (v: string) => void;
  triggerClass: string;
  /** Tên input ẩn gửi kèm form; dùng lại cho "Ngày làm" (SPEC-v0.5) */
  name?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger
        render={
          // Nhãn đọc kèm ngày đã chọn (aria-label thay chữ hiển thị → phải tự ghép ngày vào)
          <button
            type="button"
            aria-label={value ? `${label}: ${formatDay(value)}` : label}
            className={`${triggerClass} inline-flex items-center gap-2`}
          />
        }
      >
        <span className={value ? "" : "text-muted-foreground"}>{value ? `${label === "Deadline" ? "" : `${label}: `}${formatDay(value)}` : label}</span>
        <CalendarIcon aria-hidden="true" className="size-4 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={vi}
          // "Th 2" của locale vi quá rộng cho ô 28px → "T2"…"CN"
          formatters={{ formatWeekdayName: (d) => (d.getDay() === 0 ? "CN" : `T${d.getDay() + 1}`) }}
          selected={toDate(value)}
          defaultMonth={toDate(value)}
          onSelect={(d) => pick(d ? format(d, "yyyy-MM-dd") : "")}
        />
        {value && (
          <button
            type="button"
            onClick={() => pick("")}
            className="mx-2.5 mb-2.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Bỏ {label.toLowerCase()}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
