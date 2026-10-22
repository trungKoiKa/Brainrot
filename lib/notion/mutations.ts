import "server-only";
import { isFullPage } from "@notionhq/client";
import { formatDay } from "@/lib/date";
import type { DailyLogInput } from "@/lib/quick-capture";
import { notion, requireEnv } from "./client";
import { dataSourceId } from "./queries";

const normalizeId = (id: string) => id.replace(/-/g, "").toLowerCase();

/** rich_text / title của Notion; chuỗi rỗng → mảng rỗng (xóa nội dung ô). */
const richText = (content: string) => (content ? [{ type: "text" as const, text: { content } }] : []);

/**
 * Tích xong task (SPEC 7.2): đặt Trạng thái = Xong.
 * Chỉ cho phép trang nằm trong database Tasks, để không ghi nhầm trang khác.
 */
export async function markTaskDone(pageId: string): Promise<void> {
  const page = await notion().pages.retrieve({ page_id: pageId });
  const parentDb =
    isFullPage(page) && page.parent.type === "data_source_id" ? page.parent.database_id : null;
  if (!parentDb || normalizeId(parentDb) !== normalizeId(requireEnv("NOTION_TASKS_DB"))) {
    throw new Error("Trang này không thuộc database Tasks");
  }
  await notion().pages.update({
    page_id: pageId,
    properties: { "Trạng thái": { status: { name: "Xong" } } },
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
