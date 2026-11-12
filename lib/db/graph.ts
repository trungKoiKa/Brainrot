import "server-only";
import { buildGraph } from "@/lib/graph/build";
import type { GraphData } from "@/lib/graph/types";
import { anyStale, getKnowledge, getKnowledgeFields, getTaskProjects, getTasks } from "./data";

/** Dữ liệu graph Brain của người đang đăng nhập (SPEC.md mục 5.7). Quy tắc dựng nằm ở `lib/graph/build.ts`. */
export async function getBrainGraph(): Promise<GraphData & { stale: boolean }> {
  const [notes, tasks, fields, projects] = await Promise.all([getKnowledge(), getTasks(), getKnowledgeFields(), getTaskProjects()]);
  return { ...buildGraph({ notes: notes.data, tasks: tasks.data, fields, projects }), stale: anyStale(notes, tasks) };
}
