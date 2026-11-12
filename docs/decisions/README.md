# Decisions

Decision records preserve lasting product, architecture, data ownership,
security, compatibility, and validation choices that future work must inherit.

Use `docs/templates/decision.md`. Task-local implementation choices remain in
the active execution plan and do not require a separate decision.

An installed consumer begins with no fabricated decisions. Add local decision
documents here as real choices are accepted, then index them in this file.

## Index

- [0001](0001-notion-query-via-data-source.md): *(Superseded bởi 0004)* Gọi Notion API theo data source, chỉ qua `lib/notion/`.
- [0002](0002-cache-with-use-cache-and-tags.md): *(Superseded bởi 0004)* Cache Notion bằng `"use cache"` 5 phút + tag; trang render lúc request.
- [0003](0003-field-colors.md): Màu Lĩnh vực: 4 slot đã kiểm định + xám trung tính; gán theo thứ tự của từng người ở `lib/topic-colors.ts`.
- [0004](0004-postgres-drizzle-userid.md): Postgres (Neon) + Drizzle; mọi hàm `lib/db/` nhận `userId`; không cache dùng chung.
- [0005](0005-email-password-auth.md): Đăng nhập email + mật khẩu tự viết, cookie HMAC, khoá tạm khi dò mật khẩu.
