"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { deleteNoteAction, restoreNoteAction } from "@/app/actions/knowledge";
import { Card, Empty } from "@/components/card";
import { FilterRow } from "@/components/filter-row";
import { Pill } from "@/components/pill";
import { ErrorNotice } from "@/components/error-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDay } from "@/lib/date";
import { colorVarByOrder } from "@/lib/topic-colors";
import { KNOWLEDGE_LEVELS, NO_FIELD, filterNotes, noteDay, sortNotes, type KnowledgeLevel } from "@/lib/knowledge";
import type { Knowledge } from "@/lib/types";
import { undoToast } from "@/components/undo-toast";
import { focusSoon } from "@/lib/focus";
import { EditNoteForm, NewNoteForm } from "./note-forms";

const LEVEL_COLOR: Record<string, string> = {
  "Mới học": "var(--muted-foreground)",
  Hiểu: "var(--primary)",
  "Áp dụng được": "var(--good)",
};

type Change = { type: "delete"; id: string } | { type: "restore"; note: Knowledge };

/**
 * Trang Knowledge (SPEC.md mục 5.6): thêm nhanh, lọc theo Lĩnh vực / Mức hiểu (trong URL), tìm không dấu,
 * sửa tại chỗ (kèm "Liên quan tới"), xoá có Hoàn tác.
 */
export function KnowledgeBoard({
  notes: initial,
  fields,
  initialField = null,
  initialLevel = null,
}: {
  notes: Knowledge[];
  /** Lĩnh vực của người dùng, theo thứ tự ở Cài đặt (thứ tự quyết định màu) */
  fields: string[];
  initialField?: string | null;
  initialLevel?: KnowledgeLevel | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [notes, apply] = useOptimistic(initial, (state, change: Change) =>
    change.type === "delete" ? state.filter((n) => n.id !== change.id) : [...state, change.note],
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [field, setFieldState] = useState<string | null>(initialField);
  const [level, setLevelState] = useState<KnowledgeLevel | null>(initialLevel);
  const [query, setQuery] = useState("");

  // Bộ lọc nằm trong URL (?field=&level=) như Tasks: tải lại / gửi link vẫn giữ, "Tất cả" thì gỡ tham số
  const syncUrl = (next: { field: string | null; level: string | null }) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };
  const setField = (v: string | null) => {
    setFieldState(v);
    syncUrl({ field: v, level });
  };
  const setLevel = (v: KnowledgeLevel | null) => {
    setLevelState(v);
    syncUrl({ field, level: v });
  };
  const clearFilters = () => {
    setFieldState(null);
    setLevelState(null);
    setQuery("");
    syncUrl({ field: null, level: null });
  };

  const sorted = sortNotes(notes);
  const shown = filterNotes(sorted, { field, level, query });
  // Chip lĩnh vực: những lĩnh vực đang có ghi chú (theo thứ tự Cài đặt) + "Không có lĩnh vực" nếu có; lĩnh vực đang lọc luôn hiện
  const used = new Set(notes.map((n) => n.field ?? NO_FIELD));
  const fieldChips = [...fields.filter((f) => used.has(f) || f === field), ...(used.has(NO_FIELD) || field === NO_FIELD ? [NO_FIELD] : [])];
  const filtering = field !== null || level !== null || query.trim() !== "";
  const titleOf = new Map(notes.map((n) => [n.id, n.title]));

  function onDelete(n: Knowledge) {
    setError(null);
    startTransition(async () => {
      apply({ type: "delete", id: n.id });
      const res = await deleteNoteAction(n.id);
      if (!res.ok) setError(`Chưa xóa được “${n.title}”. ${res.error}`);
    });
    undoToast(`Đã xóa “${n.title}”`, () => {
      setError(null);
      startTransition(async () => {
        apply({ type: "restore", note: n });
        const res = await restoreNoteAction({
          id: n.id,
          title: n.title,
          field: n.field,
          level: (n.level ?? "Mới học") as KnowledgeLevel,
          summary: n.summary,
          source: n.source,
          learnedOn: n.learnedOn,
          createdTime: n.createdTime,
          related: n.related,
        });
        if (!res.ok) setError(`Chưa hoàn tác được “${n.title}”. ${res.error}`);
      });
      focusSoon(`[data-note-id="${n.id}"] button[aria-label^="Sửa"]`);
    });
  }

  function closeEdit(id: string) {
    setEditing(null);
    focusSoon(`[data-note-id="${id}"] button[aria-label^="Sửa"]`);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorNotice message={error} onDismiss={() => setError(null)} />}

      <Card title="Thêm ghi chú">
        <NewNoteForm fields={fields} defaultField={field && field !== NO_FIELD ? field : ""} />
      </Card>

      {notes.length > 0 && (
        <div className="flex flex-col gap-3">
          {(fieldChips.length > 1 || field) && <FilterRow label="Lĩnh vực" value={field} options={fieldChips} onChange={setField} />}
          <FilterRow label="Mức hiểu" value={level} options={KNOWLEDGE_LEVELS} onChange={setLevel} />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="note-search" className="w-16 font-mono text-xs text-muted-foreground uppercase">
              Tìm
            </label>
            <Input
              id="note-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tên hoặc tóm tắt, gõ không dấu cũng được…"
              autoComplete="off"
              className="max-w-sm"
            />
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <Card>
          <Empty>
            {notes.length === 0
              ? "Chưa có ghi chú nào. Học được gì thì ghi một dòng ở ô phía trên; chi tiết thêm sau bằng nút bút."
              : "Không có ghi chú nào khớp bộ lọc."}{" "}
            {filtering && notes.length > 0 && (
              <button type="button" onClick={clearFilters} className="font-medium text-primary underline-offset-4 hover:underline">
                Bỏ lọc
              </button>
            )}
          </Empty>
        </Card>
      ) : (
        <Card
          title="Ghi chú"
          flush
          action={
            <span className="text-xs text-muted-foreground tabular-nums">
              {filtering ? `${shown.length}/${notes.length}` : notes.length} ghi chú
            </span>
          }
        >
          <ul>
            {shown.map((n, i) => (
              <li key={n.id} data-note-id={n.id} className={`row-sep px-4 py-3 ${editing === n.id ? "bg-surface-muted" : "transition-colors hover:bg-surface-muted"}`}>
                {editing === n.id ? (
                  <EditNoteForm note={n} fields={fields} others={sorted.filter((o) => o.id !== n.id)} onClose={() => closeEdit(n.id)} />
                ) : (
                  <div className="flex gap-3">
                    <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="min-w-0 font-medium break-words">{n.title}</h3>
                        {n.field && (
                          <Pill color={`var(${colorVarByOrder(n.field, fields)})`} dot>
                            {n.field}
                          </Pill>
                        )}
                        {n.level && <Pill color={LEVEL_COLOR[n.level] ?? "var(--muted-foreground)"}>{n.level}</Pill>}
                        <span className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">{formatDay(noteDay(n))}</span>
                      </div>
                      {n.summary && <p className="text-sm text-pretty whitespace-pre-line text-muted-foreground">{n.summary}</p>}
                      {(n.source || n.related.length > 0) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {n.source && (
                            <a
                              href={n.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                            >
                              <ExternalLinkIcon aria-hidden="true" className="size-3" />
                              Nguồn
                            </a>
                          )}
                          {n.related.length > 0 && (
                            <span>
                              Liên quan:{" "}
                              {n.related
                                .map((id) => titleOf.get(id))
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start">
                      <Button variant="ghost" size="icon" className="max-md:size-10" aria-label={`Sửa ghi chú: ${n.title}`} onClick={() => setEditing(n.id)}>
                        <PencilIcon />
                      </Button>
                      <Button variant="ghost" size="icon" className="max-md:size-10" aria-label={`Xóa ghi chú: ${n.title}`} onClick={() => onDelete(n)}>
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
