# 0005 Đăng nhập email + mật khẩu tự viết, cookie HMAC; không dùng thư viện auth, không Google OAuth

Date: 2026-11-10

## Status

Accepted (Trung chốt 05/11/2026 để dùng một mình; chốt lại 10/11/2026 khi mở cho bạn bè: giữ nguyên, không làm Google).

## Context

- SPEC v1.0 ban đầu định đăng nhập Google + danh sách `ALLOWED_EMAILS`. Khi mở cho nhóm ~20 bạn, Trung chọn cách ít việc
  cấu hình hơn: tự tạo tài khoản cho từng bạn.
- Dự án ưu tiên ít dependency và chi phí 0 đồng.

## Decision

- Mật khẩu băm **scrypt** lưu ở `users.password_hash` (`lib/password.ts`). Không có trang tự đăng ký: Trung tạo / đặt lại
  bằng `npm run user:password -- <email> "Tên"` và tự gõ mật khẩu.
- Phiên là cookie `sb_session` = `<userId>.<hạn>.<chữ ký HMAC-SHA256>`, 30 ngày, ký bằng `AUTH_SECRET` (`lib/auth.ts`);
  `proxy.ts` chặn route khi chưa có cookie hợp lệ.
- **Chống dò mật khẩu:** sai 5 lần trong 15 phút thì email đó bị khoá tạm 15 phút (bảng `login_attempts`,
  `lib/db/login-throttle.ts`); email lạ cũng được ghi; lỗi ở bước kiểm tra thì bỏ qua để không khoá cả ứng dụng.
- Tham số `next` sau đăng nhập chỉ nhận đường dẫn nội bộ (`lib/next-path.ts`).

## Consequences

- Quên mật khẩu phải nhờ Trung đặt lại; không có email khôi phục.
- Nếu sau này cần Google (ví dụ Calendar từng người ở `SPEC.md` mục 10.3) thì đó là luồng nối dịch vụ riêng, không thay
  cách đăng nhập này.
