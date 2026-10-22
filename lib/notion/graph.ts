import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { collectPaginatedAPI, isFullBlock, type BlockObjectResponse, type RichTextItemResponse } from "@notionhq/client";
import type { GraphData, GraphLink, GraphNode } from "@/lib/graph-types";
import { notion } from "./client";
import { anyStale, getKnowledge, getTasks } from "./data";
import { TAGS, selectOptions } from "./queries";

const fieldId = (name: string) => `field:${name}`;
const projectId = (name: string) => `project:${name}`;

function richTextOf(block: BlockObjectResponse): RichTextItemResponse[] {
  const content = (block as Record<string, unknown>)[block.type];
  if (content && typeof content === "object" && "rich_text" in content && Array.isArray(content.rich_text)) {
    return content.rich_text as RichTextItemResponse[];
  }
  return [];
}

/**
 * Trang được nhắc tới (mention / link_to_page) trong các block cấp 1 của một trang.
 * Cache riêng từng trang; lỗi → [] (chỉ thiếu link, không làm hỏng cả graph).
 */
async function mentionedPageIds(pageId: string): Promise<string[]> {
  "use cache";
  cacheTag(TAGS.knowledge);
  try {
    const blocks = await collectPaginatedAPI(notion().blocks.children.list, { block_id: pageId });
    const ids = new Set<string>();
    for (const block of blocks.filter(isFullBlock)) {
      if (block.type === "link_to_page" && block.link_to_page.type === "page_id") ids.add(block.link_to_page.page_id);
      for (const rt of richTextOf(block)) {
        if (rt.type === "mention" && rt.mention.type === "page") ids.add(rt.mention.page.id);
      }
    }
    cacheLife({ stale: 300, revalidate: 300, expire: 60 * 60 * 24 * 7 });
    return [...ids];
  } catch {
    cacheLife({ stale: 0, revalidate: 30, expire: 60 });
    return [];
  }
}

/**
 * Node: Lĩnh vực, Dự án (giá trị trong schema có ít nhất 1 thành viên), mỗi trang Knowledge, mỗi Task chưa xong.
 * Link: note → lĩnh vực, task → dự án, trang A → trang B khi A mention B.
 * Chỉ quét nội dung trang Knowledge (SPEC 7.3) để giới hạn số request.
 */
export async function getBrainGraph(): Promise<GraphData & { stale: boolean }> {
  const [notesLoaded, tasksLoaded, schemaFields, schemaProjects] = await Promise.all([
    getKnowledge(),
    getTasks(),
    selectOptions("NOTION_KNOWLEDGE_DB", "Lĩnh vực"),
    selectOptions("NOTION_TASKS_DB", "Dự án"),
  ]);
  const notes = notesLoaded.data;
  const openTasks = tasksLoaded.data.filter((t) => t.status !== "Xong");

  // Đọc schema lỗi → dùng các giá trị đang có trong dữ liệu
  const fields = schemaFields.length ? schemaFields : [...new Set(notes.flatMap((n) => (n.field ? [n.field] : [])))];
  const projects = schemaProjects.length
    ? schemaProjects
    : [...new Set(openTasks.flatMap((t) => (t.project ? [t.project] : [])))];

  // Chỉ vẽ cụm có ít nhất 1 thành viên, tránh nhãn lơ lửng không nối gì (chip chú thích vẫn liệt kê đủ)
  const usedFields = new Set(notes.map((n) => n.field));
  const usedProjects = new Set(openTasks.map((t) => t.project));
  const nodes: GraphNode[] = [
    ...fields.filter((f) => usedFields.has(f)).map((f): GraphNode => ({ id: fieldId(f), kind: "field", label: f, field: f })),
    ...projects.filter((p) => usedProjects.has(p)).map((p): GraphNode => ({ id: projectId(p), kind: "project", label: p, project: p })),
    ...notes.map((n): GraphNode => ({ id: n.id, kind: "note", label: n.title || "(Chưa đặt tên)", url: n.url, field: n.field })),
    ...openTasks.map((t): GraphNode => ({ id: t.id, kind: "task", label: t.title || "(Chưa đặt tên)", url: t.url, project: t.project })),
  ];
  const known = new Set(nodes.map((n) => n.id));

  const links: GraphLink[] = [
    ...notes
      .filter((n) => n.field && known.has(fieldId(n.field)))
      .map((n): GraphLink => ({ source: n.id, target: fieldId(n.field!), kind: "belongs" })),
    ...openTasks
      .filter((t) => t.project && known.has(projectId(t.project)))
      .map((t): GraphLink => ({ source: t.id, target: projectId(t.project!), kind: "belongs" })),
  ];

  const mentions = await Promise.all(notes.map(async (n) => ({ from: n.id, to: await mentionedPageIds(n.id) })));
  for (const { from, to } of mentions) {
    for (const target of to) {
      if (target !== from && known.has(target)) links.push({ source: from, target, kind: "mention" });
    }
  }

  return { nodes, links, fields, projects, stale: anyStale(notesLoaded, tasksLoaded) };
}
