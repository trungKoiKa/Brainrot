"use client"; // Error boundary phải là Client Component

import { useEffect } from "react";
import { Card } from "@/components/card";

// Notion lỗi mà chưa có bản cũ nào để hiển thị (vd. vừa khởi động server) → trang này, sidebar vẫn còn.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl pt-10">
      <Card title="Không lấy được dữ liệu">
        <p className="text-sm text-muted">
          Web chưa kết nối được Notion và chưa có bản dữ liệu cũ để hiển thị. Có thể Notion đang lỗi, mạng chập chờn,
          hoặc token / quyền Connections của integration có vấn đề.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface"
        >
          Thử lại
        </button>
      </Card>
    </div>
  );
}
