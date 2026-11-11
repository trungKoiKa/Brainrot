// Dữ liệu graph Brain (SPEC.md mục 10.2) — dùng chung server (dựng) và client (vẽ).

export type GraphNodeKind = "field" | "project" | "note" | "task";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Trang trong app mở khi bấm node (ghi chú → /knowledge, việc → /tasks); cụm không có */
  url?: string;
  /** Lĩnh vực — quyết định màu của node field/note */
  field?: string | null;
  /** Dự án — quyết định màu của node project/task */
  project?: string | null;
};

export type GraphLink = {
  source: string;
  target: string;
  /** belongs: ghi chú → lĩnh vực, việc → dự án; mention: hai ghi chú "liên quan tới" nhau */
  kind: "belongs" | "mention";
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
  /** Danh sách của người dùng theo thứ tự ở Cài đặt (kể cả cụm trống) — quyết định màu và hàng chip chú thích */
  fields: string[];
  projects: string[];
};
