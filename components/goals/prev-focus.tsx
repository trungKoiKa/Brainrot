"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createGoalAction } from "@/app/actions/goals";
import { MAX_GOAL_TITLE } from "@/lib/goals";
import type { Level } from "@/lib/period";

/** "- Chạy bộ", "1. Học" → "Chạy bộ" */
const clean = (line: string) => line.replace(/^[\s\-*•\d.)]+/, "").trim();

/**
 * "Kỳ trước bạn định tập trung" (SPEC-v1.0, Goal đợt 2): mỗi dòng có nút "Thêm làm mục tiêu" (loại Ưu tiên);
 * dòng trùng tên mục tiêu có sẵn ghi "Đã có".
 */
export function PrevFocus({ text, level, periodKey, existing }: { text: string; level: Level; periodKey: string; existing: string[] }) {
  const router = useRouter();
  const [added, setAdded] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lines = text.split("\n").map(clean).filter(Boolean);
  const has = (l: string) => [...existing, ...added].some((t) => t.trim().toLowerCase() === l.toLowerCase());

  async function add(line: string) {
    setBusy(line);
    setError(null);
    const res = await createGoalAction(level, periodKey, line.slice(0, MAX_GOAL_TITLE), "Ưu tiên");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setAdded((a) => [...a, line]);
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-lg bg-surface-muted px-3 py-2.5 text-sm">
      <p className="font-medium">Kỳ trước bạn định tập trung:</p>
      <ul className="mt-1.5 space-y-1">
        {lines.map((l) => (
          <li key={l} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 break-words">{l}</span>
            {has(l) ? (
              <span className="shrink-0 text-xs text-muted-foreground">Đã có</span>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => add(l)}
                aria-label={`Thêm làm mục tiêu: ${l}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary outline-none hover:bg-accent-soft focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <PlusIcon aria-hidden="true" className="size-3" />
                {busy === l ? "Đang thêm…" : "Thêm làm mục tiêu"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-1.5 text-xs text-(--danger)">{error}</p>}
    </div>
  );
}
