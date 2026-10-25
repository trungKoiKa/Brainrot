import { describe, expect, it } from "vitest";
import { MAX_TEXT, parseDailyLog, parseIdea } from "./quick-capture";

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("parseIdea", () => {
  it("cắt khoảng trắng, gộp nhiều dòng thành một", () => {
    expect(parseIdea(form({ idea: "  thử YOLOv8\n cho đồ án  " }))).toEqual({ ok: true, data: "thử YOLOv8 cho đồ án" });
  });
  it("rỗng / quá dài → lỗi", () => {
    expect(parseIdea(form({ idea: "   " })).ok).toBe(false);
    expect(parseIdea(new FormData()).ok).toBe(false);
    expect(parseIdea(form({ idea: "x".repeat(MAX_TEXT + 1) })).ok).toBe(false);
  });
});

describe("parseDailyLog", () => {
  it("đọc đủ 5 trường, chuẩn hóa xuống dòng Windows, checkbox 'on'", () => {
    expect(
      parseDailyLog(form({ done: "Viết chương 2\r\n", dropped: "", learned: "YOLO", tomorrowTop3: "a\r\nb\r\nc", exerciseField: "1", exercised: "on" })),
    ).toEqual({ ok: true, data: { done: "Viết chương 2", dropped: "", learned: "YOLO", tomorrowTop3: "a\nb\nc", exercised: true } });
  });
  it("chỉ tích Tập thể dục vẫn lưu được", () => {
    expect(parseDailyLog(form({ exerciseField: "1", exercised: "on" })).ok).toBe(true);
  });
  it("có ô Tập thể dục nhưng bỏ tích → false; form không có ô → null (không đụng thói quen)", () => {
    expect(parseDailyLog(form({ done: "x", exerciseField: "1" }))).toMatchObject({ ok: true, data: { exercised: false } });
    expect(parseDailyLog(form({ done: "x" }))).toMatchObject({ ok: true, data: { exercised: null } });
  });
  it("trống hết → lỗi 'Chưa có gì để lưu'", () => {
    expect(parseDailyLog(form({ done: " ", learned: "" }))).toEqual({ ok: false, error: "Chưa có gì để lưu." });
  });
  it("một trường quá 2000 ký tự → lỗi nêu tên trường", () => {
    const r = parseDailyLog(form({ learned: "x".repeat(MAX_TEXT + 1) }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("Học được");
  });
});
