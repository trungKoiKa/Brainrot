import "server-only";
import { dailyLogsResult, knowledgeResult, selectOptions, tasksResult, type Result } from "./queries";
import type { DailyLog, Knowledge, Task } from "./types";

// Lớp đọc mà trang dùng (SPEC mục 9): Notion lỗi → trả bản tốt gần nhất + cờ `stale` để hiện banner.
// Bản tốt gần nhất giữ trong bộ nhớ tiến trình server: mất khi server khởi động lại (cold start trên Vercel).

export type Loaded<T> = { data: T; stale: boolean };

export class NotionUnavailableError extends Error {
  constructor(detail: string) {
    super(`Không lấy được dữ liệu từ Notion và chưa có bản cũ: ${detail}`);
    this.name = "NotionUnavailableError";
  }
}

const lastGood = new Map<string, unknown>();

export async function load<T>(key: string, fetch: () => Promise<Result<T>>): Promise<Loaded<T>> {
  const result = await fetch();
  if (result.ok) {
    lastGood.set(key, result.data);
    return { data: result.data, stale: false };
  }
  console.error(`Notion "${key}" lỗi:`, result.error);
  if (lastGood.has(key)) return { data: lastGood.get(key) as T, stale: true };
  throw new NotionUnavailableError(result.error);
}

export const getTasks = (): Promise<Loaded<Task[]>> => load("tasks", tasksResult);
export const getKnowledge = (): Promise<Loaded<Knowledge[]>> => load("knowledge", knowledgeResult);
export const getRecentDailyLogs = (): Promise<Loaded<DailyLog[]>> => load("daily", () => dailyLogsResult());
/** 90 bản ghi gần nhất cho Dashboard (SPEC-v0.3 4.4). */
export const getDailyLogs90 = (): Promise<Loaded<DailyLog[]>> => load("daily90", () => dailyLogsResult(90));

/**
 * Dự án chọn được khi thêm/sửa task: lựa chọn của select "Dự án" + dự án đang gán cho task
 * (schema cache lâu, nên lựa chọn mới thêm bên Notion vẫn có mặt nếu đã có task dùng).
 */
export async function getTaskProjects(tasks?: Task[]): Promise<string[]> {
  const [schema, used] = await Promise.all([
    selectOptions("NOTION_TASKS_DB", "Dự án"),
    tasks ?? getTasks().then((l) => l.data).catch(() => []),
  ]);
  return [...new Set([...schema, ...used.flatMap((t) => (t.project ? [t.project] : []))])];
}

export const anyStale = (...loaded: Loaded<unknown>[]) => loaded.some((l) => l.stale);
