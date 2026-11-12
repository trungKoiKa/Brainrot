"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTaskAction, updateTaskAction, type TaskFormState } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";
import { EDITABLE_STATUSES, PRIORITIES } from "@/lib/task-form";
import { Status, fieldClass } from "../form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeadlineField } from "@/components/deadline-field";

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
    <select
      name={name}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // Chưa chọn → chữ mờ như ô ngày trống, để không trông như đã chọn
      className={`${compactField} select-chevron pr-8 ${value ? "" : "text-muted-foreground"}`}
    >
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

/**
 * Hàng "Thêm việc" ở đầu trang Tasks (SPEC-v0.2 4.2). Controlled: lỗi thì nội dung đã gõ vẫn còn.
 * Thêm xong (SPEC-v1.0, 07/11/2026): giữ dự án/ưu tiên vừa chọn, con trỏ về ô tên, dòng "Đã thêm" tự mất sau 3 giây.
 */
export function NewTaskForm({ projects, defaultProject = "" }: { projects: string[]; defaultProject?: string }) {
  const [values, setValues] = useState({ ...EMPTY_NEW, project: defaultProject });
  const titleRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (prev: TaskFormState, form: FormData) => {
    const next = await createTaskAction(prev, form);
    if (next.ok) {
      setValues((s) => ({ ...EMPTY_NEW, project: s.project, priority: s.priority }));
      requestAnimationFrame(() => titleRef.current?.focus());
    }
    return next;
  }, {});
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));
  // Thông báo thành công tự ẩn; lỗi thì giữ tới lần gửi sau
  const [hiddenAt, setHiddenAt] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!state.ok || !state.at) return;
    const at = state.at;
    const timer = setTimeout(() => setHiddenAt(at), 3000);
    return () => clearTimeout(timer);
  }, [state]);
  const shown = state.ok && state.at === hiddenAt ? {} : state;

  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          ref={titleRef}
          name="title"
          aria-label="Tên việc mới"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="Thêm việc mới…"
          autoComplete="off"
          className="min-w-56 flex-1"
        />
        <Select name="project" label="Dự án" value={values.project} options={projects} empty="Dự án" onChange={set("project")} />
        <Select name="priority" label="Ưu tiên" value={values.priority} options={PRIORITIES} empty="Ưu tiên" onChange={set("priority")} />
        <DeadlineField value={values.deadline} onChange={set("deadline")} triggerClass={compactField} />
        <DeadlineField name="plannedOn" label="Ngày làm" value={values.plannedOn} onChange={set("plannedOn")} triggerClass={compactField} />
        <Button type="submit" disabled={pending || !values.title.trim()}>
          {pending ? "Đang thêm…" : "Thêm"}
        </Button>
      </div>
      <Status state={shown} />
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
  const [initialValues] = useState(() => JSON.stringify(values));
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  return (
    <div>
      <form
        action={action}
        className="flex flex-col gap-2 border-l-2 border-primary pl-3"
        onKeyDown={(e) => {
          // Esc đóng lịch / popover bên trong thì không đóng cả form (sự kiện bàn phím nổi lên qua portal)
          if (e.key !== "Escape" || e.defaultPrevented || (e.target as HTMLElement).closest("[data-slot=popover-content]")) return;
          if (JSON.stringify(values) !== initialValues) return; // đã sửa dở thì Esc không bỏ: dùng nút Hủy
          onClose();
        }}
      >
        <input type="hidden" name="id" value={task.id} />
        <Input
          name="title"
          aria-label="Tên việc"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          autoFocus
          autoComplete="off"
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
              label="Mục tiêu"
              value={values.goal}
              options={goalOptions.map((g) => g.id)}
              labels={Object.fromEntries(goalOptions.map((g) => [g.id, g.label]))}
              empty="Không gắn mục tiêu"
              onChange={set("goal")}
            />
          )}
        </div>
        <Textarea
          name="note"
          aria-label="Ghi chú"
          rows={2}
          value={values.note}
          onChange={(e) => set("note")(e.target.value)}
          placeholder="Ghi chú"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Status state={state} />
          <Button type="button" variant="ghost" onClick={onClose} className="ml-auto">
            Hủy
          </Button>
          <Button type="submit" disabled={pending || !values.title.trim()}>
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
