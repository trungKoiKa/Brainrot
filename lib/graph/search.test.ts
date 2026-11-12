import { describe, expect, it } from "vitest";
import { neighborhood, searchNodes } from "./search";
import type { GraphNode } from "./types";

const node = (id: string, label: string, kind: GraphNode["kind"] = "note"): GraphNode => ({ id, label, kind });
const NODES = [
  node("p", "Đồ án", "project"),
  node("t1", "Nộp báo cáo đồ án tốt nghiệp", "task"),
  node("n1", "Computer Vision cơ bản"),
  node("n2", "Học Computer Vision (ưu tiên số 1 tuần này)", "task"),
  node("n3", "Supervision trong ML"),
];

describe("searchNodes", () => {
  it("gõ không dấu vẫn khớp", () => {
    expect(searchNodes(NODES, "do an").map((n) => n.id)).toEqual(["p", "t1"]);
  });
  it("đầu tên > đầu từ > ở giữa", () => {
    expect(searchNodes(NODES, "vision").map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
    expect(searchNodes(NODES, "computer").map((n) => n.id)).toEqual(["n1", "n2"]);
  });
  it("chuỗi rỗng → không có kết quả; giới hạn số kết quả", () => {
    expect(searchNodes(NODES, "   ")).toEqual([]);
    expect(searchNodes(NODES, "o", 2)).toHaveLength(2);
  });
});

describe("neighborhood", () => {
  it("gồm chính nó và node nối hai chiều", () => {
    const links = [
      { source: "t1", target: "p", kind: "belongs" as const },
      { source: "n1", target: "t1", kind: "mention" as const },
      { source: "n2", target: "n3", kind: "mention" as const },
    ];
    expect([...neighborhood("t1", links)].sort()).toEqual(["n1", "p", "t1"]);
  });
});
