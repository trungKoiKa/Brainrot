// Phương án A — "Mềm": sổ kế hoạch thân thiện, góc bo lớn, một màu nhấn xanh ngọc, chữ Be Vietnam Pro.
import type { Task } from "@/lib/types";
import type { TodayData } from "./data";

const css = `
.va{--bg:#f3f4f8;--sf:#ffffff;--sf2:#eceef4;--ln:#dfe2ea;--in:#8a90a2;--fg:#1b1d26;--mu:#565b6c;--ac:#0b7a66;--acs:#dcf3ec;--wa:#9a5b00;--was:#fff1d6;--dg:#b42318;--dgs:#fde7e4;
--p1:#2563c9;--p2:#b8336a;--p3:#2f7a2f;--p4:#9a6700;--p0:#6b7080}
[data-theme=dark] .va{--bg:#111217;--sf:#1a1c23;--sf2:#23262f;--ln:#2e313b;--in:#6c7285;--fg:#eceef4;--mu:#a3a8b8;--ac:#4fd1b0;--acs:#173a33;--wa:#f5b74a;--was:#3a2c12;--dg:#ff8f84;--dgs:#3d1d1b;
--p1:#7fb0ff;--p2:#f08bb6;--p3:#7fd07f;--p4:#f0c060;--p0:#a3a8b8}`;

function Pill({ slot, children }: { slot: number; children: React.ReactNode }) {
  const c = `var(--p${slot})`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: c }} />
      {children}
    </span>
  );
}

function Row({ t, d, done = false, extra }: { t: Task; d: TodayData; done?: boolean; extra?: React.ReactNode }) {
  return (
    <li className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-4 py-3 ${done ? "opacity-60" : "bg-[var(--sf)]"}`}>
      <span
        aria-hidden
        className={`grid size-[22px] shrink-0 place-items-center rounded-full border-2 ${done ? "border-[var(--ac)] bg-[var(--ac)] text-[var(--sf)]" : "border-[var(--in)]"}`}
      >
        {done && "✓"}
      </span>
      <span className={`min-w-0 flex-1 basis-48 text-[15px] ${done ? "line-through" : ""}`}>{t.title}</span>
      {t.project && <Pill slot={d.projectSlot(t.project)}>{t.project}</Pill>}
      {extra}
    </li>
  );
}

export function VariantA({ d }: { d: TodayData }) {
  const { plan } = d;
  return (
    <div className="va min-h-screen bg-[var(--bg)] text-[var(--fg)]" style={{ fontFamily: "var(--font-bvp)" }}>
      <style>{css}</style>
      <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-6 md:px-8">
        <nav className="sticky top-6 hidden h-fit w-52 shrink-0 flex-col gap-1 lg:flex" aria-label="Điều hướng">
          <p className="mb-5 px-3 text-lg font-bold">
            Brainrot<span className="text-[var(--ac)]">.</span>
          </p>
          {["Hôm nay", "Việc", "Mục tiêu", "Tổng quan", "Cài đặt"].map((n, i) => (
            <span key={n} className={`rounded-full px-4 py-2.5 text-[15px] ${i === 0 ? "bg-[var(--fg)] font-semibold text-[var(--bg)]" : "text-[var(--mu)]"}`}>
              {n}
            </span>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <header className="mb-6">
            <p className="text-sm text-[var(--mu)]">{d.dateLong}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{d.greeting}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.progress && (
                <span className="rounded-full bg-[var(--acs)] px-4 py-2 text-sm font-semibold text-[var(--ac)]">
                  {d.progress.done}/{d.progress.total} việc hôm nay
                </span>
              )}
              {d.target && (
                <span className="rounded-full bg-[var(--sf)] px-4 py-2 text-sm">
                  Còn <b className="tabular-nums">{d.target.days} ngày</b> đến {d.target.label}
                </span>
              )}
              <span className="rounded-full bg-[var(--sf)] px-4 py-2 text-sm">{d.deadlines.filter((x) => x.daysLeft <= 3).length} hạn trong 3 ngày</span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-[28px] bg-[var(--sf2)] p-3 md:p-4">
              <h2 className="px-3 pt-2 pb-3 text-xl font-bold">Hôm nay làm</h2>
              <ul className="flex flex-col gap-2">
                {plan.late.map((t) => (
                  <Row
                    key={t.id}
                    t={t}
                    d={d}
                    extra={
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--was)] px-2.5 py-0.5 text-xs font-medium text-[var(--wa)]">trễ {t.lateDays} ngày</span>
                        <span className="rounded-full border border-[var(--ln)] px-3 py-1 text-xs font-medium">Làm hôm nay</span>
                      </span>
                    }
                  />
                ))}
                {plan.due.map((t) => (
                  <Row key={t.id} t={t} d={d} extra={<span className="rounded-full bg-[var(--dgs)] px-2.5 py-0.5 text-xs font-medium text-[var(--dg)]">hạn hôm nay</span>} />
                ))}
                {plan.planned.map((t) => (
                  <Row key={t.id} t={t} d={d} />
                ))}
                {d.doneToday.map((t) => (
                  <Row key={t.id} t={t} d={d} done />
                ))}
              </ul>
              <div className="mt-3 rounded-full border border-dashed border-[var(--in)] px-5 py-3 text-[15px] text-[var(--mu)]">+ Thêm việc cho hôm nay…</div>
              {d.weekGoals.length > 0 && (
                <div className="mt-4 px-3 pb-2">
                  <p className="mb-2 text-sm font-semibold text-[var(--mu)]">Mục tiêu tuần này</p>
                  <div className="flex flex-wrap gap-2">
                    {d.weekGoals.map((g) => (
                      <span key={g.id} className={`rounded-full bg-[var(--sf)] px-3 py-1.5 text-sm ${g.done ? "line-through opacity-60" : ""}`}>
                        {g.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-6">
              <section className="rounded-[28px] bg-[var(--sf)] p-5">
                <h2 className="mb-3 text-lg font-bold">Thói quen</h2>
                <div className="grid grid-cols-2 gap-2">
                  {d.habits.map((h) => (
                    <span
                      key={h.name}
                      className={`rounded-2xl px-3 py-3 text-sm font-medium ${h.today ? "bg-[var(--ac)] text-[var(--sf)]" : "bg-[var(--sf2)]"}`}
                    >
                      {h.today ? "✓ " : ""}
                      {h.name}
                      <span className="mt-1 block text-xs font-normal opacity-80">{h.week.filter((x) => x.done).length}/7 ngày</span>
                    </span>
                  ))}
                </div>
              </section>
              <section className="rounded-[28px] bg-[var(--sf)] p-5">
                <h2 className="mb-3 text-lg font-bold">Sắp đến hạn</h2>
                <ul className="flex flex-col gap-3">
                  {d.deadlines.slice(0, 6).map((t) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-bold tabular-nums ${
                          t.daysLeft < 0 ? "bg-[var(--dgs)] text-[var(--dg)]" : t.daysLeft <= 1 ? "bg-[var(--was)] text-[var(--wa)]" : "bg-[var(--sf2)]"
                        }`}
                      >
                        {t.daysLeft < 0 ? `-${-t.daysLeft}` : t.daysLeft}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.title}</span>
                        <span className="text-xs text-[var(--mu)]">
                          {d.dayLabel(t.deadline)} · {t.project ?? "Không dự án"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
