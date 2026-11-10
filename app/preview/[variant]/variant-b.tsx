// Phương án B — "Gọn": công cụ trung tính, mật độ cao, một màu nhấn xanh dương, chỉ một font Inter.
import type { Task } from "@/lib/types";
import type { TodayData } from "./data";

const css = `
.vb{--bg:#fafafa;--sf:#ffffff;--sf2:#f2f2f3;--ln:#e5e5e7;--in:#8c8c94;--fg:#111113;--mu:#5c5c66;--ac:#1d5fd6;--acs:#e8effc;--wa:#9a5200;--dg:#c0261d;
--p1:#1d5fd6;--p2:#c0307a;--p3:#2c7a39;--p4:#a16400;--p0:#7a7a84}
[data-theme=dark] .vb{--bg:#0e0e10;--sf:#151517;--sf2:#1c1c1f;--ln:#2a2a2e;--in:#6a6a74;--fg:#ededef;--mu:#a1a1aa;--ac:#6ea0ff;--acs:#172540;--wa:#f2a93b;--dg:#ff8077;
--p1:#6ea0ff;--p2:#f07ab3;--p3:#6fcf7f;--p4:#f0b955;--p0:#8b8b95}`;

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 border-b border-[var(--ln)] px-4 py-2 text-xs font-semibold text-[var(--mu)]">
        {title}
        {count !== undefined && <span className="tabular-nums">{count}</span>}
      </h2>
      <ul>{children}</ul>
    </section>
  );
}

function Row({ t, d, meta, mark, done = false }: { t: Task; d: TodayData; meta?: React.ReactNode; mark?: "late" | "due"; done?: boolean }) {
  const slot = d.projectSlot(t.project);
  return (
    <li
      className={`relative flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--ln)] px-4 py-2 text-sm ${done ? "text-[var(--mu)]" : ""}`}
    >
      {mark && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5" style={{ background: mark === "late" ? "var(--wa)" : "var(--dg)" }} />}
      <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded-[4px] border text-xs leading-none ${done ? "border-[var(--ac)] bg-[var(--ac)] text-[var(--sf)]" : "border-[var(--in)]"}`}>
        {done && "✓"}
      </span>
      <span className={`min-w-0 flex-1 basis-56 ${done ? "line-through" : ""}`}>{t.title}</span>
      <span className="flex items-center gap-3 text-xs text-[var(--mu)]">
        {meta}
        {t.project && (
          <span className="flex w-24 items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: `var(--p${slot})` }} />
            {t.project}
          </span>
        )}
      </span>
    </li>
  );
}

export function VariantB({ d }: { d: TodayData }) {
  const { plan } = d;
  return (
    <div className="vb flex min-h-screen bg-[var(--bg)] text-[var(--fg)]" style={{ fontFamily: "var(--font-inter)" }}>
      <style>{css}</style>
      <nav className="hidden w-56 shrink-0 flex-col gap-0.5 border-r border-[var(--ln)] px-3 py-4 text-sm lg:flex" aria-label="Điều hướng">
        <p className="mb-4 flex items-center gap-2 px-2 font-semibold">
          <span className="grid size-6 place-items-center rounded-md bg-[var(--fg)] text-xs text-[var(--bg)]">B</span>Brainrot
        </p>
        {["Hôm nay", "Việc", "Mục tiêu", "Tổng quan"].map((n, i) => (
          <span key={n} className={`rounded-md px-2 py-1.5 ${i === 0 ? "bg-[var(--sf2)] font-medium" : "text-[var(--mu)]"}`}>
            {n}
          </span>
        ))}
        <span className="mt-auto rounded-md px-2 py-1.5 text-[var(--mu)]">Cài đặt</span>
      </nav>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--ln)] px-4 py-3 md:px-6">
          <h1 className="text-base font-semibold">Hôm nay</h1>
          <span className="text-sm text-[var(--mu)]">{d.dateLong}</span>
          {d.target && (
            <span className="ml-auto text-sm tabular-nums text-[var(--mu)]">
              <b className="font-semibold text-[var(--fg)]">{d.target.days}</b> ngày đến {d.target.label}
            </span>
          )}
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0 border-[var(--ln)] xl:border-r">
            <div className="flex items-center gap-3 px-4 py-4 md:px-6">
              <p className="text-xl font-semibold tracking-tight">{d.greeting}</p>
              {d.progress && (
                <span className="ml-auto flex items-center gap-2 text-sm tabular-nums text-[var(--mu)]">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--sf2)]">
                    <span className="block h-full bg-[var(--ac)]" style={{ width: `${(100 * d.progress.done) / Math.max(1, d.progress.total)}%` }} />
                  </span>
                  {d.progress.done}/{d.progress.total}
                </span>
              )}
            </div>
            <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-[var(--ln)] bg-[var(--sf)] px-3 py-2 text-sm text-[var(--mu)] md:mx-6">
              Thêm việc cho hôm nay…
              <kbd className="ml-auto rounded border border-[var(--ln)] px-1.5 text-xs">N</kbd>
            </div>
            <div className="border-t border-[var(--ln)] bg-[var(--sf)]">
              {plan.late.length > 0 && (
                <Section title="Trễ lịch" count={plan.late.length}>
                  {plan.late.map((t) => (
                    <Row key={t.id} t={t} d={d} mark="late" meta={<span className="font-medium text-[var(--wa)]">trễ {t.lateDays}n · Làm hôm nay ↵</span>} />
                  ))}
                </Section>
              )}
              {plan.due.length > 0 && (
                <Section title="Hạn hôm nay" count={plan.due.length}>
                  {plan.due.map((t) => (
                    <Row key={t.id} t={t} d={d} mark="due" meta={<span className="font-medium text-[var(--dg)]">hạn hôm nay</span>} />
                  ))}
                </Section>
              )}
              <Section title="Đã xếp hôm nay" count={plan.planned.length + d.doneToday.length}>
                {plan.planned.map((t) => (
                  <Row key={t.id} t={t} d={d} meta={t.deadline ? <span className="tabular-nums">hạn {d.fmt(t.deadline)}</span> : null} />
                ))}
                {d.doneToday.map((t) => (
                  <Row key={t.id} t={t} d={d} done />
                ))}
              </Section>
            </div>
          </main>

          <aside className="flex flex-col gap-6 px-4 py-4 md:px-6">
            <section>
              <h2 className="mb-2 text-xs font-semibold text-[var(--mu)]">Thói quen</h2>
              <ul className="flex flex-col">
                {d.habits.map((h) => (
                  <li key={h.name} className="flex items-center gap-2 py-1.5 text-sm">
                    <span aria-hidden className={`size-4 rounded-[4px] border ${h.today ? "border-[var(--ac)] bg-[var(--ac)]" : "border-[var(--in)]"}`} />
                    <span className="flex-1 truncate">{h.name}</span>
                    <span className="flex gap-0.5" aria-label={`${h.week.filter((x) => x.done).length}/7 ngày`}>
                      {h.week.map((x) => (
                        <span key={x.day} className={`h-3 w-1.5 rounded-[1px] ${x.done ? "bg-[var(--ac)]" : "bg-[var(--sf2)]"}`} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-2 text-xs font-semibold text-[var(--mu)]">Hạn 14 ngày tới</h2>
              <ul className="flex flex-col">
                {d.deadlines.map((t) => (
                  <li key={t.id} className="flex items-baseline gap-3 py-1.5 text-sm">
                    <span className={`w-14 shrink-0 whitespace-nowrap text-xs tabular-nums ${t.daysLeft < 0 ? "font-medium text-[var(--dg)]" : t.daysLeft <= 1 ? "font-medium text-[var(--wa)]" : "text-[var(--mu)]"}`}>
                      {t.daysLeft < 0 ? `quá ${-t.daysLeft}n` : t.daysLeft === 0 ? "hôm nay" : `${t.daysLeft} ngày`}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </section>
            {d.weekGoals.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold text-[var(--mu)]">Mục tiêu tuần</h2>
                <ul className="flex flex-col gap-1 text-sm">
                  {d.weekGoals.map((g) => (
                    <li key={g.id} className={g.done ? "text-[var(--mu)] line-through" : ""}>
                      {g.title}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
