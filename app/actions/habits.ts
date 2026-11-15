"use server";

import { todayVN } from "@/lib/date";
import { habitsForMonth, MAX_HABIT_NAME } from "@/lib/habits";
import { BAD_REQUEST, okOnly, runWrite, type OkResult } from "@/lib/db/actions-db";
import { getHabits } from "@/lib/db/data";
import { setDayHabits } from "@/lib/db/daily-logs";
import { createHabit, deleteHabit, restoreHabit, setHabitEnd, setHabitOrder, type HabitSnapshot } from "@/lib/db/habits";
import { isDay, isId } from "@/lib/ids";
import { isMonthKey, monthOf } from "@/lib/period";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type HabitResult = OkResult;

const EXPIRED = { ok: false, error: SESSION_EXPIRED } as const;
const INVALID = { ok: false, error: BAD_REQUEST } as const;
const NOT_FOUND = "Không tìm thấy thói quen.";

/** Ghi các thói quen đã làm của `day`. Chỉ hôm nay và ngày đã qua; chỉ thói quen đang theo dõi trong tháng đó. */
export async function setDayHabitsAction(day: string, names: string[]): Promise<HabitResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isDay(day) || day > todayVN()) return { ok: false, error: "Ngày không hợp lệ." };
  if (!Array.isArray(names)) return { ok: false, error: "Danh sách thói quen không hợp lệ." };

  const allowed = new Set(habitsForMonth(await getHabits(), monthOf(day)).map((h) => h.name));
  const clean = [...new Set(names)].filter((n) => typeof n === "string" && allowed.has(n));
  return okOnly(await runWrite("setDayHabits", (db, userId) => setDayHabits(db, userId, day, clean)));
}

export async function addHabitAction(month: string, rawName: string): Promise<HabitResult> {
  if (!(await isSignedIn())) return EXPIRED;
  const name = typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "";
  if (!isMonthKey(month)) return { ok: false, error: "Tháng không hợp lệ." };
  if (!name) return { ok: false, error: "Nhập tên thói quen." };
  if (name.length > MAX_HABIT_NAME) return { ok: false, error: `Tên tối đa ${MAX_HABIT_NAME} ký tự.` };

  const habits = await getHabits();
  if (habitsForMonth(habits, month).some((h) => h.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "Thói quen này đã có trong tháng." };
  }
  const order = Math.max(0, ...habits.map((h) => h.order)) + 1;
  return okOnly(await runWrite("createHabit", (db, userId) => createHabit(db, userId, name, `${month}-01`, order)));
}

/** Đổi chỗ thói quen với thói quen liền trên/dưới trong tháng `month`. */
export async function moveHabitAction(month: string, id: string, direction: -1 | 1): Promise<HabitResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isMonthKey(month) || !isId(id) || (direction !== -1 && direction !== 1)) return INVALID;
  const list = habitsForMonth(await getHabits(), month);
  const i = list.findIndex((h) => h.id === id);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= list.length) return { ok: true };

  // Đánh lại số thứ tự 1..n theo vị trí mới để không bị trùng số
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return okOnly(
    await runWrite("moveHabit", (db, userId) =>
      Promise.all(next.flatMap((h, k) => (h.order === k + 1 ? [] : [setHabitOrder(db, userId, h.id, k + 1)]))),
    ),
  );
}

/**
 * Ngừng theo dõi **từ tháng sau** `month` (Đến tháng = month) — tháng đang xem vẫn còn thói quen này.
 * Nếu thói quen mới bắt đầu ở chính tháng sau thì không có gì để ngừng.
 */
export async function stopHabitAction(month: string, id: string): Promise<HabitResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isMonthKey(month) || !isId(id)) return INVALID;
  const habit = (await getHabits()).find((h) => h.id === id);
  if (!habit) return { ok: false, error: NOT_FOUND };
  if (monthOf(habit.from) > month) return { ok: false, error: "Thói quen này chưa bắt đầu." };
  return okOnly(await runWrite("stopHabit", (db, userId) => setHabitEnd(db, userId, id, `${month}-01`)));
}

const MONTH = /^\d{4}-\d{2}-01$/;

/** Xoá hẳn thói quen (SPEC.md mục 5.3, Trung chốt 11/11/2026); trả ảnh chụp để Hoàn tác. */
export async function deleteHabitAction(id: string): Promise<{ ok: true; snapshot: HabitSnapshot } | { ok: false; error: string }> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id)) return INVALID;
  const r = await runWrite("deleteHabit", (db, userId) => deleteHabit(db, userId, id));
  if (!r.ok) return r;
  return r.value ? { ok: true, snapshot: r.value } : { ok: false, error: NOT_FOUND };
}

/** Hoàn tác xoá thói quen: kiểm tra kỹ ảnh chụp do trình duyệt gửi lại rồi chèn vào tài khoản đang đăng nhập. */
export async function restoreHabitAction(snap: HabitSnapshot): Promise<HabitResult> {
  if (!(await isSignedIn())) return EXPIRED;
  const h = snap?.habit;
  const valid =
    h &&
    isId(h.id) &&
    typeof h.name === "string" &&
    h.name.trim().length > 0 &&
    h.name.length <= MAX_HABIT_NAME &&
    typeof h.fromMonth === "string" &&
    MONTH.test(h.fromMonth) &&
    (h.toMonth === null || (typeof h.toMonth === "string" && MONTH.test(h.toMonth))) &&
    Number.isInteger(h.sort) &&
    Array.isArray(snap.days) &&
    snap.days.length <= 4000 &&
    snap.days.every(isDay) &&
    Array.isArray(snap.goals) &&
    snap.goals.length <= 200 &&
    snap.goals.every((g) => g && isId(g.id) && (g.threshold === null || (Number.isInteger(g.threshold) && g.threshold >= 1 && g.threshold <= 100)));
  if (!valid) return INVALID;
  return okOnly(await runWrite("restoreHabit", (db, userId) => restoreHabit(db, userId, snap)));
}
