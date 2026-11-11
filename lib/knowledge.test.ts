import { describe, expect, it } from "vitest";
import { NO_FIELD, cleanFieldName, cleanSourceUrl, filterNotes, parseNote, sortNotes } from "./knowledge";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const form = (extra: Record<string, unknown> = {}) => ({ title: "YOLOv8 head", field: "", level: "", summary: "", source: "", learnedOn: "", related: "", ...extra });

describe("parseNote", () => {
  it("chỉ cần tên; mức hiểu mặc định Mới học; trường trống thành null", () => {
    expect(parseNote(form({ title: "  YOLOv8   head " }))).toEqual({
      ok: true,
      data: { title: "YOLOv8 head", field: null, level: "Mới học", summary: "", source: null, learnedOn: null, related: [] },
    });
  });

  it("từ chối tên rỗng, mức hiểu lạ, ngày sai dạng, id liên quan sai dạng", () => {
    expect(parseNote(form({ title: "   " })).ok).toBe(false);
    expect(parseNote(form({ level: "Siêu" })).ok).toBe(false);
    expect(parseNote(form({ learnedOn: "06/12/2026" })).ok).toBe(false);
    expect(parseNote(form({ related: "abc" })).ok).toBe(false);
    expect(parseNote(form({ summary: "x".repeat(2001) })).ok).toBe(false);
  });

  it("liên quan: tách dấu phẩy, bỏ trùng", () => {
    const r = parseNote(form({ related: `${A}, ${B},${A}` }));
    expect(r.ok && r.data.related).toEqual([A, B]);
  });
});

describe("cleanSourceUrl", () => {
  it("nhận http/https, trống → null", () => {
    expect(cleanSourceUrl("")).toBeNull();
    expect(cleanSourceUrl("https://arxiv.org/abs/1506.02640")).toBe("https://arxiv.org/abs/1506.02640");
  });
  it("từ chối scheme khác (javascript:, data:) và chuỗi không phải URL", () => {
    expect(cleanSourceUrl("javascript:alert(1)")).toHaveProperty("error");
    expect(cleanSourceUrl("data:text/html,x")).toHaveProperty("error");
    expect(cleanSourceUrl("arxiv.org")).toHaveProperty("error");
  });
});

describe("cleanFieldName", () => {
  it("gọn khoảng trắng; rỗng hoặc quá 40 ký tự thì lỗi", () => {
    expect(cleanFieldName("  Computer   Vision ")).toBe("Computer Vision");
    expect(cleanFieldName(" ")).toHaveProperty("error");
    expect(cleanFieldName("x".repeat(41))).toHaveProperty("error");
  });
});

describe("sortNotes / filterNotes", () => {
  const notes = [
    { title: "Đọc paper YOLO", summary: "", field: "Computer Vision", level: "Hiểu", learnedOn: "2026-11-01", createdTime: "2026-11-01T02:00:00Z" },
    { title: "MQTT QoS", summary: "giữ kết nối khi mất Wi-Fi", field: null, level: "Mới học", learnedOn: null, createdTime: "2026-11-05T02:00:00Z" },
    { title: "Chế độ ngủ ESP32", summary: "", field: "Nhúng", level: "Áp dụng được", learnedOn: "2026-11-03", createdTime: "2026-10-20T02:00:00Z" },
  ];

  it("mới nhất trước: theo Ngày học, không có thì ngày tạo", () => {
    expect(sortNotes(notes).map((n) => n.title)).toEqual(["MQTT QoS", "Chế độ ngủ ESP32", "Đọc paper YOLO"]);
  });

  it("lọc theo lĩnh vực (kể cả 'không có'), mức hiểu, và tìm không dấu trong tên + tóm tắt", () => {
    expect(filterNotes(notes, { field: "Nhúng", level: null, query: "" }).map((n) => n.title)).toEqual(["Chế độ ngủ ESP32"]);
    expect(filterNotes(notes, { field: NO_FIELD, level: null, query: "" }).map((n) => n.title)).toEqual(["MQTT QoS"]);
    expect(filterNotes(notes, { field: null, level: "Hiểu", query: "" })).toHaveLength(1);
    expect(filterNotes(notes, { field: null, level: null, query: "doc" }).map((n) => n.title)).toEqual(["Đọc paper YOLO"]);
    expect(filterNotes(notes, { field: null, level: null, query: "mat wi-fi" }).map((n) => n.title)).toEqual(["MQTT QoS"]);
  });
});
