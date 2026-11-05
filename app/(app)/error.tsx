"use client"; // Error boundary phải là Client Component

import { useEffect } from "react";
import { Card } from "@/components/card";

// Đọc database lỗi → trang này, sidebar vẫn còn.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl pt-10">
      <Card title="Không lấy được dữ liệu">
        <p className="text-sm text-muted-foreground">
          Web chưa đọc được database. Có thể mạng chập chờn hoặc database đang tạm ngừng; thử lại sau vài giây.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface"
        >
          Thử lại
        </button>
      </Card>
    </div>
  );
}
