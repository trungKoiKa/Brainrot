import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { collectPaginatedAPI, isFullPage, type PageObjectResponse } from "@notionhq/client";
import { notion, requireEnv } from "./client";
import { checkbox, date, multiSelect, number, relation, select, text, url } from "./properties";
import type { DailyLog, Habit, Knowledge, Priority, Task, TaskStatus } from "./types";
import { LEVEL_NOTION, type Goal, type GoalType } from "@/lib/goals";
import type { Level } from "@/lib/period";
import { REFLECTION_COLUMNS, type Reflection } from "@/lib/reflections";

export const TAGS = { tasks: "tasks", knowledge: "knowledge", daily: "daily", habits: "habits", goals: "goals", reflections: "reflections" } as const;

/** Kết quả đọc Notion: hàm có cache KHÔNG ném lỗi, để lỗi không bị cache như dữ liệu. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Cache 5 phút (SPEC mục 3). Kết quả lỗi chỉ giữ 30 giây để sớm thử lại Notion.
const FIVE_MINUTES = { stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 7 };
const ERROR_LIFE = { stale: 0, revalidate: 30, expire: 60 };

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Notion API 2025-09-03 query theo data source, không theo database.
 * Env chứa database ID (SPEC mục 5) → tra data source ID một lần rồi cache lâu.
 */
export async function dataSourceId(envName: string): Promise<string> {
  "use cache";
  cacheLife("days");
  const db = await notion().databases.retrieve({ database_id: requireEnv(envName) });
  const id = "data_sources" in db ? db.data_sources[0]?.id : undefined;
  if (!id) throw new Error(`Database ${envName} không có data source`);
  return id;
}

/** Các lựa chọn của một property select trong schema (vd. "Lĩnh vực", "Dự án"); lỗi → []. */
export async function selectOptions(envName: string, property: string): Promise<string[]> {
  "use cache";
  try {
    const ds = await notion().dataSources.retrieve({ data_source_id: await dataSourceId(envName) });
    const prop = ds.properties[property];
    cacheLife("days");
    return prop?.type === "select" ? prop.select.options.map((o) => o.name) : [];
  } catch {
    cacheLife(ERROR_LIFE);
    return [];
  }
}

async function queryAll(envName: string, oldestFirst = false): Promise<PageObjectResponse[]> {
  const pages = await collectPaginatedAPI(notion().dataSources.query, {
    data_source_id: await dataSourceId(envName),
    ...(oldestFirst && { sorts: [{ timestamp: "created_time" as const, direction: "ascending" as const }] }),
  });
  return pages.filter(isFullPage);
}

export async function tasksResult(): Promise<Result<Task[]>> {
  "use cache";
  cacheTag(TAGS.tasks);
  try {
    const pages = await queryAll("NOTION_TASKS_DB");
    cacheLife(FIVE_MINUTES);
    return {
      ok: true,
      data: pages.map(({ id, url: pageUrl, created_time, properties: p }) => ({
        id,
        url: pageUrl,
        title: text(p, "Việc"),
        project: select(p, "Dự án"),
        status: select(p, "Trạng thái") as TaskStatus | null,
        priority: select(p, "Ưu tiên") as Priority | null,
        deadline: date(p, "Deadline"),
        plannedOn: date(p, "Ngày làm"),
        note: text(p, "Ghi chú"),
        doneOn: date(p, "Ngày xong"),
        createdTime: created_time,
        goalIds: relation(p, "Mục tiêu"),
      })),
    };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

export async function knowledgeResult(): Promise<Result<Knowledge[]>> {
  "use cache";
  cacheTag(TAGS.knowledge);
  try {
    const pages = await queryAll("NOTION_KNOWLEDGE_DB");
    cacheLife(FIVE_MINUTES);
    return {
      ok: true,
      data: pages.map(({ id, url: pageUrl, created_time, properties: p }) => ({
        id,
        url: pageUrl,
        title: text(p, "Chủ đề"),
        field: select(p, "Lĩnh vực"),
        level: select(p, "Mức hiểu"),
        summary: text(p, "Tóm tắt"),
        source: url(p, "Nguồn"),
        learnedOn: date(p, "Ngày học"),
        createdTime: created_time,
      })),
    };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

const toDailyLog = ({ id, url: pageUrl, properties: p }: PageObjectResponse): DailyLog => ({
  id,
  url: pageUrl,
  title: text(p, "Ngày"),
  date: date(p, "Date"),
  done: text(p, "Xong"),
  dropped: text(p, "Rơi / chưa xong"),
  learned: text(p, "Học được"),
  tomorrowTop3: text(p, "Ngày mai 3 việc"),
  exercised: checkbox(p, "Tập thể dục"),
  habits: multiSelect(p, "Thói quen"),
});

/** Chỉ cần vài bản ghi gần nhất (Today dùng bản ghi hôm qua). */
export async function dailyLogsResult(limit = 7): Promise<Result<DailyLog[]>> {
  "use cache";
  cacheTag(TAGS.daily);
  try {
    const res = await notion().dataSources.query({
      data_source_id: await dataSourceId("NOTION_DAILY_DB"),
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: limit,
    });
    cacheLife(FIVE_MINUTES);
    return { ok: true, data: res.results.filter(isFullPage).map(toDailyLog) };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

/** Daily Log từ `start` đến `end` (gồm cả hai đầu) — bảng thói quen theo tháng (SPEC-v0.4 3.3). */
export async function dailyLogsBetweenResult(start: string, end: string): Promise<Result<DailyLog[]>> {
  "use cache";
  cacheTag(TAGS.daily);
  try {
    const pages = await collectPaginatedAPI(notion().dataSources.query, {
      data_source_id: await dataSourceId("NOTION_DAILY_DB"),
      filter: {
        and: [
          { property: "Date", date: { on_or_after: start } },
          { property: "Date", date: { on_or_before: end } },
        ],
      },
    });
    cacheLife(FIVE_MINUTES);
    return { ok: true, data: pages.filter(isFullPage).map(toDailyLog) };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

/** Database Habits có cấu hình chưa (biến NOTION_HABITS_DB, thêm ở v0.4). */
export const habitsConfigured = () => Boolean(process.env.NOTION_HABITS_DB);

export async function habitsResult(): Promise<Result<Habit[]>> {
  "use cache";
  cacheTag(TAGS.habits);
  try {
    const pages = await queryAll("NOTION_HABITS_DB");
    cacheLife(FIVE_MINUTES);
    return {
      ok: true,
      data: pages
        .map(({ id, properties: p }) => ({
          id,
          name: text(p, "Tên").trim(),
          from: date(p, "Từ tháng") ?? "",
          to: date(p, "Đến tháng"),
          order: number(p, "Thứ tự") ?? 0,
        }))
        .filter((h) => h.name && h.from),
    };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

/** Database Goals có cấu hình chưa (biến NOTION_GOALS_DB, thêm ở v0.4 bước 3). */
export const goalsConfigured = () => Boolean(process.env.NOTION_GOALS_DB);

const LEVEL_FROM_NOTION = Object.fromEntries(Object.entries(LEVEL_NOTION).map(([k, v]) => [v, k])) as Record<string, Level>;

/** Mọi mục tiêu (database nhỏ: vài chục dòng / tháng) — trang lọc theo cấp + kỳ. */
export async function goalsResult(): Promise<Result<Goal[]>> {
  "use cache";
  cacheTag(TAGS.goals);
  try {
    const pages = await queryAll("NOTION_GOALS_DB", true); // giữ thứ tự tạo trong mỗi nhóm
    cacheLife(FIVE_MINUTES);
    return {
      ok: true,
      data: pages.flatMap(({ id, properties: p }) => {
        const level = LEVEL_FROM_NOTION[select(p, "Cấp") ?? ""];
        const start = date(p, "Kỳ");
        if (!level || !start) return []; // dòng tạo tay thiếu Cấp/Kỳ → bỏ qua
        return [
          {
            id,
            title: text(p, "Mục tiêu"),
            level,
            start,
            type: (select(p, "Loại") === "Ưu tiên" ? "Ưu tiên" : "Thường") as GoalType,
            done: checkbox(p, "Xong"),
            habitId: relation(p, "Thói quen")[0] ?? null,
            threshold: number(p, "Ngưỡng %"),
            taskIds: relation(p, "Tasks"),
          },
        ];
      }),
    };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}

/** Database Reflections có cấu hình chưa (biến NOTION_REFLECTIONS_DB, v0.4 bước 5). */
export const reflectionsConfigured = () => Boolean(process.env.NOTION_REFLECTIONS_DB);

export async function reflectionsResult(): Promise<Result<Reflection[]>> {
  "use cache";
  cacheTag(TAGS.reflections);
  try {
    const pages = await queryAll("NOTION_REFLECTIONS_DB");
    cacheLife(FIVE_MINUTES);
    return {
      ok: true,
      data: pages.flatMap(({ id, properties: p }) => {
        const level = LEVEL_FROM_NOTION[select(p, "Cấp") ?? ""];
        const start = date(p, "Kỳ");
        if (!level || !start) return [];
        return [
          {
            id,
            level,
            start,
            wentWell: text(p, REFLECTION_COLUMNS.wentWell),
            lesson: text(p, REFLECTION_COLUMNS.lesson),
            grateful: text(p, REFLECTION_COLUMNS.grateful),
            nextFocus: text(p, REFLECTION_COLUMNS.nextFocus),
            motto: text(p, REFLECTION_COLUMNS.motto),
          },
        ];
      }),
    };
  } catch (e) {
    cacheLife(ERROR_LIFE);
    return { ok: false, error: errorMessage(e) };
  }
}
