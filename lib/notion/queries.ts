import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { collectPaginatedAPI, isFullPage, type PageObjectResponse } from "@notionhq/client";
import { notion, requireEnv } from "./client";
import { checkbox, date, select, text, url } from "./properties";
import type { DailyLog, Knowledge, Priority, Task, TaskStatus } from "./types";

export const TAGS = { tasks: "tasks", knowledge: "knowledge", daily: "daily" } as const;

// Cache 5 phút (SPEC mục 3). Sau 5 phút, request kế tiếp vẫn nhận bản cũ ngay
// và Next tải bản mới ở nền; nếu Notion lỗi lúc đó, bản cũ được giữ.
const FIVE_MINUTES = { stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 7 };

/**
 * Notion API 2025-09-03 query theo data source, không theo database.
 * Env chứa database ID (SPEC mục 5) → tra data source ID một lần rồi cache lâu.
 */
async function dataSourceId(envName: string): Promise<string> {
  "use cache";
  cacheLife("days");
  const db = await notion().databases.retrieve({ database_id: requireEnv(envName) });
  const id = "data_sources" in db ? db.data_sources[0]?.id : undefined;
  if (!id) throw new Error(`Database ${envName} không có data source`);
  return id;
}

/** Các lựa chọn của một property select trong schema (vd. "Lĩnh vực", "Dự án"). */
export async function selectOptions(envName: string, property: string): Promise<string[]> {
  "use cache";
  cacheLife("days");
  const ds = await notion().dataSources.retrieve({ data_source_id: await dataSourceId(envName) });
  const prop = ds.properties[property];
  return prop?.type === "select" ? prop.select.options.map((o) => o.name) : [];
}

async function queryAll(envName: string): Promise<PageObjectResponse[]> {
  const pages = await collectPaginatedAPI(notion().dataSources.query, {
    data_source_id: await dataSourceId(envName),
  });
  return pages.filter(isFullPage);
}

export async function getTasks(): Promise<Task[]> {
  "use cache";
  cacheLife(FIVE_MINUTES);
  cacheTag(TAGS.tasks);
  const pages = await queryAll("NOTION_TASKS_DB");
  return pages.map(({ id, url: pageUrl, properties: p }) => ({
    id,
    url: pageUrl,
    title: text(p, "Việc"),
    project: select(p, "Dự án"),
    status: select(p, "Trạng thái") as TaskStatus | null,
    priority: select(p, "Ưu tiên") as Priority | null,
    deadline: date(p, "Deadline"),
    note: text(p, "Ghi chú"),
  }));
}

export async function getKnowledge(): Promise<Knowledge[]> {
  "use cache";
  cacheLife(FIVE_MINUTES);
  cacheTag(TAGS.knowledge);
  const pages = await queryAll("NOTION_KNOWLEDGE_DB");
  return pages.map(({ id, url: pageUrl, created_time, properties: p }) => ({
    id,
    url: pageUrl,
    title: text(p, "Chủ đề"),
    field: select(p, "Lĩnh vực"),
    level: select(p, "Mức hiểu"),
    summary: text(p, "Tóm tắt"),
    source: url(p, "Nguồn"),
    learnedOn: date(p, "Ngày học"),
    createdTime: created_time,
  }));
}

/** Chỉ cần vài bản ghi gần nhất (Today dùng bản ghi hôm qua). */
export async function getRecentDailyLogs(limit = 7): Promise<DailyLog[]> {
  "use cache";
  cacheLife(FIVE_MINUTES);
  cacheTag(TAGS.daily);
  const res = await notion().dataSources.query({
    data_source_id: await dataSourceId("NOTION_DAILY_DB"),
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: limit,
  });
  return res.results.filter(isFullPage).map(({ id, url: pageUrl, properties: p }) => ({
    id,
    url: pageUrl,
    title: text(p, "Ngày"),
    date: date(p, "Date"),
    done: text(p, "Xong"),
    dropped: text(p, "Rơi / chưa xong"),
    learned: text(p, "Học được"),
    tomorrowTop3: text(p, "Ngày mai 3 việc"),
    exercised: checkbox(p, "Tập thể dục"),
  }));
}
