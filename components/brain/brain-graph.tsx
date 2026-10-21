"use client";

// Chỉ được nạp phía client (xem brain-view.tsx: dynamic import, ssr: false) vì three.js cần WebGL/window.
import { useEffect, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods, type NodeObject } from "react-force-graph-3d";
import { fieldColorVar } from "@/lib/fields";
import type { GraphData, GraphNode } from "@/lib/graph-types";

type Palette = Record<string, string>;
type Node = NodeObject<GraphNode>;

const VARS = [
  "--background", "--foreground", "--muted", "--line", "--accent",
  "--field-cv", "--field-agent", "--field-edge", "--field-thesis", "--field-life", "--field-other",
];

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(VARS.map((v) => [v, style.getPropertyValue(v).trim()]));
}

/** Đọc lại màu từ CSS variables mỗi khi đổi theme (data-theme trên <html>). */
function usePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const update = () => setPalette(readPalette());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return palette;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Tooltip của thư viện chèn HTML → phải escape tên trang lấy từ Notion. */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const NODE_SIZE: Record<GraphNode["kind"], number> = { field: 10, project: 10, note: 2.5, task: 1.5 };

export default function BrainGraph({ data }: { data: GraphData }) {
  const palette = usePalette();
  const [containerRef, { width, height }] = useSize<HTMLDivElement>();
  const graphRef = useRef<ForceGraphMethods<Node> | undefined>(undefined);
  // Thư viện gắn x/y/z vào object node → tạo bản sao một lần, không đụng props
  const [graphData] = useState(() => ({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  }));

  function colorOf(node: Node): string {
    if (!palette) return "#888";
    if (node.kind === "field" || node.kind === "note") return palette[fieldColorVar(node.field ?? null)];
    if (node.kind === "project") return palette["--accent"];
    return palette["--muted"];
  }

  function handleClick(node: Node) {
    if (node.url) {
      window.open(node.url, "_blank", "noopener,noreferrer");
      return;
    }
    // Lĩnh vực / Dự án → bay camera tới node
    const { x = 0, y = 0, z = 0 } = node;
    const ratio = 1 + 120 / Math.max(Math.hypot(x, y, z), 1);
    graphRef.current?.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 1000);
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {palette && width > 0 && (
        <ForceGraph3D<GraphNode>
          ref={graphRef}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor={palette["--background"]}
          showNavInfo={false}
          nodeRelSize={6}
          nodeVal={(n) => NODE_SIZE[n.kind]}
          nodeColor={colorOf}
          nodeOpacity={0.95}
          nodeLabel={(n) => escapeHtml(n.kind === "field" || n.kind === "project" ? `${n.label} (bấm để zoom)` : n.label)}
          linkColor={(l) => ((l as { kind?: string }).kind === "mention" ? palette["--accent"] : palette["--muted"])}
          linkOpacity={0.4}
          linkWidth={(l) => ((l as { kind?: string }).kind === "mention" ? 1 : 0)}
          onNodeClick={handleClick}
        />
      )}
    </div>
  );
}
