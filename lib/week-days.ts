// Thẻ ngày của chế độ Tuần (SPEC-v0.4 mục 6.3). Hàm thuần: chỉ gom dữ liệu đã có, không ghi gì.
import { addDays } from "./date";
import type { DailyLog, Task } from "./notion/types";

export type PlannerSlotItem = { id: string; title: string; done: boolean };
export type DayCardData = {
  date: string;
  tasks: Task[];
  slots: PlannerSlotItem[];
  log: { done: string; dropped: string } | null;
  doneCount: number;
  total: number;
  /** null khi ngày chưa có việc nào */
  pct: number | null;
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Task thuộc một ngày: hạn rơi vào ngày đó, hoặc (task đã xong) ngày xong là ngày đó. */
export function tasksOnDay(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.deadline === date || (t.status === "Xong" && t.doneOn === date));
}

/** 7 thẻ Thứ Hai → Chủ nhật. `slotsByDay` đọc từ store Planner (chỉ có khi `weekStart` trùng tuần đang xem). */
export function weekDayCards(
  weekStart: string,
  tasks: Task[],
  logs: DailyLog[],
  slotsByDay: Partial<Record<(typeof DAY_KEYS)[number], PlannerSlotItem[]>>,
): DayCardData[] {
  return DAY_KEYS.map((key, i) => {
    const date = addDays(weekStart, i);
    const dayTasks = tasksOnDay(tasks, date);
    const slots = slotsByDay[key] ?? [];
    const log = logs.find((l) => l.date === date);
    const total = dayTasks.length + slots.length;
    const doneCount = dayTasks.filter((t) => t.status === "Xong").length + slots.filter((s) => s.done).length;
    return {
      date,
      tasks: dayTasks,
      slots,
      log: log && (log.done.trim() || log.dropped.trim()) ? { done: log.done.trim(), dropped: log.dropped.trim() } : null,
      doneCount,
      total,
      pct: total === 0 ? null : Math.round((doneCount / total) * 100),
    };
  });
}
