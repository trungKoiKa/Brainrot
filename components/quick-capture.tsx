"use client";

import { useActionState, useState } from "react";
import { addIdeaAction, saveDailyLogAction, type CaptureState } from "@/app/actions/capture";
import type { DailyLog } from "@/lib/notion/types";
import { Status, fieldClass, primaryButtonClass } from "./form-bits";

/** Khối "Ghi nhanh" trên Today (SPEC-v0.2 4.1): ý tưởng → Ideas, Daily Log hôm nay → Daily Log. */
export function QuickCapture({ todayLog }: { todayLog: DailyLog | null }) {
  return (
    <div className="space-y-6">
      <IdeaForm />
      <DailyLogForm key={todayLog?.id ?? "new"} todayLog={todayLog} />
    </div>
  );
}

function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [state, action, pending] = useActionState(async (prev: CaptureState, form: FormData) => {
    const next = await addIdeaAction(prev, form);
    if (next.ok) setIdea("");
    return next;
  }, {});

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="idea" className="text-sm font-medium">
        Ý tưởng
      </label>
      <div className="flex gap-2">
        <input
          id="idea"
          name="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Vd: thử YOLOv8 cho đồ án…"
          className={fieldClass}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !idea.trim()}
          className={primaryButtonClass}
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

function DailyLogForm({ todayLog }: { todayLog: DailyLog | null }) {
  // Controlled: lỗi khi lưu thì nội dung đã gõ vẫn còn
  const [values, setValues] = useState({
    done: todayLog?.done ?? "",
    dropped: todayLog?.dropped ?? "",
    learned: todayLog?.learned ?? "",
    tomorrowTop3: todayLog?.tomorrowTop3 ?? "",
    exercised: todayLog?.exercised ?? false,
  });
  const [state, action, pending] = useActionState(saveDailyLogAction, {});
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const fields: { key: "done" | "dropped" | "learned" | "tomorrowTop3"; label: string; hint?: string }[] = [
    { key: "done", label: "Xong" },
    { key: "dropped", label: "Rơi / chưa xong" },
    { key: "learned", label: "Học được" },
    { key: "tomorrowTop3", label: "Ngày mai 3 việc", hint: "Mỗi việc một dòng — sáng mai thành khối 3 việc hôm nay" },
  ];

  return (
    <details className="group" open={!todayLog}>
      <summary className="cursor-pointer text-sm font-medium">
        Daily Log hôm nay{" "}
        <span className="font-normal text-muted">{todayLog ? "· đã ghi, bấm để sửa" : "· chưa ghi"}</span>
      </summary>
      <form action={action} className="mt-3 grid gap-3 md:grid-cols-2">
        {fields.map(({ key, label, hint }) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-muted">{label}</span>
            <textarea name={key} rows={3} value={values[key]} onChange={set(key)} className={fieldClass} />
            {hint && <span className="text-xs text-muted">{hint}</span>}
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="exercised"
              checked={values.exercised}
              onChange={(e) => setValues((v) => ({ ...v, exercised: e.target.checked }))}
              className="size-4 accent-[var(--accent)]"
            />
            Tập thể dục
          </label>
          <button
            type="submit"
            disabled={pending}
            className={`ml-auto ${primaryButtonClass}`}
          >
            {pending ? "Đang lưu…" : todayLog ? "Cập nhật" : "Lưu Daily Log"}
          </button>
        </div>
        <div className="md:col-span-2">
          <Status state={state} />
        </div>
      </form>
    </details>
  );
}
