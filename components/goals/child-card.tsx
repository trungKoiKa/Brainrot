// Thẻ kỳ con trên Goal (SPEC.md mục 5.3): tóm tắt mục tiêu của từng tuần / tháng nằm trong kỳ đang xem.

import Link from "next/link";
import { Card } from "@/components/card";
import { ProgressRing } from "@/components/goals/progress-ring";
import { goalCounts, type Goal } from "@/lib/goals";
import { goalsHref, periodLabel, type Period } from "@/lib/period";

/** Thẻ quý (trong Năm) / tháng (trong Quý): % + mục tiêu Ưu tiên, bấm để mở (SPEC.md mục 5.3). */
export function ChildCard({ period, goals, monthGoals, current, today }: { period: Period; goals: Goal[]; monthGoals: number; current: boolean; today: string }) {
  const c = goalCounts(goals);
  const priority = goals.filter((g) => g.type === "Ưu tiên" && g.title.trim());
  return (
    // Viền nổi bật đặt ở ring của link (Card đã có border-line, thêm border-* nữa thì không chắc class nào thắng)
    <Link
      href={goalsHref(period)}
      className={`block ring-primary transition-shadow hover:ring-1 focus-visible:outline-2 focus-visible:outline-primary ${current ? "ring-1" : ""}`}
    >
      <Card className="h-full">
        <div className="flex items-center gap-4">
          <ProgressRing pct={c.progress} size={64} empty={c.total === 0} neutral={period.end >= today} />
          <div>
            <h2 className="text-base font-semibold tabular-nums">{periodLabel(period)}</h2>
            <p className="text-xs text-muted-foreground">
              {c.completed}/{c.total} mục tiêu
            </p>
            {monthGoals > 0 && <p className="text-xs text-muted-foreground tabular-nums">+{monthGoals} mục tiêu ở các tháng</p>}
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">
          {priority.length === 0 ? (
            <li className="text-muted-foreground">Chưa có mục tiêu ưu tiên.</li>
          ) : (
            priority.map((g) => (
              <li key={g.id} className={`truncate ${g.done ? "text-muted-foreground line-through" : ""}`}>
                {g.title}
              </li>
            ))
          )}
        </ul>
      </Card>
    </Link>
  );
}
