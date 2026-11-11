/** Tiêu đề trang: nhãn mono nhỏ (tuỳ chọn) + h1 + dòng phụ (DESIGN.md → Layout). */
export function PageHeader({ title, subtitle, kicker }: { title: string; subtitle?: React.ReactNode; kicker?: string }) {
  return (
    <header className="mb-6">
      {kicker && <p className="font-mono text-xs text-muted-foreground">{kicker}</p>}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
