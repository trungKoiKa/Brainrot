// Ghi chú kiến thức (SPEC.md mục 5.6). Hàm thuần, không gọi database → test được.
import { MAX_TEXT, type Parsed } from "./quick-capture";
import { fold } from "./graph-search";
import type { Knowledge } from "./types";

export const KNOWLEDGE_LEVELS = ["Mới học", "Hiểu", "Áp dụng được"] as const;
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number];

export const MAX_NOTE_TITLE = 200;
export const MAX_FIELD_NAME = 40;
export const MAX_SOURCE_URL = 500;
/** Số ghi chú "liên quan tới" tối đa của một ghi chú (đủ dùng, giữ graph đọc được) */
export const MAX_RELATED = 20;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NoteInput = {
  title: string;
  /** Tên lĩnh vực của người dùng; null = không có */
  field: string | null;
  level: KnowledgeLevel;
  summary: string;
  source: string | null;
  learnedOn: string | null;
  related: string[];
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Chỉ nhận http/https: link hiện ra là thẻ <a>, không cho `javascript:` hay scheme lạ. */
export function cleanSourceUrl(raw: string): string | null | { error: string } {
  if (!raw) return null;
  if (raw.length > MAX_SOURCE_URL) return { error: `Link nguồn tối đa ${MAX_SOURCE_URL} ký tự.` };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { error: "Link nguồn không hợp lệ (cần dạng https://…)." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Link nguồn phải bắt đầu bằng http:// hoặc https://." };
  return url.href;
}

/** Kiểm tra dữ liệu form thêm / sửa ghi chú. `related` là danh sách id cách nhau dấu phẩy. */
export function parseNote(form: {
  title: unknown;
  field: unknown;
  level: unknown;
  summary: unknown;
  source: unknown;
  learnedOn: unknown;
  related: unknown;
}): Parsed<NoteInput> {
  const title = text(form.title).replace(/\s+/g, " ");
  if (!title) return { ok: false, error: "Nhập tên ghi chú." };
  if (title.length > MAX_NOTE_TITLE) return { ok: false, error: `Tên ghi chú tối đa ${MAX_NOTE_TITLE} ký tự.` };

  const field = text(form.field);
  if (field.length > MAX_FIELD_NAME) return { ok: false, error: "Lĩnh vực không hợp lệ." };

  const level = text(form.level) || "Mới học";
  if (!KNOWLEDGE_LEVELS.includes(level as KnowledgeLevel)) return { ok: false, error: "Mức hiểu không hợp lệ." };

  const summary = text(form.summary);
  if (summary.length > MAX_TEXT) return { ok: false, error: `Tóm tắt tối đa ${MAX_TEXT} ký tự.` };

  const source = cleanSourceUrl(text(form.source));
  if (source !== null && typeof source === "object") return { ok: false, error: source.error };

  const learnedOn = text(form.learnedOn);
  if (learnedOn && !DAY.test(learnedOn)) return { ok: false, error: "Ngày học không hợp lệ." };

  const related = [...new Set(text(form.related).split(",").map((s) => s.trim()).filter(Boolean))];
  if (related.some((id) => !UUID.test(id))) return { ok: false, error: "Ghi chú liên quan không hợp lệ." };
  if (related.length > MAX_RELATED) return { ok: false, error: `Tối đa ${MAX_RELATED} ghi chú liên quan.` };

  return {
    ok: true,
    data: { title, field: field || null, level: level as KnowledgeLevel, summary, source, learnedOn: learnedOn || null, related },
  };
}

/** Tên lĩnh vực: gọn khoảng trắng, không rỗng, ≤ 40 ký tự. */
export function cleanFieldName(raw: unknown): string | { error: string } {
  const name = text(raw).replace(/\s+/g, " ");
  if (!name) return { error: "Nhập tên lĩnh vực." };
  if (name.length > MAX_FIELD_NAME) return { error: `Tên lĩnh vực tối đa ${MAX_FIELD_NAME} ký tự.` };
  return name;
}

/** Ngày xếp ghi chú: Ngày học, không có thì ngày tạo. */
export const noteDay = (k: Pick<Knowledge, "learnedOn" | "createdTime">) => k.learnedOn ?? k.createdTime.slice(0, 10);

/** Mới nhất trước (theo Ngày học, rồi lúc tạo). */
export function sortNotes<T extends Pick<Knowledge, "learnedOn" | "createdTime">>(notes: readonly T[]): T[] {
  return [...notes].sort((a, b) => noteDay(b).localeCompare(noteDay(a)) || b.createdTime.localeCompare(a.createdTime));
}

export type NoteFilter = { field: string | null; level: string | null; query: string };

/** Giá trị lọc "không có lĩnh vực" trong URL và chip lọc. */
export const NO_FIELD = "Không có lĩnh vực";

/** Lọc theo lĩnh vực, mức hiểu và chuỗi tìm (không dấu, khớp tên hoặc tóm tắt). */
export function filterNotes<T extends Pick<Knowledge, "title" | "summary" | "field" | "level">>(notes: readonly T[], f: NoteFilter): T[] {
  const q = fold(f.query);
  return notes.filter(
    (n) =>
      (f.field === null || (n.field ?? NO_FIELD) === f.field) &&
      (f.level === null || n.level === f.level) &&
      (q === "" || fold(n.title).includes(q) || fold(n.summary).includes(q)),
  );
}
