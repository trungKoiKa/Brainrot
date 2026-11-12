// Tìm node trên Brain (SPEC.md mục 5.7). Hàm thuần, chạy phía client → test được.
import { fold } from "@/lib/text";
import type { GraphLink, GraphNode } from "./types";

/** Thứ hạng khớp: 0 = đầu tên, 1 = đầu một từ, 2 = ở giữa; null = không khớp. */
function rank(label: string, query: string): number | null {
  const i = label.indexOf(query);
  if (i === -1) return null;
  if (i === 0) return 0;
  return label.includes(` ${query}`) ? 1 : 2;
}

export function searchNodes(nodes: readonly GraphNode[], query: string, limit = 8): GraphNode[] {
  const q = fold(query);
  if (!q) return [];
  return nodes
    .flatMap((node) => {
      const label = fold(node.label);
      const r = rank(label, q);
      return r === null ? [] : [{ node, r, len: label.length }];
    })
    .sort((a, b) => a.r - b.r || a.len - b.len || a.node.label.localeCompare(b.node.label, "vi"))
    .slice(0, limit)
    .map((m) => m.node);
}

/** Node được chọn + các node nối trực tiếp với nó (để giữ màu khi làm nổi). */
export function neighborhood(id: string, links: readonly GraphLink[]): Set<string> {
  const ids = new Set([id]);
  for (const l of links) {
    if (l.source === id) ids.add(l.target);
    if (l.target === id) ids.add(l.source);
  }
  return ids;
}
