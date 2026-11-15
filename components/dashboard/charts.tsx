"use client";

// Biểu đồ SVG tự vẽ cho Dashboard (thay Recharts, bớt ~118 KB JS nén). Chỉ những gì Dashboard cần: cột nhóm, vùng hai
// đường, sparkline. Màu luôn là CSS variable (đặt qua `style` để chạy được cả hai theme).
import { useState, type ReactNode } from "react";
import { niceMax } from "@/lib/dashboard/chart-scale";
import { useElementSize } from "@/hooks/use-element-size";

/** 5 mốc trục Y từ 0 tới `top` (top luôn là 4 bước tròn, xem niceMax). */
const yTicks = (top: number) => [0, 1, 2, 3, 4].map((i) => (top / 4) * i);

const PAD = { top: 8, right: 8, left: 36 };
const LABEL_GAP = 56; // khoảng cách tối thiểu giữa hai nhãn trục X (px)

/** Khung chung: lưới ngang nét đứt, nhãn trục Y, nhãn trục X, tooltip theo vị trí chuột. */
function Frame({
  height,
  count,
  top,
  xLabel,
  angled = false,
  tooltip,
  label,
  onSlotClick,
  children,
}: {
  height: number;
  count: number;
  top: number;
  xLabel: (i: number) => string;
  /** Nghiêng nhãn trục X (tên dự án dài trên màn hẹp) */
  angled?: boolean;
  tooltip: (i: number) => ReactNode;
  /** Câu tóm tắt cho trình đọc màn hình */
  label: string;
  /** Bấm vào cột thứ i (cả chiều cao vùng vẽ, không cần trúng đúng thanh) */
  onSlotClick?: (i: number) => void;
  children: (g: { x: (i: number) => number; slot: number; y: (v: number) => number; base: number }) => ReactNode;
}) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const bottom = angled ? 56 : 24;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - bottom;
  const slot = count > 0 ? plotW / count : 0;
  const x = (i: number) => PAD.left + slot * (i + 0.5);
  const y = (v: number) => PAD.top + plotH * (1 - v / top);
  const base = y(0);
  // Nhãn trục X: bỏ bớt cho khỏi đè nhau, luôn giữ nhãn cuối (kỳ gần nhất)
  const every = angled ? 1 : Math.max(1, Math.ceil(LABEL_GAP / Math.max(slot, 1)));

  return (
    <div ref={ref} className="relative w-full" style={{ height }} role="img" aria-label={label}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible text-xs" aria-hidden="true">
          {yTicks(top).map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} strokeDasharray="3 3" style={{ stroke: "var(--line)" }} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" style={{ fill: "var(--muted-foreground)" }}>
                {t}
              </text>
            </g>
          ))}
          {children({ x, slot, y, base })}
          {Array.from({ length: count }, (_, i) =>
            (count - 1 - i) % every === 0 ? (
              <text
                key={i}
                x={x(i)}
                y={base + 16}
                textAnchor={angled ? "end" : "middle"}
                transform={angled ? `rotate(-35 ${x(i)} ${base + 16})` : undefined}
                style={{ fill: "var(--muted-foreground)" }}
              >
                {xLabel(i)}
              </text>
            ) : null,
          )}
          {/* Vùng nhận chuột theo từng cột (trong suốt), phủ trên cùng */}
          {Array.from({ length: count }, (_, i) => (
            <rect
              key={i}
              x={PAD.left + slot * i}
              y={PAD.top}
              width={slot}
              height={plotH}
              fill="transparent"
              style={onSlotClick ? { cursor: "pointer" } : undefined}
              onClick={onSlotClick ? () => onSlotClick(i) : undefined}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
            />
          ))}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-32 -translate-x-1/2 rounded-lg border border-line bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: Math.min(Math.max(x(hover), 70), width - 70) }}
        >
          {tooltip(hover)}
        </div>
      )}
    </div>
  );
}

export type Series = { key: string; label: string; color: string };

/** Dòng trong tooltip: chấm màu + nhãn + số. */
export function TipRow({ color, label, value }: { color: string; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** Cột nhóm: mỗi danh mục một nhóm, mỗi series một cột. `colorOf` cho phép tô màu từng cột (Nhịp hằng ngày). */
export function BarChart<R>({
  rows,
  series,
  height,
  label,
  xLabel,
  tooltip,
  angled,
  colorOf,
  onBarClick,
  maxBar = 36,
}: {
  rows: R[];
  series: (Series & { value: (r: R) => number })[];
  height: number;
  label: string;
  xLabel: (r: R) => string;
  tooltip: (r: R) => ReactNode;
  angled?: boolean;
  colorOf?: (r: R, s: Series) => string;
  onBarClick?: (r: R) => void;
  maxBar?: number;
}) {
  const top = niceMax(Math.max(0, ...rows.flatMap((r) => series.map((s) => s.value(r)))));
  return (
    <Frame
      height={height}
      count={rows.length}
      top={top}
      xLabel={(i) => xLabel(rows[i])}
      angled={angled}
      tooltip={(i) => tooltip(rows[i])}
      label={label}
      onSlotClick={onBarClick ? (i) => onBarClick(rows[i]) : undefined}
    >
      {({ x, slot, y, base }) => {
        const gap = slot > 12 ? 4 : 1;
        const group = Math.min(slot * 0.8, (maxBar + gap) * series.length);
        const bar = Math.max(1, (group - gap * (series.length - 1)) / series.length);
        return rows.map((r, i) =>
          series.map((s, j) => {
            const v = s.value(r);
            const h = Math.max(0, base - y(v));
            const left = x(i) - group / 2 + j * (bar + gap);
            const radius = Math.min(4, bar / 2, h);
            return (
              <path
                key={`${i}-${s.key}`}
                d={roundedTop(left, base - h, bar, h, radius)}
                style={{ fill: colorOf ? colorOf(r, s) : s.color }}
              />
            );
          }),
        );
      }}
    </Frame>
  );
}

/** Hình chữ nhật bo hai góc trên. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Vùng nhiều đường (Nhịp làm & học): đường cong đơn điệu + nền chuyển màu mờ dần xuống trục. */
export function AreaChart<R>({
  rows,
  series,
  height,
  label,
  xLabel,
  tooltip,
}: {
  rows: R[];
  series: (Series & { value: (r: R) => number })[];
  height: number;
  label: string;
  xLabel: (r: R) => string;
  tooltip: (r: R) => ReactNode;
}) {
  const top = niceMax(Math.max(0, ...rows.flatMap((r) => series.map((s) => s.value(r)))));
  return (
    <Frame height={height} count={rows.length} top={top} xLabel={(i) => xLabel(rows[i])} tooltip={(i) => tooltip(rows[i])} label={label}>
      {({ x, y, base }) => (
        <>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" style={{ stopColor: s.color, stopOpacity: 0.35 }} />
                <stop offset="95%" style={{ stopColor: s.color, stopOpacity: 0.02 }} />
              </linearGradient>
            ))}
          </defs>
          {series.map((s) => {
            const pts = rows.map((r, i) => [x(i), y(s.value(r))] as const);
            const line = monotonePath(pts);
            const first = pts[0];
            const last = pts.at(-1);
            return (
              <g key={s.key}>
                {first && last && <path d={`${line}L${last[0]},${base}L${first[0]},${base}Z`} fill={`url(#area-${s.key})`} />}
                <path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: s.color }} />
              </g>
            );
          })}
        </>
      )}
    </Frame>
  );
}

/** Đường cong đơn điệu (Fritsch–Carlson): đi qua mọi điểm, không vọt quá đỉnh / đáy như spline thường. */
function monotonePath(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n < 3) return pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join("");
  const dx = pts.slice(1).map(([px], i) => px - pts[i][0]);
  const slope = pts.slice(1).map(([, py], i) => (py - pts[i][1]) / dx[i]);
  const m = pts.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    const a = slope[i - 1];
    const b = slope[i];
    return a * b <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / a + (dx[i] + 2 * dx[i - 1]) / b);
  });
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + m[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - m[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

/** Sparkline nhỏ trong ô KPI (chỉ trang trí, đã có số bên cạnh). */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const w = 80;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [2 + ((w - 4) * i) / Math.max(1, values.length - 1), h - 4 - ((h - 8) * (v - min)) / span] as const);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={`shrink-0 ${className}`} aria-hidden="true">
      <path d={monotonePath(pts)} fill="none" strokeWidth={1.5} style={{ stroke: "var(--muted-foreground)" }} />
    </svg>
  );
}
