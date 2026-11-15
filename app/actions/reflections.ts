"use server";

import { BAD_REQUEST, runWrite } from "@/lib/db/actions-db";
import { saveReflection } from "@/lib/db/goals";
import { LEVELS, parsePeriod, type Level } from "@/lib/period";
import { parseReflection, type ReflectionFields } from "@/lib/reflections";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type ReflectionResult = { ok: true; message: string } | { ok: false; error: string };

/** Lưu Nhìn lại của kỳ `key` (SPEC.md mục 5.3); "Kỳ" do server tính từ key. */
export async function saveReflectionAction(
  level: Level,
  key: string,
  input: Partial<Record<keyof ReflectionFields, unknown>>,
): Promise<ReflectionResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const period = LEVELS.includes(level) ? parsePeriod(level, key) : null;
  if (!period || typeof input !== "object" || input === null) return { ok: false, error: BAD_REQUEST };
  const parsed = parseReflection(input, period.level);
  if (!parsed.ok) return parsed;
  const r = await runWrite("saveReflection", (db, userId) => saveReflection(db, userId, period.level, period.start, parsed.data));
  if (!r.ok) return r;
  return { ok: true, message: r.value === "created" ? "Đã lưu nhìn lại." : "Đã cập nhật nhìn lại." };
}
