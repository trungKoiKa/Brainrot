// Kiểu dữ liệu dùng chung giữa lớp dữ liệu (lib/db) và giao diện. Chỉ giá trị thuần.

export type TaskStatus = "Chưa làm" | "Đang làm" | "Xong";
export type Priority = "Cao" | "Vừa" | "Thấp";

export type Task = {
  id: string;
  title: string;
  project: string | null;
  status: TaskStatus | null;
  priority: Priority | null;
  /** YYYY-MM-DD theo giờ Việt Nam */
  deadline: string | null;
  note: string;
  /** Cột "Ngày làm" (SPEC.md mục 3): ngày định làm, khác Deadline (ngày phải xong) */
  plannedOn: string | null;
  /** Ngày đánh dấu Xong (YYYY-MM-DD), từ v0.3; task xong trước đó để trống */
  doneOn: string | null;
  /** ISO, lúc tạo */
  createdTime: string;
  /** Relation "Mục tiêu" (Goals, từ v0.4) */
  goalIds: string[];
};

export type Knowledge = {
  id: string;
  title: string;
  field: string | null;
  level: string | null;
  summary: string;
  source: string | null;
  /** YYYY-MM-DD theo giờ Việt Nam */
  learnedOn: string | null;
  createdTime: string;
  /** id các ghi chú "liên quan tới" (hai chiều) — SPEC.md mục 5.6 */
  related: string[];
};

export type DailyLog = {
  id: string;
  title: string;
  /** YYYY-MM-DD theo giờ Việt Nam */
  date: string | null;
  done: string;
  dropped: string;
  learned: string;
  tomorrowTop3: string;
  exercised: boolean;
  /** Cột "Thói quen" (multi-select, từ v0.4): tên các thói quen đã làm trong ngày */
  habits: string[];
};

/** Một dòng database Habits (SPEC.md mục 3). Tháng là ngày 1 của tháng, YYYY-MM-DD. */
export type Habit = {
  id: string;
  name: string;
  from: string;
  /** Tháng cuối còn theo dõi; null = vẫn đang theo dõi */
  to: string | null;
  order: number;
};
