import { Frame, FramePanel, FrameTitle } from "@/components/reui/frame";

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
  // Khung ReUI (Frame): viền ngoài + panel lồng bên trong; `className` đặt trên Frame (col-span, h-full…)
  return (
    <Frame className={className}>
      <FramePanel className="p-5 md:p-6">
        {(title || action) && (
          <div className="mb-4 flex items-baseline justify-between gap-3">
            {title && <FrameTitle className="font-serif text-lg">{title}</FrameTitle>}
            {action}
          </div>
        )}
        {children}
      </FramePanel>
    </Frame>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
