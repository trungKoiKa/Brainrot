"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FilterRow } from "@/components/filter-row";
import { colorVarByOrder } from "@/lib/topic-colors";
import { compareTasks } from "@/lib/today";
import type { Priority, Task } from "@/lib/types";
import { PRIORITIES } from "@/lib/task-form";
import { EditTaskForm, NewTaskForm, type GoalOption } from "./task-forms";
import { ErrorNotice, TaskRow } from "./task-row";
import { useTaskCompletion } from "./use-task-completion";

const NO_PROJECT = "Không có dự án";
/** Toast "Hoàn tác" hiện 8 giây (SPEC.md mục 5.2, 07/11/2026); sonner tạm dừng khi rê chuột/focus và xếp chồng nhiều toast. */
const UNDO_MS = 8000;

const projectOf = (t: Task) => t.project ?? NO_PROJECT;
/** Sau khi dòng biến mất: focus sang nút "Hoàn tác" của toast mới nhất (rà soát cuối A3, WCAG 2.4.3). */
const focusUndo = () =>
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-sonner-toast] [data-button]")?.focus()));

/** Đưa con trỏ bàn phím tới phần tử đầu tiên khớp `selector` sau khi React vẽ lại (không để rơi về đầu trang). */
const focusSoon = (selector: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus());

export function TaskBoard({
  tasks: initial,
  projects: allProjects,
  today,
  initialProject = null,
  initialPriority = null,
  goals = null,
}: {
  tasks: Task[];
  projects: string[];
  today: string;
  initialProject?: string | null;
  initialPriority?: Priority | null;
  goals?: GoalOption[] | null;
}) {
  const { tasks, complete, reopen, remove, restore, error, dismissError } = useTaskCompletion(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [project, setProjectState] = useState<string | null>(initialProject);
  const [priority, setPriorityState] = useState<Priority | null>(initialPriority);
  // Bộ lọc nằm trong URL (?project=&priority=) → tải lại / gửi link vẫn giữ; "Tất cả" thì gỡ tham số (rà soát 11/2026 P2).
  // replaceState: Next đồng bộ với router, không thêm mục vào lịch sử trình duyệt.
  const syncUrl = (next: { project: string | null; priority: Priority | null }) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };
  const setProject = (v: string | null) => {
    setProjectState(v);
    syncUrl({ project: v, priority });
  };
  const setPriority = (v: Priority | null) => {
    setPriorityState(v);
    syncUrl({ project, priority: v });
  };
  const clearFilters = () => {
    setProjectState(null);
    setPriorityState(null);
    syncUrl({ project: null, priority: null });
  };

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

  // Mỗi thao tác một toast riêng có nút Hoàn tác → xoá nhanh 2 việc vẫn hoàn tác được cả 2 (rà soát A2)
  function onComplete(t: Task) {
    complete(t);
    toast(`Đã xong “${t.title || "(Chưa đặt tên)"}”`, {
      duration: UNDO_MS,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          reopen(t);
          focusSoon(`[data-task-id="${t.id}"] [role=checkbox]`);
        },
      },
    });
    focusUndo();
  }

  function onDelete(t: Task) {
    remove(t);
    toast(`Đã xóa “${t.title || "(Chưa đặt tên)"}”`, {
      duration: UNDO_MS,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          restore(t);
          focusSoon(`[data-task-id="${t.id}"] button[aria-label^="Sửa"], [data-task-id="${t.id}"] [role=checkbox]`);
        },
      },
    });
    focusUndo();
  }

  function closeEdit(id: string) {
    setEditing(null);
    focusSoon(`[data-task-id="${id}"] button[aria-label^="Sửa"]`);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorNotice message={error} onDismiss={dismissError} />}

      <Card title="Thêm việc">
        <NewTaskForm projects={allProjects} defaultProject={project && project !== NO_PROJECT ? project : ""} />
      </Card>

      {open.length > 0 && (
        <div className="flex flex-col gap-3">
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
                onClick={clearFilters}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Bỏ lọc
              </button>
            )}
          </Empty>
        </Card>
      ) : (
        // Một cột: bỏ lưới 2 cột so le để hết khoảng trống (rà soát A1 Tasks)
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <Card
              key={g.name}
              flush
              title={
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2.5 shrink-0" style={{ background: `var(${colorVarByOrder(g.name, allProjects)})` }} />
                  {g.name}
                </span>
              }
              action={<span className="text-xs text-muted-foreground tabular-nums">{g.tasks.length} việc</span>}
            >
              <ul>
                {g.tasks.map((t) =>
                  editing === t.id ? (
                    <li key={t.id} className="row-sep bg-surface-muted p-4">
                      <EditTaskForm task={t} projects={allProjects} goals={goals} onClose={() => closeEdit(t.id)} />
                    </li>
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
        <Collapsible className="overflow-clip rounded-xl border border-line bg-surface">
          <CollapsibleTrigger className="group/done flex min-h-11 w-full items-center gap-2 px-4 py-2.5 text-left">
            <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/done:rotate-90" />
            <h2 className="text-sm font-semibold">
              Đã xong <span className="font-mono text-xs font-normal text-muted-foreground">({done.length})</span>
            </h2>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="border-t border-line-soft">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} today={today} projects={allProjects} onReopen={reopen} onDelete={onDelete} />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
