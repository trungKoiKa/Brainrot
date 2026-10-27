-- User mặc định của giai đoạn A (SPEC-v1.0 mục 4) + dự án "Chung". Id trùng DEFAULT_USER_ID trong lib/db/schema.ts.
INSERT INTO "users" ("id", "name") VALUES ('00000000-0000-4000-8000-000000000001', 'Trung') ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "projects" ("user_id", "name") VALUES ('00000000-0000-4000-8000-000000000001', 'Chung') ON CONFLICT DO NOTHING;
