"use server";

import { updateTag } from "next/cache";
import { todayVN } from "@/lib/date";
import { createIdea, saveDailyLog } from "@/lib/notion/mutations";
import { TAGS } from "@/lib/notion/queries";
import { parseDailyLog, parseIdea } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

export type CaptureState = { ok?: boolean; message?: string; at?: number };

export async function saveDailyLogAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseDailyLog(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    const result = await saveDailyLog(todayVN(), parsed.data);
    updateTag(TAGS.daily); // Today đọc lại Daily Log mới ngay
    return { ok: true, message: result === "created" ? "Đã tạo Daily Log hôm nay." : "Đã cập nhật Daily Log hôm nay.", at: Date.now() };
  } catch (e) {
    console.error("saveDailyLog failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Không ghi được lên Notion, thử lại sau." };
  }
}

export async function addIdeaAction(_prev: CaptureState, form: FormData): Promise<CaptureState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const parsed = parseIdea(form);
  if (!parsed.ok) return { ok: false, message: parsed.error };

  try {
    await createIdea(todayVN(), parsed.data);
    return { ok: true, message: "Đã lưu ý tưởng.", at: Date.now() };
  } catch (e) {
    console.error("createIdea failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Không ghi được lên Notion, thử lại sau." };
  }
}
