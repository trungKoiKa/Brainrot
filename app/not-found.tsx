import Link from "next/link";
import { Button } from "@/components/ui/button";

// Trang 404 tiếng Việt (rà soát A2 lỗi 6), thay trang tiếng Anh mặc định của Next.
export default function NotFound() {
  return (
    <main className="graph-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs text-muted-foreground">LỖI 404</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Không có trang này</h1>
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          Đường dẫn sai hoặc trang đã đổi chỗ. Quay về Today để xem hôm nay làm gì.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/today" />}>
            Về Today
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/tasks" />}>
            Mở Tasks
          </Button>
        </div>
      </div>
    </main>
  );
}
