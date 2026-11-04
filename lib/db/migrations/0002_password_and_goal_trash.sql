ALTER TABLE "goals" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
-- Dự án có sẵn của user mặc định (khớp bảng màu lib/fields.ts); quản lý dự án từng người làm ở bước Cài đặt.
INSERT INTO "projects" ("user_id", "name", "sort") VALUES
  ('00000000-0000-4000-8000-000000000001', 'Đồ án', 1),
  ('00000000-0000-4000-8000-000000000001', 'Học AI', 2),
  ('00000000-0000-4000-8000-000000000001', 'Sản phẩm', 3),
  ('00000000-0000-4000-8000-000000000001', 'Thực tập', 4)
ON CONFLICT DO NOTHING;
