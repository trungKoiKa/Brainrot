// Dữ liệu graph Brain (SPEC 7.3) — dùng chung server (dựng) và client (vẽ).

export type GraphNodeKind = "field" | "project" | "note" | "task";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Trang Notion (note/task) */
  url?: string;
  /** Lĩnh vực — quyết định màu của node field/note */
  field?: string | null;
};

export type GraphLink = {
  source: string;
  target: string;
  kind: "belongs" | "mention";
};

export type GraphData = { nodes: GraphNode[]; links: GraphLink[] };
