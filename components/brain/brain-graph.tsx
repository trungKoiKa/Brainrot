"use client";

// Chỉ được nạp phía client (xem brain-view.tsx: dynamic import, ssr: false) vì three.js cần WebGL/window.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-3d";
import * as THREE from "three";
import { fieldColorVar } from "@/lib/fields";
import type { GraphData, GraphLink, GraphNode } from "@/lib/graph-types";

type Palette = Record<string, string>;
type Node = NodeObject<GraphNode>;
type Link = LinkObject<GraphNode, GraphLink>;

const VARS = [
  "--background", "--foreground", "--muted", "--accent",
  "--field-1", "--field-2", "--field-3", "--field-4", "--field-neutral",
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

const isHub = (n: GraphNode) => n.kind === "field" || n.kind === "project";
const idOf = (end: string | number | Node | undefined) => (typeof end === "object" ? String(end.id) : String(end));

/** Nhãn cụm cố định trên graph: chấm màu + tên (vẽ ra canvas rồi làm sprite, không cần thư viện chữ). */
function makeLabel(text: string, dotColor: string, textColor: string): THREE.Sprite {
  const ratio = 4;
  const fontSize = 15 * ratio;
  const font = `600 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = font;
  const dot = fontSize * 0.32;
  const gap = fontSize * 0.45;
  const width = Math.ceil(dot * 2 + gap + ctx.measureText(text).width + 4);
  const height = Math.ceil(fontSize * 1.4);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(dot, height / 2, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.fillText(text, dot * 2 + gap, height / 2);

  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  const scale = 0.06; // đơn vị thế giới trên mỗi pixel canvas
  sprite.scale.set(width * scale, height * scale, 1);
  sprite.center.set(dot / width, 0.5); // chấm màu nằm đúng vị trí node
  return sprite;
}

export default function BrainGraph({ data }: { data: GraphData }) {
  const palette = usePalette();
  const [containerRef, { width, height }] = useSize<HTMLDivElement>();
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const fitted = useRef(false);
  // Thư viện gắn x/y/z vào object node → tạo bản sao một lần, không đụng props
  const [graphData] = useState(() => ({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  }));

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const l of data.links) {
      d.set(l.source, (d.get(l.source) ?? 0) + 1);
      d.set(l.target, (d.get(l.target) ?? 0) + 1);
    }
    return d;
  }, [data.links]);

  const colorOf = useCallback(
    (n: GraphNode): string => {
      if (!palette) return "#888";
      if (n.kind === "field" || n.kind === "note") return palette[fieldColorVar(n.field ?? null)];
      if (n.kind === "project") return palette["--foreground"];
      return palette["--field-neutral"]; // task: màu nhạt (SPEC 7.3)
    },
    [palette],
  );
  const colorById = useMemo(() => new Map(data.nodes.map((n) => [n.id, colorOf(n)])), [data.nodes, colorOf]);

  // Nhãn phải vẽ lại khi đổi theme → accessor đổi danh tính theo palette
  // Trả rỗng → thư viện vẽ quả cầu mặc định (three-forcegraph: `if (customObj && !extendObj)`),
  // nhưng kiểu .d.ts bắt buộc Object3D nên phải ép kiểu.
  const hubObject = useCallback(
    (n: Node) =>
      (palette && isHub(n) ? makeLabel(n.label, colorOf(n), palette["--foreground"]) : undefined) as THREE.Object3D,
    [palette, colorOf],
  );

  function focus(node: Node) {
    const { x = 0, y = 0, z = 0 } = node;
    const ratio = 1 + 90 / Math.max(Math.hypot(x, y, z), 1);
    graphRef.current?.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 1000);
  }

  function handleClick(node: Node) {
    if (node.url) window.open(node.url, "_blank", "noopener,noreferrer");
    else focus(node); // Lĩnh vực / Dự án → bay camera tới cụm
  }

  function focusHub(id: string) {
    const node = graphData.nodes.find((n) => n.id === id);
    if (node) focus(node);
  }

  const memberCount = (kind: "note" | "task", key: "field" | "project", value: string) =>
    data.links.filter(
      (l) => l.kind === "belongs" && l.target === `${key}:${value}` && data.nodes.find((n) => n.id === l.source)?.kind === kind,
    ).length;
  const pageCount = data.nodes.filter((n) => !isHub(n)).length;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {palette && width > 0 && (
        <ForceGraph3D<GraphNode, GraphLink>
          ref={graphRef}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor={palette["--background"]}
          showNavInfo={false}
          nodeRelSize={4}
          nodeResolution={16}
          nodeVal={(n) => (isHub(n) ? 0.6 : 1 + (degree.get(n.id) ?? 0) * 0.8)}
          nodeColor={(n) => colorOf(n)}
          nodeOpacity={0.92}
          nodeThreeObject={hubObject}
          nodeLabel={(n) => escapeHtml(isHub(n) ? `${n.label} — bấm để zoom` : n.label)}
          linkColor={(l) => colorById.get(idOf(l.source)) ?? palette["--muted"]}
          linkOpacity={0.35}
          linkDirectionalParticles={(l) => (l.kind === "mention" ? 2 : 0)}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleColor={() => palette["--accent"]}
          cooldownTicks={120}
          onEngineStop={() => {
            if (fitted.current) return;
            fitted.current = true;
            graphRef.current?.zoomToFit(600, 40);
          }}
          onNodeClick={handleClick}
        />
      )}

      {/* Lớp phủ: số liệu + gợi ý (không chặn chuột lên graph) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap justify-between gap-2 p-4 text-xs text-muted">
        <span className="font-mono">
          {pageCount} trang · {data.links.length} link
        </span>
        <span className="hidden sm:inline">Kéo để xoay · cuộn để zoom · bấm cụm hoặc trang</span>
      </div>

      {/* Chú thích: chip theo cụm, bấm để bay tới (màu là cách nhận diện thứ nhất, tên + số là thứ hai) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 overflow-x-auto p-4">
        <GroupLabel>Lĩnh vực</GroupLabel>
        {data.fields.map((f) => (
          <LegendChip
            key={`f-${f}`}
            label={f}
            count={memberCount("note", "field", f)}
            color={`var(${fieldColorVar(f)})`}
            onClick={() => focusHub(`field:${f}`)}
          />
        ))}
        <GroupLabel>Dự án</GroupLabel>
        {data.projects.map((p) => (
          <LegendChip
            key={`p-${p}`}
            label={p}
            count={memberCount("task", "project", p)}
            color="var(--foreground)"
            hollow
            onClick={() => focusHub(`project:${p}`)}
          />
        ))}
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 pl-1 text-xs font-medium uppercase tracking-wide text-muted first:pl-0">{children}</span>;
}

function LegendChip({
  label,
  count,
  color,
  hollow = false,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  hollow?: boolean;
  onClick: () => void;
}) {
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      title={empty ? `${label}: chưa có trang nào` : `Bay tới cụm ${label}`}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs text-foreground backdrop-blur transition-colors hover:border-accent disabled:cursor-default disabled:opacity-45 disabled:hover:border-line"
    >
      <span
        className="size-2 rounded-full"
        style={hollow ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { backgroundColor: color }}
      />
      {label}
      <span className="font-mono text-muted">{count}</span>
    </button>
  );
}
