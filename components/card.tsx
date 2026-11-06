import { Frame, FramePanel, FrameTitle } from "@/components/reui/frame";

export function Card({
  title,
  action,
  className = "",
  focal = false,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  /** Thẻ tiêu điểm của trang (Today: "Hôm nay làm"): tiêu đề cỡ headline 24px thay vì 18px. */
  focal?: boolean;
  children: React.ReactNode;
}) {
  // Khung ReUI (Frame): viền ngoài + panel lồng bên trong; `className` đặt trên Frame (col-span, h-full…)
  // Tiêu đề thẻ là heading cấp 2 (dưới h1 của trang) để trình đọc màn hình nhảy giữa các thẻ
  return (
    <Frame className={className}>
      <FramePanel className="p-5 md:p-6">
        {(title || action) && (
          <div className="mb-4 flex items-baseline justify-between gap-3">
            {title && (
              <FrameTitle role="heading" aria-level={2} className={`font-serif ${focal ? "text-2xl" : "text-lg"}`}>
                {title}
              </FrameTitle>
            )}
            {action}
          </div>
        )}
        {children}
      </FramePanel>
    </Frame>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-pretty text-muted-foreground">{children}</p>;
}
