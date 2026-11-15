"use client";

import { useEffect, useState, useTransition } from "react";
import { saveReflectionAction } from "@/app/actions/reflections";
import { Status, type FormStatus } from "@/components/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Level } from "@/lib/period";
import { MAX_TEXT } from "@/lib/quick-capture";
import { MAX_MOTTO, reflectionQuestions, type ReflectionFields } from "@/lib/reflections";
import { readJson, writeJson } from "@/lib/local-store";

const EMPTY: ReflectionFields = { wentWell: "", lesson: "", grateful: "", nextFocus: "", motto: "" };

const draftKey = (level: Level, periodKey: string) => `reflection-draft:${level}:${periodKey}`;

/** Bản nháp đang gõ (SPEC.md mục 5.3): lưu trong trình duyệt theo kỳ, hỏng/tắt lưu trữ thì bỏ qua. */
const asDraft = (v: unknown): ReflectionFields | null =>
  v && typeof v === "object" && Object.keys(EMPTY).every((k) => typeof (v as Record<string, unknown>)[k] === "string") ? (v as ReflectionFields) : null;
const readDraft = (key: string) => readJson(key, asDraft);
const writeDraft = (key: string, v: ReflectionFields | null) => writeJson(key, v);
const same = (a: ReflectionFields, b: ReflectionFields) => (Object.keys(EMPTY) as (keyof ReflectionFields)[]).every((k) => a[k] === b[k]);

/**
 * Nhìn lại của một kỳ (SPEC.md mục 5.3): 4 câu (câu 4 theo cấp) + châm ngôn ở cấp Năm.
 * 1 bản ghi / kỳ — đã có thì mở ra thấy sẵn, lưu = cập nhật. Lỗi → nội dung đã gõ vẫn còn.
 */
export function ReflectionForm({ level, periodKey, initial }: { level: Level; periodKey: string; initial: ReflectionFields | null }) {
  const saved = initial ?? EMPTY;
  const storeKey = draftKey(level, periodKey);
  const [values, setValues] = useState<ReflectionFields>(saved);
  const [restored, setRestored] = useState(false);
  // Đã có bản lưu → xem câu trả lời, bấm "Sửa" mới mở ô nhập; lưu xong quay về chế độ xem
  // (Trung báo 11/11/2026: lưu rồi mà form vẫn mở như chưa lưu)
  const [editing, setEditing] = useState(!initial);
  // Khôi phục bản nháp sau khi vào trang (localStorage chỉ có ở trình duyệt → đọc trong effect, tránh lệch SSR)
  useEffect(() => {
    const d = readDraft(storeKey);
    if (d && !same(d, saved)) {
      // đọc kho ngoài (localStorage) một lần lúc mount — chỉ làm được sau hydrate
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(d);
      setRestored(true);
      setEditing(true);
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

  const questions = reflectionQuestions(level);
  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {level === "year" && values.motto.trim() && (
          <p className="text-sm">
            <span className="text-muted-foreground">Châm ngôn năm: </span>
            {values.motto}
          </p>
        )}
        <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2">
          {questions.map((q) => (
            <div key={q.key} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{q.label}</dt>
              <dd className="mt-1 text-sm break-words whitespace-pre-line">{values[q.key].trim() || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Status state={status} />
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setStatus({});
              setEditing(true);
            }}
          >
            Sửa nhìn lại
          </Button>
        </div>
      </div>
    );
  }

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
            setEditing(false);
          }
          setStatus(res.ok ? { ok: true, message: res.message } : { ok: false, message: res.error });
        });
      }}
    >
      {level === "year" && (
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="font-medium">Châm ngôn năm — hiện ở đầu trang Mục tiêu và Dashboard</span>
          <Input value={values.motto} onChange={set("motto")} maxLength={MAX_MOTTO} placeholder="Vd: Sống kỷ luật, chăm lo chuyện của mình" className="max-md:h-10" />
        </label>
      )}
      {questions.map((q) => (
        <label key={q.key} className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{q.label}</span>
          <Textarea value={values[q.key]} onChange={set(q.key)} maxLength={MAX_TEXT} className="min-h-24 resize-none px-3 py-2.5 leading-relaxed" />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        {restored && !status.message && <p role="status" className="text-sm text-muted-foreground">Đã khôi phục bản nháp chưa lưu.</p>}
        <Status state={status} />
        {initial && (
          <Button type="button" variant="ghost" className="ml-auto" disabled={pending} onClick={() => {
              // Huỷ: bỏ phần đang sửa, quay về bản đã lưu
              setValues(saved);
              writeDraft(storeKey, null);
              setRestored(false);
              setEditing(false);
            }}
          >
            Huỷ
          </Button>
        )}
        <Button type="submit" disabled={pending} className={initial ? "" : "ml-auto"}>
          {pending ? "Đang lưu…" : initial ? "Cập nhật" : "Lưu nhìn lại"}
        </Button>
      </div>
    </form>
  );
}
