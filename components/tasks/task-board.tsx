"use client";

import { useRef, useState } from "react";
import { useAutoDismiss } from "@/components/use-auto-dismiss";
import { ChevronRightIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { compareTasks } from "@/lib/today";
import type { Priority, Task } from "@/lib/types";
import { PRIORITIES } from "@/lib/task-form";
import { EditTaskForm, NewTaskForm, type GoalOption } from "./task-forms";
import { ErrorNotice, TaskRow } from "./task-row";
import { useTaskCompletion } from "./use-task-completion";

const NO_PROJECT = "Không có dự án";
/** Thời gian hiện nút "Hoàn tác" sau khi tích xong (SPEC-v1.0, 07/11/2026) */
const UNDO_MS = 8000;

const projectOf = (t: Task) => t.project ?? NO_PROJECT;
const chipClass = (active: boolean) =>
  `min-h-10 rounded-full border px-3 py-1 text-sm transition-colors md:min-h-0 outline-none focus-visible:ring-3 focus-visible:ring-ring ${
    active ? "border-primary bg-accent-soft text-primary" : "border-line text-muted-foreground hover:text-foreground"
  }`;

/** Đưa con trỏ bàn phím tới phần tử đầu tiên khớp `selector` sau khi React vẽ lại (không để rơi về đầu trang). */
const focusSoon = (selector: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus());

export function TaskBoard({
  tasks: initial,
  projects: allProjects,
  today,
  initialProject = null,
  goals = null,
}: {
  tasks: Task[];
  projects: string[];
  today: string;
  initialProject?: string | null;
  goals?: GoalOption[] | null;
}) {
  const { tasks, complete, reopen, remove, restore, error, dismissError } = useTaskCompletion(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [project, setProject] = useState<string | null>(initialProject);
  const [priority, setPriority] = useState<Priority | null>(null);
  // Việc vừa tích xong → dải "Hoàn tác" ~8 giây (tạm dừng khi rê chuột / có focus) (cũng là thông báo cho trình đọc màn hình)
  const [undo, setUndo] = useState<{ kind: "done" | "deleted"; task: Task } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  // Rê chuột / giữ focus bàn phím trên dải Hoàn tác thì tạm dừng đếm (SPEC-v1.0, Tasks đợt 2; hook dùng chung với Goal)
  const undoHold = useAutoDismiss(undo, () => setUndo(null), UNDO_MS);

  // Thứ tự nhóm theo danh sách dự án của người dùng (không cứng theo dự án của một người)
  const projectRank = (p: string) => {
    const i = allProjects.indexOf(p);
    return i === -1 ? allProjects.length : i;
  };
  const open = tasks.filter((t) => t.status !== "Xong");
  const done = tasks.filter((t) => t.status === "Xong");
  // Dự án đang lọc (vd. mở từ Dashboard) luôn có chip, kể cả khi không còn task mở → thấy được bộ lọc đang bật
  const projects = [...new Set([...open.map(projectOf), ...(project ? [project] : [])])].sort(
    (a, b) => projectRank(a) - projectRank(b),
  );

  const visible = open
    .filter((t) => (project ? projectOf(t) === project : true))
    .filter((t) => (priority ? t.priority === priority : true));
  const groups = projects
    .map((p) => ({ name: p, tasks: visible.filter((t) => projectOf(t) === p).sort(compareTasks) }))
    .filter((g) => g.tasks.length > 0);
  const filtering = project !== null || priority !== null;

  function onComplete(t: Task) {
    complete(t);
    setUndo({ kind: "done", task: t });
    // Dòng vừa tích biến mất → con trỏ sang nút Hoàn tác thay vì rơi về đầu trang
    requestAnimationFrame(() => undoRef.current?.focus());
  }

  function onUndo() {
    if (!undo) return;
    if (undo.kind === "done") {
      reopen(undo.task);
      focusSoon(`[data-task-id="${undo.task.id}"] input[type=checkbox]`);
    } else {
      restore(undo.task);
      focusSoon(`[data-task-id="${undo.task.id}"] button[aria-label^="Sửa"], [data-task-id="${undo.task.id}"] input`);
    }
    setUndo(null);
  }

  function onDelete(t: Task) {
    remove(t);
    setUndo({ kind: "deleted", task: t });
    // Dòng vừa xoá biến mất → con trỏ sang nút Hoàn tác (người dùng bàn phím không rơi về đầu trang)
    requestAnimationFrame(() => undoRef.current?.focus());
  }

  function closeEdit(id: string) {
    setEditing(null);
    focusSoon(`[data-task-id="${id}"] button[aria-label^="Sửa"]`);
  }

  return (
    <div className="space-y-5">
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}

      <Card>
        <NewTaskForm projects={allProjects} defaultProject={project && project !== NO_PROJECT ? project : ""} />
      </Card>

      {open.length > 0 && (
        <div className="space-y-3">
          {/* Chỉ một lựa chọn thì bộ lọc dự án không giúp gì → ẩn (trừ khi đang lọc) */}
          {(projects.length > 1 || project) && <FilterRow label="Dự án" value={project} options={projects} onChange={setProject} />}
          <FilterRow label="Ưu tiên" value={priority} options={PRIORITIES} onChange={setPriority} />
        </div>
      )}

      {groups.length === 0 ? (
        <Card>
          <Empty>
            {open.length === 0 ? "Không còn việc nào chưa xong. Thêm việc mới ở ô phía trên." : "Không có việc nào khớp bộ lọc."}{" "}
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setProject(null);
                  setPriority(null);
                }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Bỏ lọc
              </button>
            )}
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          {groups.map((g) => (
            <Card key={g.name} title={g.name} action={<span className="text-xs text-muted-foreground">{g.tasks.length} việc</span>}>
              <ul className="divide-y divide-line">
                {g.tasks.map((t) =>
                  editing === t.id ? (
                    <EditTaskForm key={t.id} task={t} projects={allProjects} goals={goals} onClose={() => closeEdit(t.id)} />
                  ) : (
                    <TaskRow
                      key={t.id}
                      task={t}
                      today={today}
                      onComplete={onComplete}
                      onEdit={() => setEditing(t.id)}
                      onDelete={onDelete}
                    />
                  ),
                )}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <Card>
          <details className="group/done">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open/done:rotate-90" />
              <h2 className="font-serif text-lg font-semibold">
                Đã xong <span className="font-sans text-sm font-normal text-muted-foreground">({done.length})</span>
              </h2>
            </summary>
            <ul className="mt-4 divide-y divide-line">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} today={today} showProject onReopen={reopen} onDelete={onDelete} />
              ))}
            </ul>
          </details>
        </Card>
      )}

      {/* Dải Hoàn tác: cố định cuối màn hình, aria-live để trình đọc màn hình báo "đã xong" */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
        {undo && (
          <div
            role="status"
            {...undoHold}
            className="pointer-events-auto flex max-w-md items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg"
          >
            <span className="min-w-0 truncate">
              {undo.kind === "done" ? "Đã xong" : "Đã xóa"} “{undo.task.title || "(Chưa đặt tên)"}”
            </span>
            <button
              ref={undoRef}
              type="button"
              onClick={onUndo}
              className="shrink-0 rounded-md font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
            >
              Hoàn tác
            </button>
          </div>
        )}
      </div>
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
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Lọc theo ${label}`}>
      <span className="text-sm text-muted-foreground sm:w-16">{label}</span>
      <button type="button" aria-pressed={value === null} className={chipClass(value === null)} onClick={() => onChange(null)}>
        Tất cả
      </button>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} className={chipClass(value === o)} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
