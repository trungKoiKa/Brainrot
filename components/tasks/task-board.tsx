"use client";

import { useState } from "react";
import { compareTasks } from "@/lib/today";
import type { Priority, Task } from "@/lib/notion/types";
import { ErrorNotice, TaskRow } from "./task-row";
import { useTaskCompletion } from "./use-task-completion";

// Thứ tự giống select "Dự án" trong Notion (SPEC mục 4)
const PROJECT_ORDER = ["Đồ án", "Học AI", "Sản phẩm", "Sức khỏe", "Thực tập", "Khác"];
const NO_PROJECT = "Không có dự án";
const PRIORITIES: Priority[] = ["Cao", "Vừa", "Thấp"];

const projectOf = (t: Task) => t.project ?? NO_PROJECT;
const projectRank = (p: string) => {
  const i = PROJECT_ORDER.indexOf(p);
  return i === -1 ? PROJECT_ORDER.length : i;
};

export function TaskBoard({ tasks: initial, today }: { tasks: Task[]; today: string }) {
  const { tasks, complete, error, dismissError } = useTaskCompletion(initial);
  const [project, setProject] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);

  const open = tasks.filter((t) => t.status !== "Xong");
  const done = tasks.filter((t) => t.status === "Xong");
  const projects = [...new Set(open.map(projectOf))].sort((a, b) => projectRank(a) - projectRank(b));

  const visible = open
    .filter((t) => (project ? projectOf(t) === project : true))
    .filter((t) => (priority ? t.priority === priority : true));
  const groups = projects
    .map((p) => ({ name: p, tasks: visible.filter((t) => projectOf(t) === p).sort(compareTasks) }))
    .filter((g) => g.tasks.length > 0);

  return (
    <div>
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}

      <div className="mb-6 space-y-3">
        <FilterRow label="Dự án" value={project} options={projects} onChange={setProject} />
        <FilterRow label="Ưu tiên" value={priority} options={PRIORITIES} onChange={setPriority} />
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
          {open.length === 0 ? "Không còn việc nào chưa xong." : "Không có task nào khớp bộ lọc."}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((g) => (
            <section key={g.name} className="rounded-2xl border border-line bg-surface p-5 md:p-6">
              <h2 className="mb-4 flex items-baseline justify-between font-serif text-lg font-semibold">
                {g.name}
                <span className="font-sans text-xs font-normal text-muted">{g.tasks.length} việc</span>
              </h2>
              <ul className="divide-y divide-line">
                {g.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} today={today} onComplete={complete} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <details className="mt-6 rounded-2xl border border-line bg-surface p-5 md:p-6">
          <summary className="cursor-pointer font-serif text-lg font-semibold">
            Đã xong <span className="font-sans text-sm font-normal text-muted">({done.length})</span>
          </summary>
          <ul className="mt-4 divide-y divide-line">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} today={today} showProject />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  onChange: (v: T | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-foreground"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Lọc theo ${label}`}>
      <span className="w-16 text-sm text-muted">{label}</span>
      <button type="button" aria-pressed={value === null} className={chip(value === null)} onClick={() => onChange(null)}>
        Tất cả
      </button>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} className={chip(value === o)} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
