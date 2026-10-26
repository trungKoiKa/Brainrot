// Nhìn lại theo kỳ (SPEC-v0.4 mục 5). Hàm thuần.
import { NEXT_LABEL } from "./goals";
import { MAX_TEXT, type Parsed } from "./quick-capture";
import { shiftPeriod, type Level, type Period } from "./period";

export type ReflectionFields = { wentWell: string; lesson: string; grateful: string; nextFocus: string; motto: string };
export type Reflection = ReflectionFields & { id: string; level: Level; start: string };

export const MAX_MOTTO = 300;

/** Tên cột Notion của từng ô. */
export const REFLECTION_COLUMNS: Record<keyof ReflectionFields, string> = {
  wentWell: "Làm tốt",
  lesson: "Bài học",
  grateful: "Biết ơn",
  nextFocus: "Tập trung tiếp",
  motto: "Châm ngôn",
};

/** 4 câu hỏi; câu 4 đổi chữ theo cấp ("…trong tuần/tháng/quý/năm tiếp theo là?"). */
export function reflectionQuestions(level: Level): { key: Exclude<keyof ReflectionFields, "motto">; label: string }[] {
  return [
    { key: "wentWell", label: "Điều gì tôi đã làm tốt và muốn tiếp tục phát huy?" },
    { key: "lesson", label: "Bài học quan trọng nhất tôi rút ra được là gì?" },
    { key: "grateful", label: "Tôi biết ơn về điều gì?" },
    { key: "nextFocus", label: `Ba mục tiêu tôi cần tập trung trong ${NEXT_LABEL[level]} tiếp theo là?` },
  ];
}

export const reflectionOf = (list: Reflection[], p: Period) => list.find((r) => r.level === p.level && r.start === p.start) ?? null;

/** "Kỳ trước bạn định tập trung" = câu 4 của kỳ liền trước, nếu có. */
export function previousFocus(list: Reflection[], p: Period): string | null {
  const prev = reflectionOf(list, shiftPeriod(p, -1));
  return prev?.nextFocus.trim() || null;
}

const text = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

/** Kiểm tra dữ liệu form; châm ngôn chỉ cho cấp Năm. Ô trống được phép (xóa nội dung). */
export function parseReflection(input: Partial<Record<keyof ReflectionFields, unknown>>, level: Level): Parsed<ReflectionFields> {
  const data: ReflectionFields = {
    wentWell: text(input.wentWell),
    lesson: text(input.lesson),
    grateful: text(input.grateful),
    nextFocus: text(input.nextFocus),
    motto: level === "year" ? text(input.motto).replace(/\s*\n\s*/g, " ") : "",
  };
  for (const q of reflectionQuestions(level)) {
    if (data[q.key].length > MAX_TEXT) return { ok: false, error: `"${q.label}" dài quá ${MAX_TEXT} ký tự.` };
  }
  if (data.motto.length > MAX_MOTTO) return { ok: false, error: `Châm ngôn tối đa ${MAX_MOTTO} ký tự.` };
  return { ok: true, data };
}
