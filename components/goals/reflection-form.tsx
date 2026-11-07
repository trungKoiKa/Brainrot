"use client";

import { useEffect, useState, useTransition } from "react";
import { saveReflectionAction } from "@/app/actions/reflections";
import { Status, fieldClass, primaryButtonClass, type FormStatus } from "@/components/form-bits";
import type { Level } from "@/lib/period";
import { MAX_TEXT } from "@/lib/quick-capture";
import { MAX_MOTTO, reflectionQuestions, type ReflectionFields } from "@/lib/reflections";

const EMPTY: ReflectionFields = { wentWell: "", lesson: "", grateful: "", nextFocus: "", motto: "" };

const draftKey = (level: Level, periodKey: string) => `reflection-draft:${level}:${periodKey}`;

/** Bản nháp đang gõ (SPEC-v1.0, Goal đợt 2): lưu trong trình duyệt theo kỳ, hỏng/tắt lưu trữ thì bỏ qua. */
function readDraft(key: string): ReflectionFields | null {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as Partial<ReflectionFields>) : null;
    return v && Object.keys(EMPTY).every((k) => typeof v[k as keyof ReflectionFields] === "string") ? (v as ReflectionFields) : null;
  } catch {
    return null;
  }
}
const writeDraft = (key: string, v: ReflectionFields | null) => {
  try {
    if (v) localStorage.setItem(key, JSON.stringify(v));
    else localStorage.removeItem(key);
  } catch {}
};
const same = (a: ReflectionFields, b: ReflectionFields) => (Object.keys(EMPTY) as (keyof ReflectionFields)[]).every((k) => a[k] === b[k]);

/**
 * Nhìn lại của một kỳ (SPEC-v0.4 mục 5): 4 câu (câu 4 theo cấp) + châm ngôn ở cấp Năm.
 * 1 bản ghi / kỳ — đã có thì mở ra thấy sẵn, lưu = cập nhật. Lỗi → nội dung đã gõ vẫn còn.
 */
export function ReflectionForm({ level, periodKey, initial }: { level: Level; periodKey: string; initial: ReflectionFields | null }) {
  const saved = initial ?? EMPTY;
  const storeKey = draftKey(level, periodKey);
  const [values, setValues] = useState<ReflectionFields>(saved);
  const [restored, setRestored] = useState(false);
  // Khôi phục bản nháp sau khi vào trang (localStorage chỉ có ở trình duyệt → đọc trong effect, tránh lệch SSR)
  useEffect(() => {
    const d = readDraft(storeKey);
    if (d && !same(d, saved)) {
      // đọc kho ngoài (localStorage) một lần lúc mount — chỉ làm được sau hydrate
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(d);
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [status, setStatus] = useState<FormStatus>({});
  const [pending, start] = useTransition();
  const set = (key: keyof ReflectionFields) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setValues((v) => {
      const next = { ...v, [key]: e.target.value };
      writeDraft(storeKey, same(next, saved) ? null : next);
      return next;
    });

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveReflectionAction(level, periodKey, values);
          if (res.ok) {
            writeDraft(storeKey, null);
            setRestored(false);
          }
          setStatus(res.ok ? { ok: true, message: res.message } : { ok: false, message: res.error });
        });
      }}
    >
      {level === "year" && (
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-muted-foreground">Châm ngôn năm — hiện ở đầu trang Mục tiêu và Dashboard</span>
          <input value={values.motto} onChange={set("motto")} maxLength={MAX_MOTTO} placeholder="Vd: Sống kỷ luật, chăm lo chuyện của mình" className={fieldClass} />
        </label>
      )}
      {reflectionQuestions(level).map((q) => (
        <label key={q.key} className="space-y-1 text-sm">
          <span className="text-muted-foreground">{q.label}</span>
          <textarea rows={3} value={values[q.key]} onChange={set(q.key)} maxLength={MAX_TEXT} className={fieldClass} />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        {restored && !status.message && <p role="status" className="text-sm text-muted-foreground">Đã khôi phục bản nháp chưa lưu.</p>}
        <Status state={status} />
        <button type="submit" disabled={pending} className={`ml-auto ${primaryButtonClass}`}>
          {pending ? "Đang lưu…" : initial ? "Cập nhật" : "Lưu nhìn lại"}
        </button>
      </div>
    </form>
  );
}
