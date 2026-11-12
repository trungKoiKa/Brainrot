"use client";

import { StatusPill } from "@/components/pill";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { ProgressRing } from "@/components/goals/progress-ring";
import { Badge } from "@/components/reui/badge";
import { AreaChart, BarChart, Sparkline, TipRow } from "./charts";
import { Progress } from "@/components/ui/progress";
import { formatDay } from "@/lib/date";
import { pctTone, type DashTask, type KpiTone, type Tone } from "@/lib/dashboard/stats";
import { deadlineLabel } from "@/lib/today";
import { goalCounts, isGoalDone, type Goal } from "@/lib/goals";

// Màu (SPEC.md mục 5.4, critique lần 3): trạng thái dùng token ngữ nghĩa --good / --warning / --danger;
// màu Lĩnh vực (--chart-1..5) chỉ để phân loại; sparkline màu trung tính.

const TONE_COLOR: Record<Tone, string> = { good: "var(--good)", warn: "var(--warning)", bad: "var(--danger)" };
const TONE_LABEL: Record<KpiTone, string> = { good: "Ổn", warn: "Cần để ý", bad: "Cần xử lý", none: "Chưa đủ dữ liệu" };
/** Thay đổi nhỏ hơn mức này coi như đứng yên: không tô xanh/đỏ */
const NOISE = 5;

function Dot({ tone }: { tone: KpiTone }) {
  return (
    <span
      role="img"
      aria-label={TONE_LABEL[tone]}
      title={TONE_LABEL[tone]}
      className="size-2 shrink-0 rounded-full"
      style={tone === "none" ? { border: "1.5px solid var(--muted-foreground)" } : { background: TONE_COLOR[tone] }}
    />
  );
}

/** Huy hiệu ±% (hoặc ± điểm); |thay đổi| < 5 → viền trung tính. */
export function ChangeBadge({
  change,
  unit = "%",
  upIsGood = true,
}: {
  change: number | null | undefined;
  unit?: "%" | "điểm";
  upIsGood?: boolean;
}) {
  if (change === null || change === undefined) return null;
  const variant = Math.abs(change) < NOISE ? "outline" : (change >= 0) === upIsGood ? "success-light" : "destructive-light";
  // Tăng ≥ 100% trên nền nhỏ ("+1700%") dễ hiểu sai → nói "gấp N lần" (rà soát A1/A2, P1)
  const text =
    unit === "%" && change >= 100
      ? `gấp ${Math.round(((100 + change) / 100) * 10) / 10} lần`
      : `${change > 0 ? "+" : ""}${change}${unit === "%" ? "%" : " điểm"}`;
  return (
    <Badge variant={variant} radius="full">
      {text}
    </Badge>
  );
}

// ---------- 4.1: 4 số liệu gọn trong một khung (critique 07/11/2026) ----------

export type KpiItem = {
  title: string;
  tone: KpiTone;
  value: string;
  /** Đơn vị in nhỏ cạnh số (vd "ngày"), tách khỏi số để không dính khoảng trắng của chữ số đều */
  unit?: string;
  series: number[];
  change?: number | null;
  changeUnit?: "%" | "điểm";
  upIsGood?: boolean;
  note: string;
};

/** Một hàng 4 số liệu trong một khung (thay 4 thẻ rời), để thẻ tóm tắt tuần là tiêu điểm. */
export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <Card>
      <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((k, i) => (
          <KpiCell key={k.title} item={k} first={i === 0} />
        ))}
      </dl>
    </Card>
  );
}

/** Đường xu hướng chỉ vẽ khi có ít nhất 2 lần đổi giá trị (một bậc thang đơn lẻ trông như lỗi hiển thị). */
const hasTrend = (series: number[]) => series.filter((v, i) => i > 0 && v !== series[i - 1]).length >= 2;

function KpiCell({ item: k, first }: { item: KpiItem; first: boolean }) {
  return (
    <div className={`flex flex-col ${first ? "" : "xl:border-l xl:border-line xl:pl-6"}`}>
      {/* Trạng thái bằng chấm có nhãn (không chỉ bằng màu sparkline) */}
      <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Dot tone={k.tone} />
        {k.title}
      </dt>
      <dd className="mt-2 flex items-end justify-between gap-3">
        <span className="whitespace-nowrap">
          <span className={`font-mono text-2xl tabular-nums ${k.tone === "none" ? "text-muted-foreground" : ""}`}>{k.value}</span>
          {k.unit && <span className="ml-1 text-sm text-muted-foreground">{k.unit}</span>}
        </span>
        {/* Đường phẳng không nói gì → ẩn */}
        {k.tone !== "none" && hasTrend(k.series) && (
          <Sparkline values={k.series} />
        )}
      </dd>
      <dd className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ChangeBadge change={k.change} unit={k.changeUnit} upIsGood={k.upIsGood} />
        <span>{k.note}</span>
      </dd>
    </div>
  );
}

/** Chấm màu trạng thái có nhãn cho trình đọc màn hình. */
export function ToneDot({ tone }: { tone: KpiTone }) {
  return <Dot tone={tone} />;
}

// ---------- 4.2 ----------

type ProjectRow = { project: string; doing: number; todo: number };
const PROJECT_SERIES = [
  { key: "doing", label: "Đang làm", color: "var(--primary)", value: (r: ProjectRow) => r.doing },
  { key: "todo", label: "Chưa làm", color: "var(--chart-5)", value: (r: ProjectRow) => r.todo },
];

const NARROW = "(max-width: 640px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Màn hẹp → nghiêng nhãn trục X cho tên dự án khỏi đè nhau. */
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);

export function ProjectBars({ rows }: { rows: ProjectRow[] }) {
  const router = useRouter();
  const narrow = useNarrow();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Không còn việc nào chưa xong.</p>;
  const href = (project: string) => `/tasks?project=${encodeURIComponent(project)}`;
  const summary = rows.map((r) => `${r.project}: ${r.doing} đang làm, ${r.todo} chưa làm`).join("; ");
  // Đường bàn phím / trình đọc màn hình thay cho bấm cột (chỉ chuột)
  const links = (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Mở Tasks theo dự án">
      {rows.map((r) => (
        <li key={r.project}>
          <Link href={href(r.project)} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {r.project} <span className="tabular-nums">({r.doing + r.todo})</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  // Chỉ một nhóm: biểu đồ cột không so sánh được gì → một dòng chữ + link
  if (rows.length === 1) {
    const only = rows[0];
    return (
      <>
        <p className="text-sm text-muted-foreground">
          {only.project}: {only.doing} đang làm, {only.todo} chưa làm.
        </p>
        {links}
      </>
    );
  }
  return (
    <>
      <Legend items={PROJECT_SERIES} />
      <BarChart
        rows={rows}
        series={PROJECT_SERIES}
        height={narrow ? 224 : 192}
        angled={narrow}
        label={`Việc chưa xong theo dự án. ${summary}.`}
        xLabel={(r) => r.project}
        onBarClick={(r) => router.push(href(r.project))}
        tooltip={(r) => (
          <>
            <p className="mb-1 font-medium">{r.project}</p>
            {PROJECT_SERIES.map((x) => (
              <TipRow key={x.key} color={x.color} label={x.label} value={x.value(r)} />
            ))}
          </>
        )}
      />
      {links}
    </>
  );
}

// ---------- 4.3 ----------

type WeekRow = { week: string; done: number; learned: number };
const WEEKLY_SERIES = [
  { key: "done", label: "Việc xong", color: "var(--primary)", value: (r: WeekRow) => r.done },
  { key: "learned", label: "Ghi chú mới", color: "var(--chart-3)", value: (r: WeekRow) => r.learned },
];

/** Dưới số tuần/ngày có dữ liệu này thì biểu đồ chỉ toàn số 0 → thu thành một dòng (SPEC.md mục 5.4, critique lần 2). */
export const MIN_ACTIVE_WEEKS = 3;

/** Trang gọi chỉ vẽ khi đã có từ MIN_ACTIVE_WEEKS tuần có hoạt động (dashboard-view.tsx). */
export function WeeklyArea({ rows }: { rows: WeekRow[] }) {
  const total = rows.reduce((s, r) => s + r.done, 0);
  const learned = rows.reduce((s, r) => s + r.learned, 0);
  const last = rows.at(-1);
  return (
    <>
      <Legend items={WEEKLY_SERIES} />
      <AreaChart
        rows={rows}
        series={WEEKLY_SERIES}
        height={256}
        label={`12 tuần: tổng ${total} việc xong và ${learned} ghi chú mới; tuần này ${last?.done ?? 0} việc, ${last?.learned ?? 0} ghi chú.`}
        xLabel={(r) => formatDay(r.week, true)}
        tooltip={(r) => (
          <>
            <p className="mb-1 font-medium">Tuần từ {formatDay(r.week, true)}</p>
            {WEEKLY_SERIES.map((x) => (
              <TipRow key={x.key} color={x.color} label={x.label} value={x.value(r)} />
            ))}
          </>
        )}
      />
    </>
  );
}

// ---------- 4.4 ----------

type Day = { date: string; hasLog: boolean; done: number; exercised: boolean; dropped: boolean };

const DAILY_LEGEND = [
  { key: "normal", label: "Thường", color: "var(--chart-5)" },
  { key: "exercised", label: "Có tập", color: "var(--good)" },
  { key: "dropped", label: "Có việc chưa xong", color: "var(--warning)" },
];

const dayColor = (d: Day) => (!d.hasLog ? "var(--line)" : d.exercised ? "var(--good)" : d.dropped ? "var(--warning)" : "var(--chart-5)");

export function DailyBars({ days }: { days: Day[] }) {
  const logged = days.filter((d) => d.hasLog).length;
  const total = days.reduce((sum, d) => sum + d.done, 0);
  return (
    <>
      <Legend items={DAILY_LEGEND} />
      <BarChart
        rows={days}
        // Ngày không có log vẫn có cột thấp để thấy "lỗ"
        series={[{ key: "done", label: "Việc xong", color: "var(--chart-5)", value: (d: Day) => (d.hasLog ? Math.max(d.done, 0.4) : 0.25) }]}
        colorOf={(d) => dayColor(d)}
        maxBar={28}
        height={224}
        label={`${days.length} ngày: ${logged} ngày có log, tổng ${total} việc xong.`}
        xLabel={(d) => formatDay(d.date, true)}
        tooltip={(d) => (
          <>
            <p className="mb-1 font-medium">{formatDay(d.date)}</p>
            <p className="text-muted-foreground">
              {d.hasLog ? [`${d.done} việc xong`, d.exercised && "có tập", d.dropped && "có việc chưa xong"].filter(Boolean).join(" · ") : "Không ghi log"}
            </p>
          </>
        )}
      />
    </>
  );
}

// ---------- 4.5 ----------

export function DueSoonList({ items, more }: { items: (DashTask & { deadline: string; daysLeft: number })[]; more: number }) {
  if (items.length === 0) return <Empty>Không có việc nào quá hạn hay sắp đến hạn.</Empty>;
  return (
    <ul className="divide-y divide-line-soft text-sm">
      {items.map((t, i) => (
        <li key={`${t.title}-${i}`} className="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
          {/* Task không còn trang riêng (v1.0) → mở Tasks, lọc theo dự án của việc */}
          <Link
            href={t.project ? `/tasks?project=${encodeURIComponent(t.project)}` : "/tasks"}
            className="min-w-0 flex-1 truncate underline-offset-4 hover:text-primary hover:underline"
          >
            {t.title || "(Chưa đặt tên)"}
          </Link>
          <StatusPill tone={t.daysLeft <= 0 ? "danger" : t.daysLeft <= 3 ? "warning" : "muted"}>{deadlineLabel(t.daysLeft)}</StatusPill>
        </li>
      ))}
      {more > 0 && <li className="pt-2 text-muted-foreground">+{more} task</li>}
    </ul>
  );
}

// ---------- mục tiêu tháng này (SPEC.md mục 5.4) ----------

export function MonthGoals({ goals }: { goals: Goal[] }) {
  const c = goalCounts(goals);
  if (c.total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa đặt mục tiêu tháng này.{" "}
        <Link href="/goals?level=month" className="text-primary underline underline-offset-2">
          Đặt mục tiêu
        </Link>
      </p>
    );
  }
  const priority = goals.filter((g) => g.type === "Ưu tiên" && g.title.trim());
  const regular = goals.filter((g) => g.type === "Thường" && g.title.trim());
  return (
    <div>
      <div className="flex items-center gap-4">
        <ProgressRing pct={c.progress} size={64} />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{c.completed}</span>/{c.total} mục tiêu xong
        </p>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {priority.map((g) => (
          <li key={g.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                isGoalDone(g) ? "border-primary bg-primary text-primary-foreground" : "border-line"
              }`}
            >
              {isGoalDone(g) && <CheckIcon className="size-3" strokeWidth={3} />}
            </span>
            <span className={`truncate ${isGoalDone(g) ? "text-muted-foreground line-through" : ""}`}>{g.title}</span>
            <span className="sr-only">{isGoalDone(g) ? "(đã xong)" : "(chưa xong)"}</span>
          </li>
        ))}
        {regular.length > 0 && (
          <li className="text-xs text-muted-foreground">
            + {regular.length} mục tiêu thường ({regular.filter(isGoalDone).length} xong)
          </li>
        )}
      </ul>
    </div>
  );
}

// ---------- thói quen (SPEC.md mục 5.4) ----------

export function HabitBars({
  rows,
}: {
  rows: { name: string; count: number; days: number; pct: number; streak: number; best: number }[];
}) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        // Thói quen chưa đạt: "cần để ý" (vàng), không phải lỗi (đỏ) — DESIGN.md → Colors
        const tone = pctTone(r.pct) === "bad" ? "warn" : pctTone(r.pct);
        return (
          <li key={r.name}>
            <div className="flex items-center gap-2 text-sm">
              <Dot tone={tone} />
              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
              <span className="font-medium tabular-nums">{r.pct}%</span>
            </div>
            <Progress
              value={r.pct}
              aria-label={`${r.name}: ${r.pct}%`}
              className="mt-2 [&_[data-slot=progress-indicator]]:bg-(--lane) [&_[data-slot=progress-track]]:h-1.5"
              style={{ "--lane": TONE_COLOR[tone] } as React.CSSProperties}
            />
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {r.count}/{r.days} ngày · chuỗi {r.streak} ngày · dài nhất {r.best} ngày
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Legend({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap justify-end gap-4 text-xs text-muted-foreground">
      {items.map((c) => (
        <span key={c.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: c.color }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}
