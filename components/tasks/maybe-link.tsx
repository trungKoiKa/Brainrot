/** Link mở trang ngoài nếu có `href`; task trong database không có trang riêng (href rỗng) → chữ thường. */
export function MaybeLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
