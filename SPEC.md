# SPEC — Second Brain Web v0.1

> Tài liệu thiết kế đã chốt (grill session 22/10/2026). Claude Code dùng file này để lập plan và implement.
> Mọi thay đổi phạm vi phải được Trung đồng ý và cập nhật vào file này trước khi code.

## 1. Mục đích

Trung (sinh viên năm 4, đang làm đồ án + thực tập) có quá nhiều việc song song, làm việc này thì rơi việc kia.
v0.1 là **công cụ dùng hằng ngày**: mở ra là biết hôm nay làm 3 việc gì, deadline nào sắp tới, đã học được gì.
Portfolio / hiệu ứng đẹp là mục tiêu phụ (v0.2).

**Tiêu chí thành công thật sự:** Trung mở web ≥ 5 ngày/tuần trong 2 tuần liên tiếp.

## 2. Ràng buộc

| Ràng buộc | Giá trị |
|---|---|
| Người dùng | Chỉ 1 người (Trung) |
| Thời gian của Trung | ≤ 2 giờ/tuần (tạo key, test, góp ý) |
| Mốc v0.1 | Trước 08/11/2026, sau đó **đóng băng** đến khi nộp đồ án 06/12/2026 |
| Chi phí | 0 đồng — chỉ dùng gói miễn phí; **không** dùng Claude API |
| Thiết bị | Ưu tiên máy tính (desktop-first); mobile chỉ cần không vỡ layout |
| Ngôn ngữ UI | Tiếng Việt; giữ tên Today / Tasks / Brain |
| Múi giờ | Asia/Ho_Chi_Minh cho mọi phép tính ngày |

## 3. Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- `@notionhq/client` (SDK chính thức của Notion)
- `react-force-graph-3d` (graph 3D)
- Deploy: Vercel, nối repo GitHub (push → tự deploy)
- **Không có database riêng ở v0.1.** Dữ liệu đọc từ Notion, cache 5 phút (`revalidate = 300` hoặc `unstable_cache`).

## 4. Nguồn dữ liệu: Notion

Trang gốc: **"Second Brain — Anh Trung"** — `4006ff07-1439-81c6-8aef-eb5e50960bf9`

| Database | Database ID | Data source ID |
|---|---|---|
| Tasks | `74befc818e33434d976a6947b7ac39ac` | `ba0e10bf-cef0-4fe6-8526-e365adf729e7` |
| Knowledge | `b4a4b9b5a05a4208bb5bfec895731f24` | `1244cbd3-f498-4c02-89a5-d2ae6c634c42` |
| Daily Log | `f4eaa115e8664617a6075a775c6d6cda` | `ec83f304-d1ae-4b47-ace0-764f8bacafb0` |

Trang con (không phải database): User, Soul, Identity, Projects.

> Lưu ý: tùy phiên bản Notion API, query có thể dùng database ID hoặc data source ID. Claude Code kiểm tra docs/SDK hiện hành và chọn cách đúng; đọc ID từ biến môi trường, không hard-code trong logic.

### Schema

**Tasks**
| Property | Type | Giá trị |
|---|---|---|
| Việc | title | |
| Dự án | select | Đồ án, Học AI, Sản phẩm, Sức khỏe, Thực tập, Khác |
| Trạng thái | status | Chưa làm, Đang làm, Xong |
| Ưu tiên | select | Cao, Vừa, Thấp |
| Deadline | date | |
| Ghi chú | rich_text | |

**Knowledge**
| Property | Type | Giá trị |
|---|---|---|
| Chủ đề | title | |
| Lĩnh vực | select | Computer Vision, AI Agent, Embedded/Edge AI, Đồ án, Kỹ năng sống, Khác |
| Mức hiểu | select | Mới học, Hiểu, Áp dụng được |
| Tóm tắt | rich_text | |
| Nguồn | url | |
| Ngày học | date | |

**Daily Log**
| Property | Type |
|---|---|
| Ngày | title |
| Date | date |
| Xong | rich_text |
| Rơi / chưa xong | rich_text |
| Học được | rich_text |
| Ngày mai 3 việc | rich_text |
| Tập thể dục | checkbox |

### Kết nối (Trung tự làm)
1. Tạo internal integration tại https://www.notion.so/my-integrations → lấy token.
2. Mở trang "Second Brain — Anh Trung" → `...` → Connections → thêm integration đó (các database con được thừa hưởng quyền).
3. Đưa token vào `.env.local` và Vercel Environment Variables. **Không bao giờ commit.**

## 5. Biến môi trường

```
NOTION_TOKEN=
NOTION_TASKS_DB=74befc818e33434d976a6947b7ac39ac
NOTION_KNOWLEDGE_DB=b4a4b9b5a05a4208bb5bfec895731f24
NOTION_DAILY_DB=f4eaa115e8664617a6075a775c6d6cda
NOTION_ROOT_PAGE=4006ff07143981c68aefeb5e50960bf9
APP_PASSWORD=
AUTH_SECRET=            # chuỗi ngẫu nhiên để ký cookie
THESIS_DEADLINE=2026-12-06
```

Có `.env.example` (không chứa giá trị bí mật) trong repo.

## 6. Đăng nhập

- 1 mật khẩu (`APP_PASSWORD`). Trang `/login` nhập mật khẩu.
- Đúng → set cookie httpOnly, secure, ký bằng `AUTH_SECRET`, hạn 30 ngày.
- `proxy.ts` (Next.js 16 đổi tên từ `middleware.ts`, chức năng như cũ) chặn mọi route (trừ `/login` và static assets) nếu thiếu cookie hợp lệ.
- Không có tài khoản, không có database, không có OAuth.

## 7. Các trang

Layout chung: sidebar trái (Today, Tasks, Brain + nút đổi sáng/tối ở góc dưới), nội dung bên phải.

### 7.1 Today (`/`)
Lời chào theo buổi + ngày (tiếng Việt). 4 khối:

1. **Đếm ngược đồ án** — "Còn N ngày đến hạn nộp đồ án (06/12/2026)". Đọc từ `THESIS_DEADLINE`.
2. **3 việc hôm nay** — quy tắc:
   - Nếu Daily Log có bản ghi **hôm qua** và trường "Ngày mai 3 việc" không rỗng → hiển thị nội dung đó (tách dòng). Đây là chữ tự do nên **không có nút tích**; kèm link mở trang Daily Log hôm qua. *(chốt 22/10/2026)*
   - Ngược lại → lấy từ Tasks: `Trạng thái ≠ Xong`, sắp theo Ưu tiên (Cao > Vừa > Thấp) rồi Deadline gần nhất (task không có deadline xếp cuối), lấy 3.
   - Task hiển thị kèm nút tích "xong" (xem 7.2).
3. **Deadline 14 ngày tới** — task chưa Xong có Deadline ≤ hôm nay + 14 ngày, sắp theo deadline. Quá hạn → tô đỏ + "Quá hạn N ngày". Hôm nay → "Hôm nay".
4. **Kiến thức mới** — 5 bản ghi Knowledge mới nhất (theo Ngày học, fallback created_time): Chủ đề, Lĩnh vực (badge màu), Mức hiểu.

Mỗi mục bấm được → mở trang Notion tương ứng (tab mới).

### 7.2 Tasks (`/tasks`)
- Danh sách task chưa Xong, nhóm theo Dự án; có bộ lọc theo Dự án và Ưu tiên.
- Mục "Đã xong" thu gọn ở cuối.
- **Chỉ đọc**, trừ một hành động: **tích "xong"** → Server Action cập nhật `Trạng thái = Xong` trên Notion → cập nhật UI ngay (optimistic) → revalidate cache.
- Lỗi khi ghi → hoàn tác UI + thông báo lỗi.
- Thêm/sửa/xóa task: **ngoài phạm vi**, làm trong Notion.

### 7.3 Brain (`/brain`)
Graph 3D xoay được (`react-force-graph-3d`, chỉ render phía client — dynamic import, `ssr: false`).

**Node**
| Loại | Nguồn | Màu |
|---|---|---|
| Lĩnh vực | các giá trị select "Lĩnh vực" của Knowledge | node lớn, màu theo lĩnh vực |
| Dự án | các giá trị select "Dự án" của Tasks | node lớn |
| Note | mỗi trang Knowledge | màu theo Lĩnh vực |
| Task | mỗi trang Tasks chưa Xong | màu nhạt |

**Link**
- Note → Lĩnh vực của nó
- Task → Dự án của nó
- Trang A → Trang B khi nội dung trang A có **mention** trang B (đọc block children; chỉ quét trang Knowledge ở v0.1 để giới hạn số request)

**Tương tác:** kéo để xoay, cuộn để zoom, hover hiện tên, bấm node trang → mở Notion; bấm node Lĩnh vực/Dự án → focus camera.
Hiển thị "N node · M link" như ảnh tham khảo. Graph ban đầu sẽ thưa — chấp nhận.

## 8. Giao diện

- Tinh thần giống ảnh tham khảo ("Nathan's Brain Console"): sidebar trái, card bo góc, tiêu đề chữ có chân (serif), chữ nội dung sans-serif, khoảng trắng rộng. **Không sao chép y hệt.**
- **Sáng / tối:** mặc định theo hệ điều hành (`prefers-color-scheme`); nút đổi ở góc dưới sidebar; lựa chọn lưu trong `localStorage` (bọc try/catch); không nhấp nháy sai theme khi tải trang.
- Màu định nghĩa bằng CSS variables/token cho cả 2 theme; graph cũng đổi màu nền theo theme.
- Mỗi giá trị "Lĩnh vực" có một màu cố định (CSS variable), dùng chung cho badge ở Today và node ở Brain. *(chốt 22/10/2026)*
  Chỉ 4 màu phân biệt được chắc chắn (đã kiểm bằng validator): CV, AI Agent, Edge AI, Đồ án có màu riêng;
  các lĩnh vực còn lại xám, nhận diện bằng tên cụm + chip. Xem `docs/decisions/0003-field-colors.md`. *(chốt 22/10/2026)*
- Brain: tên cụm (Lĩnh vực/Dự án) hiện cố định trên graph, link cùng màu node nguồn, hàng chip chú thích có số lượng
  (bấm để bay tới cụm), tự zoom vừa khung. Chỉ vẽ cụm có ít nhất 1 trang. Ô tìm kiếm: để v0.2. *(chốt 22/10/2026)*
- Desktop-first (≥ 1280px là chuẩn); dưới 768px sidebar thu thành thanh trên, không cần graph đẹp trên mobile.

## 9. Xử lý lỗi & hiệu năng

- Notion trả 429 → retry có backoff, tôn trọng header `Retry-After`.
- Notion lỗi/không truy cập được → hiển thị dữ liệu cache gần nhất (nếu có) + banner "Không lấy được dữ liệu mới từ Notion".
- Phân trang (pagination) khi query database.
- Giới hạn của Notion API: 180 request/phút (gói thường), payload ≤ 500KB — v0.1 dư sức.

## 10. Ngoài phạm vi v0.1 (để v0.2+)

- Postgres / Neon / Supabase, semantic search, embeddings
- Claude API: morning brief, evening review, "Ask Claude"
- Google Calendar, khối "Next up"
- Routines / cron / logs
- Ideas inbox, Skills
- Thêm/sửa/xóa task trên web
- Obsidian, file trên máy
- Nhiều người dùng

> Brief sáng/tối hiện do scheduled task trong Claude (ngoài web này) đảm nhận.

## 11. Tiêu chí hoàn thành v0.1

1. Web deploy trên Vercel, có mật khẩu bảo vệ.
2. Today hiển thị đủ 4 khối, dữ liệu khớp Notion (độ trễ ≤ 5 phút).
3. Tích "xong" trên web → Notion cập nhật.
4. Graph 3D xoay được; bấm node trang mở đúng trang Notion.
5. Đổi sáng/tối hoạt động và được ghi nhớ.
6. (Tiêu chí thật) Trung dùng ≥ 5 ngày/tuần trong 2 tuần liên tiếp.

## 12. Thứ tự implement đề xuất

1. Khởi tạo project, Tailwind, theme sáng/tối, layout + sidebar
2. Đăng nhập (middleware + /login)
3. Lớp Notion: client, query có cache, map dữ liệu sang kiểu TypeScript
4. Trang Today
5. Trang Tasks + Server Action tích xong
6. Trang Brain (graph)
7. Xử lý lỗi, `.env.example`, README hướng dẫn chạy & deploy
8. Deploy Vercel, Trung test theo mục 11
