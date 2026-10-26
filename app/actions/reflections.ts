"use server";

import { updateTag } from "next/cache";
import { saveReflection } from "@/lib/notion/mutations";
import { TAGS } from "@/lib/notion/queries";
import { LEVELS, parsePeriod, periodLabel, type Level } from "@/lib/period";
import { parseReflection, type ReflectionFields } from "@/lib/reflections";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type ReflectionResult = { ok: true; message: string } | { ok: false; error: string };

/** Lưu Nhìn lại của kỳ `key` (SPEC-v0.4 mục 5); "Kỳ" do server tính từ key. */
export async function saveReflectionAction(
  level: Level,
  key: string,
  input: Partial<Record<keyof ReflectionFields, unknown>>,
): Promise<ReflectionResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (!process.env.NOTION_REFLECTIONS_DB) return { ok: false, error: "Chưa kết nối database Reflections (NOTION_REFLECTIONS_DB)." };
  const period = LEVELS.includes(level) ? parsePeriod(level, key) : null;
  if (!period || typeof input !== "object" || input === null) return { ok: false, error: "Yêu cầu không hợp lệ." };
  const parsed = parseReflection(input, period.level);
  if (!parsed.ok) return parsed;

  try {
    const result = await saveReflection(period.level, period.start, periodLabel(period), parsed.data);
    updateTag(TAGS.reflections);
    return { ok: true, message: result === "created" ? "Đã lưu nhìn lại." : "Đã cập nhật nhìn lại." };
  } catch (e) {
    console.error("saveReflection failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Không ghi được lên Notion, thử lại sau." };
  }
}
