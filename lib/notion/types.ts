// Kiểu dữ liệu đã chuẩn hóa từ Notion (schema ở mục 4 SPEC). Chỉ dùng giá trị thuần để cache được.

export type TaskStatus = "Chưa làm" | "Đang làm" | "Xong";
export type Priority = "Cao" | "Vừa" | "Thấp";

export type Task = {
  id: string;
  url: string;
  title: string;
  project: string | null;
  status: TaskStatus | null;
  priority: Priority | null;
  /** YYYY-MM-DD theo giờ Việt Nam */
  deadline: string | null;
  note: string;
  /** Ngày đánh dấu Xong (YYYY-MM-DD), từ v0.3; task xong trước đó để trống */
  doneOn: string | null;
  /** ISO, Notion tự đặt */
  createdTime: string;
  /** Relation "Mục tiêu" (Goals, từ v0.4) */
  goalIds: string[];
};

export type Knowledge = {
  id: string;
  url: string;
  title: string;
  field: string | null;
  level: string | null;
  summary: string;
  source: string | null;
  /** YYYY-MM-DD theo giờ Việt Nam */
  learnedOn: string | null;
  createdTime: string;
};

export type DailyLog = {
  id: string;
  url: string;
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

/** Một dòng database Habits (SPEC-v0.4 mục 3.1). Tháng là ngày 1 của tháng, YYYY-MM-DD. */
export type Habit = {
  id: string;
  name: string;
  from: string;
  /** Tháng cuối còn theo dõi; null = vẫn đang theo dõi */
  to: string | null;
  order: number;
};
