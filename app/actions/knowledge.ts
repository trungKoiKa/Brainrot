"use server";

import { BAD_REQUEST, okOnly, runWrite, type OkResult } from "@/lib/db/actions-db";
import { createField, createNote, deleteField, deleteNote, renameField, restoreNote, updateNote, type NoteSnapshot } from "@/lib/db/knowledge";
import { isDay, isId } from "@/lib/ids";
import { KNOWLEDGE_LEVELS, MAX_FIELD_NAME, MAX_NOTE_TITLE, MAX_RELATED, cleanFieldName, cleanSourceUrl, parseNote } from "@/lib/knowledge";
import { MAX_TEXT } from "@/lib/quick-capture";
import { SESSION_EXPIRED, isSignedIn } from "@/lib/session";

// Knowledge (SPEC.md mục 5.6). userId luôn lấy từ cookie trong runWrite(), không nhận từ client.

export type NoteFormState = { ok?: boolean; error?: string; at?: number };
export type NoteResult = OkResult;
export type FieldState = { ok?: boolean; message?: string };

const EXPIRED = { ok: false, error: SESSION_EXPIRED } as const;
const INVALID = { ok: false, error: BAD_REQUEST } as const;
/** Lỗi đã biết từ lib/db/knowledge.ts → câu hiện cho người dùng */
const NOTE_ERRORS = { "Không tìm thấy ghi chú": "Ghi chú này không còn nữa." };
const FIELD_ERRORS = {
  "Lĩnh vực còn ghi chú": "Lĩnh vực còn ghi chú, chuyển hoặc xoá ghi chú trước.",
  "Đã có lĩnh vực tên này": "Đã có lĩnh vực tên này",
  "Không tìm thấy lĩnh vực": "Không tìm thấy lĩnh vực",
};

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
  if (!(await isSignedIn())) return EXPIRED;
  const parsed = fromForm(form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const r = await runWrite("createNote", (db, userId) => createNote(db, userId, parsed.data));
  return r.ok ? { ok: true, at: Date.now() } : r;
}

export async function updateNoteAction(_prev: NoteFormState, form: FormData): Promise<NoteFormState> {
  if (!(await isSignedIn())) return EXPIRED;
  const id = form.get("id");
  if (!isId(id)) return INVALID;
  const parsed = fromForm(form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const r = await runWrite("updateNote", (db, userId) => updateNote(db, userId, id, parsed.data), NOTE_ERRORS);
  return r.ok ? { ok: true, at: Date.now() } : r;
}

export async function deleteNoteAction(id: string): Promise<NoteResult> {
  if (!(await isSignedIn())) return EXPIRED;
  if (!isId(id)) return INVALID;
  return okOnly(await runWrite("deleteNote", (db, userId) => deleteNote(db, userId, id)));
}

/** Hoàn tác xoá: chèn lại ghi chú từ ảnh chụp phía client. Kiểm tra lại mọi trường như khi tạo mới. */
export async function restoreNoteAction(snapshot: NoteSnapshot): Promise<NoteResult> {
  if (!(await isSignedIn())) return EXPIRED;
  const s = snapshot as Partial<NoteSnapshot> | null;
  const source = s && typeof s.source === "string" ? cleanSourceUrl(s.source) : null;
  const valid =
    s !== null &&
    typeof s === "object" &&
    isId(s.id) &&
    typeof s.title === "string" &&
    s.title.trim().length > 0 &&
    s.title.length <= MAX_NOTE_TITLE &&
    (s.field === null || (typeof s.field === "string" && s.field.length <= MAX_FIELD_NAME)) &&
    typeof s.level === "string" &&
    (KNOWLEDGE_LEVELS as readonly string[]).includes(s.level) &&
    typeof s.summary === "string" &&
    s.summary.length <= MAX_TEXT &&
    (s.source === null || (typeof source === "string" && source === s.source)) &&
    (s.learnedOn === null || isDay(s.learnedOn)) &&
    typeof s.createdTime === "string" &&
    !Number.isNaN(Date.parse(s.createdTime)) &&
    Array.isArray(s.related) &&
    s.related.length <= MAX_RELATED &&
    s.related.every(isId);
  if (!valid) return INVALID;
  return okOnly(await runWrite("restoreNote", (db, userId) => restoreNote(db, userId, s as NoteSnapshot)));
}

// ---------- Lĩnh vực (Cài đặt) ----------

export async function createFieldAction(_prev: FieldState, form: FormData): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  const name = cleanFieldName(form.get("name"));
  if (typeof name !== "string") return { ok: false, message: name.error };
  const r = await runWrite("createField", (db, userId) => createField(db, userId, name), FIELD_ERRORS);
  return r.ok ? { ok: true, message: `Đã thêm “${name}”.` } : { ok: false, message: r.error };
}

export async function renameFieldAction(id: string, rawName: string): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (!isId(id)) return { ok: false, message: BAD_REQUEST };
  const name = cleanFieldName(rawName);
  if (typeof name !== "string") return { ok: false, message: name.error };
  const r = await runWrite("renameField", (db, userId) => renameField(db, userId, id, name), FIELD_ERRORS);
  return r.ok ? { ok: true, message: "Đã đổi tên." } : { ok: false, message: r.error };
}

export async function deleteFieldAction(id: string): Promise<FieldState> {
  if (!(await isSignedIn())) return { ok: false, message: SESSION_EXPIRED };
  if (!isId(id)) return { ok: false, message: BAD_REQUEST };
  const r = await runWrite("deleteField", (db, userId) => deleteField(db, userId, id), FIELD_ERRORS);
  return r.ok ? { ok: true, message: "Đã xoá lĩnh vực." } : { ok: false, message: r.error };
}
