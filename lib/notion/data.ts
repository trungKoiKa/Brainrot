import "server-only";
import { dailyLogsResult, knowledgeResult, tasksResult, type Result } from "./queries";
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

export const anyStale = (...loaded: Loaded<unknown>[]) => loaded.some((l) => l.stale);
