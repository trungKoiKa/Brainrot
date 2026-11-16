// Thói quen (Goal, SPEC.md mục 5.3): đọc + ghi, lọc theo `userId`.

import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "./client";
import { goals, habitDays, habits } from "./schema";
import type { Habit } from "@/lib/types";

export async function listHabits(db: Db, userId: string): Promise<Habit[]> {
  const rows = await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(asc(habits.sort), asc(habits.name));
  return rows.map((h) => ({ id: h.id, name: h.name, from: h.fromMonth, to: h.toMonth, order: h.sort }));
}

/** Thêm thói quen, theo dõi từ tháng `from` (YYYY-MM-01). */
/** Ảnh chụp một thói quen trước khi xoá — đủ để Hoàn tác (SPEC.md mục 3, Trung chốt 11/11/2026). */
export type HabitSnapshot = {
  habit: { id: string; name: string; fromMonth: string; toMonth: string | null; sort: number };
  days: string[];
  goals: { id: string; threshold: number | null }[];
};

/**
 * Xoá hẳn thói quen của đúng user: các ngày đã tích xoá theo (cascade), mục tiêu đang gắn bị gỡ liên kết.
 * Trả ảnh chụp để Hoàn tác; không tìm thấy (hoặc của người khác) → null.
 */
export async function deleteHabit(db: Db, userId: string, id: string): Promise<HabitSnapshot | null> {
  // Ba truy vấn đọc chạy song song (mỗi lượt đi về Neon tốn vài trăm ms); ngày đã tích chỉ dùng khi
  // thói quen đúng là của userId, không thì bỏ kết quả và trả null.
  const [[h], days, linked] = await Promise.all([
    db
      .select({ id: habits.id, name: habits.name, fromMonth: habits.fromMonth, toMonth: habits.toMonth, sort: habits.sort })
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId))),
    db.select({ day: habitDays.day }).from(habitDays).where(eq(habitDays.habitId, id)),
    db
      .select({ id: goals.id, threshold: goals.threshold })
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.habitId, id))),
  ]);
  if (!h) return null;
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));
  return { habit: h, days: days.map((d) => d.day), goals: linked };
}

/**
 * Hoàn tác xoá thói quen: chèn lại đúng id, các ngày đã tích và liên kết mục tiêu. Chỉ ghi vào tài khoản `userId`;
 * mục tiêu chỉ gắn lại khi vẫn của user đó và chưa gắn thói quen khác. id đã tồn tại → không làm gì.
 */
export async function restoreHabit(db: Db, userId: string, snap: HabitSnapshot): Promise<void> {
  const { habit, days, goals: linked } = snap;
  const inserted = await db
    .insert(habits)
    .values({ id: habit.id, userId, name: habit.name, fromMonth: habit.fromMonth, toMonth: habit.toMonth, sort: habit.sort })
    .onConflictDoNothing()
    .returning({ id: habits.id });
  if (!inserted.length) return;
  if (days.length) await db.insert(habitDays).values(days.map((day) => ({ habitId: habit.id, day }))).onConflictDoNothing();
  for (const g of linked) {
    await db
      .update(goals)
      .set({ habitId: habit.id, threshold: g.threshold })
      .where(and(eq(goals.id, g.id), eq(goals.userId, userId), isNull(goals.habitId)));
  }
}

export async function createHabit(db: Db, userId: string, name: string, from: string, order: number): Promise<void> {
  await db.insert(habits).values({ userId, name, fromMonth: from, sort: order });
}

export async function setHabitOrder(db: Db, userId: string, id: string, order: number): Promise<void> {
  await db.update(habits).set({ sort: order }).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

/** Ngừng theo dõi sau tháng `to` (YYYY-MM-01); null = theo dõi lại. Lịch sử giữ nguyên. */
export async function setHabitEnd(db: Db, userId: string, id: string, to: string | null): Promise<void> {
  await db.update(habits).set({ toMonth: to }).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}
