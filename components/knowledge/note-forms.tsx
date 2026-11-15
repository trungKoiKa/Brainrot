"use client";

// Form thêm / sửa ghi chú và ô chọn "Liên quan tới" (SPEC.md mục 5.6).

import { useActionState, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { createNoteAction, updateNoteAction, type NoteFormState } from "@/app/actions/knowledge";
import { fieldClass } from "@/components/form-bits";
import { DeadlineField } from "@/components/deadline-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fold } from "@/lib/text";
import { KNOWLEDGE_LEVELS, MAX_NOTE_TITLE, MAX_RELATED } from "@/lib/knowledge";
import type { Knowledge } from "@/lib/types";
import { NativeSelect } from "@/components/native-select";

const compactField = fieldClass.replace("w-full", "w-auto");

/** Thêm nhanh: Tên + Lĩnh vực + Mức hiểu. Thêm xong giữ lĩnh vực / mức hiểu vừa chọn, con trỏ về ô tên. */
export function NewNoteForm({ fields, defaultField }: { fields: string[]; defaultField: string }) {
  const [values, setValues] = useState({ title: "", field: defaultField, level: "Mới học" });
  const titleRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (prev: NoteFormState, form: FormData) => {
    const next = await createNoteAction(prev, form);
    if (next.ok) {
      setValues((s) => ({ ...s, title: "" }));
      requestAnimationFrame(() => titleRef.current?.focus());
    }
    return next;
  }, {});
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          ref={titleRef}
          name="title"
          aria-label="Tên ghi chú mới"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="Hôm nay học được gì…"
          maxLength={MAX_NOTE_TITLE}
          autoComplete="off"
          className="min-w-56 flex-1"
        />
        {fields.length > 0 && <NativeSelect name="field" label="Lĩnh vực" value={values.field} options={fields} empty="Lĩnh vực" onChange={set("field")} />}
        <NativeSelect name="level" label="Mức hiểu" value={values.level} options={KNOWLEDGE_LEVELS} onChange={set("level")} />
        <Button type="submit" disabled={pending || !values.title.trim()}>
          {pending ? "Đang thêm…" : "Thêm"}
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Muốn nhóm ghi chú theo lĩnh vực? Thêm lĩnh vực ở{" "}
          <a href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
            Cài đặt
          </a>
          .
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Sửa tại chỗ: đủ trường + "Liên quan tới". Lỗi thì nội dung đã gõ vẫn còn. */
export function EditNoteForm({ note, fields, others, onClose }: { note: Knowledge; fields: string[]; others: Knowledge[]; onClose: () => void }) {
  const [values, setValues] = useState({
    title: note.title,
    field: note.field ?? "",
    level: note.level ?? "Mới học",
    summary: note.summary,
    source: note.source ?? "",
    learnedOn: note.learnedOn ?? "",
  });
  const [related, setRelated] = useState<string[]>(note.related.filter((id) => others.some((o) => o.id === id)));
  const [state, action, pending] = useActionState(async (prev: NoteFormState, form: FormData) => {
    const next = await updateNoteAction(prev, form);
    if (next.ok) onClose();
    return next;
  }, {});
  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));
  const label = "space-y-1 text-sm";

  return (
    <form action={action} className="space-y-3" aria-label={`Sửa ghi chú: ${note.title}`}>
      <input type="hidden" name="id" value={note.id} />
      <input type="hidden" name="related" value={related.join(",")} />
      <div className="flex flex-wrap gap-2">
        <Input
          autoFocus
          name="title"
          aria-label="Tên ghi chú"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          maxLength={MAX_NOTE_TITLE}
          autoComplete="off"
          className="min-w-56 flex-1"
        />
        {/* Lĩnh vực đang gắn luôn có trong danh sách, kể cả khi vừa bị xoá ở Cài đặt */}
        <NativeSelect
          name="field"
          label="Lĩnh vực"
          value={values.field}
          options={values.field && !fields.includes(values.field) ? [...fields, values.field] : fields}
          empty="Lĩnh vực"
          onChange={set("field")}
        />
        <NativeSelect name="level" label="Mức hiểu" value={values.level} options={KNOWLEDGE_LEVELS} onChange={set("level")} />
        <DeadlineField name="learnedOn" label="Ngày học" value={values.learnedOn} onChange={set("learnedOn")} triggerClass={compactField} />
      </div>
      <label className={`block ${label}`}>
        <span className="text-muted-foreground">Tóm tắt</span>
        <Textarea
          name="summary"
          value={values.summary}
          onChange={(e) => set("summary")(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Viết lại bằng lời của mình: ý chính, ví dụ, chỗ dễ nhầm…"
        />
      </label>
      <label className={`block ${label}`}>
        <span className="text-muted-foreground">Nguồn (link)</span>
        <Input name="source" type="url" value={values.source} onChange={(e) => set("source")(e.target.value)} placeholder="https://…" autoComplete="off" />
      </label>
      <RelatedPicker noteTitle={note.title} others={others} value={related} onChange={setRelated} />
      <div className="flex flex-wrap items-center gap-2">
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending || !values.title.trim()}>
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </div>
    </form>
  );
}

/** "Liên quan tới" (Trung chốt 11/11/2026: chọn tay): chip các ghi chú đã chọn + ô tìm không dấu để thêm. */
function RelatedPicker({ noteTitle, others, value, onChange }: { noteTitle: string; others: Knowledge[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const q = fold(query);
  const full = value.length >= MAX_RELATED;
  const matches = q === "" ? [] : others.filter((o) => !value.includes(o.id) && fold(o.title).includes(q)).slice(0, 6);
  const titleOf = new Map(others.map((o) => [o.id, o.title]));

  return (
    <div className="space-y-1.5 text-sm">
      <label htmlFor="related-search" className="text-muted-foreground">
        Liên quan tới
      </label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Ghi chú liên quan tới: ${noteTitle}`}>
          {value.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-md border border-line py-0.5 pr-0.5 pl-2 text-xs">
              <span className="max-w-56 truncate">{titleOf.get(id)}</span>
              <button
                type="button"
                aria-label={`Bỏ liên quan: ${titleOf.get(id)}`}
                onClick={() => {
                  onChange(value.filter((v) => v !== id));
                  inputRef.current?.focus();
                }}
                className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring max-md:size-10"
              >
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {others.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có ghi chú nào khác để nối.</p>
      ) : (
        <>
          <Input
            id="related-search"
            ref={inputRef}
            type="search"
            value={query}
            disabled={full}
            onChange={(e) => setQuery(e.target.value)}
            // Enter trong ô tìm chọn kết quả đầu, không gửi cả form
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (matches[0]) {
                onChange([...value, matches[0].id]);
                setQuery("");
              }
            }}
            placeholder={full ? `Đã đủ ${MAX_RELATED} ghi chú liên quan` : "Tìm ghi chú khác để nối…"}
            autoComplete="off"
            className="max-w-sm"
          />
          {q !== "" &&
            (matches.length === 0 ? (
              <p className="text-xs text-muted-foreground">Không có ghi chú nào khớp “{query.trim()}”.</p>
            ) : (
              <ul className="max-w-sm overflow-clip rounded-lg border border-line" aria-label="Ghi chú tìm thấy">
                {matches.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange([...value, o.id]);
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className="flex min-h-10 w-full items-center px-2 py-1.5 text-left text-sm break-words outline-none hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring md:min-h-0"
                    >
                      {o.title}
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </>
      )}
    </div>
  );
}
