import "server-only";
import type { GraphData, GraphLink, GraphNode } from "@/lib/graph-types";
import { anyStale, getKnowledge, getTaskProjects, getTasks } from "./data";

const projectId = (name: string) => `project:${name}`;

/**
 * Đợt 1 (chưa có Knowledge): node Dự án (có ít nhất 1 task chưa xong) và mỗi task chưa xong nối vào dự án của nó.
 * Trang kiến thức và liên kết giữa chúng quay lại ở v1.1.
 */
export async function getBrainGraph(): Promise<GraphData & { stale: boolean }> {
  const [notesLoaded, tasksLoaded, projects] = await Promise.all([getKnowledge(), getTasks(), getTaskProjects()]);
  const openTasks = tasksLoaded.data.filter((t) => t.status !== "Xong");
  const usedProjects = new Set(openTasks.map((t) => t.project));

  const nodes: GraphNode[] = [
    ...projects.filter((p) => usedProjects.has(p)).map((p): GraphNode => ({ id: projectId(p), kind: "project", label: p, project: p })),
    ...openTasks.map((t): GraphNode => ({ id: t.id, kind: "task", label: t.title || "(Chưa đặt tên)", url: t.url, project: t.project })),
  ];
  const known = new Set(nodes.map((n) => n.id));
  const links: GraphLink[] = openTasks
    .filter((t) => t.project && known.has(projectId(t.project)))
    .map((t): GraphLink => ({ source: t.id, target: projectId(t.project!), kind: "belongs" }));

  return { nodes, links, fields: [], projects, stale: anyStale(notesLoaded, tasksLoaded) };
}
