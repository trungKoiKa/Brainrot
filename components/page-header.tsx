export function PageHeader({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="font-serif text-3xl font-semibold md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </header>
  );
}
