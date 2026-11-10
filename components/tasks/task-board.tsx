"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";
import { Card, Empty } from "@/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { projectColorByOrder } from "@/lib/fields";
import { compareTasks } from "@/lib/today";
import type { Priority, Task } from "@/lib/types";
import { PRIORITIES } from "@/lib/task-form";
import { EditTaskForm, NewTaskForm, type GoalOption } from "./task-forms";
import { ErrorNotice, TaskRow } from "./task-row";
import { useTaskCompletion } from "./use-task-completion";

const NO_PROJECT = "Không có dự án";
/** Toast "Hoàn tác" hiện 8 giây (SPEC-v1.0, 07/11/2026); sonner tạm dừng khi rê chuột/focus và xếp chồng nhiều toast. */
const UNDO_MS = 8000;

const projectOf = (t: Task) => t.project ?? NO_PROJECT;

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
        // Một cột: bỏ lưới 2 cột so le để hết khoảng trống (rà soát A1 Tasks)
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <Card
              key={g.name}
              flush
              title={
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2.5 shrink-0" style={{ background: `var(${projectColorByOrder(g.name, allProjects)})` }} />
                  {g.name}
                </span>
              }
              action={<span className="font-mono text-xs text-muted-foreground">{g.tasks.length} việc</span>}
            >
              <ul>
                {g.tasks.map((t) =>
                  editing === t.id ? (
                    <li key={t.id} className="border-b border-line p-4 last:border-b-0">
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
        <Collapsible className="border border-line bg-surface">
          <CollapsibleTrigger className="group/done flex min-h-11 w-full items-center gap-2 px-4 py-2.5 text-left">
            <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/done:rotate-90" />
            <h2 className="text-sm font-semibold">
              Đã xong <span className="font-mono text-xs font-normal text-muted-foreground">({done.length})</span>
            </h2>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="border-t border-line">
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
  const ALL = "__all";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 font-mono text-xs text-muted-foreground uppercase">{label}</span>
      <ToggleGroup
        aria-label={`Lọc theo ${label}`}
        variant="outline"
        size="sm"
        className="flex-wrap"
        value={[value ?? ALL]}
        onValueChange={(v: unknown[]) => {
          const next = v[0] as string | undefined;
          if (next === undefined) return; // bấm lại mục đang chọn: giữ nguyên
          onChange(next === ALL ? null : (next as T));
        }}
      >
        <ToggleGroupItem value={ALL} className="max-md:h-10 data-pressed:border-primary data-pressed:bg-accent-soft data-pressed:text-primary">
          Tất cả
        </ToggleGroupItem>
        {options.map((o) => (
          <ToggleGroupItem key={o} value={o} className="max-md:h-10 data-pressed:border-primary data-pressed:bg-accent-soft data-pressed:text-primary">
            {o}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
