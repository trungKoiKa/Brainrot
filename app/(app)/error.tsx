"use client"; // Error boundary phải là Client Component

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";

// Đọc database lỗi → trang này, sidebar vẫn còn. Có h1 và được báo cho trình đọc màn hình (rà soát A3).
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error(error);
    heading.current?.focus();
  }, [error]);

  return (
    <div className="mx-auto max-w-xl pt-6">
      <p className="font-mono text-xs text-muted-foreground">LỖI · ĐỌC DỮ LIỆU</p>
      <h1 ref={heading} tabIndex={-1} className="mt-1 mb-6 text-3xl font-semibold tracking-tight outline-none">
        Không lấy được dữ liệu
      </h1>
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Web chưa đọc được database</AlertTitle>
        <AlertDescription>Có thể mạng chập chờn hoặc database đang tạm ngừng. Thử lại sau vài giây.</AlertDescription>
      </Alert>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => retry()}>Thử lại</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/today" />}>
          Về Today
        </Button>
      </div>
    </div>
  );
}
