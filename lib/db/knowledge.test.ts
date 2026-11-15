import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "./client";
import {
  createField,
  createNote,
  deleteField,
  deleteNote,
  listFieldNames,
  listFieldsWithCounts,
  listKnowledge,
  renameField,
  restoreNote,
  updateNote,
} from "./knowledge";
import { deleteUser } from "./account";
import { DEFAULT_USER_ID, knowledge, knowledgeLinks, users } from "./schema";
import { createTestDb } from "./test-db";
import type { NoteInput } from "@/lib/knowledge";

let db: Db;
let close: () => Promise<void>;
let other: string; // người dùng thứ hai, để thử cách ly

const ME = DEFAULT_USER_ID;
const note = (title: string, extra: Partial<NoteInput> = {}): NoteInput => ({
  title,
  field: null,
  level: "Mới học",
  summary: "",
  source: null,
  learnedOn: null,
  related: [],
  ...extra,
});
const byTitle = async (userId: string, title: string) => (await listKnowledge(db, userId)).find((n) => n.title === title)!;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  [{ id: other }] = await db.insert(users).values({ name: "Bạn", email: "ban-kn@example.com" }).returning({ id: users.id });
}, 30_000);
afterAll(() => close());

describe("lĩnh vực", () => {
  it("thêm theo thứ tự, không trùng tên trong một người, hai người được trùng", async () => {
    await createField(db, ME, "Computer Vision");
    await createField(db, ME, "Nhúng");
    await expect(createField(db, ME, "Nhúng")).rejects.toThrow("Đã có lĩnh vực tên này");
    await createField(db, other, "Nhúng");
    expect(await listFieldNames(db, ME)).toEqual(["Computer Vision", "Nhúng"]);
    expect(await listFieldNames(db, other)).toEqual(["Nhúng"]);
  });

  it("đổi tên → ghi chú theo tên mới; còn ghi chú thì không xoá được", async () => {
    await createNote(db, ME, note("Chế độ ngủ ESP32", { field: "Nhúng" }));
    const nhung = (await listFieldsWithCounts(db, ME)).find((f) => f.name === "Nhúng")!;
    expect(nhung.notes).toBe(1);
    await renameField(db, ME, nhung.id, "Embedded");
    expect((await byTitle(ME, "Chế độ ngủ ESP32")).field).toBe("Embedded");
    await expect(deleteField(db, ME, nhung.id)).rejects.toThrow("Lĩnh vực còn ghi chú");
  });

  it("cách ly: không đổi tên / xoá được lĩnh vực của người khác", async () => {
    const [theirs] = await listFieldsWithCounts(db, other);
    await expect(renameField(db, ME, theirs.id, "Của tôi")).rejects.toThrow("Không tìm thấy lĩnh vực");
    await expect(deleteField(db, ME, theirs.id)).rejects.toThrow("Không tìm thấy lĩnh vực");
    expect(await listFieldNames(db, other)).toEqual(["Nhúng"]);
  });
});

describe("ghi chú", () => {
  it("tạo → đọc đủ trường; lĩnh vực lạ (không phải của mình) thành null", async () => {
    await createNote(
      db,
      ME,
      note("YOLOv8 head", { field: "Computer Vision", level: "Hiểu", summary: "Decoupled head", source: "https://example.com/yolo", learnedOn: "2026-11-10" }),
    );
    expect(await byTitle(ME, "YOLOv8 head")).toMatchObject({
      field: "Computer Vision",
      level: "Hiểu",
      summary: "Decoupled head",
      source: "https://example.com/yolo",
      learnedOn: "2026-11-10",
      related: [],
    });
    await createNote(db, other, note("Của bạn", { field: "Computer Vision" })); // "Computer Vision" là lĩnh vực của ME
    expect((await byTitle(other, "Của bạn")).field).toBeNull();
  });

  it("liên quan tới: hai chiều, mỗi cặp một dòng, sửa là thay toàn bộ", async () => {
    const yolo = await byTitle(ME, "YOLOv8 head");
    const esp = await byTitle(ME, "Chế độ ngủ ESP32");
    await createNote(db, ME, note("Anchor-free", { related: [yolo.id] }));
    const anchor = await byTitle(ME, "Anchor-free");
    expect(anchor.related).toEqual([yolo.id]);
    expect((await byTitle(ME, "YOLOv8 head")).related).toEqual([anchor.id]);

    // nối lại từ phía bên kia không tạo dòng thứ hai
    await updateNote(db, ME, yolo.id, note("YOLOv8 head", { field: "Computer Vision", level: "Hiểu", related: [anchor.id, esp.id, yolo.id] }));
    expect(await db.select().from(knowledgeLinks)).toHaveLength(2);
    expect((await byTitle(ME, "YOLOv8 head")).related.sort()).toEqual([anchor.id, esp.id].sort());

    await updateNote(db, ME, yolo.id, note("YOLOv8 head", { related: [] }));
    expect((await byTitle(ME, "YOLOv8 head")).related).toEqual([]);
    expect((await byTitle(ME, "Anchor-free")).related).toEqual([]);
  });

  it("cách ly: không đọc, sửa, xoá, nối tới ghi chú của người khác", async () => {
    const theirs = await byTitle(other, "Của bạn");
    const mine = await byTitle(ME, "Anchor-free");
    expect((await listKnowledge(db, ME)).some((n) => n.id === theirs.id)).toBe(false);
    await expect(updateNote(db, ME, theirs.id, note("Chiếm"))).rejects.toThrow("Không tìm thấy ghi chú");
    await expect(deleteNote(db, ME, theirs.id)).rejects.toThrow("Không tìm thấy ghi chú");
    expect((await byTitle(other, "Của bạn")).title).toBe("Của bạn");

    // nối tới ghi chú của người khác bị bỏ qua, cả hai phía đều không thấy
    await updateNote(db, ME, mine.id, note("Anchor-free", { related: [theirs.id] }));
    expect((await byTitle(ME, "Anchor-free")).related).toEqual([]);
    expect((await byTitle(other, "Của bạn")).related).toEqual([]);
  });

  it("xoá rồi hoàn tác: chèn lại đúng id, đủ trường, kèm liên kết còn tồn tại; không ghi đè id đã có", async () => {
    const yolo = await byTitle(ME, "YOLOv8 head");
    const anchor = await byTitle(ME, "Anchor-free");
    await updateNote(db, ME, anchor.id, note("Anchor-free", { field: "Computer Vision", summary: "không cần anchor", related: [yolo.id] }));
    const before = await byTitle(ME, "Anchor-free");

    await deleteNote(db, ME, anchor.id);
    expect(await byTitle(ME, "Anchor-free")).toBeUndefined();
    expect((await byTitle(ME, "YOLOv8 head")).related).toEqual([]);

    const snap = { ...before, level: before.level as "Mới học" };
    await restoreNote(db, ME, snap);
    expect(await byTitle(ME, "Anchor-free")).toEqual(before);
    expect((await byTitle(ME, "YOLOv8 head")).related).toEqual([anchor.id]);

    // người khác gửi ảnh chụp trùng id của mình → không đổi gì
    await restoreNote(db, other, { ...snap, title: "Chiếm chỗ" });
    expect((await byTitle(ME, "Anchor-free")).title).toBe("Anchor-free");
    expect((await listKnowledge(db, other)).some((n) => n.id === anchor.id)).toBe(false);
  });

  it("xoá tài khoản → ghi chú, lĩnh vực, liên kết đi theo", async () => {
    await createNote(db, other, note("Tạm", { related: [(await byTitle(other, "Của bạn")).id] }));
    await deleteUser(db, other);
    expect(await listKnowledge(db, other)).toEqual([]);
    expect(await listFieldNames(db, other)).toEqual([]);
    const left = await db.select({ id: knowledge.id }).from(knowledge);
    const links = await db.select().from(knowledgeLinks);
    expect(links.every((l) => left.some((k) => k.id === l.fromId) && left.some((k) => k.id === l.toId))).toBe(true);
  });
});
