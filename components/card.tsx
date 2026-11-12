// Khung chuẩn (DESIGN.md): hộp bo 12px viền 1px nền surface, hàng tiêu đề kẻ dưới.
// Một họ khung cho mọi trang; không lồng khung trong khung.

export function Card({
  title,
  action,
  className = "",
  focal = false,
  flush = false,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Khung tiêu điểm của trang (vd. "Hôm nay làm"): tiêu đề lớn hơn một bậc. */
  focal?: boolean;
  /** Nội dung sát viền (bảng, danh sách kẻ dòng tự có đệm). */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 overflow-clip rounded-xl border border-line bg-surface ${className}`}>
      {(title || action) && (
        <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line-soft px-4 py-2.5">
          {title && <h2 className={`font-semibold ${focal ? "text-base" : "text-sm"}`}>{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-pretty text-muted-foreground">{children}</p>;
}
