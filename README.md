# Brainrot — Second Brain Web

Web cá nhân gom việc, mục tiêu, thói quen và kiến thức về một chỗ, đọc ghi trực tiếp trên **Notion**.
Mở ra là biết hôm nay làm gì, tuần này đang ra sao, đang hướng tới mục tiêu nào và đã học được gì.

> Dự án cá nhân của một sinh viên năm 4 (PTIT), viết cùng AI agent. Giao diện tiếng Việt, giờ Việt Nam.

## Tính năng

| Trang | Câu hỏi nó trả lời | Nội dung |
|---|---|---|
| **Dashboard** | Tôi đang làm tốt không? | KPI việc tồn · hoàn thành · tuần này · đếm ngược đồ án; task theo dự án; mục tiêu tháng; sắp đến hạn; nhịp làm & học; Brain thu nhỏ; thói quen. Chuyển **Thật / Mẫu** để xem với dữ liệu mẫu |
| **Brain** (`/`) | Tôi biết những gì? | Graph 3D kiến thức và dự án, tìm trang, bay tới cụm |
| **Today** | Hôm nay làm gì? | **Hôm nay làm** (theo Ngày làm, việc trễ, hạn hôm nay) · Next up từ Google Calendar · deadline 14 ngày · thói quen hôm nay · Ghi nhanh (ý tưởng, Daily Log, chọn việc ngày mai) |
| **Tasks** | Tôi có những việc gì? | Nơi duy nhất tạo và sửa việc: lọc theo dự án / ưu tiên, Deadline, **Ngày làm**, gắn Goal |
| **Goal** | Tôi đang hướng tới điều gì? | Mục tiêu xếp tầng **Năm → Quý → Tháng → Tuần**, tự xong theo thói quen / task, bảng thói quen tháng, **7 thẻ ngày** của tuần (dời việc sang ngày khác), Nhìn lại 4 câu + châm ngôn năm |

Mô hình nghiệp vụ (từ v0.5): **Notion Tasks là kho việc duy nhất**. Goal gồm Task (relation), Task xếp vào ngày qua cột
**Ngày làm**, thói quen làm Goal tự xong. Lý do và các lựa chọn đã cân nhắc: [`SPEC-v0.5.md`](SPEC-v0.5.md).

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind CSS v4 ·
shadcn/ui + [ReUI](https://reui.io) · Recharts · `react-force-graph-3d` · `@notionhq/client` · Vitest · Vercel.

## Chạy trên máy

Cần Node.js ≥ 20 và một workspace Notion có các database ở mục [Notion](#notion).

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

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `NOTION_TOKEN` | ✓ | Token của Notion internal integration (**bí mật**) |
| `NOTION_TASKS_DB` · `NOTION_KNOWLEDGE_DB` · `NOTION_DAILY_DB` | ✓ | **Database ID** (không phải data source ID — code tự tra) |
| `NOTION_IDEAS_DB` | | Database Ideas cho ô "Ý tưởng" ở Ghi nhanh |
| `NOTION_HABITS_DB` · `NOTION_GOALS_DB` · `NOTION_REFLECTIONS_DB` | | Thói quen · Goal · Nhìn lại. Thiếu → phần đó báo "chưa kết nối", phần còn lại vẫn chạy |
| `NOTION_ROOT_PAGE` | | ID trang gốc chứa các database |
| `APP_PASSWORD` | ✓ | Mật khẩu vào web (**bí mật**) |
| `AUTH_SECRET` | ✓ | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký cookie (**bí mật**): `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `THESIS_DEADLINE` | | Ngày đích cho thẻ đếm ngược, dạng `YYYY-MM-DD` |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_REFRESH_TOKEN` | | OAuth chỉ đọc lịch cho thẻ Next up (**bí mật**). Thiếu → thẻ báo "chưa kết nối" |
| `GOOGLE_CALENDAR_IDS` | | Các calendar ID cách nhau bởi dấu phẩy; mặc định `primary` |

`.env.local` nằm trong `.gitignore` — **không bao giờ commit**.

## Notion

1. Tạo internal integration tại <https://www.notion.so/my-integrations>, chép token vào `NOTION_TOKEN`.
2. Mở trang gốc chứa các database → **⋯ → Connections** → thêm integration (database con thừa hưởng quyền).
   Thiếu bước này Notion báo `object_not_found`.
3. Các database và cột mà code đọc (tên cột phải đúng như dưới):

| Database | Cột |
|---|---|
| **Tasks** | `Việc` (title) · `Dự án` (select) · `Trạng thái` (status: Chưa làm / Đang làm / Xong) · `Ưu tiên` (select: Cao / Vừa / Thấp) · `Deadline` (date) · `Ngày làm` (date) · `Ngày xong` (date) · `Ghi chú` (text) · `Mục tiêu` (relation → Goals) |
| **Knowledge** | `Chủ đề` (title) · `Lĩnh vực` (select) · `Mức hiểu` (select) · `Tóm tắt` (text) · `Nguồn` (url) · `Ngày học` (date) |
| **Daily Log** | `Ngày` (title) · `Date` (date) · `Xong` · `Rơi / chưa xong` · `Học được` (text) · `Tập thể dục` (checkbox) · `Thói quen` (multi-select) |
| **Habits** | `Tên` (title) · `Từ tháng` · `Đến tháng` (date) · `Thứ tự` (number) |
| **Goals** | `Mục tiêu` (title) · `Cấp` (select: Năm / Quý / Tháng / Tuần) · `Kỳ` (date) · `Loại` (select: Ưu tiên / Thường) · `Xong` (checkbox) · `Thói quen` (relation → Habits) · `Ngưỡng %` (number) · `Tasks` (relation → Tasks) |
| **Reflections** | `Kỳ nhìn lại` (title) · `Cấp` (select) · `Kỳ` (date) · `Làm tốt` · `Bài học` · `Biết ơn` · `Tập trung tiếp` · `Châm ngôn` (text) |

Chi tiết từng phiên bản: [`SPEC.md`](SPEC.md), [`SPEC-v0.2.md`](SPEC-v0.2.md) → [`SPEC-v0.5.md`](SPEC-v0.5.md).

## Deploy lên Vercel

1. <https://vercel.com/new> → **Import** repo này (Vercel tự nhận Next.js).
2. Thêm các biến môi trường ở bảng trên cho **Production** (và **Preview** nếu dùng). Dùng `APP_PASSWORD` mạnh và
   `AUTH_SECRET` mới, không dùng lại giá trị ở máy.
3. **Deploy**. Từ đó mỗi lần push lên `main` Vercel tự deploy lại; đổi biến môi trường → **Redeploy**.

## Khi có lỗi

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Banner "Không lấy được dữ liệu mới từ Notion" | Notion lỗi tạm thời; web hiện bản gần nhất và tự thử lại sau ~30 giây |
| Trang "Không lấy được dữ liệu" | Token sai / thiếu quyền Connections, hoặc Notion lỗi khi chưa có bản cache nào |
| Một khối báo "Chưa kết nối database …" | Thiếu biến `NOTION_*_DB` tương ứng (thêm rồi Redeploy) |
| Sửa trong Notion mà web chưa đổi | Cache 5 phút; thao tác trên web thì cập nhật ngay |
| Notion trả 429 | SDK tự chờ theo `Retry-After` rồi thử lại |

## Cấu trúc

```
app/(app)/        Trang sau đăng nhập: Dashboard, Brain, Today, Tasks, Goal
app/login/        Đăng nhập
app/actions/      Server Actions (task, thói quen, goal, nhìn lại, ghi nhanh)
proxy.ts          Chặn route khi chưa đăng nhập (Next 16: tên mới của middleware)
lib/notion/       Mọi lời gọi Notion (server-only): queries (cache + tag), data, mutations, graph
lib/              Hàm thuần có test: date (giờ VN), today, period (năm/quý/tháng/tuần), goals, habits, dashboard…
components/       UI: dashboard/, goals/, habits/, tasks/, brain/, reui/ (ReUI), ui/ (shadcn)
docs/             Quyết định kỹ thuật, plan từng phiên bản
```

Cách dùng hằng ngày và luồng dữ liệu: [`docs/huong-dan.md`](docs/huong-dan.md).

Agent (Claude Code, Codex…) đọc [`AGENTS.md`](AGENTS.md) trước khi làm việc.
