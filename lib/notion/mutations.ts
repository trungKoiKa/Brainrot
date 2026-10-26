import "server-only";
import { isFullPage } from "@notionhq/client";
import { LEVEL_NOTION, type GoalType } from "@/lib/goals";
import { LEGACY_EXERCISE, toggleHabit } from "@/lib/habits";
import type { Level } from "@/lib/period";
import { formatDay, todayVN } from "@/lib/date";
import type { DailyLogInput } from "@/lib/quick-capture";
import type { TaskInput, TaskUpdate } from "@/lib/task-form";
import { notion, requireEnv } from "./client";
import { multiSelect } from "./properties";
import { dataSourceId } from "./queries";

const normalizeId = (id: string) => id.replace(/-/g, "").toLowerCase();

/** rich_text / title của Notion; chuỗi rỗng → mảng rỗng (xóa nội dung ô). */
const richText = (content: string) => (content ? [{ type: "text" as const, text: { content } }] : []);

/** Chỉ cho phép ghi trang nằm trong đúng database (theo biến môi trường), để không ghi nhầm trang khác. */
async function assertInDatabase(pageId: string, envName: string): Promise<void> {
  const page = await notion().pages.retrieve({ page_id: pageId });
  const parentDb =
    isFullPage(page) && page.parent.type === "data_source_id" ? page.parent.database_id : null;
  if (!parentDb || normalizeId(parentDb) !== normalizeId(requireEnv(envName))) {
    throw new Error(`Trang này không thuộc database ${envName}`);
  }
}

const assertTaskPage = (pageId: string) => assertInDatabase(pageId, "NOTION_TASKS_DB");

/** Tích xong task (SPEC 7.2): đặt Trạng thái = Xong và Ngày xong = hôm nay (SPEC-v0.3 mục 6). */
export async function markTaskDone(pageId: string): Promise<void> {
  await assertTaskPage(pageId);
  await notion().pages.update({
    page_id: pageId,
    properties: {
      "Trạng thái": { status: { name: "Xong" } },
      "Ngày xong": { date: { start: todayVN() } },
    },
  });
}

const taskProperties = (input: TaskInput) => ({
  "Việc": { title: richText(input.title) },
  "Dự án": { select: input.project ? { name: input.project } : null },
  "Ưu tiên": { select: input.priority ? { name: input.priority } : null },
  Deadline: { date: input.deadline ? { start: input.deadline } : null },
});

/** Thêm task (SPEC-v0.2 4.2): Trạng thái = Chưa làm. */
export async function createTask(input: TaskInput): Promise<void> {
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: await dataSourceId("NOTION_TASKS_DB") },
    properties: { ...taskProperties(input), "Trạng thái": { status: { name: "Chưa làm" } } },
  });
}

/** Sửa task: ghi đè Tên, Trạng thái, Dự án, Ưu tiên, Deadline, Ghi chú; ô để trống → xóa trên Notion. */
export async function updateTask(pageId: string, input: TaskUpdate): Promise<void> {
  await assertTaskPage(pageId);
  await notion().pages.update({
    page_id: pageId,
    properties: {
      ...taskProperties(input),
      "Trạng thái": { status: { name: input.status } },
      // Form sửa chỉ cho Chưa làm / Đang làm → task mở lại thì bỏ Ngày xong (SPEC-v0.3 mục 6)
      "Ngày xong": { date: null },
      // undefined = form không có ô Mục tiêu (chưa kết nối Goals) → không đụng tới relation
      ...(input.goalId !== undefined && { "Mục tiêu": { relation: input.goalId ? [{ id: input.goalId }] : [] } }),
      "Ghi chú": { rich_text: richText(input.note) },
    },
  });
}

/**
 * Daily Log của `day` (YYYY-MM-DD, giờ VN): mỗi ngày 1 bản ghi (SPEC-v0.2 4.1).
 * Đã có bản ghi Date = day → cập nhật; chưa có → tạo mới.
 */
/** Bản ghi Daily Log của `day`, nếu đã có. */
async function findDailyLog(day: string) {
  const dsId = await dataSourceId("NOTION_DAILY_DB");
  const existing = await notion().dataSources.query({
    data_source_id: dsId,
    filter: { property: "Date", date: { equals: day } },
    page_size: 1,
  });
  const page = existing.results.find(isFullPage);
  return { dsId, page };
}

/** Thuộc tính bắt buộc khi tạo bản ghi Daily Log mới cho `day`. */
const newDailyLog = (day: string) => ({
  "Ngày": { title: richText(formatDay(day)) },
  Date: { date: { start: day } },
});

/** Cột "Thói quen" + checkbox "Tập thể dục" cũ luôn khớp nhau (SPEC-v0.4 3.1). */
const habitProperties = (names: string[]) => ({
  "Thói quen": { multi_select: names.map((name) => ({ name })) },
  "Tập thể dục": { checkbox: names.includes(LEGACY_EXERCISE) },
});

export async function saveDailyLog(day: string, input: DailyLogInput): Promise<"created" | "updated"> {
  const { dsId, page } = await findDailyLog(day);
  // Ô "Tập thể dục" của Ghi nhanh (nếu có) bật/tắt thói quen cùng tên, giữ nguyên các thói quen khác
  const exercised = input.exercised;
  const habits =
    exercised === null ? null : toggleHabit(page ? multiSelect(page.properties, "Thói quen") : [], LEGACY_EXERCISE, exercised);
  const properties = {
    Xong: { rich_text: richText(input.done) },
    "Rơi / chưa xong": { rich_text: richText(input.dropped) },
    "Học được": { rich_text: richText(input.learned) },
    "Ngày mai 3 việc": { rich_text: richText(input.tomorrowTop3) },
    ...(habits && habitProperties(habits)),
  };

  if (page) {
    await notion().pages.update({ page_id: page.id, properties });
    return "updated";
  }
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: dsId },
    properties: { ...properties, ...newDailyLog(day) },
  });
  return "created";
}

/** Ghi **toàn bộ** thói quen đã làm của `day` (không bật/tắt lẻ → hai lần bấm nhanh không ghi đè nhau sai). */
export async function setDayHabits(day: string, names: string[]): Promise<void> {
  const { dsId, page } = await findDailyLog(day);
  if (page) {
    await notion().pages.update({ page_id: page.id, properties: habitProperties(names) });
    return;
  }
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: dsId },
    properties: { ...habitProperties(names), ...newDailyLog(day) },
  });
}

/** Thêm thói quen, theo dõi từ tháng `from` (YYYY-MM-01). */
export async function createHabit(name: string, from: string, order: number): Promise<void> {
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: await dataSourceId("NOTION_HABITS_DB") },
    properties: {
      "Tên": { title: richText(name) },
      "Từ tháng": { date: { start: from } },
      "Thứ tự": { number: order },
    },
  });
}

export async function setHabitOrder(pageId: string, order: number): Promise<void> {
  await assertInDatabase(pageId, "NOTION_HABITS_DB");
  await notion().pages.update({ page_id: pageId, properties: { "Thứ tự": { number: order } } });
}

/** Ngừng theo dõi sau tháng `to` (YYYY-MM-01); null = theo dõi lại. Lịch sử Daily Log giữ nguyên. */
export async function setHabitEnd(pageId: string, to: string | null): Promise<void> {
  await assertInDatabase(pageId, "NOTION_HABITS_DB");
  await notion().pages.update({
    page_id: pageId,
    properties: { "Đến tháng": { date: to ? { start: to } : null } },
  });
}

/** Ý tưởng ghi nhanh → database Ideas (Trạng thái = Mới). */
export async function createIdea(day: string, idea: string): Promise<void> {
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: await dataSourceId("NOTION_IDEAS_DB") },
    properties: {
      "Ý tưởng": { title: richText(idea) },
      "Ngày": { date: { start: day } },
      "Trạng thái": { select: { name: "Mới" } },
    },
  });
}

// ---------- Goals (SPEC-v0.4 mục 4.4) ----------

export async function createGoal(level: Level, start: string, title: string, type: GoalType): Promise<string> {
  const page = await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: await dataSourceId("NOTION_GOALS_DB") },
    properties: {
      "Mục tiêu": { title: richText(title) },
      "Cấp": { select: { name: LEVEL_NOTION[level] } },
      "Kỳ": { date: { start } },
      "Loại": { select: { name: type } },
      Xong: { checkbox: false },
    },
  });
  return page.id;
}

export type GoalPatch = { title?: string; type?: GoalType; done?: boolean; habitId?: string | null; threshold?: number | null };

export async function updateGoal(pageId: string, patch: GoalPatch): Promise<void> {
  await assertInDatabase(pageId, "NOTION_GOALS_DB");
  await notion().pages.update({
    page_id: pageId,
    properties: {
      ...(patch.title !== undefined && { "Mục tiêu": { title: richText(patch.title) } }),
      ...(patch.type !== undefined && { "Loại": { select: { name: patch.type } } }),
      ...(patch.done !== undefined && { Xong: { checkbox: patch.done } }),
      ...(patch.habitId !== undefined && { "Thói quen": { relation: patch.habitId ? [{ id: patch.habitId }] : [] } }),
      ...(patch.threshold !== undefined && { "Ngưỡng %": { number: patch.threshold } }),
    },
  });
}

/** Xóa = chuyển vào Trash của Notion (khôi phục được); `trashed: false` để hoàn tác. */
export async function trashGoal(pageId: string, trashed: boolean): Promise<void> {
  await assertInDatabase(pageId, "NOTION_GOALS_DB");
  await notion().pages.update({ page_id: pageId, in_trash: trashed });
}
