/** Tiêu đề trang: nhãn mono nhỏ (tuỳ chọn) + h1 + dòng phụ; `aside` căn phải ngang tiêu đề (DESIGN.md → Layout). */
export function PageHeader({
  title,
  subtitle,
  kicker,
  aside,
}: {
  title: string;
  subtitle?: React.ReactNode;
  kicker?: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <div className="min-w-0">
        {kicker && <p className="font-mono text-xs text-muted-foreground">{kicker}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
    </header>
  );
}
