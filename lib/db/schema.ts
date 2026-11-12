// Bảng Postgres của v1.0 (SPEC.md mục 3). Mọi bảng dữ liệu gắn với users.id, ON DELETE CASCADE:
// xóa tài khoản là xóa sạch dữ liệu của người đó.
// Ngày lưu kiểu `date`, đọc ra chuỗi YYYY-MM-DD (giờ Việt Nam do app tính, như thời Notion).

import { boolean, date, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", ["Chưa làm", "Đang làm", "Xong"]);
export const priority = pgEnum("priority", ["Cao", "Vừa", "Thấp"]);
export const level = pgEnum("level", ["year", "quarter", "month", "week"]);
export const goalType = pgEnum("goal_type", ["Ưu tiên", "Thường"]);
export const knowledgeLevel = pgEnum("knowledge_level", ["Mới học", "Hiểu", "Áp dụng được"]);

const id = () => uuid("id").primaryKey().defaultRandom();
const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  /** `sub` của Google — null tới khi đăng nhập Google (bước 5); user mặc định giai đoạn A chưa có */
  googleSub: text("google_sub").unique(),
  email: text("email").unique(),
  name: text("name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  /** scrypt: `scrypt$<salt>$<hash>` (lib/password.ts). Null → chưa đặt mật khẩu, không đăng nhập được */
  passwordHash: text("password_hash"),
  /** Thẻ đếm ngược ở Dashboard; null → ẩn thẻ */
  targetDate: date("target_date"),
  targetLabel: text("target_label").notNull().default(""),
  createdAt: createdAt(),
});

export const projects = pgTable(
  "projects",
  {
    id: id(),
    userId: owner(),
    name: text("name").notNull(),
    /** Màu theo `lib/fields.ts`; null → tự chọn theo tên */
    color: text("color"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.name)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    userId: owner(),
    title: text("title").notNull().default(""),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    status: taskStatus("status").notNull().default("Chưa làm"),
    priority: priority("priority"),
    deadline: date("deadline"),
    /** "Ngày làm" (SPEC.md mục 3): ngày định làm, khác deadline */
    plannedOn: date("planned_on"),
    doneOn: date("done_on"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("tasks_user_idx").on(t.userId)],
);

export const habits = pgTable(
  "habits",
  {
    id: id(),
    userId: owner(),
    name: text("name").notNull(),
    /** Tháng bắt đầu / cuối theo dõi: ngày 1 của tháng; toMonth null = vẫn theo dõi */
    fromMonth: date("from_month").notNull(),
    toMonth: date("to_month"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

/** Ngày đã làm thói quen — thay multi-select "Thói quen" của Daily Log; theo id nên đổi tên không mất lịch sử */
export const habitDays = pgTable(
  "habit_days",
  {
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
  },
  (t) => [primaryKey({ columns: [t.habitId, t.day] })],
);

export const goals = pgTable(
  "goals",
  {
    id: id(),
    userId: owner(),
    title: text("title").notNull().default(""),
    level: level("level").notNull(),
    /** Ngày đầu kỳ (cột "Kỳ" thời Notion) */
    start: date("start").notNull(),
    type: goalType("type").notNull().default("Thường"),
    done: boolean("done").notNull().default(false),
    habitId: uuid("habit_id").references(() => habits.id, { onDelete: "set null" }),
    /** "Ngưỡng %" để thói quen làm goal tự xong */
    threshold: integer("threshold"),
    /** Xóa mềm: "Xóa" có nút Hoàn tác 5 giây (như Trash của Notion) */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("goals_user_level_idx").on(t.userId, t.level, t.start)],
);

export const goalTasks = pgTable(
  "goal_tasks",
  {
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.taskId] }), index("goal_tasks_task_idx").on(t.taskId)],
);

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: id(),
    userId: owner(),
    day: date("day").notNull(),
    done: text("done").notNull().default(""),
    dropped: text("dropped").notNull().default(""),
    learned: text("learned").notNull().default(""),
    exercised: boolean("exercised").notNull().default(false),
  },
  (t) => [unique().on(t.userId, t.day)],
);

export const reflections = pgTable(
  "reflections",
  {
    id: id(),
    userId: owner(),
    level: level("level").notNull(),
    start: date("start").notNull(),
    wentWell: text("went_well").notNull().default(""),
    lesson: text("lesson").notNull().default(""),
    grateful: text("grateful").notNull().default(""),
    nextFocus: text("next_focus").notNull().default(""),
    motto: text("motto").notNull().default(""),
  },
  (t) => [unique().on(t.userId, t.level, t.start)],
);

export const ideas = pgTable(
  "ideas",
  {
    id: id(),
    userId: owner(),
    text: text("text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ideas_user_idx").on(t.userId)],
);

// ---------- Knowledge (SPEC.md mục 5.6, v1.1) ----------

/** Lĩnh vực của ghi chú kiến thức: danh sách riêng từng người, quản lý ở Cài đặt (như `projects`). */
export const fields = pgTable(
  "fields",
  {
    id: id(),
    userId: owner(),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.name)],
);

export const knowledge = pgTable(
  "knowledge",
  {
    id: id(),
    userId: owner(),
    title: text("title").notNull(),
    fieldId: uuid("field_id").references(() => fields.id, { onDelete: "set null" }),
    level: knowledgeLevel("level").notNull().default("Mới học"),
    summary: text("summary").notNull().default(""),
    sourceUrl: text("source_url"),
    learnedOn: date("learned_on"),
    createdAt: createdAt(),
  },
  (t) => [index("knowledge_user_idx").on(t.userId)],
);

/** "Liên quan tới": cặp ghi chú không có hướng, luôn lưu `from_id < to_id` để mỗi cặp chỉ một dòng. */
export const knowledgeLinks = pgTable(
  "knowledge_links",
  {
    fromId: uuid("from_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
    toId: uuid("to_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.fromId, t.toId] })],
);

/**
 * User mặc định của giai đoạn A (SPEC.md mục 3): mọi dữ liệu thuộc về Trung tới khi có đăng nhập Google (bước 5).
 * Migration `0001` tạo sẵn dòng này (kèm dự án "Chung"); bước 5 gắn nó vào tài khoản Google có email `OWNER_EMAIL`.
 */
export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";


/**
 * Lần đăng nhập sai (SPEC.md mục 3C): đếm theo email trong cửa sổ 15 phút để khoá tạm việc dò mật khẩu.
 * Không gắn khoá ngoại tới `users` (email lạ cũng được ghi, để không lộ email nào có tài khoản).
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_email_idx").on(t.email, t.createdAt)],
);
