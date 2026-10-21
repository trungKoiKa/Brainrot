export function Card({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          {title && <h2 className="font-serif text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
