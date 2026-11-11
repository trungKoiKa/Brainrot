# SPEC — Brainrot (Second Brain Web)

> **Nguồn sự thật duy nhất về phạm vi và hành vi sản phẩm.** Viết lại ngày 11/11/2026 bằng cách gộp `SPEC` v0.1 → v1.0;
> chỗ các bản cũ nói khác nhau thì lấy quyết định mới nhất của Trung. Bản cũ giữ nguyên văn ở `docs/specs/archive/`
> (comment trong code kiểu "SPEC-v0.4 6.3" trỏ tới các file đó).
> Mọi thay đổi phạm vi phải được Trung đồng ý và ghi vào file này trước khi code.
>
> **Trạng thái:** mục 1–9 = **v1.0, đang chạy production**. Mục 10 = **v1.1, Trung duyệt 11/11/2026**, đang làm
> (`docs/plans/active/v1.1.md`).

## 1. Mục đích và ràng buộc

Trung (sinh viên năm 4, làm đồ án và thực tập cùng lúc) có nhiều việc song song, làm việc này thì rơi việc kia.
Brainrot gom việc, mục tiêu, thói quen (và kiến thức, ở v1.1) vào một chỗ: mở ra là biết hôm nay làm gì, tuần này ra
sao, đang hướng tới điều gì.

**Tiêu chí thành công:** Trung mở web ≥ 5 ngày/tuần trong 2 tuần liên tiếp.

| Ràng buộc | Giá trị |
|---|---|
| Người dùng | Trung + nhóm ~20 bạn; mỗi người một tài khoản, dữ liệu riêng |
| Thời gian của Trung | ≤ 2 giờ/tuần (duyệt, test, tự điền secret) |
| Chi phí | 0 đồng: Neon free, Vercel Hobby, không dùng API LLM trả phí |
| Thiết bị | Desktop-first (≥ 1280px là chuẩn); mobile không vỡ layout, vùng bấm ≥ 40px |
| Ngôn ngữ | Giao diện tiếng Việt; giữ tên màn Dashboard / Today / Tasks / Goal |
| Múi giờ | Asia/Ho_Chi_Minh cho mọi phép tính ngày |

**Mô hình nghiệp vụ:** một chuỗi **Goal → Task → Ngày**. Tasks là kho việc duy nhất (nơi duy nhất tạo, sửa, xoá việc);
Goal gồm các Task; Task xếp vào ngày bằng **Ngày làm** (ngày định làm, khác **Deadline** là ngày phải xong); thói quen
làm Goal tự xong.

## 2. Kiến trúc

```
Trình duyệt ──► Next.js trên Vercel (Server Components + Server Actions)
                   ├── proxy.ts: chưa có cookie hợp lệ → /login?next=<trang đang mở>
                   ├── lib/auth.ts, lib/session.ts: cookie phiên HMAC chứa userId
                   └── lib/db/: MỌI truy vấn, luôn lọc theo userId ──► Postgres (Neon)
```

- Stack: Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui + ReUI · Recharts · Drizzle ORM +
  Neon Postgres · Vitest · Vercel.
- Không cache dữ liệu người dùng (cache dùng chung là chỗ dễ lộ dữ liệu nhất). Ghi xong gọi `refreshData()`
  (`lib/db/revalidate.ts`). Giao diện cập nhật lạc quan; lỗi thì trả về như cũ và báo lỗi.
- Một database Neon dùng chung cho dev và production. Migration ở `lib/db/migrations/`.
- Quyết định kỹ thuật lâu dài: `docs/decisions/`.

## 3. Dữ liệu

Mọi bảng có `user_id` → `users.id` **ON DELETE CASCADE**. Ngày lưu kiểu `date` (YYYY-MM-DD, giờ Việt Nam).
Định nghĩa đầy đủ: `lib/db/schema.ts`.

| Bảng | Cột chính |
|---|---|
| `users` | email (duy nhất), name, password_hash (scrypt), target_date, target_label |
| `projects` | name (duy nhất theo user, ≤ 40 ký tự), sort |
| `tasks` | title, project_id?, status (Chưa làm / Đang làm / Xong), priority? (Cao / Vừa / Thấp), deadline?, planned_on?, done_on?, note |
| `goals` | title, level (năm / quý / tháng / tuần), start (ngày đầu kỳ; tuần = thứ Hai), type (Ưu tiên / Thường), done, habit_id?, threshold?, deleted_at (xoá mềm) |
| `goal_tasks` | goal_id, task_id (mỗi việc gắn tối đa một mục tiêu) |
| `habits` | name, from_month, to_month? (trống = còn theo dõi), sort |
| `habit_days` | habit_id, day (lưu theo id nên đổi tên không mất lịch sử) |
| `daily_logs` | day (duy nhất theo user), done, dropped, learned |
| `reflections` | level, start, went_well, lesson, grateful, next_focus, motto (duy nhất theo user + level + start) |
| `ideas` | text, created_at (chỉ ghi, chưa có trang xem) |
| `login_attempts` | email, thời điểm (chống dò mật khẩu) |

Mỗi ô văn bản ≤ 2000 ký tự.

## 4. Đăng nhập và quyền

- **Email + mật khẩu** lưu trong database (Trung chốt 10/11/2026: không làm Google OAuth, không `ALLOWED_EMAILS`).
  Trung tạo tài khoản cho từng bạn bằng `npm run user:password -- <email> "Tên"`; tài khoản mới có sẵn dự án "Chung".
  Không có trang tự đăng ký.
- Cookie phiên `sb_session` = `<userId>.<hạn>.<chữ ký HMAC>`, sống 30 ngày, ký bằng `AUTH_SECRET`.
- Sai mật khẩu **5 lần trong 15 phút** → email đó bị khoá tạm 15 phút; email lạ cũng được ghi nên không lộ email nào có
  tài khoản; lỗi ở bước kiểm tra thì bỏ qua để không khoá cả ứng dụng.
- Mở link khi chưa đăng nhập → đăng nhập xong quay lại đúng trang đó (`next`, chỉ nhận đường dẫn nội bộ).
- **Mọi** hàm `lib/db/` nhận `userId` lấy từ cookie trên server, không bao giờ từ form hay URL; sửa / xoá theo id luôn
  kèm `user_id`. Có test cách ly giữa hai người dùng.

## 5. Các màn

Sidebar: **Dashboard · Today · Tasks · Goal · Cài đặt**; chân sidebar có ngày, đếm ngược, tên người dùng, Đăng xuất,
nút đổi sáng / tối. `/` → `/today`; `/planner` → `/goals?level=week`; `/brain` → `/today` (tới khi làm mục 10).
Màn nào chưa có dữ liệu thì hiện một câu hướng dẫn kèm đường tới chỗ thêm, không hiện bảng trống.

### 5.1 Today — "Hôm nay làm gì?"

- **Ngày làm việc đổi lúc 4:00:** 0:00–3:59 vẫn tính là tối hôm trước cho lời chào, Daily Log, thói quen và "Hôm nay
  làm". Deadline / "quá hạn" ở các màn khác và Ngày xong của việc vẫn đổi lúc 0:00.
- Lời chào theo buổi + tên người dùng; đếm ngược là dòng phụ (chưa đặt hạn thì không hiện).
- **Hôm nay làm** (thẻ tiêu điểm, rộng hết hàng), ghi "x/y việc xong":
  1. việc chưa xong có Ngày làm hôm nay, xếp Cao → Thấp;
  2. việc trễ (Ngày làm đã qua): nhãn "trễ từ …", nút **Làm hôm nay**;
  3. việc có Deadline hôm nay mà chưa xếp hôm nay.
  Tích xong tại chỗ, có Hoàn tác. Luôn có ô **"Thêm việc cho hôm nay…"** (chỉ tên; dự án / ưu tiên / deadline đặt ở
  Tasks). Khi trống nói rõ lý do (chưa có việc / xong hết / đã xếp ngày khác). Cuối thẻ liệt kê mục tiêu tuần Ưu tiên.
- **Hạn · 14 ngày:** việc chưa xong có Deadline ≤ hôm nay + 14 ngày; không lặp việc đã nằm trong "Hôm nay làm".
- **Thói quen · 7 ngày:** lưới 7 ngày gần nhất, bấm ô là lưu.
- **Ghi nhanh ý tưởng** (một ô + Enter) và **Cuối ngày** (Daily Log: Xong · Rơi / chưa xong · Học được; và **Ngày mai
  làm**: tích việc để đặt Ngày làm = ngày mai) là dải viền nét đứt, thu gọn. Từ **18:00** "Cuối ngày" đứng ngay dưới
  "Hôm nay làm" và mở sẵn (Daily Log chỉ mở khi chưa ghi). Daily Log mỗi ngày một bản ghi, bản nháp tự lưu trong
  trình duyệt và khi khôi phục thì phần Daily Log tự mở.

### 5.2 Tasks — "Tôi có những việc gì?"

- Hàng chỉ số: Chưa xong · Quá hạn · Hạn 7 ngày · Xong 7 ngày.
- **Thêm việc:** Tên (bắt buộc) + Dự án + Ưu tiên + Deadline + Ngày làm; form giữ dự án / ưu tiên vừa chọn.
- Việc chưa xong **nhóm theo dự án**; lọc theo Dự án và Ưu tiên, bộ lọc nằm trong URL (`?project=&priority=`).
- **Sửa** bằng nút bút, form mở tại chỗ: Tên, Trạng thái, Dự án, Ưu tiên, Deadline, Ngày làm, Ghi chú, Mục tiêu
  (mục tiêu Tháng / Tuần hiện tại chưa xong, cộng mục tiêu đang gắn). Esc không đóng form khi đã sửa dở.
- **Tích xong** → Ngày xong = hôm nay; mục "Đã xong" thu gọn ở cuối, bỏ tích được (việc về Chưa làm, xoá Ngày xong,
  giữ liên kết mục tiêu).
- **Xoá** bằng thùng rác: xoá ngay (xoá thật), có **Hoàn tác** chèn lại đúng id với đủ trường và liên kết mục tiêu.
  Hoàn tác chỉ còn trong phiên đang mở.
- Nhãn ưu tiên màu trung tính; đỏ chỉ dành cho quá hạn.

### 5.3 Goal — "Tôi đang hướng tới điều gì?"

- Chế độ **Năm / Quý / Tháng / Tuần**, mặc định **Tháng**; ‹ › đổi kỳ, nút "Kỳ này". URL giữ kỳ:
  `/goals?level=month&period=2026-10` (`2026`, `2026-Q4`, `2026-10`, `2026-W44`). Tuần bắt đầu thứ Hai; tuần vắt qua
  hai tháng là một bộ mục tiêu, hiện ở cả hai tháng.
- **Mục tiêu:** thêm nhanh (một dòng + chọn loại), sửa tên bằng nút bút, tích / bỏ tích, xoá (xoá mềm, có Hoàn tác);
  "Gắn thói quen" (+ ngưỡng %, mặc định 80) và "Chuyển loại" nằm trong menu "⋯". Nhóm Ưu tiên trên, Thường dưới; nhóm
  rỗng không hiện. Khuyến nghị ≤ 3 mục tiêu Ưu tiên mỗi kỳ (nhắc nhẹ, không chặn).
- **Bộ đếm:** tổng = mục tiêu có tên; % = xong / tổng, tính trên mục tiêu của chính kỳ đó (không cộng dồn kỳ con).
- **Tự xong** (chỉ tính lúc hiển thị, không ghi vào `done`): đã tích tay; **hoặc** có gắn thói quen và % thói quen
  trong kỳ ≥ ngưỡng; **hoặc** có việc gắn và mọi việc đó đã xong. Có nhãn cho biết lý do và tiến độ.
- **Việc dưới mục tiêu:** "Gắn việc" mở popover có ô tìm (không phân biệt dấu), gắn liên tiếp được; mỗi việc đã gắn là
  dòng việc thật (ô tích, tên mở trang Tasks, Ngày làm hoặc "chưa xếp ngày", nút bỏ gắn có Hoàn tác).
- **Kỳ con:** Năm có biểu đồ 4 quý + 12 tháng và 4 thẻ quý; Quý có 3 thẻ tháng; Tháng có biểu đồ các tuần. Biểu đồ chỉ
  hiện khi từ hai kỳ con có mục tiêu. Thẻ quý ở Năm: % chỉ tính mục tiêu của quý, kèm dòng phụ "+N mục tiêu ở các tháng".
- **Tháng — bảng thói quen × ngày:** ô tích cho hôm nay và ngày đã qua; % mỗi thói quen = ngày đã tích / ngày đã qua;
  quản lý thói quen tại chỗ: thêm, đổi thứ tự, **Ngừng theo dõi** từ tháng sau (giữ lịch sử), **Xoá hẳn** (xoá cả
  ngày đã tích, gỡ liên kết mục tiêu, có Hoàn tác).
- **Tuần — 7 thẻ ngày** đứng trước mục tiêu: mỗi thẻ gồm việc có Ngày làm ngày đó, việc xong ngày đó, việc có Deadline
  ngày đó (nhãn "hạn"), ghi chú Daily Log; % ngày = việc xong / tổng. **Dời sang…** chỉ cho chọn từ hôm nay trở đi,
  có "Bỏ lịch" và Hoàn tác. Khay **Chưa xếp ngày** cho việc đã gắn mục tiêu tuần mà chưa có Ngày làm. Dải **Tập trung
  tuần này** liệt kê mục tiêu Ưu tiên dạng chip "mục tiêu · xong/tổng việc".
- **Chuyển kỳ:** "Chuyển N mục tiêu chưa xong sang <kỳ sau>" tạo bản sao (giữ loại, bỏ qua tên đã có), có Hoàn tác.
- **Nhìn lại:** 4 câu mỗi kỳ (làm tốt · bài học · biết ơn · ba mục tiêu cần tập trung kỳ tới), một bản ghi mỗi kỳ, bản
  nháp tự lưu; lưu xong chuyển sang chế độ đọc. Câu 4 của kỳ trước hiện ở đầu kỳ sau, mỗi dòng có "Thêm làm mục tiêu".
  **Châm ngôn năm** nhập ở Năm, hiện ở đầu Goal và dưới tiêu đề Dashboard.
- Màu trạng thái: % ngày / kỳ **trung tính cho tới khi ngày / kỳ kết thúc**; sau đó ≥ 70% xanh, dưới 70% viền trung tính.

### 5.4 Dashboard — "Tôi đang làm tốt không?"

Chỉ đọc. Bộ chọn kỳ **7 / 30 / 90 ngày** (mặc định 30) và công tắc **Thật / Mẫu** (mặc định Thật), nhớ trong
`localStorage`.

- **Thẻ "Tuần này"** (tiêu điểm): một câu kết luận xét 3 tín hiệu, mỗi cái chấm ổn / cần để ý / chậm theo ngưỡng 70% /
  40%: việc theo lịch tuần này, thói quen, ghi log (thói quen và ghi log tính từ thứ Hai tới hôm nay, chỉ ngày đã qua).
  Có việc quá hạn thì nói quá hạn trước; còn lại nói tín hiệu yếu nhất, kèm **một link sửa**. Mẫu dưới 3 ngày không
  bao giờ đỏ; thứ Hai – thứ Ba kết luận không tô màu.
- **4 KPI trong một khung:** Việc tồn · Hoàn thành · Việc theo lịch tuần này · Đếm ngược (đọc hạn từ Cài đặt). Chấm
  trung tính và số mờ khi chưa đủ dữ liệu để phán xét; thay đổi dưới 5% không tô màu.
- **Khối:** Việc theo dự án (bấm cột → Tasks lọc theo dự án; chỉ một nhóm thì hiện một dòng chữ) · Mục tiêu tháng này ·
  Sắp đến hạn (quá hạn hoặc hạn ≤ 14 ngày) · Nhịp làm (việc xong 12 tuần) · Nhịp hằng ngày (từ Daily Log) · Thói quen.
- **Thật là thật:** chế độ Thật không lấp bằng dữ liệu mẫu; khối chưa có dữ liệu gom vào khung "Chưa có dữ liệu" cuối
  trang, mỗi khối một dòng + link. Chế độ Mẫu (`lib/dashboard/sample.ts`, cố định theo ngày) có một dải thông báo đầu
  trang kèm nút "Về dữ liệu thật".

### 5.5 Cài đặt

Tên hiển thị · hạn + tên hạn cho thẻ đếm ngược (trống thì ẩn thẻ) · **Dự án** (thêm, đổi tên, xoá khi không còn việc)
· đổi mật khẩu · **Xoá tài khoản** (gõ lại email + mật khẩu; xoá toàn bộ dữ liệu, không hoàn tác).

## 6. Quy tắc chung

- **Hoàn tác:** mọi thao tác xoá / dời / tích xong / bỏ gắn hiện toast có nút Hoàn tác **8 giây**, dừng đếm khi rê
  chuột hoặc có focus bàn phím (`sonner`, `useAutoDismiss`).
- **Giao diện** theo `DESIGN.md` (hướng "Nhật ký kỹ thuật"): dùng component trong `components/ui/`, `components/reui/`,
  khung `components/card.tsx`, nhãn `components/pill.tsx`; màu qua CSS variables cho cả hai theme.
- **Màu dự án:** 4 màu đầu theo thứ tự dự án của từng người, còn lại xám (`docs/decisions/0003-field-colors.md`).
- **Theme:** mặc định theo hệ điều hành, nhớ lựa chọn, không nhấp nháy khi tải.
- **Tiếp cận:** vòng focus rõ, tương phản đạt AA, tôn trọng `prefers-reduced-motion`, không tràn ngang ở 320–768px.
- **Lỗi đọc database:** trang vẫn hiện kèm banner "Không lấy được dữ liệu".

## 7. Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | ✓ | Chuỗi kết nối Neon (bí mật) |
| `AUTH_SECRET` | ✓ | ≥ 32 ký tự, ký cookie (bí mật) |
| `THESIS_DEADLINE` | | Hạn mặc định cho người dùng đầu tiên khi chưa đặt hạn ở Cài đặt |

`GOOGLE_*` hiện không trang nào đọc; số phận của chúng nằm ở mục 10.3. `NOTION_*` và `APP_PASSWORD` đã bỏ.

## 8. Kiểm thử và bằng chứng hoàn thành

- `npm run lint`, `npm test` (vitest; truy vấn chạy trên PGlite, có test cách ly giữa hai người dùng), `npm run build`.
- Mọi thay đổi giao diện: ảnh thật 1440×900 ở cả hai theme trên tài khoản demo (`npm run demo:seed`).
- Trung test tay theo danh sách cuối mỗi bước.

## 9. Ngoài phạm vi

Chia sẻ / việc nhóm giữa các tài khoản · thông báo, nhắc nhở · app điện thoại · thu phí · đa ngôn ngữ · nhập dữ liệu
từ Notion · trang tự đăng ký · đăng nhập Google · việc lặp lại · kéo thả việc giữa các ngày, khối giờ trong ngày ·
kéo thả sắp xếp mục tiêu, mục tiêu dạng số đo · export báo cáo, khoảng ngày tuỳ ý ở Dashboard · LLM (chờ ngân sách).

## 10. v1.1 — Knowledge, Brain, Calendar (Trung duyệt 11/11/2026)

> Chưa có trên production. Khi một phần làm xong thì chuyển mô tả của nó lên mục 3, 5, 7 và xoá khỏi đây.

### 10.1 Knowledge (`/knowledge`)

- Bảng `knowledge`: title, field_id?, level (Mới học / Hiểu / Áp dụng được), summary (≤ 2000 ký tự), source_url?,
  learned_on (mặc định hôm nay). Bảng `fields` (Lĩnh vực, riêng từng người, như `projects`). Bảng `knowledge_links`
  (from_id, to_id) cho "liên quan tới".
- Trang: thêm nhanh (Tên + Lĩnh vực + Mức hiểu), sửa tại chỗ (thêm Tóm tắt, Nguồn, Ngày học, **Liên quan tới**: chọn
  ghi chú khác bằng ô tìm không dấu), xoá có Hoàn tác, lọc theo Lĩnh vực và Mức hiểu (trong URL).
- Cài đặt thêm khối **Lĩnh vực** (thêm, đổi tên, xoá khi không còn ghi chú), cùng mẫu với Dự án.
- Today có lại khối **Kiến thức mới** (5 ghi chú mới nhất). Dashboard: "Nhịp làm" thành "Nhịp làm & học" (thêm đường
  ghi chú mới mỗi tuần). Chế độ Mẫu có dữ liệu ghi chú mẫu.

### 10.2 Brain (`/brain`)

- Mở lại graph 3D (dynamic import, `ssr: false`, chỉ tải ở trang này); thêm mục **Brain** vào sidebar.
- Node: Lĩnh vực, Dự án (có việc chưa xong), ghi chú, việc chưa xong. Link: ghi chú → lĩnh vực, việc → dự án, ghi chú ↔
  ghi chú ("liên quan tới"). Màu lĩnh vực theo quy tắc 4 màu + xám như dự án.
- Tương tác như bản cũ: xoay, zoom, tìm không dấu (phím `/`), bấm cụm để bay tới. Bấm node ghi chú mở `/knowledge`, bấm
  node việc mở `/tasks`.

### 10.3 Calendar — thẻ Next up trên Today

- Mỗi người tự nối ở Cài đặt: nút **Nối Google Calendar** → Google OAuth quyền chỉ đọc `calendar.readonly` → lưu refresh
  token **mã hoá AES-GCM** (khoá suy ra từ `AUTH_SECRET`) trong bảng `google_tokens`; nút **Ngắt kết nối** xoá token.
- Thẻ **Next up**: sự kiện còn lại hôm nay (tối đa 5; giờ, tên, địa điểm hoặc link họp; "Đang diễn ra"); hết thì hiện
  sự kiện sớm nhất ngày mai. Bỏ sự kiện đã huỷ hoặc đã từ chối. Chưa nối thì không hiện thẻ. Google lỗi thì thẻ báo
  lỗi, các thẻ khác vẫn chạy.
- Biến môi trường: giữ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; bỏ `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_IDS`.
- Trung tự làm trên Google Cloud Console: thêm redirect URI, để app "In production". App chưa được Google xác minh nên
  người nối sẽ thấy màn cảnh báo và giới hạn 100 người.
- **Đường lui:** nếu không ổn định kịp trong tuần thì bỏ mục 10.3 khỏi bản cuối và ghi vào mục 9.

### 10.4 Tiêu chí hoàn thành v1.1

1. Thêm ghi chú có liên kết → thấy trên Brain; hai tài khoản không thấy ghi chú của nhau (test cách ly).
2. Brain chạy ở cả hai theme, không làm nặng các trang khác.
3. (Nếu làm 10.3) nối và ngắt Calendar được; token trong database là bản mã hoá; không in token ra log.
4. Lint, test, build sạch; ảnh hai theme; README, hướng dẫn, PRODUCT khớp sản phẩm.

### 10.5 Đã chốt (11/11/2026)

1. **Liên kết giữa ghi chú:** chọn tay ở ô "Liên quan tới" (không dùng cú pháp `[[tên]]`).
2. **Lĩnh vực:** danh sách riêng từng người ở Cài đặt (không gõ tự do).
3. **Calendar:** làm theo 10.3, có đường lui (không ổn định kịp thì bỏ khỏi bản cuối).
4. **"Đã xong" ở Tasks:** giữ như hiện nay, tải hết (không giới hạn 30 ngày).
5. **Tên menu:** giữ Dashboard / Today / Tasks / Goal (chưa có yêu cầu Việt hoá).

## 11. Nhật ký quyết định

| Ngày | Quyết định | Chi tiết ở |
|---|---|---|
| 22/10/2026 | v0.1: Today / Tasks / Brain đọc Notion. v0.2: Planner, Ghi nhanh, sửa task, tìm trên Brain, Next up | `archive/SPEC-v0.1.md`, `SPEC-v0.2.md` |
| 26/10/2026 | v0.3 Dashboard · v0.4 Mục tiêu, Thói quen, Nhìn lại · v0.5 một kho việc, bỏ Planner, thêm Ngày làm | `archive/SPEC-v0.3.md` – `SPEC-v0.5.md` |
| 27/10/2026 | v1.0: Postgres thay Notion, nhiều người dùng, không chuyển dữ liệu Notion cũ, làm 2 đợt | `archive/SPEC-v1.0.md` |
| 05/11/2026 | Lên production; đăng nhập email + mật khẩu; xoá task trên web | như trên |
| 06–10/11/2026 | Các đợt critique Today, Tasks, Goal, Dashboard (bố cục, hoàn tác 8 giây, ngày đổi lúc 4:00, "Thật là thật") | như trên, phần ghi chú đầu file |
| 10/11/2026 | Bước 5: giữ email + mật khẩu (bỏ Google), Cài đặt, dự án riêng, chống dò mật khẩu, xoá tài khoản | như trên |
| 10/11/2026 | Redesign "Nhật ký kỹ thuật"; xoá task có Hoàn tác (thay "xoá hẳn, không hoàn tác") | `DESIGN.md`, `docs/audits/2026-11-audit.md` |
| 11/11/2026 | Xoá hẳn thói quen có Hoàn tác; thẻ quý có dòng "+N mục tiêu ở các tháng"; bộ lọc Tasks trong URL | file này |
| 11/11/2026 | Duyệt v1.1: liên kết ghi chú chọn tay, Lĩnh vực ở Cài đặt, làm Calendar có đường lui, "Đã xong" tải hết | mục 10.5 |
| 11/11/2026 | Gộp SPEC thành một file; Trung muốn hoàn thành cả v1.1 trong tuần 11–18/11 | file này, `docs/plans/active/v1.1.md` |
