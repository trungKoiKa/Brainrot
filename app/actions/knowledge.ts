"use server";

import { dbScope } from "@/lib/db/actions-db";
import { createField, createNote, deleteField, deleteNote, renameField, restoreNote, updateNote, type NoteSnapshot } from "@/lib/db/knowledge";
import { refreshData } from "@/lib/db/revalidate";
import { KNOWLEDGE_LEVELS, MAX_FIELD_NAME, MAX_NOTE_TITLE, MAX_RELATED, cleanFieldName, cleanSourceUrl, parseNote } from "@/lib/knowledge";
import { MAX_TEXT } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

// Knowledge (SPEC.md mục 10.1). userId luôn lấy từ cookie trong dbScope(), không nhận từ client.

export type NoteFormState = { ok?: boolean; error?: string; at?: number };
export type NoteResult = { ok: true } | { ok: false; error: string };
export type FieldState = { ok?: boolean; message?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WRITE_FAILED = "Không lưu được, thử lại sau.";

const fromForm = (form: FormData) =>
  parseNote({
    title: form.get("title"),
    field: form.get("field"),
    level: form.get("level"),
    summary: form.get("summary"),
    source: form.get("source"),
    learnedOn: form.get("learnedOn"),
    related: form.get("related"),
  });

export async function createNoteAction(_prev: NoteFormState, form: FormData): Promise<NoteFormState> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const parsed = fromForm(form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  try {
    const { db, userId } = await dbScope();
    await createNote(db, userId, parsed.data);
  } catch (e) {
    console.error("createNote failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true, at: Date.now() };
}

export async function updateNoteAction(_prev: NoteFormState, form: FormData): Promise<NoteFormState> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const id = form.get("id");
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  const parsed = fromForm(form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  try {
    const { db, userId } = await dbScope();
    await updateNote(db, userId, id, parsed.data);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "Không tìm thấy ghi chú") return { ok: false, error: "Ghi chú này không còn nữa." };
    console.error("updateNote failed:", m);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true, at: Date.now() };
}

export async function deleteNoteAction(id: string): Promise<NoteResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await deleteNote(db, userId, id);
  } catch (e) {
    console.error("deleteNote failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

/** Hoàn tác xoá: chèn lại ghi chú từ ảnh chụp phía client. Kiểm tra lại mọi trường như khi tạo mới. */
export async function restoreNoteAction(snapshot: NoteSnapshot): Promise<NoteResult> {
  if (!(await isSignedIn())) return { ok: false, error: SESSION_EXPIRED };
  const s = snapshot as Partial<NoteSnapshot> | null;
  const source = s && typeof s.source === "string" ? cleanSourceUrl(s.source) : null;
  const valid =
    s !== null &&
    typeof s === "object" &&
    typeof s.id === "string" &&
    UUID.test(s.id) &&
    typeof s.title === "string" &&
    s.title.trim().length > 0 &&
    s.title.length <= MAX_NOTE_TITLE &&
    (s.field === null || (typeof s.field === "string" && s.field.length <= MAX_FIELD_NAME)) &&
    typeof s.level === "string" &&
    (KNOWLEDGE_LEVELS as readonly string[]).includes(s.level) &&
    typeof s.summary === "string" &&
    s.summary.length <= MAX_TEXT &&
    (s.source === null || (typeof source === "string" && source === s.source)) &&
    (s.learnedOn === null || (typeof s.learnedOn === "string" && DAY.test(s.learnedOn))) &&
    typeof s.createdTime === "string" &&
    !Number.isNaN(Date.parse(s.createdTime)) &&
    Array.isArray(s.related) &&
    s.related.length <= MAX_RELATED &&
    s.related.every((r) => typeof r === "string" && UUID.test(r));
  if (!valid) return { ok: false, error: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await restoreNote(db, userId, s as NoteSnapshot);
  } catch (e) {
    console.error("restoreNote failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: WRITE_FAILED };
  }
  refreshData();
  return { ok: true };
}

// ---------- Lĩnh vực (Cài đặt) ----------

const fieldError = (e: unknown): string => {
  const m = e instanceof Error ? e.message : "";
  if (m === "Lĩnh vực còn ghi chú") return "Lĩnh vực còn ghi chú, chuyển hoặc xoá ghi chú trước.";
  if (m === "Đã có lĩnh vực tên này" || m === "Không tìm thấy lĩnh vực") return m;
  console.error("field action failed:", m);
  return WRITE_FAILED;
};

export async function createFieldAction(_prev: FieldState, form: FormData): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const name = cleanFieldName(form.get("name"));
  if (typeof name !== "string") return { ok: false, message: name.error };
  try {
    const { db, userId } = await dbScope();
    await createField(db, userId, name);
  } catch (e) {
    return { ok: false, message: fieldError(e) };
  }
  refreshData();
  return { ok: true, message: `Đã thêm “${name}”.` };
}

export async function renameFieldAction(id: string, rawName: string): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, message: "Yêu cầu không hợp lệ." };
  const name = cleanFieldName(rawName);
  if (typeof name !== "string") return { ok: false, message: name.error };
  try {
    const { db, userId } = await dbScope();
    await renameField(db, userId, id, name);
  } catch (e) {
    return { ok: false, message: fieldError(e) };
  }
  refreshData();
  return { ok: true, message: "Đã đổi tên." };
}

export async function deleteFieldAction(id: string): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, message: "Yêu cầu không hợp lệ." };
  try {
    const { db, userId } = await dbScope();
    await deleteField(db, userId, id);
  } catch (e) {
    return { ok: false, message: fieldError(e) };
  }
  refreshData();
  return { ok: true, message: "Đã xoá lĩnh vực." };
}
