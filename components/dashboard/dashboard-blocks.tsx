"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/card";
import { Badge } from "@/components/reui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { formatDay } from "@/lib/date";
import { pctTone, type Tone } from "@/lib/dashboard/stats";

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

// ---------- 4.1 ----------

export function KpiCard({
  title,
  subtitle,
  tone,
  value,
  series,
  change,
  changeUnit = "%",
  upIsGood = true,
  note,
  sample,
}: {
  title: string;
  subtitle: string;
  tone: Tone;
  value: string;
  series: number[];
  change?: number | null;
  changeUnit?: "%" | "điểm";
  upIsGood?: boolean;
  note: string;
  sample: boolean;
}) {
  const config = { v: { label: title, color: TONE_COLOR[tone] } } satisfies ChartConfig;
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="flex items-center gap-2">
          {sample && <SampleBadge />}
          <Dot tone={tone} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-serif text-2xl font-semibold whitespace-nowrap">{value}</p>
        {series.length > 1 && (
          <ChartContainer config={config} className="aspect-auto h-10 w-24 shrink-0" aria-hidden>
            <LineChart data={series.map((v, i) => ({ i, v }))} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line dataKey="v" type="monotone" stroke="var(--color-v)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted-foreground">
        {change !== undefined && change !== null && (
          <Badge variant={(change >= 0) === upIsGood ? "success-light" : "destructive-light"} radius="full">
            {change > 0 ? "+" : ""}
            {change}
            {changeUnit === "%" ? "%" : " điểm"}
          </Badge>
        )}
        <span>{note}</span>
      </div>
    </Card>
  );
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
  const open = (index: number) => router.push(`/tasks?project=${encodeURIComponent(rows[index].project)}`);
  return (
    <>
      <Legend config={projectConfig} />
      <ChartContainer config={projectConfig} className="aspect-auto h-64 w-full">
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
    </>
  );
}

// ---------- 4.3 ----------

const weeklyConfig = {
  done: { label: "Task xong", color: "var(--primary)" },
  learned: { label: "Kiến thức mới", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function WeeklyArea({ rows }: { rows: { week: string; done: number; learned: number }[] }) {
  return (
    <>
      <Legend config={weeklyConfig} />
      <ChartContainer config={weeklyConfig} className="aspect-auto h-64 w-full">
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
          <Area dataKey="learned" type="monotone" stroke="var(--color-learned)" strokeWidth={2} fill="url(#fill-learned)" />
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
      <ChartContainer config={dailyConfig} className="aspect-auto h-56 w-full">
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

export function PlannerLanes({ lanes, more }: { lanes: { name: string; done: number; total: number; pct: number }[]; more: number }) {
  return (
    <ul className="space-y-4">
      {lanes.map((l) => {
        const tone = pctTone(l.pct);
        return (
          <li key={l.name}>
            <div className="flex items-center gap-2 text-sm">
              <Dot tone={tone} />
              <span className="min-w-0 flex-1 truncate font-medium">{l.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {l.done}/{l.total}
              </span>
            </div>
            <Progress
              value={l.pct}
              aria-label={`${l.name}: ${l.pct}%`}
              className="mt-2 [&_[data-slot=progress-indicator]]:bg-(--lane) [&_[data-slot=progress-track]]:h-1.5"
              style={{ "--lane": TONE_COLOR[tone] } as React.CSSProperties}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{l.pct}%</p>
          </li>
        );
      })}
      {more > 0 && <li className="text-sm text-muted-foreground">+{more} dự án</li>}
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
