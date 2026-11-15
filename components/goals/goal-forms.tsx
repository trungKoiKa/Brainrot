"use client";

// Thêm mục tiêu và chuyển mục tiêu chưa xong sang kỳ sau (SPEC.md mục 5.3).

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { carryOverGoalsAction, createGoalAction, trashGoalAction } from "@/app/actions/goals";
import { Input } from "@/components/ui/input";
import { MAX_GOAL_TITLE, type Goal, type GoalType } from "@/lib/goals";
import type { Level } from "@/lib/period";
import { undoToast } from "@/components/undo-toast";
import { NativeSelect } from "@/components/native-select";

export function AddGoal({
  level,
  periodKey,
  onAdded,
  onError,
}: {
  level: Level;
  periodKey: string;
  onAdded: (goal: Goal) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("Thường");
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const text = title.trim();
        if (!text) return;
        start(async () => {
          const res = await createGoalAction(level, periodKey, text, type);
          if (!res.ok) return onError(res.error);
          // "Kỳ" thật do server tính; ở client chỉ cần id để thao tác tiếp
          onAdded({ id: res.id, title: text, level, start: "", type, done: false, habitId: null, threshold: null, taskIds: [] });
          setTitle("");
        });
      }}
    >
      <Input
        aria-label="Mục tiêu mới"
        placeholder="Thêm mục tiêu…"
        value={title}
        maxLength={MAX_GOAL_TITLE}
        onChange={(e) => setTitle(e.target.value)}
        className="min-w-48 flex-1 max-md:h-10"
      />
      <NativeSelect label="Loại" value={type} options={["Thường", "Ưu tiên"]} onChange={(v) => setType(v as GoalType)} className="max-md:h-10" />
      <Button type="submit" disabled={pending || !title.trim()} className="max-md:h-10">
        {pending ? "Đang thêm…" : "Thêm"}
      </Button>
    </form>
  );
}

/**
 * "Chuyển N mục tiêu chưa xong sang <kỳ sau>" (SPEC.md mục 5.3): tạo bản sao ở kỳ sau, không đụng mục tiêu hiện tại.
 * Gửi đúng danh sách đang hiện là chưa xong → số trên nút khớp số đã chuyển (rà soát A2 lỗi 2); xong thì ẩn nút,
 * kết quả + Hoàn tác ở toast.
 */
export function CarryOver({
  level,
  periodKey,
  goalIds,
  label,
  onError,
}: {
  level: Level;
  periodKey: string;
  goalIds: string[];
  label: string;
  onError: (message: string) => void;
}) {
  const [pending, start] = useTransition();
  const [carried, setCarried] = useState<string | null>(null);
  const key = goalIds.join(",");
  if (carried === key || goalIds.length === 0) return null;
  return (
    <div className="mt-4">
      <Button
        variant="outline"
        // nhãn dài trên mobile được xuống dòng thay vì tràn ngang (rà soát 375px)
        className="h-auto min-h-8 max-w-full py-1.5 text-left whitespace-normal"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await carryOverGoalsAction(level, periodKey, goalIds);
            if (!res.ok) return onError(res.error);
            setCarried(key);
            const skipped = goalIds.length - res.ids.length;
            const text = res.ids.length
              ? `Đã chuyển ${res.ids.length} mục tiêu sang ${label}${skipped ? ` (${skipped} đã có sẵn)` : ""}.`
              : `${label} đã có đủ các mục tiêu này.`;
            undoToast(
              text,
              res.ids.length
                ? async () => {
                    const results = await Promise.all(res.ids.map((id) => trashGoalAction(id, true)));
                    const failed = results.find((r) => !r.ok);
                    if (failed && !failed.ok) return onError(failed.error);
                    setCarried(null);
                  }
                : undefined,
            );
          })
        }
      >
        {pending ? "Đang chuyển…" : `Chuyển ${goalIds.length} mục tiêu chưa xong sang ${label}`}
      </Button>
    </div>
  );
}
