"use client";

// Chỉ được nạp phía client (xem brain-view.tsx: dynamic import, ssr: false) vì three.js cần WebGL/window.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-3d";
import * as THREE from "three";
import { forceX, forceY, forceZ } from "d3-force-3d";
import { fieldColorVar, projectColorVar } from "@/lib/fields";
import { neighborhood } from "@/lib/graph-search";
import type { GraphData, GraphLink, GraphNode } from "@/lib/graph-types";
import { GraphSearch } from "./graph-search";

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

const MIN_DISTANCE = 180;
const DIM = 0.85; // mức trộn về màu nền của node/link bị làm mờ khi đang chọn một node // khoảng cách camera tối thiểu (đơn vị của graph)

const isHub = (n: GraphNode) => n.kind === "field" || n.kind === "project";
const idOf = (end: string | number | Node | undefined) => (typeof end === "object" ? String(end.id) : String(end));

/** Nhãn cụm cố định trên graph: chấm màu + tên (vẽ ra canvas rồi làm sprite, không cần thư viện chữ). */
function makeLabel(text: string, dotColor: string, textColor: string, opacity = 1): THREE.Sprite {
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
  // sizeAttenuation: false → chữ giữ cỡ cố định trên màn hình, không bé đi khi ở xa camera
  const sprite = new THREE.Sprite(
    // depthTest: false + renderOrder cao → nhãn luôn nằm trên, không bị quả cầu che
    new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false, depthTest: false, sizeAttenuation: false }),
  );
  sprite.renderOrder = 10;
  const screenHeight = 0.03; // tỉ lệ so với chiều cao khung graph (~20px chữ ở khung 650px)
  sprite.scale.set((width / height) * screenHeight, screenHeight, 1);
  sprite.center.set(dot / width, 0.5); // chấm màu nằm đúng vị trí node
  return sprite;
}

/** Màu nhạt hơn của một màu (trộn về phía màu nền) — task "màu nhạt" theo SPEC 7.3. */
function soften(color: string, background: string, amount = 0.45): string {
  return `#${new THREE.Color(color).lerp(new THREE.Color(background), amount).getHexString()}`;
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

  const [selected, setSelected] = useState<GraphNode | null>(null);
  const highlight = useMemo(() => (selected ? neighborhood(selected.id, data.links) : null), [selected, data.links]);

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
      const projectColor = palette[projectColorVar(n.project ?? null)];
      return n.kind === "project" ? projectColor : soften(projectColor, palette["--background"]);
    },
    [palette],
  );

  // Lực mô phỏng: hút mọi node về tâm (3 trục) để các cụm không trôi xa nhau, đẩy nhẹ, link ngắn
  const ready = Boolean(palette && width > 0);
  useEffect(() => {
    const fg = graphRef.current;
    if (!ready || !fg) return;
    fg.d3Force("charge")?.strength(-70);
    fg.d3Force("link")?.distance((l: Link) => (l.kind === "mention" ? 40 : 26));
    fg.d3Force("x", forceX(0).strength(0.035));
    fg.d3Force("y", forceY(0).strength(0.035));
    fg.d3Force("z", forceZ(0).strength(0.035));
    fg.d3ReheatSimulation();
  }, [ready]);
  const colorById = useMemo(() => new Map(data.nodes.map((n) => [n.id, colorOf(n)])), [data.nodes, colorOf]);
  const dimmed = useCallback((id: string) => Boolean(highlight && !highlight.has(id)), [highlight]);
  const shownColor = useCallback(
    (color: string, dim: boolean) => (dim && palette ? soften(color, palette["--background"], DIM) : color),
    [palette],
  );

  // Nhãn phải vẽ lại khi đổi theme → accessor đổi danh tính theo palette
  // Trả rỗng → thư viện vẽ quả cầu mặc định (three-forcegraph: `if (customObj && !extendObj)`),
  // nhưng kiểu .d.ts bắt buộc Object3D nên phải ép kiểu.
  const hubObject = useCallback(
    (n: Node) =>
      (palette && isHub(n)
        ? makeLabel(n.label, colorOf(n), palette["--foreground"], dimmed(String(n.id)) ? 0.25 : 1)
        : undefined) as THREE.Object3D,
    [palette, colorOf, dimmed],
  );

  /**
   * Đưa camera vừa khung nhưng không gần hơn MIN_DISTANCE: khi graph ít node, zoomToFit
   * phóng quá sát làm mỗi quả cầu to khổng lồ.
   */
  function fitCamera() {
    const fg = graphRef.current;
    if (!fg) return;
    const box = fg.getGraphBbox();
    if (!box) return;
    const center = { x: (box.x[0] + box.x[1]) / 2, y: (box.y[0] + box.y[1]) / 2, z: (box.z[0] + box.z[1]) / 2 };
    const radius = Math.hypot(box.x[1] - box.x[0], box.y[1] - box.y[0], box.z[1] - box.z[0]) / 2;
    const distance = Math.max(radius * 2.4, MIN_DISTANCE);
    fg.cameraPosition({ x: center.x, y: center.y, z: center.z + distance }, center, 800);
  }

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

  /** Chọn từ ô tìm: bay tới node + làm nổi node và các node nối trực tiếp. */
  function selectNode(n: GraphNode) {
    setSelected(n);
    focusHub(n.id);
  }

  const memberCount = (kind: "note" | "task", key: "field" | "project", value: string) =>
    data.links.filter(
      (l) => l.kind === "belongs" && l.target === `${key}:${value}` && data.nodes.find((n) => n.id === l.source)?.kind === kind,
    ).length;
  const pageCount = data.nodes.filter((n) => !isHub(n)).length;
  // Chỉ hiện chip của cụm đang có trang (giống ảnh tham khảo); cụm trống gom thành 1 dòng
  const fieldAll = data.fields.map((name) => ({ name, count: memberCount("note", "field", name) }));
  const projectAll = data.projects.map((name) => ({ name, count: memberCount("task", "project", name) }));
  const fieldChips = fieldAll.filter((c) => c.count > 0);
  const projectChips = projectAll.filter((c) => c.count > 0);
  const emptyNames = [...fieldAll, ...projectAll].filter((c) => c.count === 0).map((c) => c.name);
  const emptyCount = emptyNames.length;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {ready && palette && (
        <ForceGraph3D<GraphNode, GraphLink>
          ref={graphRef}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor={palette["--background"]}
          showNavInfo={false}
          nodeRelSize={4}
          nodeResolution={16}
          nodeVal={(n) => (n.kind === "note" ? 1.2 + (degree.get(n.id) ?? 0) * 0.6 : 0.7 + (degree.get(n.id) ?? 0) * 0.3)}
          nodeColor={(n) => shownColor(colorOf(n), dimmed(String(n.id)))}
          nodeOpacity={0.92}
          nodeThreeObject={hubObject}
          nodeLabel={(n) => escapeHtml(isHub(n) ? `${n.label} — bấm để zoom` : n.label)}
          linkColor={(l) =>
            shownColor(
              colorById.get(idOf(l.source)) ?? palette["--muted"],
              Boolean(selected) && idOf(l.source) !== selected?.id && idOf(l.target) !== selected?.id,
            )
          }
          linkOpacity={0.35}
          linkDirectionalParticles={(l) => (l.kind === "mention" ? 2 : 0)}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleColor={() => palette["--accent"]}
          cooldownTicks={120}
          onEngineStop={() => {
            if (fitted.current) return;
            fitted.current = true;
            fitCamera();
          }}
          onNodeClick={handleClick}
        />
      )}

      {/* Lớp phủ: ô tìm + số liệu + gợi ý (chỉ ô tìm nhận chuột, phần còn lại không chặn graph) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4 text-xs text-muted">
        <GraphSearch
          nodes={data.nodes}
          colorOf={colorOf}
          selected={selected}
          onSelect={selectNode}
          onClear={() => setSelected(null)}
        />
        <span className="flex flex-col items-end gap-1 pt-1.5">
          <span className="font-mono">
            {pageCount} trang · {data.links.length} link
          </span>
          <span className="hidden sm:inline">Kéo để xoay · cuộn để zoom · bấm cụm hoặc trang</span>
        </span>
      </div>

      {/* Chú thích: chip theo cụm, bấm để bay tới (màu là cách nhận diện thứ nhất, tên + số là thứ hai) */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
        {fieldChips.length > 0 && <GroupLabel>Lĩnh vực</GroupLabel>}
        {fieldChips.map(({ name, count }) => (
          <LegendChip
            key={`f-${name}`}
            label={name}
            count={count}
            color={`var(${fieldColorVar(name)})`}
            onClick={() => focusHub(`field:${name}`)}
          />
        ))}
        {projectChips.length > 0 && <GroupLabel>Dự án</GroupLabel>}
        {projectChips.map(({ name, count }) => (
          <LegendChip
            key={`p-${name}`}
            label={name}
            count={count}
            color={`var(${projectColorVar(name)})`}
            hollow
            onClick={() => focusHub(`project:${name}`)}
          />
        ))}
        {emptyCount > 0 && (
          <span className="text-xs text-muted" title={emptyNames.join(", ")}>
            +{emptyCount} cụm chưa có trang
          </span>
        )}
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
