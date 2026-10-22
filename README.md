# Brainrot — Second Brain Web

Web cá nhân của Trung: mở ra là biết hôm nay làm 3 việc gì, deadline nào sắp tới, đã học được gì.
Dữ liệu đọc từ Notion (Tasks, Knowledge, Daily Log). Phạm vi và quyết định: [`SPEC.md`](SPEC.md),
[`docs/decisions/`](docs/decisions/), kết quả v0.1: [`docs/plans/completed/v0.1.md`](docs/plans/completed/v0.1.md).
**v0.1 và v0.2 xong 22/10/2026** ([`SPEC-v0.2.md`](SPEC-v0.2.md), [`docs/plans/completed/v0.2.md`](docs/plans/completed/v0.2.md)).

| Trang | Nội dung |
|---|---|
| `/` Brain | Graph 3D kiến thức và dự án (trang chủ từ v0.2; `/brain` cũ tự chuyển về đây) |
| `/today` | Đếm ngược đồ án · 3 việc hôm nay · deadline 14 ngày · kiến thức mới |
| `/tasks` | Task chưa xong theo dự án, lọc, tích "xong" (ghi lên Notion) |
| `/planner` | Kế hoạch tuần (đang tích hợp, v0.2) |

Production: <https://brainrot-blue.vercel.app> (cần mật khẩu).

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · `@notionhq/client` · `react-force-graph-3d` · Vercel.

## Chạy trên máy

Cần Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị (xem bên dưới)
npm run dev                  # http://localhost:3000
```

Kiểm tra trước khi commit:

```bash
npm run lint
npm run build
npm test        # unit test (vitest)
```

## Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `NOTION_TOKEN` | Token của internal integration (bí mật) |
| `NOTION_TASKS_DB` · `NOTION_KNOWLEDGE_DB` · `NOTION_DAILY_DB` · `NOTION_IDEAS_DB` | **Database ID** (không phải data source ID — code tự tra) |
| `NOTION_ROOT_PAGE` | ID trang gốc "Second Brain — Anh Trung" |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_REFRESH_TOKEN` | OAuth client + refresh token chỉ đọc lịch (bí mật). Thiếu → thẻ Next up báo "Chưa kết nối" |
| `GOOGLE_CALENDAR_IDS` | Tùy chọn, các calendar ID cách nhau bởi dấu phẩy; mặc định `primary` |
| `APP_PASSWORD` | Mật khẩu vào web (bí mật) |
| `AUTH_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký cookie (bí mật). Tạo: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `THESIS_DEADLINE` | Hạn nộp đồ án, dạng `YYYY-MM-DD` |

`.env.local` đã nằm trong `.gitignore` — **không bao giờ commit**.

### Kết nối Notion (làm 1 lần)

1. Tạo internal integration tại <https://www.notion.so/my-integrations>, chép token vào `NOTION_TOKEN`.
2. Cấp quyền: mở <https://www.notion.so/profile/integrations> → chọn integration → tab **Access** →
   **Edit access** → tick trang "Second Brain — Anh Trung" (3 database con được thừa hưởng quyền).
   Thiếu bước này Notion báo `object_not_found`.

## Deploy lên Vercel

1. Vào <https://vercel.com/new>, **Import** repo GitHub `trungKoiKa/Brainrot` (Vercel tự nhận Next.js, không cần
   đổi lệnh build).
2. Trước khi bấm Deploy, mở **Environment Variables** và thêm đủ các biến ở bảng trên cho môi trường
   **Production** (dùng `APP_PASSWORD` mạnh, `AUTH_SECRET` mới — đừng dùng lại giá trị ở máy).
3. Bấm **Deploy**. Từ đó mỗi lần push lên `main` Vercel tự deploy lại.
4. Đổi biến môi trường sau này → **Redeploy** để có hiệu lực.

## Khi có lỗi

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Banner "Không lấy được dữ liệu mới từ Notion" | Notion lỗi tạm thời; web đang hiện bản gần nhất và tự thử lại sau ~30 giây |
| Trang "Không lấy được dữ liệu" | Notion lỗi khi server vừa khởi động (chưa có bản cũ), hoặc token sai / thiếu quyền Connections |
| Sửa trong Notion mà web chưa đổi | Cache 5 phút — chờ hoặc tải lại sau 5 phút (tích "xong" trên web thì cập nhật ngay) |
| Dev server báo lỗi lạ sau khi sửa code / cài thư viện | Tắt `npm run dev` rồi chạy lại |
| Notion trả 429 (quá nhiều request) | SDK tự chờ theo `Retry-After` rồi thử lại |

## Cấu trúc

```
app/(app)/        Trang sau đăng nhập: Today, Tasks, Brain, error.tsx
app/login/        Đăng nhập + Server Action
app/actions/      Server Action tích "xong"
proxy.ts          Chặn route khi chưa đăng nhập (Next 16: tên mới của middleware)
lib/notion/       Mọi lời gọi Notion (server-only): client, queries (cache), data (fallback), mutations, graph
lib/              auth, date (giờ VN), today (quy tắc trang Today), fields (màu Lĩnh vực/Dự án)
components/       UI dùng chung, tasks/, brain/
docs/             Harness: decisions, plans, templates
```

Agent (Claude Code, Codex…) đọc [`AGENTS.md`](AGENTS.md) trước khi làm việc.
