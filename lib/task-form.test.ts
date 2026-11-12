import { describe, expect, it } from "vitest";
import { MAX_TEXT } from "./quick-capture";
import { parseTaskInput, parseTaskUpdate } from "./task-form";

const PROJECTS = ["Đồ án", "Học AI"];

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("parseTaskInput", () => {
  it("chỉ có tên → các trường khác null", () => {
    expect(parseTaskInput(form({ title: "  Viết chương 3 \n ", project: "", priority: "", deadline: "" }), PROJECTS)).toEqual({
      ok: true,
      data: { title: "Viết chương 3", project: null, priority: null, deadline: null, plannedOn: null },
    });
  });
  it("đủ trường hợp lệ", () => {
    expect(parseTaskInput(form({ title: "A", project: "Đồ án", priority: "Cao", deadline: "2026-11-08" }), PROJECTS)).toEqual({
      ok: true,
      data: { title: "A", project: "Đồ án", priority: "Cao", deadline: "2026-11-08", plannedOn: null },
    });
  });
  it("tên trống / quá dài → lỗi", () => {
    expect(parseTaskInput(form({ title: "  " }), PROJECTS).ok).toBe(false);
    expect(parseTaskInput(form({ title: "x".repeat(MAX_TEXT + 1) }), PROJECTS).ok).toBe(false);
  });
  it("dự án lạ, ưu tiên lạ, ngày sai → lỗi", () => {
    expect(parseTaskInput(form({ title: "A", project: "Dự án mới" }), PROJECTS).ok).toBe(false);
    expect(parseTaskInput(form({ title: "A", priority: "Gấp" }), PROJECTS).ok).toBe(false);
    expect(parseTaskInput(form({ title: "A", deadline: "2026-02-30" }), PROJECTS).ok).toBe(false);
    expect(parseTaskInput(form({ title: "A", deadline: "08/11/2026" }), PROJECTS).ok).toBe(false);
    // Ngày làm (SPEC.md mục 5.2)
    expect(parseTaskInput(form({ title: "A", plannedOn: "2026-10-28" }), PROJECTS)).toMatchObject({ ok: true, data: { plannedOn: "2026-10-28" } });
    expect(parseTaskInput(form({ title: "A", plannedOn: "2026-13-01" }), PROJECTS).ok).toBe(false);
  });
});

describe("parseTaskUpdate", () => {
  it("đọc trạng thái và ghi chú nhiều dòng", () => {
    expect(parseTaskUpdate(form({ title: "A", status: "Đang làm", note: "dòng 1\r\ndòng 2" }), PROJECTS)).toEqual({
      ok: true,
      data: { title: "A", project: null, priority: null, deadline: null, plannedOn: null, status: "Đang làm", note: "dòng 1\ndòng 2" },
    });
  });
  it("không cho đặt Xong qua form sửa", () => {
    expect(parseTaskUpdate(form({ title: "A", status: "Xong" }), PROJECTS).ok).toBe(false);
  });
  it("ghi chú quá 2000 ký tự → lỗi", () => {
    const r = parseTaskUpdate(form({ title: "A", status: "Chưa làm", note: "x".repeat(MAX_TEXT + 1) }), PROJECTS);
    expect(!r.ok && r.error).toContain("Ghi chú");
  });
});
