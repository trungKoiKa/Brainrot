// Kiểm tra dữ liệu form thêm/sửa task (SPEC.md mục 5.2). Hàm thuần, không gọi Notion → test được.
import { MAX_TEXT, type Parsed } from "./quick-capture";
import type { Priority, TaskStatus } from "./types";

export const PRIORITIES: Priority[] = ["Cao", "Vừa", "Thấp"];
/** Trên web chỉ chuyển giữa hai trạng thái này; "Xong" dùng ô tích. */
export const EDITABLE_STATUSES: TaskStatus[] = ["Chưa làm", "Đang làm"];

/** null = để trống ô đó trên Notion. */
export type TaskInput = {
  title: string;
  project: string | null;
  priority: Priority | null;
  deadline: string | null;
  /** Ngày làm (SPEC.md mục 5.2) */
  plannedOn: string | null;
};

/** goalId: id mục tiêu gắn (null = bỏ gắn); undefined = form không có ô này. */
export type TaskUpdate = TaskInput & { status: TaskStatus; note: string; goalId?: string | null };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

const isDay = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/** `projects`: các lựa chọn hiện có của select "Dự án" — không cho tạo dự án mới từ web. */
export function parseTaskInput(form: FormData, projects: readonly string[]): Parsed<TaskInput> {
  const title = str(form.get("title")).replace(/\s*\n\s*/g, " ");
  if (!title) return { ok: false, error: "Tên việc đang trống." };
  if (title.length > MAX_TEXT) return { ok: false, error: `Tên việc dài quá ${MAX_TEXT} ký tự.` };

  const project = str(form.get("project")) || null;
  if (project && !projects.includes(project)) return { ok: false, error: `Dự án "${project}" không có trong danh sách dự án.` };

  const priority = str(form.get("priority")) || null;
  if (priority && !PRIORITIES.includes(priority as Priority)) return { ok: false, error: "Ưu tiên không hợp lệ." };

  const deadline = str(form.get("deadline")) || null;
  if (deadline && !isDay(deadline)) return { ok: false, error: "Deadline không hợp lệ." };

  const plannedOn = str(form.get("plannedOn")) || null;
  if (plannedOn && !isDay(plannedOn)) return { ok: false, error: "Ngày làm không hợp lệ." };

  return { ok: true, data: { title, project, priority: priority as Priority | null, deadline, plannedOn } };
}

/** `goalIds`: id các mục tiêu có thật — chỉ cho gắn task vào mục tiêu trong danh sách này. */
export function parseTaskUpdate(form: FormData, projects: readonly string[], goalIds: readonly string[] = []): Parsed<TaskUpdate> {
  const base = parseTaskInput(form, projects);
  if (!base.ok) return base;

  const status = str(form.get("status"));
  if (!EDITABLE_STATUSES.includes(status as TaskStatus)) return { ok: false, error: "Trạng thái không hợp lệ." };

  const note = str(form.get("note"));
  if (note.length > MAX_TEXT) return { ok: false, error: `Ghi chú dài quá ${MAX_TEXT} ký tự.` };

  let goalId: string | null | undefined;
  if (form.has("goal")) {
    goalId = str(form.get("goal")) || null;
    if (goalId && !goalIds.includes(goalId)) return { ok: false, error: "Mục tiêu không hợp lệ." };
  }

  return { ok: true, data: { ...base.data, status: status as TaskStatus, note, ...(goalId !== undefined && { goalId }) } };
}
