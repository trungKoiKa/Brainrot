/**
 * Link mở trang ngoài nếu có `href`; task trong database không có trang riêng (href rỗng) → chữ thường.
 * `title`: chữ đầy đủ khi tên bị cắt (rà soát A3, tên dài bị truncate).
 */
export function MaybeLink({ href, className, title, children }: { href: string; className?: string; title?: string; children: React.ReactNode }) {
  if (!href) {
    // Không có trang riêng → bỏ hiệu ứng hover của link để không trông như bấm được (rà soát A2 lỗi 5)
    const plain = className?.split(/\s+/).filter((c) => !c.startsWith("hover:")).join(" ");
    return (
      <span className={plain} title={title}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={title}>
      {children}
    </a>
  );
}
