"use client";

import { useActionState, useState } from "react";
import { addIdeaAction, saveDailyLogAction, type CaptureState } from "@/app/actions/capture";
import type { DailyLog } from "@/lib/types";
import { Status, fieldClass, primaryButtonClass } from "./form-bits";

/**
 * Ghi nhanh trên Today (SPEC-v0.2 4.1): ý tưởng → Ideas, Daily Log hôm nay → Daily Log.
 * Hai form tách ra để Today đặt ý tưởng riêng, Daily Log vào cụm "Cuối ngày" (SPEC-v1.0, Trung chốt 06/11/2026).
 */
export function DailyLogCapture({
  todayLog,
  open,
  showExercise = true,
}: {
  todayLog: DailyLog | null;
  /** Mở sẵn hay không; Today chỉ mở sau 18:00 khi chưa ghi. */
  open: boolean;
  /** false khi đã có thẻ Thói quen (SPEC-v0.4): bỏ ô "Tập thể dục" để hai nơi không ghi đè nhau. */
  showExercise?: boolean;
}) {
  return <DailyLogForm key={todayLog?.id ?? "new"} todayLog={todayLog} open={open} showExercise={showExercise} />;
}

export function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [state, action, pending] = useActionState(async (prev: CaptureState, form: FormData) => {
    const next = await addIdeaAction(prev, form);
    if (next.ok) setIdea("");
    return next;
  }, {});

  return (
    <form action={action} className="space-y-2">
      {/* Thẻ đã có tiêu đề "Ghi nhanh ý tưởng" → nhãn chỉ cho trình đọc màn hình */}
      <label htmlFor="idea" className="sr-only">
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

function DailyLogForm({ todayLog, open, showExercise }: { todayLog: DailyLog | null; open: boolean; showExercise: boolean }) {
  // Controlled: lỗi khi lưu thì nội dung đã gõ vẫn còn
  const [values, setValues] = useState({
    done: todayLog?.done ?? "",
    dropped: todayLog?.dropped ?? "",
    learned: todayLog?.learned ?? "",
    exercised: todayLog?.exercised ?? false,
  });
  const [state, action, pending] = useActionState(saveDailyLogAction, {});
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const fields: { key: "done" | "dropped" | "learned"; label: string; hint?: string }[] = [
    { key: "done", label: "Xong" },
    { key: "dropped", label: "Rơi / chưa xong" },
    { key: "learned", label: "Học được" },
  ];

  return (
    <details className="group" open={open}>
      <summary className="cursor-pointer text-sm font-medium">
        Daily Log hôm nay{" "}
        <span className="font-normal text-muted-foreground">{todayLog ? "· đã ghi, bấm để sửa" : "· chưa ghi"}</span>
      </summary>
      <form action={action} className="mt-3 grid gap-3 md:grid-cols-3">
        {fields.map(({ key, label, hint }) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <textarea name={key} rows={3} value={values[key]} onChange={set(key)} className={fieldClass} />
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-4 md:col-span-3">
          {showExercise && (
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="exerciseField" value="1" />
              <input
                type="checkbox"
                name="exercised"
                checked={values.exercised}
                onChange={(e) => setValues((v) => ({ ...v, exercised: e.target.checked }))}
                className="size-4 accent-[var(--primary)]"
              />
              Tập thể dục
            </label>
          )}
          <button
            type="submit"
            disabled={pending}
            className={`ml-auto ${primaryButtonClass}`}
          >
            {pending ? "Đang lưu…" : todayLog ? "Cập nhật" : "Lưu Daily Log"}
          </button>
        </div>
        <div className="md:col-span-3">
          <Status state={state} />
        </div>
      </form>
    </details>
  );
}
