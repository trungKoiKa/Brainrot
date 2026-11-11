import { describe, expect, it } from "vitest";
import { buildGraph } from "./graph-build";

const note = (id: string, field: string | null, related: string[] = []) => ({ id, title: `note ${id}`, field, related });
const task = (id: string, project: string | null, status: "Chưa làm" | "Đang làm" | "Xong" = "Chưa làm") => ({ id, title: `task ${id}`, project, status });

describe("buildGraph", () => {
  const g = buildGraph({
    notes: [note("a", "CV", ["b"]), note("b", "CV", ["a", "c"]), note("c", null, ["b"])],
    tasks: [task("t1", "Đồ án"), task("t2", "Đồ án", "Xong"), task("t3", null), task("t4", "Học AI", "Xong")],
    fields: ["CV", "Nhúng"],
    projects: ["Đồ án", "Học AI"],
  });
  const ids = (kind: string) => g.nodes.filter((n) => n.kind === kind).map((n) => n.id);

  it("node: lĩnh vực có ghi chú, dự án có việc chưa xong, mọi ghi chú, việc chưa xong", () => {
    expect(ids("field")).toEqual(["field:CV"]);
    expect(ids("project")).toEqual(["project:Đồ án"]);
    expect(ids("note")).toEqual(["a", "b", "c"]);
    expect(ids("task")).toEqual(["t1", "t3"]);
  });

  it("link: ghi chú → lĩnh vực, việc → dự án, mỗi cặp 'liên quan tới' đúng một link", () => {
    expect(g.links).toEqual([
      { source: "a", target: "field:CV", kind: "belongs" },
      { source: "b", target: "field:CV", kind: "belongs" },
      { source: "t1", target: "project:Đồ án", kind: "belongs" },
      { source: "a", target: "b", kind: "mention" },
      { source: "b", target: "c", kind: "mention" },
    ]);
  });

  it("ghi chú mở /knowledge, việc mở /tasks; cụm không có link", () => {
    const url = (id: string) => g.nodes.find((n) => n.id === id)?.url;
    expect(url("a")).toBe("/knowledge");
    expect(url("t1")).toBe("/tasks");
    expect(url("field:CV")).toBeUndefined();
  });

  it("giữ đủ danh sách lĩnh vực / dự án (kể cả cụm trống) để tính màu theo thứ tự", () => {
    expect(g.fields).toEqual(["CV", "Nhúng"]);
    expect(g.projects).toEqual(["Đồ án", "Học AI"]);
  });

  it("bỏ link tới ghi chú không có trong danh sách", () => {
    const lone = buildGraph({ notes: [note("a", null, ["zzz"])], tasks: [], fields: [], projects: [] });
    expect(lone.links).toEqual([]);
  });
});
