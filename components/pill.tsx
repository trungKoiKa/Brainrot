// Nhãn bo tròn (pill) — một cách vẽ duy nhất cho dự án và trạng thái ở mọi trang (DESIGN.md → Pill, The One Status Map Rule).
import type { ReactNode } from "react";
import { projectColorByOrder } from "@/lib/fields";

type Tone = "warning" | "danger" | "success" | "primary" | "muted";

const TONE_VAR: Record<Tone, string> = {
  warning: "var(--warning)",
  danger: "var(--danger)",
  success: "var(--good)",
  primary: "var(--primary)",
  muted: "var(--muted-foreground)",
};

export function Pill({ color, dot = false, children, className = "" }: { color: string; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
      style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}
    >
      {dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/** Pill trạng thái: trễ lịch, hạn hôm nay, quá hạn, xong, đang làm… */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Pill color={TONE_VAR[tone]}>{children}</Pill>;
}

/** Pill dự án: màu theo thứ tự dự án của người dùng; không có dự án thì không vẽ gì. */
export function ProjectPill({ project, projects }: { project: string | null; projects: readonly string[] }) {
  if (!project) return null;
  return (
    <Pill color={`var(${projectColorByOrder(project, projects)})`} dot>
      {project}
    </Pill>
  );
}
