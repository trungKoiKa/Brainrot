// Thẻ ngày của chế độ Tuần (SPEC.md mục 5.3). Hàm thuần: chỉ gom dữ liệu đã có, không ghi gì.
import { addDays } from "./date";
import type { DailyLog, Task } from "./types";

export type DayTask = Task & { /** chỉ có mặt vì Hạn rơi vào ngày này */ dueOnly: boolean };
export type DayCardData = {
  date: string;
  tasks: DayTask[];
  log: { done: string; dropped: string } | null;
  doneCount: number;
  total: number;
  /** null khi ngày chưa có việc nào */
  pct: number | null;
};

/**
 * Task thuộc một ngày (mỗi task tối đa một lần): Ngày làm là ngày đó; hoặc đã xong đúng ngày đó;
 * hoặc Hạn là ngày đó mà chưa xếp Ngày làm ngày khác (nhãn "hạn").
 */
export function tasksOnDay(tasks: Task[], date: string): DayTask[] {
  const out: DayTask[] = [];
  for (const t of tasks) {
    const done = t.status === "Xong";
    if (t.plannedOn === date || (done && t.doneOn === date)) out.push({ ...t, dueOnly: false });
    else if (t.deadline === date && !done && !t.plannedOn) out.push({ ...t, dueOnly: true });
  }
  return out;
}

/** 7 thẻ Thứ Hai → Chủ nhật. */
export function weekDayCards(weekStart: string, tasks: Task[], logs: DailyLog[]): DayCardData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayTasks = tasksOnDay(tasks, date);
    const log = logs.find((l) => l.date === date);
    const total = dayTasks.length;
    const doneCount = dayTasks.filter((t) => t.status === "Xong").length;
    return {
      date,
      tasks: dayTasks,
      log: log && (log.done.trim() || log.dropped.trim()) ? { done: log.done.trim(), dropped: log.dropped.trim() } : null,
      doneCount,
      total,
      pct: total === 0 ? null : Math.round((doneCount / total) * 100),
    };
  });
}
