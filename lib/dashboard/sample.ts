// Dữ liệu mẫu cho Dashboard (SPEC-v0.3 mục 5): seed cố định → cùng ngày luôn ra cùng số liệu.
// Chỉ để xem/demo; không bao giờ ghi vào Notion.
import { addDays } from "@/lib/date";
import type { Goal } from "@/lib/goals";
import type { Habit } from "@/lib/types";
import type { DashInput, DashLog, DashTask } from "./stats";

const SEED = 20261206;
const HISTORY_DAYS = 120;
// [tên, tỉ lệ làm mỗi ngày có log] — "Tập thể dục" đi theo cờ exercised của log mẫu
const SAMPLE_GOALS: [string, Goal["type"], boolean][] = [
  ["Nộp bản nháp chương 3 cho thầy", "Ưu tiên", true],
  ["Hoàn thiện demo phần cứng ESP32", "Ưu tiên", false],
  ["Học xong khóa Computer Vision tuần 1–4", "Ưu tiên", true],
  ["Đọc 2 cuốn sách", "Thường", false],
  ["Tập thể dục ≥ 70% số ngày", "Thường", true],
  ["Viết 4 bài nhật ký tuần", "Thường", false],
];
const SAMPLE_TITLES: Record<string, string[]> = {
  "Đồ án": ["Viết chương 3", "Sửa sơ đồ khối", "Đo dòng ESP32", "Chạy thử mô hình"],
  "Học AI": ["Bài tập CNN", "Đọc paper YOLO", "Ôn backprop"],
  "Thực tập": ["Báo cáo tuần", "Sửa bug dashboard"],
  "Sản phẩm": ["Thiết kế landing"],
  "Sức khỏe": ["Khám định kỳ"],
  Khác: ["Việc lặt vặt"],
};
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
        title: "",
        url: "",
        plannedOn: null,
        project,
        status: done ? "Xong" : r() < 0.35 ? "Đang làm" : "Chưa làm",
        deadline: r() < 0.6 ? addDays(day, int(2, 21)) : null,
        doneOn: done ? addDays(day, doneAfter) : null,
        createdOn: day,
      });
    }
  }

  // Ghi chú kiến thức mẫu: khoảng 1 ghi chú mỗi 3 ngày
  const knowledge: string[] = [];
  for (let i = HISTORY_DAYS; i >= 0; i--) if (r() < 0.32) knowledge.push(addDays(today, -i));

  const logs: DashLog[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = addDays(today, -i);
    if (r() < (isWeekend(date) ? 0.6 : 0.85)) {
      logs.push({ date, doneCount: int(1, 6), exercised: r() < 0.45, dropped: r() < 0.3, habits: [] });
    }
  }

  // Việc cũ chưa xong không giữ hạn đã qua từ lâu: mẫu cho thấy vài việc quá hạn vừa phải, không phải 19 việc "quá hạn 100 ngày"
  // (không dùng PRNG → số liệu các khối khác không đổi)
  for (const t of tasks) if (t.status !== "Xong" && t.deadline !== null && t.deadline < addDays(today, -7)) t.deadline = null;

  // Tên + Ngày làm (SPEC-v0.5) dùng PRNG riêng → số liệu mẫu các khối có sẵn không đổi
  const rp = rng(SEED + 2);
  tasks.forEach((t, i) => {
    const names = SAMPLE_TITLES[t.project ?? "Khác"] ?? SAMPLE_TITLES["Khác"];
    t.title = `${names[i % names.length]} #${i + 1}`;
    // ~70% việc được xếp lịch: việc xong làm đúng ngày xong, việc còn mở xếp vài ngày sau khi tạo
    if (rp() < 0.7) t.plannedOn = t.status === "Xong" && t.doneOn ? t.doneOn : addDays(t.createdOn, Math.floor(rp() * 5));
  });

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

  const monthStart = `${today.slice(0, 7)}-01`;
  const monthGoals: Goal[] = SAMPLE_GOALS.map(([title, type, done], i) => ({
    id: `sample-goal-${i}`,
    title,
    level: "month",
    start: monthStart,
    type,
    done,
    habitId: null,
    threshold: null,
    taskIds: [],
  }));

  return { today, tasks, knowledge, logs, thesisDeadline, habits, monthGoals };
}
