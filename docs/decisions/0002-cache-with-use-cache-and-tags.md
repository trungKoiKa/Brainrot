# 0002 Cache dữ liệu Notion bằng `"use cache"` 5 phút + tag, trang render lúc request

Date: 2026-10-22

## Status

Accepted

## Context

- SPEC mục 3: cache đọc 5 phút; sau khi ghi (tích xong) thì revalidate. SPEC gợi ý `revalidate = 300`
  hoặc `unstable_cache`.
- Next.js 16.4 (`create-next-app`) bật sẵn `cacheComponents`. Ở chế độ này cơ chế khuyến nghị là directive
  `"use cache"` + `cacheLife` + `cacheTag` (docs trong `node_modules/next/dist/docs/`).
- Trang Today/Tasks phụ thuộc **ngày hôm nay** (giờ VN) → không được đóng băng lúc build.
- Không muốn `next build` (trên Vercel hoặc máy khác) phải gọi Notion.

## Decision

1. `getTasks` / `getKnowledge` / `getRecentDailyLogs` dùng `"use cache"`,
   `cacheLife({ stale: 300, revalidate: 300, expire: 7 ngày })` và `cacheTag` (`tasks` / `knowledge` / `daily`).
2. Trang đọc Notion đặt phần dữ liệu trong `<Suspense>` và gọi `await connection()` → render lúc request
   (ngày luôn đúng), dữ liệu vẫn lấy từ cache.
3. Sau khi tích xong, Server Action gọi `updateTag("tasks")` → cache hết hạn ngay, lần render kế tiếp đọc mới
   (read-your-own-writes).

## Alternatives Considered

1. `unstable_cache` / `export const revalidate = 300` như SPEC gợi ý — là API cũ, docs Next 16 khuyên chuyển
   sang `"use cache"` khi bật `cacheComponents`.
2. Tắt `cacheComponents` để dùng mô hình cũ — đi ngược mặc định của framework, khó nâng cấp sau này.
3. Prerender trang lúc build — nhanh hơn nhưng "hôm nay" bị đóng băng và build cần `NOTION_TOKEN`.
4. `revalidateTag` thay vì `updateTag` — người dùng có thể vẫn thấy dữ liệu cũ ngay sau khi tích.

## Consequences

Positive:

- Đúng yêu cầu 5 phút + revalidate sau khi ghi.
- Build không cần Notion; Notion lỗi trong lúc làm mới nền thì bản cache cũ vẫn được giữ.

Tradeoffs:

- Sửa dữ liệu trực tiếp trong Notion phải chờ tối đa ~5 phút mới thấy trên web (đã thấy khi test Bước 4).
- Hàm có `"use cache"` không được đọc `cookies()` / `headers()`; tham số và giá trị trả về phải serialize được.
- Dev server đôi khi giữ module cũ sau khi sửa file (gặp lỗi `greetingVN is not a function`) → khởi động lại.

## Follow-Up

- Bước 7: banner "Không lấy được dữ liệu mới từ Notion" khi Notion lỗi mà vẫn còn cache (SPEC mục 9).
