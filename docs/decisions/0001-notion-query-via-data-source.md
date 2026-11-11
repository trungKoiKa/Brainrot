# 0001 Gọi Notion API theo data source, chỉ qua `lib/notion/`

Date: 2026-10-22

## Status

Superseded (05/11/2026) — v1.0 bỏ Notion, dữ liệu ở Postgres. Xem [0004](0004-postgres-drizzle-userid.md).

## Context

- SDK `@notionhq/client` 5.27 mặc định dùng Notion API `2025-09-03`. Từ bản này, query dữ liệu dùng
  **data source ID** (`dataSources.query`), không còn query trực tiếp bằng database ID.
- SPEC mục 5 đặt biến môi trường là **database ID** (`NOTION_TASKS_DB`, …) và yêu cầu không hard-code ID.
- SPEC mục 9 yêu cầu retry khi Notion trả 429, tôn trọng `Retry-After`.
- Web có một hành động ghi duy nhất (tích xong task) nhưng integration có quyền trên cả trang gốc.

## Decision

1. Env giữ database ID. Code tra data source ID bằng `databases.retrieve` → `data_sources[0].id`,
   cache lâu (`cacheLife("days")`) — `dataSourceId()` trong `lib/notion/queries.ts`.
2. Mọi lời gọi Notion nằm trong `lib/notion/` (đánh dấu `server-only`): `client.ts`, `queries.ts`, `mutations.ts`.
3. Retry 429/5xx dùng cơ chế có sẵn của SDK (đã kiểm tra source: đọc header `Retry-After`, không có thì back-off).
4. Đọc property theo **tên tiếng Việt** đúng schema SPEC mục 4; sai kiểu/thiếu → giá trị rỗng, không crash
   (`lib/notion/properties.ts`).
5. Ghi (`markTaskDone`) kiểm tra `page.parent.database_id` khớp `NOTION_TASKS_DB` trước khi `pages.update`.

## Alternatives Considered

1. Đổi env sang data source ID — bỏ được 1 request, nhưng lệch SPEC mục 5 và ID khó tìm trong giao diện Notion.
2. Ép SDK dùng API version cũ để query bằng database ID — chạy được trước mắt nhưng sẽ hỏng khi Notion bỏ bản cũ.
3. Tự viết retry/backoff — trùng chức năng SDK, thêm code phải bảo trì.

## Consequences

Positive:

- Khớp SPEC, không hard-code ID; nâng SDK không phải đổi env.
- Đổi tên property bên Notion chỉ làm thiếu dữ liệu chứ không sập trang.
- Không thể dùng web để ghi nhầm trang ngoài database Tasks.

Tradeoffs:

- Thêm 1 request `databases.retrieve` mỗi database (được cache theo ngày).
- Giả định mỗi database có đúng 1 data source; nếu sau này thêm data source thứ hai sẽ phải chọn theo tên.
- Đổi **tên** property trong Notion → phải sửa code (`queries.ts`).

## Follow-Up

- Nếu Notion báo lỗi `object_not_found`: kiểm tra integration đã được thêm vào Connections của trang gốc chưa
  (gặp ở Bước 3).
