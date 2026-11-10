// Phương án C — "Kỹ thuật": như một bảng thông số/nhật ký đo, lưới mảnh, góc vuông, số liệu chữ mono, màu tín hiệu cam.
import type { Task } from "@/lib/types";
import type { TodayData } from "./data";

const css = `
.vc{--bg:#f1f2ee;--grid:rgba(20,30,20,.05);--sf:#ffffff;--sf2:#f6f7f3;--ln:#cfd3ca;--in:#7d8378;--fg:#121412;--mu:#50564d;--ac:#c2410c;--acs:#fdebe1;--wa:#8a5a00;--was:#fbf0d6;--ok:#2b6f3a;--dg:#b42318;
--p1:#2459b8;--p2:#a8326a;--p3:#2b6f3a;--p4:#8a5a00;--p0:#6b7166}
[data-theme=dark] .vc{--bg:#0c0e0d;--grid:rgba(220,235,220,.04);--sf:#141716;--sf2:#191c1a;--ln:#2d322e;--in:#69705f;--fg:#e4e8e2;--mu:#9ea69a;--ac:#ff8a3d;--acs:#3a2112;--wa:#f2b84b;--was:#33280f;--ok:#79c98a;--dg:#ff8b80;
--p1:#7aa7ff;--p2:#f08bbd;--p3:#79c98a;--p4:#f2b84b;--p0:#9ea69a}
.vc .mono{font-family:var(--font-plex-mono);font-feature-settings:"tnum"}`;

function Cell({ label, value, note, accent = false }: { label: string; value: React.ReactNode; note?: string; accent?: boolean }) {
  return (
    <div className="border-r border-b border-[var(--ln)] px-4 py-3">
      <p className="mono text-xs text-[var(--mu)]">{label}</p>
      <p className={`mono mt-1 text-2xl ${accent ? "text-[var(--ac)]" : ""}`}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-[var(--mu)]">{note}</p>}
    </div>
  );
}

function Row({ t, d, n, state }: { t: Task; d: TodayData; n: number; state: "late" | "due" | "plan" | "done" }) {
  const slot = d.projectSlot(t.project);
  const late = state === "late" ? (t as Task & { lateDays: number }).lateDays : 0;
  return (
    <tr className={`border-b border-[var(--ln)] align-top ${state === "done" ? "text-[var(--mu)]" : ""} ${state === "late" ? "bg-[var(--was)]" : ""}`}>
      <td className="mono w-10 py-2.5 pl-4 text-xs text-[var(--mu)]">{String(n).padStart(2, "0")}</td>
      <td className="w-8 py-2.5">
        <span aria-hidden className={`mt-0.5 block size-4 border ${state === "done" ? "border-[var(--ok)] bg-[var(--ok)]" : "border-[var(--in)] bg-[var(--sf)]"}`} />
      </td>
      <td className={`py-2.5 pr-3 text-sm ${state === "done" ? "line-through" : ""}`}>{t.title}</td>
      <td className="hidden py-2.5 pr-3 text-xs sm:table-cell">
        {t.project && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-3 w-1" style={{ background: `var(--p${slot})` }} />
            {t.project}
          </span>
        )}
      </td>
      <td className="mono py-2.5 pr-4 text-right text-xs whitespace-nowrap">
        {state === "late" && <span className="font-medium text-[var(--wa)]">TRỄ +{late}N</span>}
        {state === "due" && <span className="font-medium text-[var(--dg)]">HẠN 00N</span>}
        {state === "plan" && (t.deadline ? <span className="text-[var(--mu)]">hạn {d.fmt(t.deadline)}</span> : <span className="text-[var(--mu)]">—</span>)}
        {state === "done" && <span className="text-[var(--ok)]">XONG</span>}
      </td>
    </tr>
  );
}

export function VariantC({ d }: { d: TodayData }) {
  const { plan } = d;
  const rows: { t: Task; s: "late" | "due" | "plan" | "done" }[] = [
    ...plan.late.map((t) => ({ t, s: "late" as const })),
    ...plan.due.map((t) => ({ t, s: "due" as const })),
    ...plan.planned.map((t) => ({ t, s: "plan" as const })),
    ...d.doneToday.map((t) => ({ t, s: "done" as const })),
  ];
  const habitsDone = d.habits.filter((h) => h.today).length;
  return (
    <div
      className="vc min-h-screen bg-[var(--bg)] text-[var(--fg)]"
      style={{
        fontFamily: "var(--font-plex-sans)",
        backgroundImage: "linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <style>{css}</style>
      <div className="flex">
        <nav className="hidden w-48 shrink-0 flex-col border-r border-[var(--ln)] bg-[var(--sf)] lg:flex" aria-label="Điều hướng">
          <p className="mono border-b border-[var(--ln)] px-4 py-4 text-sm font-semibold">BRAINROT/v1</p>
          {["Hôm nay", "Việc", "Mục tiêu", "Tổng quan", "Cài đặt"].map((n, i) => (
            <span key={n} className={`flex items-center gap-2 border-b border-[var(--ln)] px-4 py-2.5 text-sm ${i === 0 ? "font-semibold" : "text-[var(--mu)]"}`}>
              <span className="mono w-5 text-xs text-[var(--mu)]">0{i + 1}</span>
              {n}
              {i === 0 && <span className="ml-auto size-1.5 bg-[var(--ac)]" />}
            </span>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mono text-xs text-[var(--mu)]">NHẬT KÝ · {d.today}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{d.greeting}</h1>
            </div>
            <p className="text-sm text-[var(--mu)]">{d.dateLong}</p>
          </header>

          <div className="mb-6 grid grid-cols-2 border-t border-l border-[var(--ln)] bg-[var(--sf)] md:grid-cols-4">
            <Cell label="VIỆC HÔM NAY" value={d.progress ? `${d.progress.done}/${d.progress.total}` : "0/0"} note="đã xong / tổng" />
            <Cell label="TRỄ LỊCH" value={String(plan.late.length).padStart(2, "0")} note="việc có Ngày làm đã qua" />
            <Cell label="THÓI QUEN" value={`${habitsDone}/${d.habits.length}`} note="tích hôm nay" />
            {d.target ? <Cell label="ĐẾM NGƯỢC" value={`D-${d.target.days}`} note={`${d.target.label} · ${d.target.date}`} accent /> : <Cell label="ĐẾM NGƯỢC" value="—" />}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border border-[var(--ln)] bg-[var(--sf)]">
              <h2 className="flex items-center justify-between border-b border-[var(--ln)] px-4 py-2.5 text-sm font-semibold">
                Hôm nay làm <span className="mono text-xs font-normal text-[var(--mu)]">{rows.length} dòng</span>
              </h2>
              <table className="w-full border-collapse">
                <tbody>
                  {rows.map((r, i) => (
                    <Row key={r.t.id} t={r.t} d={d} n={i + 1} state={r.s} />
                  ))}
                </tbody>
              </table>
              <p className="mono px-4 py-3 text-xs text-[var(--mu)]">+ thêm việc ▸</p>
            </section>

            <aside className="flex flex-col gap-6">
              <section className="border border-[var(--ln)] bg-[var(--sf)]">
                <h2 className="border-b border-[var(--ln)] px-4 py-2.5 text-sm font-semibold">Thói quen · 7 ngày</h2>
                <div className="px-4 py-3">
                  <div className="mono mb-1 grid grid-cols-[1fr_repeat(7,20px)] gap-1 text-xs text-[var(--mu)]">
                    <span />
                    {d.habits[0]?.week.map((x) => (
                      <span key={x.day} className="text-center">
                        {x.label.slice(0, 2)}
                      </span>
                    ))}
                  </div>
                  {d.habits.map((h) => (
                    <div key={h.name} className="grid grid-cols-[1fr_repeat(7,20px)] items-center gap-1 py-1">
                      <span className="truncate text-sm">{h.name}</span>
                      {h.week.map((x) => (
                        <span key={x.day} className={`mx-auto size-3.5 border ${x.done ? "border-[var(--ac)] bg-[var(--ac)]" : "border-[var(--ln)]"}`} />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
              <section className="border border-[var(--ln)] bg-[var(--sf)]">
                <h2 className="border-b border-[var(--ln)] px-4 py-2.5 text-sm font-semibold">Hạn · 14 ngày</h2>
                <ul>
                  {d.deadlines.map((t) => (
                    <li key={t.id} className="flex items-baseline gap-3 border-b border-[var(--ln)] px-4 py-2 text-sm last:border-b-0">
                      <span className={`mono w-14 shrink-0 text-xs ${t.daysLeft < 0 ? "text-[var(--dg)]" : t.daysLeft <= 1 ? "text-[var(--wa)]" : "text-[var(--mu)]"}`}>
                        {t.daysLeft < 0 ? `T+${-t.daysLeft}` : `T-${String(t.daysLeft).padStart(2, "0")}`}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="mono text-xs text-[var(--mu)]">{d.fmt(t.deadline)}</span>
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
