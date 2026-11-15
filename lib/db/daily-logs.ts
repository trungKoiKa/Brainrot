// Daily Log, thói quen đã tích theo ngày và ý tưởng ghi nhanh (Today, SPEC.md mục 5.1): đọc + ghi, lọc theo `userId`.

import { and, asc, desc, eq, gte, lte, inArray } from "drizzle-orm";
import type { Db } from "./client";
import { dailyLogs, habitDays, habits, ideas } from "./schema";
import type { DailyLog } from "@/lib/types";
import { LEGACY_EXERCISE } from "@/lib/habits";
import type { DailyLogInput } from "@/lib/quick-capture";

/** Daily Log kèm tên các thói quen đã làm (từ habit_days) — cùng dạng `DailyLog` như thời Notion. */
async function withHabits(db: Db, userId: string, logs: (typeof dailyLogs.$inferSelect)[]): Promise<DailyLog[]> {
  if (!logs.length) return [];
  const days = logs.map((l) => l.day);
  const rows = await db
    .select({ day: habitDays.day, name: habits.name })
    .from(habitDays)
    .innerJoin(habits, eq(habitDays.habitId, habits.id))
    .where(and(eq(habits.userId, userId), inArray(habitDays.day, days)))
    .orderBy(asc(habits.sort), asc(habits.name));
  const namesOf = new Map<string, string[]>();
  for (const r of rows) namesOf.set(r.day, [...(namesOf.get(r.day) ?? []), r.name]);
  return logs.map((l) => ({
    id: l.id,
    title: l.day,
    date: l.day,
    done: l.done,
    dropped: l.dropped,
    learned: l.learned,
    tomorrowTop3: "", // đã thay bằng "Ngày mai làm" (Ngày làm của task), SPEC.md mục 3
    exercised: l.exercised,
    habits: namesOf.get(l.day) ?? [],
  }));
}

/** `limit` ngày gần nhất có Daily Log (mới trước). */
export async function listRecentDailyLogs(db: Db, userId: string, limit = 7): Promise<DailyLog[]> {
  const rows = await db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId)).orderBy(desc(dailyLogs.day)).limit(limit);
  return withHabits(db, userId, rows);
}

/** Từ `start` đến `end`, gồm cả hai đầu. */
export async function listDailyLogsBetween(db: Db, userId: string, start: string, end: string): Promise<DailyLog[]> {
  const rows = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.day, start), lte(dailyLogs.day, end)))
    .orderBy(asc(dailyLogs.day));
  return withHabits(db, userId, rows);
}

async function upsertDay(db: Db, userId: string, day: string, values: Partial<typeof dailyLogs.$inferInsert>): Promise<"created" | "updated"> {
  const [existing] = await db.select({ id: dailyLogs.id }).from(dailyLogs).where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.day, day)));
  if (existing) {
    if (Object.keys(values).length) await db.update(dailyLogs).set(values).where(eq(dailyLogs.id, existing.id));
    return "updated";
  }
  await db.insert(dailyLogs).values({ ...values, userId, day });
  return "created";
}

/** Mỗi ngày 1 bản ghi (SPEC.md mục 3). Ô "Tập thể dục" cũ (nếu form có) bật/tắt cột `exercised`. */
export async function saveDailyLog(db: Db, userId: string, day: string, input: DailyLogInput): Promise<"created" | "updated"> {
  return upsertDay(db, userId, day, {
    done: input.done,
    dropped: input.dropped,
    learned: input.learned,
    ...(input.exercised !== null && { exercised: input.exercised }),
  });
}

/** Ghi **toàn bộ** thói quen đã làm của `day` (không bật/tắt lẻ → hai lần bấm nhanh không ghi đè nhau sai). */
export async function setDayHabits(db: Db, userId: string, day: string, names: string[]): Promise<void> {
  await upsertDay(db, userId, day, {}); // ngày có thói quen cũng là một ngày có Daily Log
  const mine = await db.select({ id: habits.id, name: habits.name }).from(habits).where(eq(habits.userId, userId));
  const mineIds = mine.map((h) => h.id);
  if (mineIds.length) await db.delete(habitDays).where(and(eq(habitDays.day, day), inArray(habitDays.habitId, mineIds)));
  const chosen = mine.filter((h) => names.includes(h.name));
  if (chosen.length) await db.insert(habitDays).values(chosen.map((h) => ({ habitId: h.id, day })));
  // Checkbox "Tập thể dục" cũ không còn nguồn thứ hai: thói quen cùng tên là sự thật duy nhất
  if (mine.some((h) => h.name === LEGACY_EXERCISE)) await db.update(dailyLogs).set({ exercised: false }).where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.day, day)));
}

export async function createIdea(db: Db, userId: string, idea: string): Promise<void> {
  await db.insert(ideas).values({ userId, text: idea });
}

// ---------- Goals ----------
