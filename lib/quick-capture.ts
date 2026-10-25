// Kiểm tra dữ liệu form "Ghi nhanh" (SPEC-v0.2 mục 4.1). Hàm thuần, không gọi Notion → test được.

/** Notion giới hạn 2000 ký tự cho một đoạn text trong rich_text. */
export const MAX_TEXT = 2000;

export type DailyLogInput = {
  done: string;
  dropped: string;
  learned: string;
  tomorrowTop3: string;
  /** null = form không có ô này (thẻ Thói quen lo phần đó, SPEC-v0.4 3.1) → không đụng tới thói quen */
  exercised: boolean | null;
};

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

const FIELD_LABELS: Record<Exclude<keyof DailyLogInput, "exercised">, string> = {
  done: "Xong",
  dropped: "Rơi / chưa xong",
  learned: "Học được",
  tomorrowTop3: "Ngày mai 3 việc",
};

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

export function parseDailyLog(form: FormData): Parsed<DailyLogInput> {
  const data: DailyLogInput = {
    done: text(form.get("done")),
    dropped: text(form.get("dropped")),
    learned: text(form.get("learned")),
    tomorrowTop3: text(form.get("tomorrowTop3")),
    // checkbox bỏ tích thì không gửi gì → dùng ô ẩn "exerciseField" để biết form có ô này hay không
    exercised: form.has("exerciseField") ? form.get("exercised") === "on" : null,
  };
  for (const [key, label] of Object.entries(FIELD_LABELS) as [keyof typeof FIELD_LABELS, string][]) {
    if (data[key].length > MAX_TEXT) return { ok: false, error: `"${label}" dài quá ${MAX_TEXT} ký tự.` };
  }
  if (!data.done && !data.dropped && !data.learned && !data.tomorrowTop3 && !data.exercised) {
    return { ok: false, error: "Chưa có gì để lưu." };
  }
  return { ok: true, data };
}

export function parseIdea(form: FormData): Parsed<string> {
  const idea = text(form.get("idea")).replace(/\s*\n\s*/g, " ");
  if (!idea) return { ok: false, error: "Ý tưởng đang trống." };
  if (idea.length > MAX_TEXT) return { ok: false, error: `Ý tưởng dài quá ${MAX_TEXT} ký tự.` };
  return { ok: true, data: idea };
}
