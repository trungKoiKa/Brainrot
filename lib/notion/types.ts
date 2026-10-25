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
};
