# Brainrot — Second Brain Web

Web gom việc, mục tiêu, thói quen và kiến thức về một chỗ, lưu trong Postgres (Neon); mỗi người một tài khoản email + mật khẩu.
Mở ra là biết hôm nay làm gì, tuần này đang ra sao, đang hướng tới mục tiêu nào và đã học được gì.

> Dự án cá nhân của một sinh viên năm 4 (PTIT), viết cùng AI agent. Giao diện tiếng Việt, giờ Việt Nam.

## Tính năng

| Trang | Câu hỏi nó trả lời | Nội dung |
|---|---|---|
| **Dashboard** | Tôi đang làm tốt không? | KPI việc tồn · hoàn thành · tuần này · đếm ngược đồ án; task theo dự án; mục tiêu tháng; sắp đến hạn; nhịp làm & học; thói quen. Chuyển **Thật / Mẫu** để xem với dữ liệu mẫu |
| **Today** | Hôm nay làm gì? | **Hôm nay làm** (theo Ngày làm, việc trễ, hạn hôm nay) · Next up từ Google Calendar · deadline 14 ngày · thói quen hôm nay · Ghi nhanh (ý tưởng, Daily Log, chọn việc ngày mai) |
| **Tasks** | Tôi có những việc gì? | Nơi duy nhất tạo và sửa việc: lọc theo dự án / ưu tiên, Deadline, **Ngày làm**, gắn Goal |
| **Goal** | Tôi đang hướng tới điều gì? | Mục tiêu xếp tầng **Năm → Quý → Tháng → Tuần**, tự xong theo thói quen / task, bảng thói quen tháng, **7 thẻ ngày** của tuần (dời việc sang ngày khác), Nhìn lại 4 câu + châm ngôn năm |

Mô hình nghiệp vụ (từ v0.5): **Tasks là kho việc duy nhất**. Goal gồm Task, Task xếp vào ngày qua cột
**Ngày làm**, thói quen làm Goal tự xong. Lý do và các lựa chọn đã cân nhắc: [`SPEC-v0.5.md`](SPEC-v0.5.md).

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind CSS v4 ·
shadcn/ui + [ReUI](https://reui.io) · Recharts · Drizzle ORM + Neon Postgres · Vitest · Vercel.

## Chạy trên máy

Cần Node.js ≥ 20 và một database Postgres (Neon miễn phí; tạo qua Vercel → Storage → Neon).

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị (xem bên dưới)
npm run db:migrate           # tạo bảng trong database
npm run user:password -- <email> "<tên>"   # tạo tài khoản, script tự hỏi mật khẩu
npm run dev                  # http://localhost:3000
```

Kiểm tra trước khi commit:

```bash
npm run lint
npm run build
npm test        # unit test (vitest)
```

## Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | ✓ | Chuỗi kết nối Postgres (**bí mật**). Trên Vercel do Neon integration tự thêm |
| `AUTH_SECRET` | ✓ | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký cookie (**bí mật**): `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `THESIS_DEADLINE` | | Ngày đích cho thẻ đếm ngược, dạng `YYYY-MM-DD` |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_REFRESH_TOKEN` | | OAuth chỉ đọc lịch cho thẻ Next up (**bí mật**). Thiếu → thẻ báo "chưa kết nối" |
| `GOOGLE_CALENDAR_IDS` | | Các calendar ID cách nhau bởi dấu phẩy; mặc định `primary` |

`.env.local` nằm trong `.gitignore` — **không bao giờ commit**.

## Database

Bảng và cột định nghĩa ở [`lib/db/schema.ts`](lib/db/schema.ts); migration ở `lib/db/migrations/`
(`npm run db:generate` sau khi sửa schema, `npm run db:migrate` để áp). Mọi bảng có `user_id`, xóa user là xóa
sạch dữ liệu của người đó. Xem bảng bằng `npm run db:studio`.

Chi tiết từng phiên bản: [`SPEC.md`](SPEC.md), [`SPEC-v0.2.md`](SPEC-v0.2.md) → [`SPEC-v1.0.md`](SPEC-v1.0.md).

## Deploy lên Vercel

1. <https://vercel.com/new> → **Import** repo này (Vercel tự nhận Next.js).
2. **Storage → Neon** → nối project cho các môi trường cần dùng (không tick "Create Database Branch" nếu muốn
   dùng chung một database). Thêm `AUTH_SECRET` mới cùng các biến tùy chọn ở bảng trên.
3. Áp migration vào database đó (`npm run db:migrate` với `DATABASE_URL` của nó) và tạo tài khoản bằng
   `npm run user:password`.
4. **Deploy**. Từ đó mỗi lần push lên `main` Vercel tự deploy lại; đổi biến môi trường → **Redeploy**.

## Khi có lỗi

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Trang "Không lấy được dữ liệu" | Không đọc được database: sai `DATABASE_URL`, mạng, hoặc Neon đang khởi động lại |
| Đăng nhập báo sai email hoặc mật khẩu | Chưa tạo tài khoản / quên mật khẩu → `npm run user:password -- <email>` đặt lại |
| Lỗi thiếu bảng / cột | Chưa chạy `npm run db:migrate` cho database đó |

## Cấu trúc

```
app/(app)/        Trang sau đăng nhập: Dashboard, Today, Tasks, Goal
app/login/        Đăng nhập
app/actions/      Server Actions (task, thói quen, goal, nhìn lại, ghi nhanh)
proxy.ts          Chặn route khi chưa đăng nhập (Next 16: tên mới của middleware)
lib/db/           Postgres (server-only): schema, migrations, queries, mutations, data; mọi hàm lọc theo userId
lib/              Hàm thuần có test: date (giờ VN), today, period (năm/quý/tháng/tuần), goals, habits, dashboard…
components/       UI: dashboard/, goals/, habits/, tasks/, brain/, reui/ (ReUI), ui/ (shadcn)
docs/             Quyết định kỹ thuật, plan từng phiên bản
```

Cách dùng hằng ngày và luồng dữ liệu: [`docs/huong-dan.md`](docs/huong-dan.md).

Agent (Claude Code, Codex…) đọc [`AGENTS.md`](AGENTS.md) trước khi làm việc.
