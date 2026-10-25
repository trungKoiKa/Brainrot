// Dữ liệu mẫu cho Dashboard (SPEC-v0.3 mục 5): seed cố định → cùng ngày luôn ra cùng số liệu.
// Chỉ để xem/demo; không bao giờ ghi vào Notion.
import { addDays } from "@/lib/date";
import type { Habit } from "@/lib/notion/types";
import type { DashInput, DashLog, DashTask, PlannerSummary } from "./stats";
import { mondayOf } from "./stats";

const SEED = 20261206;
const HISTORY_DAYS = 120;
// [tên, tỉ lệ làm mỗi ngày có log] — "Tập thể dục" đi theo cờ exercised của log mẫu
const SAMPLE_HABITS: [string, number][] = [
  ["Tập thể dục", 0],
  ["Đọc sách", 0.75],
  ["Viết nhật ký", 0.55],
  ["Học tiếng Anh", 0.65],
  ["Ngủ trước 0h", 0.35],
];

/** mulberry32: PRNG nhỏ, đủ cho dữ liệu mẫu. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isWeekend = (day: string) => [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay());

function pick<T>(r: () => number, items: [T, number][]): T {
  let x = r() * items.reduce((s, [, w]) => s + w, 0);
  for (const [item, w] of items) if ((x -= w) < 0) return item;
  return items[items.length - 1][0];
}

export function sampleDashboard(today: string, thesisDeadline = "2026-12-06"): DashInput {
  const r = rng(SEED);
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));

  const tasks: DashTask[] = [];
  for (let i = HISTORY_DAYS; i >= 0; i--) {
    const day = addDays(today, -i);
    const thesisRush = i < 40 ? 3 : 1; // gần hạn đồ án thì việc Đồ án dồn lên
    for (let n = isWeekend(day) ? int(0, 2) : int(2, 5); n > 0; n--) {
      const project = pick<string | null>(r, [
        ["Đồ án", 3 * thesisRush], ["Học AI", 2], ["Thực tập", 2], ["Sản phẩm", 1], ["Sức khỏe", 1], ["Khác", 0.5], [null, 0.5],
      ]);
      const doneAfter = int(0, 9);
      const done = r() < 0.85 && doneAfter <= i;
      tasks.push({
        project,
        status: done ? "Xong" : r() < 0.35 ? "Đang làm" : "Chưa làm",
        deadline: r() < 0.6 ? addDays(day, int(2, 21)) : null,
        doneOn: done ? addDays(day, doneAfter) : null,
        createdOn: day,
      });
    }
  }

  const knowledge: string[] = [];
  for (let i = HISTORY_DAYS; i >= 0; i--) if (r() < 0.32) knowledge.push(addDays(today, -i));

  const logs: DashLog[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = addDays(today, -i);
    if (r() < (isWeekend(date) ? 0.6 : 0.85)) {
      logs.push({ date, doneCount: int(1, 6), exercised: r() < 0.45, dropped: r() < 0.3, habits: [] });
    }
  }

  const monday = mondayOf(today);
  const planner: PlannerSummary = {
    thisWeek: { done: 0, total: 0 },
    history: Array.from({ length: 12 }, (_, i) => {
      const total = int(14, 24);
      return { weekStart: addDays(monday, (i - 12) * 7), total, done: Math.round(total * (0.45 + 0.04 * i * r() + 0.2 * r())) };
    }),
    projects: [
      ["Đồ án tốt nghiệp", 12],
      ["Học AI", 6],
      ["Thực tập", 5],
      ["Sức khỏe", 7],
    ].map(([name, total]) => ({ name: name as string, total: total as number, done: int(1, total as number) })),
  };
  planner.thisWeek = planner.projects.reduce((s, p) => ({ done: s.done + p.done, total: s.total + p.total }), { done: 0, total: 0 });

  // Thói quen dùng PRNG riêng → thêm phần này không làm đổi số liệu mẫu các khối có sẵn
  const rh = rng(SEED + 1);
  const habits: Habit[] = SAMPLE_HABITS.map(([name], i) => ({
    id: `sample-${i}`,
    name,
    from: `${addDays(today, -HISTORY_DAYS).slice(0, 7)}-01`,
    to: null,
    order: i + 1,
  }));
  for (const log of logs) {
    log.habits = SAMPLE_HABITS.filter(([name, rate]) => (name === "Tập thể dục" ? log.exercised : rh() < rate)).map(([n]) => n);
  }

  return { today, tasks, knowledge, logs, planner, thesisDeadline, habits };
}
