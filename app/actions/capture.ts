"use server";

import { workdayVN } from "@/lib/date";
import { runWrite } from "@/lib/db/actions-db";
import { createIdea, saveDailyLog } from "@/lib/db/mutations";
import { parseDailyLog, parseIdea } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type CaptureState = { ok?: boolean; message?: string; at?: number };

export async function saveDailyLogAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseDailyLog(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const r = await runWrite("saveDailyLog", (db, userId) => saveDailyLog(db, userId, workdayVN(), parsed.data));
  if (!r.ok) return { ok: false, message: r.error };
  return { ok: true, message: r.value === "created" ? "Đã tạo Daily Log hôm nay." : "Đã cập nhật Daily Log hôm nay.", at: Date.now() };
}

export async function addIdeaAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseIdea(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const r = await runWrite("createIdea", (db, userId) => createIdea(db, userId, parsed.data));
  if (!r.ok) return { ok: false, message: r.error };
  return { ok: true, message: "Đã lưu ý tưởng.", at: Date.now() };
}
