"use client";

import { useActionState, useState } from "react";
import { createTaskAction, updateTaskAction, type TaskFormState } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";
import { EDITABLE_STATUSES, PRIORITIES } from "@/lib/task-form";
import { Status, fieldClass, primaryButtonClass } from "../form-bits";
import { DeadlineField } from "./deadline-field";

// Ô select/date hẹp hơn ô tên; giữ cùng kiểu viền với fieldClass
const compactField = fieldClass.replace("w-full", "w-auto");

function Select({
  name,
  label,
  value,
  options,
  empty,
  labels,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  empty?: string;
  /** Nhãn hiển thị khác giá trị (vd. id mục tiêu → tên) */
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <select name={name} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={compactField}>
      {empty !== undefined && <option value="">{empty}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

const EMPTY_NEW = { title: "", project: "", priority: "", deadline: "", plannedOn: "" };

/** Hàng "Thêm task" ở đầu trang Tasks (SPEC-v0.2 4.2). Controlled: lỗi thì nội dung đã gõ vẫn còn. */
export function NewTaskForm({ projects }: { projects: string[] }) {
  const [values, setValues] = useState(EMPTY_NEW);
  const [state, action, pending] = useActionState(async (prev: TaskFormState, form: FormData) => {
    const next = await createTaskAction(prev, form);
    if (next.ok) setValues(EMPTY_NEW);
    return next;
  }, {});
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  return (
    <form action={action} className="mb-6 space-y-2 rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap gap-2">
        <input
          name="title"
          aria-label="Tên task mới"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="Thêm task mới…"
          autoComplete="off"
          className={`${fieldClass} min-w-56 flex-1`}
        />
        <Select name="project" label="Dự án" value={values.project} options={projects} empty="Dự án" onChange={set("project")} />
        <Select name="priority" label="Ưu tiên" value={values.priority} options={PRIORITIES} empty="Ưu tiên" onChange={set("priority")} />
        <DeadlineField value={values.deadline} onChange={set("deadline")} triggerClass={compactField} />
        <DeadlineField name="plannedOn" label="Ngày làm" value={values.plannedOn} onChange={set("plannedOn")} triggerClass={compactField} />
        <button type="submit" disabled={pending || !values.title.trim()} className={primaryButtonClass}>
          {pending ? "Đang thêm…" : "Thêm"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

/** Mục tiêu chọn được khi sửa task (SPEC-v0.4 4.4); `open` = mục tiêu Tháng/Tuần hiện tại chưa xong. */
export type GoalOption = { id: string; label: string; open: boolean };

/** Form sửa mở tại chỗ thay cho dòng task (bấm ✎). Lưu thành công → đóng. `goals` null = chưa kết nối Goals (ẩn ô Mục tiêu). */
export function EditTaskForm({
  task,
  projects,
  goals,
  onClose,
}: {
  task: Task;
  projects: string[];
  goals: GoalOption[] | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState({
    title: task.title,
    status: task.status === "Đang làm" ? "Đang làm" : "Chưa làm",
    project: task.project ?? "",
    priority: task.priority ?? "",
    deadline: task.deadline ?? "",
    plannedOn: task.plannedOn ?? "",
    note: task.note,
    // Form chỉ gắn 1 mục tiêu; task gắn nhiều mục tiêu thì giữ cái đầu
    goal: task.goalIds[0] ?? "",
  });
  // Chỉ mục tiêu đang mở + mục tiêu task đang gắn (để mở form không làm mất liên kết cũ)
  const goalOptions = goals?.filter((g) => g.open || task.goalIds.includes(g.id)) ?? [];
  const [state, action, pending] = useActionState(async (prev: TaskFormState, form: FormData) => {
    const next = await updateTaskAction(prev, form);
    if (next.ok) onClose();
    return next;
  }, {});
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <form
        action={action}
        className="space-y-2 rounded-lg border border-primary p-3"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <input type="hidden" name="id" value={task.id} />
        <input
          name="title"
          aria-label="Tên task"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          autoFocus
          autoComplete="off"
          className={fieldClass}
        />
        <div className="flex flex-wrap gap-2">
          <Select name="status" label="Trạng thái" value={values.status} options={EDITABLE_STATUSES} onChange={set("status")} />
          <Select name="project" label="Dự án" value={values.project} options={projects} empty="Không có dự án" onChange={set("project")} />
          <Select name="priority" label="Ưu tiên" value={values.priority} options={PRIORITIES} empty="Không ưu tiên" onChange={set("priority")} />
          <DeadlineField value={values.deadline} onChange={set("deadline")} triggerClass={compactField} />
          <DeadlineField name="plannedOn" label="Ngày làm" value={values.plannedOn} onChange={set("plannedOn")} triggerClass={compactField} />
          {goals && (
            <Select
              name="goal"
              label="Goal"
              value={values.goal}
              options={goalOptions.map((g) => g.id)}
              labels={Object.fromEntries(goalOptions.map((g) => [g.id, g.label]))}
              empty="Không gắn mục tiêu"
              onChange={set("goal")}
            />
          )}
        </div>
        <textarea
          name="note"
          aria-label="Ghi chú"
          rows={2}
          value={values.note}
          onChange={(e) => set("note")(e.target.value)}
          placeholder="Ghi chú"
          className={fieldClass}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Status state={state} />
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Hủy
          </button>
          <button type="submit" disabled={pending || !values.title.trim()} className={primaryButtonClass}>
            {pending ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>
    </li>
  );
}
