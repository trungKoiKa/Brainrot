"use server";

import { workdayVN } from "@/lib/date";
import { dbScope } from "@/lib/db/actions-db";
import { createIdea, saveDailyLog } from "@/lib/db/mutations";
import { refreshData } from "@/lib/db/revalidate";
import { parseDailyLog, parseIdea } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type CaptureState = { ok?: boolean; message?: string; at?: number };

export async function saveDailyLogAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseDailyLog(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    const { db, userId } = await dbScope();
    const result = await saveDailyLog(db, userId, workdayVN(), parsed.data);
    refreshData(); // Today đọc lại Daily Log mới ngay
    return { ok: true, message: result === "created" ? "Đã tạo Daily Log hôm nay." : "Đã cập nhật Daily Log hôm nay.", at: Date.now() };
  } catch (e) {
    console.error("saveDailyLog failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Không lưu được, thử lại sau." };
  }
}

export async function addIdeaAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseIdea(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    const { db, userId } = await dbScope();
    await createIdea(db, userId, parsed.data);
    return { ok: true, message: "Đã lưu ý tưởng.", at: Date.now() };
  } catch (e) {
    console.error("createIdea failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Không lưu được, thử lại sau." };
  }
}
