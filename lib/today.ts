// Quy tắc của trang Today (SPEC 7.1). Hàm thuần, không gọi Notion → dễ kiểm tra.
import { addDays, daysBetween } from "./date";
import type { Knowledge, Priority, Task } from "./notion/types";

const PRIORITY_RANK: Record<Priority, number> = { Cao: 0, Vừa: 1, Thấp: 2 };

const isOpen = (t: Task) => t.status !== "Xong";

/** Ưu tiên Cao > Vừa > Thấp, rồi deadline gần nhất; không có deadline xếp cuối. */
export function compareTasks(a: Task, b: Task): number {
  const pa = a.priority ? PRIORITY_RANK[a.priority] : 3;
  const pb = b.priority ? PRIORITY_RANK[b.priority] : 3;
  if (pa !== pb) return pa - pb;
  if (a.deadline === b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline < b.deadline ? -1 : 1;
}

/** "- việc", "1. việc", "• việc", "[ ] việc" → "việc" */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•–]|\d+[.)]|\[[ xX]?\])\s*/, "").trim())
    .filter(Boolean);
}

export type LateTask = Task & { plannedOn: string; lateDays: number };
export type TodayPlan = {
  /** Ngày làm = hôm nay */
  planned: Task[];
  /** Ngày làm < hôm nay, chưa xong */
  late: LateTask[];
  /** Hạn = hôm nay, chưa xếp làm hôm nay */
  due: Task[];
  /** Cả ba nhóm trống → gợi ý 3 task ưu tiên cao nhất chưa xếp lịch */
  suggest: Task[];
};

/** Khối "Hôm nay làm" (SPEC-v0.5 4.2). Chỉ task chưa xong; mỗi task chỉ thuộc một nhóm. */
export function planToday(today: string, tasks: Task[]): TodayPlan {
  const open = tasks.filter(isOpen);
  const planned = open.filter((t) => t.plannedOn === today).sort(compareTasks);
  const late = open
    .filter((t): t is Task & { plannedOn: string } => t.plannedOn !== null && t.plannedOn < today)
    .map((t) => ({ ...t, lateDays: daysBetween(t.plannedOn, today) }))
    .sort((a, b) => a.plannedOn.localeCompare(b.plannedOn) || compareTasks(a, b));
  const due = open.filter((t) => t.deadline === today && (t.plannedOn === null || t.plannedOn > today)).sort(compareTasks);
  const empty = planned.length + late.length + due.length === 0;
  const suggest = empty ? open.filter((t) => t.plannedOn === null).sort(compareTasks).slice(0, 3) : [];
  return { planned, late, due, suggest };
}

/** "Ngày mai làm" (SPEC-v0.5 câu 10.2a): task đã xếp ngày mai + task chưa xếp lịch, ưu tiên cao trước. */
export function tomorrowCandidates(today: string, tasks: Task[], limit = 8): Task[] {
  const tomorrow = addDays(today, 1);
  const open = tasks.filter(isOpen);
  const picked = open.filter((t) => t.plannedOn === tomorrow).sort(compareTasks);
  const rest = open.filter((t) => t.plannedOn === null).sort(compareTasks);
  return [...picked, ...rest].slice(0, Math.max(limit, picked.length));
}

export type DeadlineItem = Task & { deadline: string; daysLeft: number };

/** Task chưa xong có deadline ≤ hôm nay + 14 (gồm cả quá hạn), sắp theo deadline. */
export function upcomingDeadlines(today: string, tasks: Task[], horizon = 14): DeadlineItem[] {
  return tasks
    .filter((t): t is Task & { deadline: string } => isOpen(t) && t.deadline !== null)
    .map((t) => ({ ...t, daysLeft: daysBetween(today, t.deadline) }))
    .filter((t) => t.daysLeft <= horizon)
    .sort((a, b) => (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0));
}

/** 5 note mới nhất theo Ngày học, thiếu thì dùng thời điểm tạo trang. */
export function latestKnowledge(notes: Knowledge[], limit = 5): Knowledge[] {
  const key = (k: Knowledge) => k.learnedOn ?? k.createdTime.slice(0, 10);
  return [...notes]
    .sort((a, b) => key(b).localeCompare(key(a)) || b.createdTime.localeCompare(a.createdTime))
    .slice(0, limit);
}

export function deadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Quá hạn ${-daysLeft} ngày`;
  if (daysLeft === 0) return "Hôm nay";
  if (daysLeft === 1) return "Ngày mai";
  return `Còn ${daysLeft} ngày`;
}
