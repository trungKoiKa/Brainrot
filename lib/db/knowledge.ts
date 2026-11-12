// Knowledge (SPEC.md mục 5.6): lĩnh vực, ghi chú, liên kết "liên quan tới".
// Như mọi file lib/db/: mọi hàm nhận `userId` và mọi câu đọc / sửa / xoá đều kèm `user_id` (docs/decisions/0004).

import { and, asc, count, eq, inArray, or, sql } from "drizzle-orm";
import type { Db } from "./client";
import { fields, knowledge, knowledgeLinks } from "./schema";
import type { KnowledgeLevel, NoteInput } from "@/lib/knowledge";
import type { Knowledge } from "@/lib/types";

// ---------- Lĩnh vực ----------

export type FieldRow = { id: string; name: string; notes: number };

export async function listFieldNames(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ name: fields.name }).from(fields).where(eq(fields.userId, userId)).orderBy(asc(fields.sort), asc(fields.name));
  return rows.map((r) => r.name);
}

/** Lĩnh vực của người dùng kèm số ghi chú (Cài đặt → xoá chỉ khi 0 ghi chú). */
export async function listFieldsWithCounts(db: Db, userId: string): Promise<FieldRow[]> {
  const rows = await db
    .select({ id: fields.id, name: fields.name, notes: count(knowledge.id) })
    .from(fields)
    .leftJoin(knowledge, eq(knowledge.fieldId, fields.id))
    .where(eq(fields.userId, userId))
    .groupBy(fields.id, fields.name, fields.sort)
    .orderBy(asc(fields.sort), asc(fields.name));
  return rows.map((r) => ({ id: r.id, name: r.name, notes: Number(r.notes) }));
}

async function fieldNameTaken(db: Db, userId: string, name: string, exceptId?: string): Promise<boolean> {
  const rows = await db.select({ id: fields.id }).from(fields).where(and(eq(fields.userId, userId), eq(fields.name, name)));
  return rows.some((r) => r.id !== exceptId);
}

export async function createField(db: Db, userId: string, name: string): Promise<void> {
  if (await fieldNameTaken(db, userId, name)) throw new Error("Đã có lĩnh vực tên này");
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${fields.sort}), -1) + 1` })
    .from(fields)
    .where(eq(fields.userId, userId));
  await db.insert(fields).values({ userId, name, sort: Number(next) });
}

/** Đổi tên: ghi chú gắn lĩnh vực theo id nên tự theo tên mới. */
export async function renameField(db: Db, userId: string, id: string, name: string): Promise<void> {
  if (await fieldNameTaken(db, userId, name, id)) throw new Error("Đã có lĩnh vực tên này");
  const res = await db
    .update(fields)
    .set({ name })
    .where(and(eq(fields.id, id), eq(fields.userId, userId)))
    .returning({ id: fields.id });
  if (!res.length) throw new Error("Không tìm thấy lĩnh vực");
}

/** Chỉ xoá khi không còn ghi chú nào gắn (như dự án). */
export async function deleteField(db: Db, userId: string, id: string): Promise<void> {
  const [own] = await db.select({ id: fields.id }).from(fields).where(and(eq(fields.id, id), eq(fields.userId, userId)));
  if (!own) throw new Error("Không tìm thấy lĩnh vực");
  const [used] = await db.select({ n: sql<number>`count(*)` }).from(knowledge).where(eq(knowledge.fieldId, id));
  if (Number(used.n) > 0) throw new Error("Lĩnh vực còn ghi chú");
  await db.delete(fields).where(and(eq(fields.id, id), eq(fields.userId, userId)));
}

/** id lĩnh vực theo tên (của đúng user); tên rỗng / không có → null. */
async function fieldId(db: Db, userId: string, name: string | null): Promise<string | null> {
  if (!name) return null;
  const [row] = await db.select({ id: fields.id }).from(fields).where(and(eq(fields.userId, userId), eq(fields.name, name)));
  return row?.id ?? null;
}

// ---------- Ghi chú ----------

const ownNote = (userId: string, id: string) => and(eq(knowledge.id, id), eq(knowledge.userId, userId));

export async function listKnowledge(db: Db, userId: string): Promise<Knowledge[]> {
  const rows = await db
    .select({ k: knowledge, field: fields.name })
    .from(knowledge)
    .leftJoin(fields, eq(knowledge.fieldId, fields.id))
    .where(eq(knowledge.userId, userId))
    .orderBy(asc(knowledge.createdAt));
  if (rows.length === 0) return [];
  // Chỉ lấy liên kết mà đầu `from` là ghi chú của user này; đầu `to` được kiểm lại bằng tập id bên dưới
  const links = await db
    .select({ fromId: knowledgeLinks.fromId, toId: knowledgeLinks.toId })
    .from(knowledgeLinks)
    .innerJoin(knowledge, eq(knowledgeLinks.fromId, knowledge.id))
    .where(eq(knowledge.userId, userId));
  const mine = new Set(rows.map((r) => r.k.id));
  const related = new Map<string, string[]>();
  const add = (a: string, b: string) => related.set(a, [...(related.get(a) ?? []), b]);
  for (const l of links) {
    if (!mine.has(l.toId)) continue;
    add(l.fromId, l.toId);
    add(l.toId, l.fromId);
  }
  return rows.map(({ k, field }) => ({
    id: k.id,
    url: "",
    title: k.title,
    field,
    level: k.level,
    summary: k.summary,
    source: k.sourceUrl,
    learnedOn: k.learnedOn,
    createdTime: k.createdAt.toISOString(),
    related: related.get(k.id) ?? [],
  }));
}

/** Thay toàn bộ liên kết của một ghi chú. Chỉ nối tới ghi chú của chính user; bỏ qua id lạ và chính nó. */
async function setRelated(db: Db, userId: string, id: string, relatedIds: readonly string[]): Promise<void> {
  await db.delete(knowledgeLinks).where(or(eq(knowledgeLinks.fromId, id), eq(knowledgeLinks.toId, id)));
  const wanted = [...new Set(relatedIds)].filter((r) => r !== id);
  if (wanted.length === 0) return;
  const owned = await db
    .select({ id: knowledge.id })
    .from(knowledge)
    .where(and(eq(knowledge.userId, userId), inArray(knowledge.id, wanted)));
  if (owned.length === 0) return;
  await db
    .insert(knowledgeLinks)
    .values(owned.map((o) => (id < o.id ? { fromId: id, toId: o.id } : { fromId: o.id, toId: id })))
    .onConflictDoNothing();
}

export async function createNote(db: Db, userId: string, input: NoteInput): Promise<string> {
  const [row] = await db
    .insert(knowledge)
    .values({
      userId,
      title: input.title,
      fieldId: await fieldId(db, userId, input.field),
      level: input.level,
      summary: input.summary,
      sourceUrl: input.source,
      learnedOn: input.learnedOn,
    })
    .returning({ id: knowledge.id });
  await setRelated(db, userId, row.id, input.related);
  return row.id;
}

export async function updateNote(db: Db, userId: string, id: string, input: NoteInput): Promise<void> {
  const res = await db
    .update(knowledge)
    .set({
      title: input.title,
      fieldId: await fieldId(db, userId, input.field),
      level: input.level,
      summary: input.summary,
      sourceUrl: input.source,
      learnedOn: input.learnedOn,
    })
    .where(ownNote(userId, id))
    .returning({ id: knowledge.id });
  if (!res.length) throw new Error("Không tìm thấy ghi chú");
  await setRelated(db, userId, id, input.related);
}

/** Xoá thật (liên kết đi theo nhờ ON DELETE CASCADE). Hoàn tác bằng `restoreNote` với ảnh chụp phía client. */
export async function deleteNote(db: Db, userId: string, id: string): Promise<void> {
  const res = await db.delete(knowledge).where(ownNote(userId, id)).returning({ id: knowledge.id });
  if (!res.length) throw new Error("Không tìm thấy ghi chú");
}

export type NoteSnapshot = {
  id: string;
  title: string;
  field: string | null;
  level: KnowledgeLevel;
  summary: string;
  source: string | null;
  learnedOn: string | null;
  createdTime: string;
  related: string[];
};

/** Hoàn tác xoá: chèn lại đúng id với đủ trường và các liên kết còn tồn tại; id đã có thì không ghi đè. */
export async function restoreNote(db: Db, userId: string, s: NoteSnapshot): Promise<void> {
  const inserted = await db
    .insert(knowledge)
    .values({
      id: s.id,
      userId,
      title: s.title,
      fieldId: await fieldId(db, userId, s.field),
      level: s.level,
      summary: s.summary,
      sourceUrl: s.source,
      learnedOn: s.learnedOn,
      createdAt: new Date(s.createdTime),
    })
    .onConflictDoNothing()
    .returning({ id: knowledge.id });
  if (!inserted.length) return; // id đã tồn tại (của mình hoặc người khác) → không đụng
  await setRelated(db, userId, s.id, s.related);
}
