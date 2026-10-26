"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setDayHabitsAction } from "@/app/actions/habits";
import { toggleHabit } from "@/lib/habits";

type Days = Record<string, string[]>;

/**
 * Thói quen đã làm theo ngày, tích là thấy ngay (cập nhật lạc quan).
 * Mỗi lần tích gửi **cả danh sách** của ngày đó; các lần gửi xếp hàng lần lượt → bấm nhanh nhiều ô không ghi đè lẫn nhau.
 * Lỗi → trả ngày đó về bản đã lưu gần nhất + báo lỗi.
 * Hàng đợi xong thì làm mới bộ nhớ đệm của trình duyệt, nếu không các trang đã tải sẵn (Mục tiêu, Dashboard) còn hiện bản cũ.
 */
export function useHabitDays(initial: Days) {
  const [days, setDays] = useState(initial);
  const current = useRef(initial);
  const saved = useRef(initial);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggle(day: string, name: string, on: boolean) {
    const list = toggleHabit(current.current[day] ?? [], name, on);
    current.current = { ...current.current, [day]: list };
    setDays(current.current);
    setError(null);

    pending.current += 1;
    queue.current = queue.current.then(async () => {
      const res = await setDayHabitsAction(day, list);
      if (res.ok) {
        saved.current = { ...saved.current, [day]: list };
      } else {
        setError(res.error);
        current.current = { ...current.current, [day]: saved.current[day] ?? [] };
        setDays(current.current);
      }
      pending.current -= 1;
      if (pending.current === 0) startTransition(() => router.refresh());
    });
  }

  return { days, toggle, error, dismissError: () => setError(null) };
}
