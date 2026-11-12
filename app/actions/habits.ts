"use server";

import { todayVN } from "@/lib/date";
import { habitsForMonth, MAX_HABIT_NAME } from "@/lib/habits";
import { dbScope } from "@/lib/db/actions-db";
import { getHabits } from "@/lib/db/data";
import { createHabit, deleteHabit, restoreHabit, setDayHabits, setHabitEnd, setHabitOrder, type HabitSnapshot } from "@/lib/db/mutations";
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

  const allowed = new Set(habitsForMonth((await getHabits()), monthOf(day)).map((h) => h.name));
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

  const habits = (await getHabits());
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
  const list = habitsForMonth((await getHabits()), month);
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
  const habit = (await getHabits()).find((h) => h.id === id);
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

const MONTH = /^\d{4}-\d{2}-01$/;

/** Xoá hẳn thói quen (SPEC.md mục 5.3, Trung chốt 11/11/2026); trả ảnh chụp để Hoàn tác. */
export async function deleteHabitAction(id: string): Promise<{ ok: true; snapshot: HabitSnapshot } | { ok: false; error: string }> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof id !== "string" || !PAGE_ID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    const snapshot = await deleteHabit(db, userId, id);
    if (!snapshot) return { ok: false, error: "Không tìm thấy thói quen." };
    refreshData();
    return { ok: true, snapshot };
  } catch (e) {
    console.error("deleteHabit failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
}

/** Hoàn tác xoá thói quen: kiểm tra kỹ ảnh chụp do trình duyệt gửi lại rồi chèn vào tài khoản đang đăng nhập. */
export async function restoreHabitAction(snap: HabitSnapshot): Promise<HabitResult> {
  const denied = await guard();
  if (denied) return denied;
  const h = snap?.habit;
  const valid =
    h &&
    typeof h.id === "string" &&
    PAGE_ID.test(h.id) &&
    typeof h.name === "string" &&
    h.name.trim().length > 0 &&
    h.name.length <= MAX_HABIT_NAME &&
    typeof h.fromMonth === "string" &&
    MONTH.test(h.fromMonth) &&
    (h.toMonth === null || (typeof h.toMonth === "string" && MONTH.test(h.toMonth))) &&
    Number.isInteger(h.sort) &&
    Array.isArray(snap.days) &&
    snap.days.length <= 4000 &&
    snap.days.every((d) => typeof d === "string" && DAY.test(d)) &&
    Array.isArray(snap.goals) &&
    snap.goals.length <= 200 &&
    snap.goals.every((g) => g && typeof g.id === "string" && PAGE_ID.test(g.id) && (g.threshold === null || (Number.isInteger(g.threshold) && g.threshold >= 1 && g.threshold <= 100)));
  if (!valid) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await restoreHabit(db, userId, snap);
    refreshData();
    return { ok: true };
  } catch (e) {
    console.error("restoreHabit failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
}
