"use client";

// Chỉ được nạp phía client (xem brain-view.tsx: dynamic import, ssr: false) vì three.js cần WebGL/window.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ForceGraph3D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-3d";
import * as THREE from "three";
import { forceX, forceY, forceZ } from "d3-force-3d";
import { Button } from "@/components/ui/button";
import { colorVarByOrder } from "@/lib/topic-colors";
import { neighborhood } from "@/lib/graph/search";
import type { GraphData, GraphLink, GraphNode } from "@/lib/graph/types";
import { GraphSearch } from "./graph-search";

type Palette = Record<string, string>;
type Node = NodeObject<GraphNode>;
type Link = LinkObject<GraphNode, GraphLink>;

const VARS = [
  "--background", "--foreground", "--muted-foreground", "--primary",
  "--field-1", "--field-2", "--field-3", "--field-4", "--field-neutral",
];

function readPalette(scope: Element): Palette {
  const style = getComputedStyle(scope);
  return Object.fromEntries(VARS.map((v) => [v, style.getPropertyValue(v).trim()]));
}

/**
 * Đọc lại màu từ CSS variables mỗi khi đổi theme (data-theme trên <html>). Đọc ở khung graph chứ không ở <html>:
 * khung có thể tự mang `data-theme="dark"` (nền luôn tối) và khi đó token bên trong là token tối.
 */
function usePalette(scope: React.RefObject<Element | null>): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const update = () => setPalette(readPalette(scope.current ?? document.documentElement));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [scope]);
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

/** Tooltip của thư viện chèn HTML → phải escape tên do người dùng gõ. */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const MIN_DISTANCE = 150; // khoảng cách camera tối thiểu (đơn vị của graph)
const DIM = 0.85; // mức trộn về màu nền của node/link bị làm mờ khi đang chọn một node

const isHub = (n: GraphNode) => n.kind === "field" || n.kind === "project";
const idOf = (end: string | number | Node | undefined) => (typeof end === "object" ? String(end.id) : String(end));

/**
 * Nhãn cụm cố định trên graph: chấm màu + tên (vẽ ra canvas rồi làm sprite, không cần thư viện chữ).
 * `hollow`: chấm rỗng cho Dự án, chấm đặc cho Lĩnh vực — cùng quy ước với chip chú thích, vì hai nhóm dùng chung 4 màu.
 */
function makeLabel(text: string, dotColor: string, textColor: string, opacity = 1, hollow = false): THREE.Sprite {
  const ratio = 4;
  const fontSize = 15 * ratio;
  const font = `600 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = font;
  const dot = fontSize * 0.32;
  const gap = fontSize * 0.8; // chừa chỗ cho nhân neuron nằm dưới chấm
  const width = Math.ceil(dot * 2 + gap + ctx.measureText(text).width + 4);
  const height = Math.ceil(fontSize * 1.4);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.beginPath();
  if (hollow) {
    const line = dot * 0.45;
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = line;
    ctx.arc(dot, height / 2, dot - line / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = dotColor;
    ctx.arc(dot, height / 2, dot, 0, Math.PI * 2);
    ctx.fill();
  }
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

// ---------- Neuron: nhân cầu bóng có phát sáng + quầng sáng quanh nhân (SPEC.md mục 5.7) ----------

const REL_SIZE = 5.5; // bán kính = REL_SIZE × căn bậc ba của "khối lượng" node, như cách thư viện tính quả cầu mặc định
const SPHERE = new THREE.SphereGeometry(1, 32, 24); // dùng chung, mỗi node chỉ đổi scale
const SHELL = new THREE.IcosahedronGeometry(1, 1); // khung lưới của nhân Dự án

let glowMap: THREE.Texture | null = null;
/** Ảnh quầng sáng tròn mờ dần (trắng, tô màu bằng material.color) — tạo một lần, mọi node dùng chung. */
function glowTexture(): THREE.Texture {
  if (glowMap) return glowMap;
  const size = 128;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.canvas.width = ctx.canvas.height = size;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowMap = new THREE.CanvasTexture(ctx.canvas);
  return glowMap;
}

/**
 * Một neuron. `shell`: nhân Dự án vẽ rỗng (cầu trong + khung lưới) để phân biệt với Lĩnh vực (cầu đặc) khi trùng màu.
 * `glow`: độ mạnh quầng sáng (0 = không vẽ, dùng cho node đang bị làm mờ).
 */
function makeNeuron(color: string, radius: number, { dark, glow, shell }: { dark: boolean; glow: number; shell: boolean }): THREE.Group {
  const group = new THREE.Group();
  const c = new THREE.Color(color);
  const core = new THREE.Mesh(
    SPHERE,
    new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: dark ? 0.6 : 0.12,
      roughness: 0.32,
      metalness: 0.15,
      transparent: shell,
      opacity: shell ? 0.28 : 1,
      depthWrite: !shell,
    }),
  );
  core.scale.setScalar(radius);
  group.add(core);
  if (shell) {
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(SHELL), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
    wire.scale.setScalar(radius * 1.02);
    wire.raycast = () => {}; // bấm trúng nhân là đủ
    group.add(wire);
  }
  if (glow > 0) {
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: c,
        transparent: true,
        opacity: (dark ? 0.75 : 0.38) * glow,
        // Nền tối: cộng sáng (quầng chồng lên nhau sáng dần); nền sáng: cộng sáng sẽ thành trắng xoá nên trộn thường
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      }),
    );
    halo.scale.setScalar(radius * 7);
    halo.raycast = () => {}; // quầng sáng không nhận chuột, chỉ nhân mới bấm được
    group.add(halo);
  }
  return group;
}

/** Lớp "bụi" mờ quanh graph: vài trăm chấm nhỏ cố định, cho cảm giác chiều sâu khi xoay. */
function makeDust(color: string, dark: boolean): THREE.Points {
  const count = 420;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // điểm ngẫu nhiên trong vỏ cầu bán kính 260–700
    const r = 260 + Math.random() * 440;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size: 3.4, map: glowTexture(), transparent: true, opacity: dark ? 0.5 : 0.35, depthWrite: false, sizeAttenuation: true }),
  );
  points.raycast = () => {};
  return points;
}

/** Màu nhạt hơn của một màu (trộn về phía màu nền): việc vẽ nhạt hơn dự án của nó. */
function soften(color: string, background: string, amount = 0.45): string {
  return `#${new THREE.Color(color).lerp(new THREE.Color(background), amount).getHexString()}`;
}

export default function BrainGraph({ data }: { data: GraphData }) {
  const router = useRouter();
  const [containerRef, { width, height }] = useSize<HTMLDivElement>();
  const palette = usePalette(containerRef);
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const fitted = useRef(false);
  // Thư viện gắn x/y/z vào object node → tạo bản sao một lần, không đụng props
  const [graphData] = useState(() => ({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  }));

  // Nền tối hay sáng quyết định cách vẽ quầng sáng; người dùng bật "giảm chuyển động" thì không xoay, không hạt chạy
  const dark = useMemo(() => (palette ? new THREE.Color(palette["--background"]).getHSL({ h: 0, s: 0, l: 0 }).l < 0.5 : false), [palette]);
  const [calm] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

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
      // Màu theo thứ tự lĩnh vực / dự án của từng người (4 mục đầu có màu, còn lại xám), như pill ở các trang khác
      if (n.kind === "field" || n.kind === "note") return palette[colorVarByOrder(n.field ?? null, data.fields)];
      const projectColor = palette[colorVarByOrder(n.project ?? null, data.projects)];
      return n.kind === "project" ? projectColor : soften(projectColor, palette["--background"]);
    },
    [palette, data.fields, data.projects],
  );

  // Lực mô phỏng: hút mọi node về tâm (3 trục) để các cụm không trôi xa nhau, đẩy nhẹ, link ngắn
  const ready = Boolean(palette && width > 0);
  useEffect(() => {
    const fg = graphRef.current;
    if (!ready || !fg) return;
    fg.d3Force("charge")?.strength(-95);
    fg.d3Force("link")?.distance((l: Link) => (l.kind === "mention" ? 54 : 36));
    fg.d3Force("x", forceX(0).strength(0.035));
    fg.d3Force("y", forceY(0).strength(0.035));
    fg.d3Force("z", forceZ(0).strength(0.035));
    fg.d3ReheatSimulation();
  }, [ready]);

  // Camera tự xoay rất chậm cho tới khi người dùng chạm vào graph (OrbitControls của three.js)
  useEffect(() => {
    const fg = graphRef.current;
    if (!ready || !fg || calm) return;
    const controls = fg.controls() as { autoRotate: boolean; autoRotateSpeed: number; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void };
    const stop = () => {
      controls.autoRotate = false;
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [ready, calm]);

  // Lớp bụi nền: dựng lại khi đổi theme (màu khác), gỡ khi rời trang
  useEffect(() => {
    const fg = graphRef.current;
    if (!ready || !fg || !palette) return;
    const dust = makeDust(palette["--muted-foreground"], dark);
    fg.scene().add(dust);
    return () => {
      fg.scene().remove(dust);
      dust.geometry.dispose();
      (dust.material as THREE.Material).dispose();
    };
  }, [ready, palette, dark]);
  const colorById = useMemo(() => new Map(data.nodes.map((n) => [n.id, colorOf(n)])), [data.nodes, colorOf]);
  const dimmed = useCallback((id: string) => Boolean(highlight && !highlight.has(id)), [highlight]);
  const shownColor = useCallback(
    (color: string, dim: boolean) => (dim && palette ? soften(color, palette["--background"], DIM) : color),
    [palette],
  );

  // Bán kính: cụm to nhất, ghi chú to hơn việc; càng nhiều liên kết càng to
  const radiusOf = useCallback(
    (n: GraphNode) => {
      const links = degree.get(n.id) ?? 0;
      const mass = isHub(n) ? 2.4 + links * 0.35 : n.kind === "note" ? 1.2 + links * 0.6 : 0.7 + links * 0.3;
      return REL_SIZE * Math.cbrt(mass);
    },
    [degree],
  );

  // Mọi node tự vẽ (neuron); cụm thêm nhãn tên. Vẽ lại khi đổi theme hoặc đổi node đang chọn → accessor đổi danh tính.
  const nodeObject = useCallback(
    (n: Node) => {
      if (!palette) return new THREE.Group();
      const dim = dimmed(String(n.id));
      const hub = isHub(n);
      const group = makeNeuron(shownColor(colorOf(n), dim), radiusOf(n), {
        dark,
        // việc phát sáng yếu hơn ghi chú; node bị làm mờ thì tắt quầng
        glow: dim ? 0 : hub ? 1.15 : n.kind === "note" ? 1 : 0.55,
        shell: n.kind === "project",
      });
      if (hub) group.add(makeLabel(n.label, colorOf(n), palette["--foreground"], dim ? 0.25 : 1, n.kind === "project"));
      return group;
    },
    [palette, dark, colorOf, dimmed, shownColor, radiusOf],
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
    const distance = Math.max(radius * 1.65, MIN_DISTANCE);
    fg.cameraPosition({ x: center.x, y: center.y, z: center.z + distance }, center, 800);
  }

  function focus(node: Node) {
    const { x = 0, y = 0, z = 0 } = node;
    const ratio = 1 + 140 / Math.max(Math.hypot(x, y, z), 1);
    graphRef.current?.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 1000);
  }

  function handleClick(node: Node) {
    if (node.url) router.push(node.url); // ghi chú → /knowledge, việc → /tasks
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
  const noteCount = data.nodes.filter((n) => n.kind === "note").length;
  const taskCount = data.nodes.filter((n) => n.kind === "task").length;
  // Chỉ hiện chip của cụm đang có ghi chú / việc; cụm trống gom thành 1 dòng
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
          // Canvas trong suốt: nền là của khung bao ngoài (brain-view.tsx)
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
          controlType="orbit"
          nodeRelSize={REL_SIZE}
          nodeThreeObject={nodeObject}
          nodeLabel={(n) => escapeHtml(isHub(n) ? `${n.label} · bấm để bay tới` : `${n.label} · bấm để mở ${n.kind === "note" ? "Knowledge" : "Tasks"}`)}
          linkColor={(l) =>
            shownColor(
              colorById.get(idOf(l.source)) ?? palette["--muted-foreground"],
              Boolean(selected) && idOf(l.source) !== selected?.id && idOf(l.target) !== selected?.id,
            )
          }
          linkOpacity={dark ? 0.45 : 0.4}
          // "Liên quan tới" uốn cong như một sợi nối giữa hai neuron; link về cụm để thẳng
          linkCurvature={(l) => (l.kind === "mention" ? 0.22 : 0)}
          // Hạt chạy dọc link như tín hiệu: nhiều và nhanh hơn trên link "liên quan tới"
          linkDirectionalParticles={(l) => (calm ? 0 : l.kind === "mention" ? 3 : 1)}
          linkDirectionalParticleSpeed={(l) => (l.kind === "mention" ? 0.007 : 0.0035)}
          linkDirectionalParticleWidth={(l) => (l.kind === "mention" ? 1.8 : 1.1)}
          linkDirectionalParticleColor={(l) => (l.kind === "mention" ? palette["--primary"] : (colorById.get(idOf(l.target)) ?? palette["--muted-foreground"]))}
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
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4 text-xs text-muted-foreground">
        <GraphSearch
          nodes={data.nodes}
          colorOf={colorOf}
          selected={selected}
          onSelect={selectNode}
          onClear={() => setSelected(null)}
        />
        <span className="flex flex-col items-end gap-1 pt-1.5">
          <span className="font-mono">
            {noteCount} ghi chú · {taskCount} việc · {data.links.length} liên kết
          </span>
          <span className="hidden sm:inline">Kéo để xoay · cuộn để zoom · bấm cụm để bay tới</span>
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
            color={`var(${colorVarByOrder(name, data.fields)})`}
            onClick={() => focusHub(`field:${name}`)}
          />
        ))}
        {projectChips.length > 0 && <GroupLabel>Dự án</GroupLabel>}
        {projectChips.map(({ name, count }) => (
          <LegendChip
            key={`p-${name}`}
            label={name}
            count={count}
            color={`var(${colorVarByOrder(name, data.projects)})`}
            hollow
            onClick={() => focusHub(`project:${name}`)}
          />
        ))}
        {emptyCount > 0 && (
          <span className="text-xs text-muted-foreground" title={emptyNames.join(", ")}>
            +{emptyCount} cụm trống
          </span>
        )}
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 pl-1 font-mono text-xs text-muted-foreground uppercase first:pl-0">{children}</span>;
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
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} title={`Bay tới cụm ${label}`} className="shrink-0 gap-2 bg-surface max-md:h-10">
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={hollow ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { backgroundColor: color }}
      />
      {label}
      <span className="font-mono text-muted-foreground tabular-nums">{count}</span>
    </Button>
  );
}
