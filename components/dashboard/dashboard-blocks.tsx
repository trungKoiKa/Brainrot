"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, Empty } from "@/components/card";
import { ProgressRing } from "@/components/goals/progress-ring";
import { Badge } from "@/components/reui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { formatDay } from "@/lib/date";
import { pctTone, type DashTask, type Tone } from "@/lib/dashboard/stats";
import { deadlineLabel } from "@/lib/today";
import { goalCounts, isGoalDone, type Goal } from "@/lib/goals";

// Màu lấy từ token (SPEC-v0.3 mục 7): --primary xanh, --chart-3 xanh lá, --chart-4 hổ phách, --chart-5 xám, --good "ổn"

// Trục Y chừa 15% phía trên để đỉnh đường cong không bị cắt
const Y_DOMAIN: [number, (max: number) => number] = [0, (max) => Math.max(4, Math.ceil(max * 1.15))];
const TONE_COLOR: Record<Tone, string> = { good: "var(--good)", warn: "var(--chart-4)", bad: "var(--danger)" };
const TONE_LABEL: Record<Tone, string> = { good: "Ổn", warn: "Cần để ý", bad: "Cần xử lý" };

export function SampleBadge() {
  return (
    <Badge variant="warning-light" radius="full" title="Dữ liệu mẫu, không phải số thật">
      Mẫu
    </Badge>
  );
}

function Dot({ tone }: { tone: Tone }) {
  return (
    <span
      role="img"
      aria-label={TONE_LABEL[tone]}
      title={TONE_LABEL[tone]}
      className="size-2 shrink-0 rounded-full"
      style={{ background: TONE_COLOR[tone] }}
    />
  );
}

// ---------- 4.1: 4 số liệu gọn trong một khung (critique 07/11/2026) ----------

export type KpiItem = {
  title: string;
  tone: Tone;
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
export function KpiStrip({ items, sample }: { items: KpiItem[]; sample: boolean }) {
  return (
    <Card>
      {sample && (
        <div className="-mt-1 mb-3 flex justify-end">
          <SampleBadge />
        </div>
      )}
      <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((k, i) => (
          <KpiCell key={k.title} item={k} first={i === 0} />
        ))}
      </dl>
    </Card>
  );
}

function KpiCell({ item: k, first }: { item: KpiItem; first: boolean }) {
  const config = { v: { label: k.title, color: TONE_COLOR[k.tone] } } satisfies ChartConfig;
  return (
    <div className={`flex flex-col ${first ? "" : "xl:border-l xl:border-line xl:pl-6"}`}>
      <dt className="text-sm font-medium text-muted-foreground">{k.title}</dt>
      <dd className="mt-2 flex items-end justify-between gap-3">
        <span className="whitespace-nowrap">
          <span className="font-serif text-2xl font-semibold tabular-nums">{k.value}</span>
          {k.unit && <span className="ml-1 text-sm text-muted-foreground">{k.unit}</span>}
        </span>
        {/* Đường phẳng không nói gì → ẩn */}
        {new Set(k.series).size > 1 && (
          <ChartContainer config={config} className="aspect-auto h-8 w-20 shrink-0" aria-hidden>
            <LineChart data={k.series.map((v, i) => ({ i, v }))} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line dataKey="v" type="monotone" stroke="var(--color-v)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        )}
      </dd>
      <dd className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {k.change !== undefined && k.change !== null && (
          <Badge variant={(k.change >= 0) === (k.upIsGood ?? true) ? "success-light" : "destructive-light"} radius="full">
            {k.change > 0 ? "+" : ""}
            {k.change}
            {(k.changeUnit ?? "%") === "%" ? "%" : " điểm"}
          </Badge>
        )}
        <span>{k.note}</span>
      </dd>
    </div>
  );
}

/** Chấm màu trạng thái có nhãn cho trình đọc màn hình. */
export function ToneDot({ tone }: { tone: Tone }) {
  return <Dot tone={tone} />;
}

// ---------- 4.2 ----------

const projectConfig = {
  doing: { label: "Đang làm", color: "var(--primary)" },
  todo: { label: "Chưa làm", color: "var(--chart-5)" },
} satisfies ChartConfig;

const NARROW = "(max-width: 640px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Màn hẹp → nghiêng nhãn trục X cho tên dự án khỏi đè nhau. */
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);

export function ProjectBars({ rows }: { rows: { project: string; doing: number; todo: number }[] }) {
  const router = useRouter();
  const narrow = useNarrow();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Không còn việc nào chưa xong.</p>;
  const href = (project: string) => `/tasks?project=${encodeURIComponent(project)}`;
  const open = (index: number) => router.push(href(rows[index].project));
  const summary = rows.map((r) => `${r.project}: ${r.doing} đang làm, ${r.todo} chưa làm`).join("; ");
  return (
    <>
      <Legend config={projectConfig} />
      <ChartContainer config={projectConfig} className="aspect-auto h-64 w-full" role="img" aria-label={`Việc chưa xong theo dự án. ${summary}.`}>
        <BarChart data={rows} margin={{ left: -12, right: 4 }} barGap={4} maxBarSize={36}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="project"
            tickLine={false}
            axisLine={false}
            interval={0}
            tickMargin={8}
            {...(narrow && { angle: -35, textAnchor: "end", height: 56 })}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} domain={Y_DOMAIN} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="doing" fill="var(--color-doing)" radius={4} className="cursor-pointer" onClick={(_, i) => open(i)} />
          <Bar dataKey="todo" fill="var(--color-todo)" radius={4} className="cursor-pointer" onClick={(_, i) => open(i)} />
        </BarChart>
      </ChartContainer>
      {/* Đường bàn phím / trình đọc màn hình thay cho bấm cột (chỉ chuột) */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Mở Tasks theo dự án">
        {rows.map((r) => (
          <li key={r.project}>
            <Link href={href(r.project)} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {r.project} <span className="tabular-nums">({r.doing + r.todo})</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------- 4.3 ----------

const weeklyConfig = {
  done: { label: "Việc xong", color: "var(--primary)" },
} satisfies ChartConfig;

/** Dưới số tuần/ngày có dữ liệu này thì biểu đồ chỉ toàn số 0 → thu thành một dòng (SPEC-v1.0, critique lần 2). */
const MIN_ACTIVE_WEEKS = 3;

export function WeeklyArea({ rows }: { rows: { week: string; done: number }[] }) {
  const total = rows.reduce((s, r) => s + r.done, 0);
  const active = rows.filter((r) => r.done > 0).length;
  const thisWeek = rows.at(-1)?.done ?? 0;
  if (active < MIN_ACTIVE_WEEKS) {
    return (
      <Empty>
        {total === 0
          ? "Chưa có việc nào xong trong 12 tuần qua."
          : `12 tuần qua: ${total} việc xong, ${active} tuần có việc xong (tuần này ${thisWeek}). Biểu đồ hiện khi có từ ${MIN_ACTIVE_WEEKS} tuần.`}
      </Empty>
    );
  }
  return (
    <>
      <ChartContainer
        config={weeklyConfig}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={`12 tuần: tổng ${total} việc xong, tuần này ${thisWeek}.`}
      >
        <AreaChart data={rows} margin={{ left: -12, right: 8 }}>
          <defs>
            {Object.keys(weeklyConfig).map((k) => (
              <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.35} />
                <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(w: string) => formatDay(w, true)} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} domain={Y_DOMAIN} />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={(w) => `Tuần từ ${formatDay(String(w), true)}`} />}
          />
          <Area dataKey="done" type="monotone" stroke="var(--color-done)" strokeWidth={2} fill="url(#fill-done)" />
        </AreaChart>
      </ChartContainer>
    </>
  );
}

// ---------- 4.4 ----------

type Day = { date: string; hasLog: boolean; done: number; exercised: boolean; dropped: boolean };

const dailyConfig = {
  h: { label: "Việc xong" },
  normal: { label: "Thường", color: "var(--chart-5)" },
  exercised: { label: "Có tập", color: "var(--chart-3)" },
  dropped: { label: "Có rơi việc", color: "var(--chart-4)" },
} satisfies ChartConfig;

const dayColor = (d: Day) =>
  !d.hasLog ? "var(--line)" : d.exercised ? "var(--color-exercised)" : d.dropped ? "var(--color-dropped)" : "var(--color-normal)";

export function DailyBars({ days }: { days: Day[] }) {
  // Ngày không có log vẫn có cột thấp để thấy "lỗ"
  const data = days.map((d) => ({ ...d, h: d.hasLog ? Math.max(d.done, 0.4) : 0.25 }));
  return (
    <>
      <Legend config={{ normal: dailyConfig.normal, exercised: dailyConfig.exercised, dropped: dailyConfig.dropped }} />
      <ChartContainer
        config={dailyConfig}
        className="aspect-auto h-56 w-full"
        role="img"
        aria-label={`${days.length} ngày: ${days.filter((d) => d.hasLog).length} ngày có log, tổng ${days.reduce((s, d) => s + d.done, 0)} việc xong.`}
      >
        <BarChart data={data} margin={{ left: -12, right: 4 }} barCategoryGap={days.length > 40 ? 1 : 3}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(d: string) => formatDay(d, true)} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} domain={Y_DOMAIN} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => formatDay(String(payload?.[0]?.payload?.date ?? ""))}
                formatter={(_, __, item) => {
                  const d = item.payload as Day;
                  if (!d.hasLog) return "Không ghi log";
                  return [`${d.done} việc xong`, d.exercised && "có tập", d.dropped && "có rơi việc"].filter(Boolean).join(" · ");
                }}
              />
            }
          />
          <Bar dataKey="h" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.date} fill={dayColor(d)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </>
  );
}

// ---------- 4.5 ----------

export function DueSoonList({ items, more }: { items: (DashTask & { deadline: string; daysLeft: number })[]; more: number }) {
  if (items.length === 0) return <Empty>Không có việc nào quá hạn hay sắp đến hạn.</Empty>;
  return (
    <ul className="divide-y divide-line text-sm">
      {items.map((t, i) => (
        <li key={`${t.title}-${i}`} className="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
          {/* Task không còn trang riêng (v1.0) → mở Tasks, lọc theo dự án của việc */}
          <Link
            href={t.project ? `/tasks?project=${encodeURIComponent(t.project)}` : "/tasks"}
            className="min-w-0 flex-1 truncate underline-offset-4 hover:text-primary hover:underline"
          >
            {t.title || "(Chưa đặt tên)"}
          </Link>
          <Badge variant={t.daysLeft < 0 ? "destructive-light" : t.daysLeft <= 3 ? "warning-light" : "outline"} className="shrink-0 tabular-nums">
            {deadlineLabel(t.daysLeft)}
          </Badge>
        </li>
      ))}
      {more > 0 && <li className="pt-2 text-muted-foreground">+{more} task</li>}
    </ul>
  );
}

// ---------- mục tiêu tháng này (SPEC-v0.4 mục 7) ----------

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

// ---------- thói quen (SPEC-v0.4 3.3) ----------

export function HabitBars({
  rows,
}: {
  rows: { name: string; count: number; days: number; pct: number; streak: number; best: number }[];
}) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const tone = pctTone(r.pct);
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

function Legend({ config }: { config: ChartConfig }) {
  return (
    <div className="mb-3 flex flex-wrap justify-end gap-4 text-xs text-muted-foreground">
      {Object.entries(config).map(([k, c]) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "color" in c ? c.color : undefined }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}
