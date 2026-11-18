// Lưới thói quen kiểu GitHub cho Quý / Năm: mỗi thói quen một khối 7 hàng (T2 → CN) × các tuần, chỉ xem
// (SPEC.md mục 5.3, Trung chốt 19/11/2026). Tích ở Tuần hoặc Tháng.

import Link from "next/link";
import { Card } from "@/components/card";
import { addDays } from "@/lib/date";
import { habitTone, isHabitActive, rangeStats } from "@/lib/habits";
import { monthOf } from "@/lib/period";
import type { Habit } from "@/lib/types";

const GAP = 2;
const mondayOf = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

/** Các cột tuần phủ [start, end]; ngày ngoài khoảng là null (ô trống giữ chỗ). */
function weekColumns(start: string, end: string): (string | null)[][] {
  const cols: (string | null)[][] = [];
  for (let monday = mondayOf(start); monday <= end; monday = addDays(monday, 7)) {
    cols.push(Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => (d < start || d > end ? null : d)));
  }
  return cols;
}

export function HabitGrid({
  title,
  start,
  end,
  today,
  habits,
  doneByDay,
  tickHref,
}: {
  title: string;
  start: string;
  end: string;
  today: string;
  habits: Habit[];
  doneByDay: Record<string, string[]>;
  /** Link tới tuần đang chạy để tích. */
  tickHref: string;
}) {
  const cols = weekColumns(start, end);
  const days = cols.flat().filter((d): d is string => d !== null);
  const stats = rangeStats(habits, doneByDay, days, today);
  // Ô vuông giãn theo bề ngang thẻ, giới hạn trên / dưới: năm ~53 cột, quý ~14 cột. Màn hẹp thì cuộn ngang.
  const n = cols.length;
  const [minCell, maxCell] = n > 20 ? [10, 22] : [14, 26];
  const size = { width: `min(100%, ${n * (maxCell + GAP)}px)`, minWidth: n * (minCell + GAP) };
  const columns = `repeat(${n}, minmax(0, 1fr))`;
  // Nhãn tháng đặt ở cột chứa ngày 1 của tháng (hoặc cột đầu)
  const monthLabels = cols.map((col, i) => {
    const first = col.find((d) => d !== null && (d.endsWith("-01") || (i === 0 && d === start)));
    return first ? `T${Number(first.slice(5, 7))}` : "";
  });

  return (
    <Card title={title} action={<span className="text-sm text-muted-foreground">{stats.elapsed} ngày đã qua</span>}>
      {stats.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có thói quen nào trong kỳ này.</p>
      ) : (
        <ul className={n > 20 ? "space-y-5" : "grid gap-x-8 gap-y-5 lg:grid-cols-2"}>
          {[...stats.rows].map((r) => (
            <li key={r.habit.id}>
              <div className="mb-2 flex items-baseline gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{r.habit.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {r.count}/{r.tracked} ngày · dài nhất {r.best}
                </span>
                <span className="w-11 text-right font-medium tabular-nums" style={{ color: r.tracked ? habitTone(r.pct) : undefined }}>
                  {r.tracked ? `${r.pct}%` : "–"}
                </span>
              </div>
              <div className="-mx-4 overflow-x-auto px-4">
                <div style={size} role="img" aria-label={`${r.habit.name}: đã làm ${r.count} trên ${r.tracked} ngày`}>
                  <div className="mb-1 grid text-xs text-muted-foreground" style={{ gap: GAP, gridTemplateColumns: columns }} aria-hidden="true">
                    {monthLabels.map((l, i) => (
                      <span key={i} className="overflow-visible whitespace-nowrap">
                        {l}
                      </span>
                    ))}
                  </div>
                  <div
                    className="grid grid-flow-col"
                    style={{ gap: GAP, gridTemplateColumns: columns, gridTemplateRows: "repeat(7, auto)" }}
                    aria-hidden="true"
                  >
                    {cols.flat().map((d, i) => {
                      if (d === null) return <span key={i} className="aspect-square" />;
                      const tracked = isHabitActive(r.habit, monthOf(d));
                      const state = d > today || !tracked ? "off" : r.done.has(d) ? "done" : "miss";
                      return (
                        <span
                          key={d}
                          title={`${d}: ${state === "done" ? "đã làm" : state === "miss" ? "chưa làm" : d > today ? "chưa tới" : "chưa theo dõi"}`}
                          className={`aspect-square rounded-[3px] ${
                            state === "done" ? "bg-primary" : state === "miss" ? "bg-line" : "border border-line-soft"
                          } ${d === today ? "ring-1 ring-foreground/60" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-primary" /> đã làm</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-line" /> chưa làm</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] border border-line-soft" /> chưa tới / chưa theo dõi</span>
        <span className="ml-auto">
          Chỉ xem.{" "}
          <Link href={tickHref} className="text-primary underline underline-offset-2">
            Tích ở tuần này
          </Link>
        </span>
      </div>
    </Card>
  );
}
