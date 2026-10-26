"use client";

import { useState, useTransition } from "react";
import { saveReflectionAction } from "@/app/actions/reflections";
import { Status, fieldClass, primaryButtonClass, type FormStatus } from "@/components/form-bits";
import type { Level } from "@/lib/period";
import { MAX_TEXT } from "@/lib/quick-capture";
import { MAX_MOTTO, reflectionQuestions, type ReflectionFields } from "@/lib/reflections";

const EMPTY: ReflectionFields = { wentWell: "", lesson: "", grateful: "", nextFocus: "", motto: "" };

/**
 * Nhìn lại của một kỳ (SPEC-v0.4 mục 5): 4 câu (câu 4 theo cấp) + châm ngôn ở cấp Năm.
 * 1 bản ghi / kỳ — đã có thì mở ra thấy sẵn, lưu = cập nhật. Lỗi → nội dung đã gõ vẫn còn.
 */
export function ReflectionForm({ level, periodKey, initial }: { level: Level; periodKey: string; initial: ReflectionFields | null }) {
  const [values, setValues] = useState<ReflectionFields>(initial ?? EMPTY);
  const [status, setStatus] = useState<FormStatus>({});
  const [pending, start] = useTransition();
  const set = (key: keyof ReflectionFields) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveReflectionAction(level, periodKey, values);
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
        <Status state={status} />
        <button type="submit" disabled={pending} className={`ml-auto ${primaryButtonClass}`}>
          {pending ? "Đang lưu…" : initial ? "Cập nhật" : "Lưu nhìn lại"}
        </button>
      </div>
    </form>
  );
}
