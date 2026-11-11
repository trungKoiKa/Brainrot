// Dựng dữ liệu graph Brain (SPEC.md mục 10.2). Hàm thuần, không gọi database → test được.
import type { GraphData, GraphLink, GraphNode } from "./graph-types";
import type { Knowledge, Task } from "./types";

export const fieldNodeId = (name: string) => `field:${name}`;
export const projectNodeId = (name: string) => `project:${name}`;

type NoteIn = Pick<Knowledge, "id" | "title" | "field" | "related">;
type TaskIn = Pick<Task, "id" | "title" | "project" | "status">;

/**
 * Node: Lĩnh vực (có ghi chú), Dự án (có việc chưa xong), ghi chú, việc chưa xong.
 * Link: ghi chú → lĩnh vực, việc → dự án ("belongs"); ghi chú ↔ ghi chú "liên quan tới" ("mention", mỗi cặp một link).
 * `fields` / `projects` là danh sách theo thứ tự của người dùng: quyết định màu (4 mục đầu có màu, còn lại xám).
 */
export function buildGraph({
  notes,
  tasks,
  fields,
  projects,
}: {
  notes: readonly NoteIn[];
  tasks: readonly TaskIn[];
  fields: readonly string[];
  projects: readonly string[];
}): GraphData {
  const openTasks = tasks.filter((t) => t.status !== "Xong");
  const usedFields = new Set(notes.map((n) => n.field));
  const usedProjects = new Set(openTasks.map((t) => t.project));

  const nodes: GraphNode[] = [
    ...fields.filter((f) => usedFields.has(f)).map((f): GraphNode => ({ id: fieldNodeId(f), kind: "field", label: f, field: f })),
    ...projects.filter((p) => usedProjects.has(p)).map((p): GraphNode => ({ id: projectNodeId(p), kind: "project", label: p, project: p })),
    ...notes.map((n): GraphNode => ({ id: n.id, kind: "note", label: n.title || "(Chưa đặt tên)", url: "/knowledge", field: n.field })),
    ...openTasks.map((t): GraphNode => ({ id: t.id, kind: "task", label: t.title || "(Chưa đặt tên)", url: "/tasks", project: t.project })),
  ];
  const known = new Set(nodes.map((n) => n.id));

  const links: GraphLink[] = [
    ...notes.flatMap((n): GraphLink[] => (n.field && known.has(fieldNodeId(n.field)) ? [{ source: n.id, target: fieldNodeId(n.field), kind: "belongs" }] : [])),
    ...openTasks.flatMap((t): GraphLink[] =>
      t.project && known.has(projectNodeId(t.project)) ? [{ source: t.id, target: projectNodeId(t.project), kind: "belongs" }] : [],
    ),
    // "liên quan tới" lưu hai chiều (A có B thì B có A) → chỉ lấy chiều id nhỏ → lớn để mỗi cặp một link
    ...notes.flatMap((n) =>
      n.related.filter((r) => n.id < r && known.has(r)).map((r): GraphLink => ({ source: n.id, target: r, kind: "mention" })),
    ),
  ];

  return { nodes, links, fields: [...fields], projects: [...projects] };
}
