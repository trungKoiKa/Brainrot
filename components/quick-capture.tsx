"use client";

import { useActionState, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { addIdeaAction, saveDailyLogAction, type CaptureState } from "@/app/actions/capture";
import type { DailyLog } from "@/lib/types";
import { Status } from "./form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Ghi nhanh trên Today (SPEC.md mục 5.1): ý tưởng → Ideas, Daily Log hôm nay → Daily Log.
 * Hai form tách ra để Today đặt ý tưởng riêng, Daily Log vào cụm "Cuối ngày" (SPEC.md mục 5.1, Trung chốt 06/11/2026).
 */
export function DailyLogCapture({
  todayLog,
  open,
  showExercise = true,
  day,
}: {
  todayLog: DailyLog | null;
  /** Mở sẵn hay không; Today chỉ mở sau 18:00 khi chưa ghi. */
  open: boolean;
  /** false khi đã có thẻ Thói quen (SPEC.md mục 5.1): bỏ ô "Tập thể dục" để hai nơi không ghi đè nhau. */
  showExercise?: boolean;
  /** Ngày làm việc (Today: workdayVN) — khoá bản nháp Daily Log đang gõ */
  day: string;
}) {
  return <DailyLogForm key={todayLog?.id ?? "new"} todayLog={todayLog} open={open} showExercise={showExercise} day={day} />;
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
        <Input
          id="idea"
          name="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Vd: thử YOLOv8 cho đồ án…"
          className="max-md:h-10"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending || !idea.trim()} className="max-md:h-10">
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </div>
      <Status state={state} />
    </form>
  );
}

function DailyLogForm({ todayLog, open, showExercise, day }: { todayLog: DailyLog | null; open: boolean; showExercise: boolean; day: string }) {
  // Controlled: lỗi khi lưu thì nội dung đã gõ vẫn còn
  const [values, setValues] = useState({
    done: todayLog?.done ?? "",
    dropped: todayLog?.dropped ?? "",
    learned: todayLog?.learned ?? "",
    exercised: todayLog?.exercised ?? false,
  });
  const draftKey = `daily-log-draft:${day}`;
  // Mở / thu gọn có kiểm soát: lưu xong thì thu gọn lại
  const [expanded, setExpanded] = useState(open);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof saveDailyLogAction>[0], form: FormData) => {
      const next = await saveDailyLogAction(prev, form);
      if (next.ok) {
        writeDraft(draftKey, null);
        setExpanded(false);
        setSavedAt(Date.now());
      }
      return next;
    },
    {},
  );
  const saved = { done: todayLog?.done ?? "", dropped: todayLog?.dropped ?? "", learned: todayLog?.learned ?? "", exercised: todayLog?.exercised ?? false };
  // Khôi phục bản nháp chưa lưu của đúng ngày làm việc này (localStorage chỉ có sau hydrate → đọc trong effect)
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const d = readDraft(draftKey);
    if (d && (d.done !== saved.done || d.dropped !== saved.dropped || d.learned !== saved.learned)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(d);
      setRestored(true);
      setExpanded(true); // mở sẵn để thấy bản nháp vừa khôi phục (rà soát 11/2026 P2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setValues((v) => {
      const next = { ...v, [key]: e.target.value };
      const same = next.done === saved.done && next.dropped === saved.dropped && next.learned === saved.learned;
      writeDraft(draftKey, same ? null : next);
      return next;
    });

  const fields: { key: "done" | "dropped" | "learned"; label: string; hint?: string; placeholder?: string }[] = [
    { key: "done", label: "Xong", placeholder: "Việc đã xong hôm nay…" },
    { key: "dropped", label: "Chưa xong", placeholder: "Việc định làm mà chưa xong, vì sao…" },
    { key: "learned", label: "Học được", placeholder: "Một điều mới hiểu ra…" },
  ];

  return (
    <details className="group" open={expanded} onToggle={(e) => setExpanded(e.currentTarget.open)}>
      <summary className="cursor-pointer py-2.5 text-sm font-medium">
        Daily Log hôm nay{" "}
        <span className="font-normal text-muted-foreground">{todayLog || savedAt ? "· đã ghi, bấm để sửa" : "· chưa ghi"}</span>
        {savedAt && (
          <span role="status" className="ml-2 font-normal text-good">
            ✓ Đã lưu
          </span>
        )}
      </summary>
      <form action={action} className="mt-3 grid gap-x-4 gap-y-5 md:grid-cols-3">
        {fields.map(({ key, label, hint, placeholder }) => (
          <label key={key} className="flex flex-col gap-2 text-sm">
            <span className="font-medium">{label}</span>
            {/* Ô tự cao theo nội dung (field-sizing-content) nên bỏ tay kéo ở góc */}
            <Textarea name={key} value={values[key]} onChange={set(key)} placeholder={placeholder} className="min-h-24 resize-none px-3 py-2.5 leading-relaxed" />
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
          <Button type="submit" disabled={pending} className="ml-auto max-md:h-10">
            {pending ? "Đang lưu…" : todayLog ? "Cập nhật" : "Lưu Daily Log"}
          </Button>
        </div>
        <div className="md:col-span-3">
          {restored && !state.message && <p role="status" className="text-sm text-muted-foreground">Đã khôi phục bản nháp chưa lưu.</p>}
          <Status state={state} />
        </div>
      </form>
    </details>
  );
}

type DailyDraft = { done: string; dropped: string; learned: string; exercised: boolean };
/** Bản nháp Daily Log đang gõ (SPEC.md mục 5.1): lưu trong trình duyệt theo ngày làm việc; hỏng/tắt lưu trữ thì bỏ qua. */
function readDraft(key: string): DailyDraft | null {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as Partial<DailyDraft>) : null;
    return v && typeof v.done === "string" && typeof v.dropped === "string" && typeof v.learned === "string"
      ? { done: v.done, dropped: v.dropped, learned: v.learned, exercised: v.exercised === true }
      : null;
  } catch {
    return null;
  }
}
function writeDraft(key: string, v: DailyDraft | null) {
  try {
    if (v) localStorage.setItem(key, JSON.stringify(v));
    else localStorage.removeItem(key);
  } catch {}
}
