"use server";

import { todayVN } from "@/lib/date";
import { habitsForMonth, MAX_HABIT_NAME } from "@/lib/habits";
import { dbScope } from "@/lib/db/actions-db";
import { getHabits } from "@/lib/db/data";
import { createHabit, setDayHabits, setHabitEnd, setHabitOrder } from "@/lib/db/mutations";
import { refreshData } from "@/lib/db/revalidate";
import { isMonthKey, monthOf } from "@/lib/period";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type HabitResult = { ok: true } | { ok: false; error: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE_FAILED = "Không lưu được, thử lại sau.";

async function guard(): Promise<HabitResult | null> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  return null;
}

/** Ghi các thói quen đã làm của `day`. Chỉ hôm nay và ngày đã qua; chỉ thói quen đang theo dõi trong tháng đó. */
export async function setDayHabitsAction(day: string, names: string[]): Promise<HabitResult> {
  const denied = await guard();
  if (denied) return denied;
  if (typeof day !== "string" || !DAY.test(day) || day > todayVN()) return { ok: false, error: "Ngày không hợp lệ." };
  if (!Array.isArray(names)) return { ok: false, error: "Danh sách thói quen không hợp lệ." };

  const allowed = new Set(habitsForMonth((await getHabits()).data, monthOf(day)).map((h) => h.name));
  const clean = [...new Set(names)].filter((n) => typeof n === "string" && allowed.has(n));

  try {
    const { db, userId } = await dbScope();
    await setDayHabits(db, userId, day, clean);
  } catch (e) {
    console.error("setDayHabits failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

export async function addHabitAction(month: string, rawName: string): Promise<HabitResult> {
  const denied = await guard();
  if (denied) return denied;
  const name = typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "";
  if (!isMonthKey(month)) return { ok: false, error: "Tháng không hợp lệ." };
  if (!name) return { ok: false, error: "Nhập tên thói quen." };
  if (name.length > MAX_HABIT_NAME) return { ok: false, error: `Tên tối đa ${MAX_HABIT_NAME} ký tự.` };

  const habits = (await getHabits()).data;
  if (habitsForMonth(habits, month).some((h) => h.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "Thói quen này đã có trong tháng." };
  }
  try {
    const { db, userId } = await dbScope();
    await createHabit(db, userId, name, `${month}-01`, Math.max(0, ...habits.map((h) => h.order)) + 1);
  } catch (e) {
    console.error("createHabit failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

/** Đổi chỗ thói quen với thói quen liền trên/dưới trong tháng `month`. */
export async function moveHabitAction(month: string, id: string, direction: -1 | 1): Promise<HabitResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!isMonthKey(month) || !PAGE_ID.test(id) || (direction !== -1 && direction !== 1)) {
    return { ok: false, error: "Yêu cầu không hợp lệ." };
  }
  const list = habitsForMonth((await getHabits()).data, month);
  const i = list.findIndex((h) => h.id === id);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= list.length) return { ok: true };

  // Đánh lại số thứ tự 1..n theo vị trí mới để không bị trùng số
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  try {
    const { db, userId } = await dbScope();
    await Promise.all(next.flatMap((h, k) => (h.order === k + 1 ? [] : [setHabitOrder(db, userId, h.id, k + 1)])));
  } catch (e) {
    console.error("moveHabit failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

/**
 * Ngừng theo dõi **từ tháng sau** `month` (Đến tháng = month) — tháng đang xem vẫn còn thói quen này.
 * Nếu thói quen mới bắt đầu ở chính tháng sau thì không có gì để ngừng.
 */
export async function stopHabitAction(month: string, id: string): Promise<HabitResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!isMonthKey(month) || !PAGE_ID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  const habit = (await getHabits()).data.find((h) => h.id === id);
  if (!habit) return { ok: false, error: "Không tìm thấy thói quen." };
  if (monthOf(habit.from) > month) return { ok: false, error: "Thói quen này chưa bắt đầu." };

  try {
    const { db, userId } = await dbScope();
    await setHabitEnd(db, userId, id, `${month}-01`);
  } catch (e) {
    console.error("stopHabit failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}
