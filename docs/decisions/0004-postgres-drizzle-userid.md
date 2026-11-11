# 0004 Dữ liệu ở Postgres (Neon) qua Drizzle; mọi hàm `lib/db/` nhận `userId`; không cache dùng chung

Date: 2026-10-27

## Status

Accepted (Trung duyệt SPEC v1.0 ngày 27/10/2026; lên production 05/11/2026). Thay 0001 và 0002.

## Context

- Bản Notion chỉ phục vụ một người: một token, ID database trong biến môi trường. Muốn nhóm ~20 bạn cùng dùng thì mỗi
  người phải tự dựng Notion đúng cấu trúc, không thực tế.
- Cache dùng chung giữa người dùng là chỗ dễ lộ dữ liệu nhất nếu quên đưa `userId` vào khoá cache.

## Decision

- Dữ liệu lưu ở **Neon Postgres**, truy vấn bằng **Drizzle ORM**; schema ở `lib/db/schema.ts`, migration sinh bằng
  `npm run db:generate` và commit cùng thay đổi.
- Mọi truy vấn nằm trong `lib/db/` (server-only). **Mọi hàm nhận `userId`** lấy từ cookie đã ký, không bao giờ từ form
  hay URL; mọi UPDATE / DELETE theo id kèm điều kiện `user_id`.
- Mọi bảng có `user_id` → `users.id` ON DELETE CASCADE.
- **Không cache dữ liệu người dùng.** Ghi xong gọi `refreshData()` (`lib/db/revalidate.ts`).
- Test truy vấn chạy trên Postgres trong bộ nhớ (PGlite), bắt buộc có test cách ly giữa hai người dùng.

## Consequences

- Mỗi lần mở trang đọc thẳng database; Neon gói free "ngủ" khi không dùng nên lần mở đầu chậm khoảng 1 giây.
- Dev và production đang dùng chung một database: migration chỉ được thêm, không sửa / xoá cột đang dùng.
- Dữ liệu Notion cũ không chuyển sang; code Notion chỉ còn trong lịch sử git.
