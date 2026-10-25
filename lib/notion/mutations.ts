import "server-only";
import { isFullPage } from "@notionhq/client";
import { formatDay, todayVN } from "@/lib/date";
import type { DailyLogInput } from "@/lib/quick-capture";
import type { TaskInput, TaskUpdate } from "@/lib/task-form";
import { notion, requireEnv } from "./client";
import { dataSourceId } from "./queries";

const normalizeId = (id: string) => id.replace(/-/g, "").toLowerCase();

/** rich_text / title của Notion; chuỗi rỗng → mảng rỗng (xóa nội dung ô). */
const richText = (content: string) => (content ? [{ type: "text" as const, text: { content } }] : []);

/** Chỉ cho phép ghi trang nằm trong database Tasks, để không ghi nhầm trang khác. */
async function assertTaskPage(pageId: string): Promise<void> {
  const page = await notion().pages.retrieve({ page_id: pageId });
  const parentDb =
    isFullPage(page) && page.parent.type === "data_source_id" ? page.parent.database_id : null;
  if (!parentDb || normalizeId(parentDb) !== normalizeId(requireEnv("NOTION_TASKS_DB"))) {
    throw new Error("Trang này không thuộc database Tasks");
  }
}

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
      "Ghi chú": { rich_text: richText(input.note) },
    },
  });
}

/**
 * Daily Log của `day` (YYYY-MM-DD, giờ VN): mỗi ngày 1 bản ghi (SPEC-v0.2 4.1).
 * Đã có bản ghi Date = day → cập nhật; chưa có → tạo mới.
 */
export async function saveDailyLog(day: string, input: DailyLogInput): Promise<"created" | "updated"> {
  const dsId = await dataSourceId("NOTION_DAILY_DB");
  const existing = await notion().dataSources.query({
    data_source_id: dsId,
    filter: { property: "Date", date: { equals: day } },
    page_size: 1,
  });
  const properties = {
    Xong: { rich_text: richText(input.done) },
    "Rơi / chưa xong": { rich_text: richText(input.dropped) },
    "Học được": { rich_text: richText(input.learned) },
    "Ngày mai 3 việc": { rich_text: richText(input.tomorrowTop3) },
    "Tập thể dục": { checkbox: input.exercised },
  };

  const page = existing.results[0];
  if (page) {
    await notion().pages.update({ page_id: page.id, properties });
    return "updated";
  }
  await notion().pages.create({
    parent: { type: "data_source_id", data_source_id: dsId },
    properties: {
      ...properties,
      "Ngày": { title: richText(formatDay(day)) },
      Date: { date: { start: day } },
    },
  });
  return "created";
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
