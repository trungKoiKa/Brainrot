# SPEC — Second Brain Web v1.0: Nhiều người dùng (bỏ Notion)

> Thay nền dữ liệu của `SPEC.md` → `SPEC-v0.5.md`. Hành vi các màn (Today, Tasks, Goal, Dashboard) **giữ nguyên** như
> v0.5; chỉ đổi nơi lưu dữ liệu và cách đăng nhập. Mục nào không nhắc ở đây thì giữ nguyên.
>
> **Trạng thái:** Trung **duyệt 27/10/2026** theo các phương án đề xuất ở mục 11. Tiến độ: `docs/plans/active/v1.0.md`. Trung đã chốt: người dùng là **Trung + nhóm ~20 bạn**,
> **bỏ Notion**, **không chuyển dữ liệu Notion cũ**, làm **2 đợt**; trong đợt 1 làm **database + backend trước**,
> **đăng nhập Google và phân quyền sau** (27/10/2026).
>
> **Cập nhật 05/11/2026 (Trung chốt):** để dùng một mình trước, đăng nhập tạm là **email + mật khẩu lưu trong database**
> (`users.password_hash`, scrypt; đặt bằng `npm run user:password`), thay cho `APP_PASSWORD`. Đăng nhập Google,
> `ALLOWED_EMAILS` và trang Cài đặt (bước 5) làm khi mở cho bạn bè. v1.0 lên production 05/11/2026, tag `v1.0.0`.
>
> **Bố cục Today (Trung chốt 06/11/2026, sau critique Impeccable):** "Hôm nay làm" đứng đầu, rộng hết hàng; đếm ngược đồ
> án chuyển thành dòng phụ dưới lời chào (chưa đặt hạn thì không hiện); hàng 2 là Deadline 14 ngày tới + Thói quen hôm nay;
> rồi "Ghi nhanh" (ý tưởng) và "Cuối ngày" (Daily Log + Ngày mai làm). Cụm Cuối ngày thu gọn, **từ 18:00** mới mở sẵn
> (Daily Log chỉ mở khi chưa ghi). Next up và Kiến thức mới gỡ khỏi Today đúng mục 3.
>
> **Today, đợt 2 (Trung chốt 06/11/2026, critique lần 2):** buổi tối (18:00–3:59) "Cuối ngày" đứng ngay dưới "Hôm nay làm".
> **Today đổi ngày lúc 4:00:** 0:00–3:59 vẫn là tối hôm trước cho lời chào, ngày ở dòng phụ, Daily Log, thói quen và việc
> trong "Hôm nay làm"; deadline/"quá hạn" ở các màn khác và ngày xong của task vẫn đổi lúc 0:00. "Hôm nay làm" ghi "x/y việc
> xong" (việc có Ngày làm hôm nay); khi trống nói rõ lý do (chưa có việc / xong hết / đã xếp ngày khác) kèm link sang Tasks.
> Tiêu đề thẻ là heading cấp 2; trên Today, chân sidebar không lặp ngày và đếm ngược.
>
> **Xóa task (Trung chốt 05/11/2026):** mỗi dòng task (Tasks, cả việc chưa xong lẫn Đã xong) có icon thùng rác; bấm → hỏi
> xác nhận ngay tại dòng → **xóa hẳn** (không hoàn tác), liên kết với mục tiêu mất theo. Trước đây xóa trong Notion.

## 1. Vấn đề

Bản hiện tại là web **một người**: một `APP_PASSWORD` chung, một `NOTION_TOKEN`, ID database đặt trong biến môi trường.
Ai đăng nhập cũng thấy dữ liệu của Trung. Muốn bạn bè cùng dùng thì mỗi người phải tự dựng Notion đúng 6 database, đúng
tên cột — không thực tế.

## 2. Mục tiêu

- Mỗi người **đăng nhập bằng Google**, có **dữ liệu riêng**, không ai thấy dữ liệu người khác.
- Dữ liệu lưu ở **Postgres** của app (thay Notion). Không cần backend riêng: Server Actions của Next.js trên Vercel là backend.
- Chỉ người trong danh sách được vào (nhóm ~20 người).
- **Chi phí 0 đồng** (Neon free, Vercel Hobby — dùng phi thương mại, không thu tiền).

## 3. Hai đợt

| Đợt | Phiên bản | Gồm | Kết quả |
|---|---|---|---|
| **1** | **v1.0** | Đăng nhập Google, database, Tasks, Today, Goal (mục tiêu · thói quen · nhìn lại · 7 thẻ ngày), Ghi nhanh (ý tưởng, Daily Log, ngày mai làm), Dashboard, Cài đặt | Bạn bè dùng được phần **quản lý việc** |
| **2** | v1.1 (SPEC riêng, có thể sau 06/12) | Knowledge + ô soạn nội dung, Brain 3D, Calendar Google **từng người** | Đầy đủ như bản Notion |

Đợt 1: Brain, Knowledge, thẻ Next up (Calendar) và các khối Dashboard dựa vào Knowledge **ẩn đi** (không hiện "chưa kết nối").

## 4. Kiến trúc

```
Trình duyệt ──► Next.js trên Vercel (Server Components + Server Actions)
                   ├── proxy.ts: chưa có cookie hợp lệ → /login
                   ├── lib/auth/: Google OAuth, cookie phiên chứa userId
                   └── lib/db/: MỌI truy vấn, luôn lọc theo userId ──► Postgres (Neon)
```

- **Database:** Neon Postgres (gói free, tạo qua Vercel Marketplace hoặc neon.tech).
- **ORM:** Drizzle (định nghĩa bảng bằng TypeScript, sinh migration, truy vấn có kiểu) — xem câu 11.3.
- **Đăng nhập:** Google OAuth chỉ xin quyền cơ bản `openid email profile` → **không cần Google duyệt app**. Xem câu 11.2.
- **Phiên:** giữ cookie HMAC hiện có (`lib/auth.ts`), thêm `userId` vào token: `<userId>.<hạn>.<chữ ký>`, sống 30 ngày.
- **Trước khi có đăng nhập Google** (bước 1–4 mục 10): vẫn vào bằng `APP_PASSWORD` như bây giờ; mọi dữ liệu thuộc về
  **một user mặc định** (Trung) tạo sẵn khi migration. Bảng và hàm `lib/db/` **đã có `userId` ngay từ đầu**, nên bước
  đăng nhập chỉ thay chỗ lấy `userId` (từ user mặc định → từ cookie), không phải sửa lại truy vấn.
- **Cache:** **bỏ** `"use cache"` cho dữ liệu người dùng. Postgres đủ nhanh (vài chục ms); cache dùng chung giữa người
  dùng là chỗ dễ lộ dữ liệu nhất nếu quên đưa `userId` vào khóa cache. Sau khi ghi: `router.refresh()`/`revalidatePath`.

## 5. Dữ liệu (bảng Postgres)

Mọi bảng có `user_id` → `users.id` **ON DELETE CASCADE** (xóa tài khoản là xóa sạch dữ liệu).
Ngày lưu kiểu `date` (YYYY-MM-DD, giờ Việt Nam) như hiện tại.

| Bảng | Cột chính | Thay cho (Notion) |
|---|---|---|
| `users` | id, google_sub (duy nhất), email, name, avatar_url, target_date, target_label, created_at | `APP_PASSWORD`, `THESIS_DEADLINE` |
| `projects` | id, user_id, name, color, sort | Select "Dự án" |
| `tasks` | id, user_id, title, project_id?, status, priority?, deadline?, planned_on?, done_on?, note, created_at | Tasks |
| `goals` | id, user_id, title, level (năm/quý/tháng/tuần), start, type, done, habit_id?, threshold? | Goals |
| `goal_tasks` | goal_id, task_id | Relation Goals ↔ Tasks |
| `habits` | id, user_id, name, from_month, to_month?, sort | Habits |
| `habit_days` | habit_id, day | Multi-select "Thói quen" của Daily Log |
| `daily_logs` | user_id, day (duy nhất theo user), done, dropped, learned, exercised | Daily Log |
| `reflections` | id, user_id, level, start, went_well, lesson, grateful, next_focus, motto (duy nhất theo user+level+start) | Reflections |
| `ideas` | id, user_id, text, created_at | Ideas |

Đợt 2 thêm `knowledge` và `google_tokens` (refresh token Calendar, **mã hóa** AES-GCM).

Khác Notion:
- `habit_days` lưu theo **id thói quen** thay vì tên → đổi tên thói quen không mất lịch sử.
- Link "mở trong Notion" (`url`) bỏ; bấm tên task → mở form sửa trong app.

## 6. Đăng nhập & quyền

- `/login`: một nút **"Đăng nhập bằng Google"**. Luồng: Google → `/auth/callback` → kiểm tra `state` (chống giả mạo)
  → lấy email, `sub` → **kiểm tra danh sách cho phép** → tạo user nếu lần đầu → đặt cookie → `/today`.
- Email không có trong danh sách → trang "Bạn chưa được mời", không tạo user.
- Danh sách cho phép: biến môi trường `ALLOWED_EMAILS` (email cách nhau dấu phẩy), Trung sửa trên Vercel — xem câu 11.1.
- **Mọi** hàm trong `lib/db/` nhận `userId` làm tham số đầu, lấy từ cookie trên server — **không bao giờ** từ form/URL.
  Sửa/xóa theo id luôn kèm `WHERE user_id = ?` (không sửa được bản ghi của người khác dù đoán được id).
- Lần đầu đăng nhập: tạo sẵn 1 dự án "Chung" để form Tasks dùng được ngay.

## 7. Thay đổi theo màn

- **Sidebar:** Dashboard · Today · Tasks · Goal · **Cài đặt**. Brain ẩn ở đợt 1; `/` chuyển sang `/today` (câu 11.4).
  Góc dưới sidebar: ảnh + tên Google, nút **Đăng xuất**.
- **Cài đặt** (mới): danh sách dự án (thêm/đổi tên/đổi màu/xóa khi không còn task), ngày đích + nhãn cho thẻ đếm ngược
  (trống → ẩn thẻ), **Xóa tài khoản** (gõ lại email để xác nhận).
- **Today, Tasks, Goal, Ghi nhanh:** giữ nguyên hành vi v0.5, chỉ đổi nguồn dữ liệu. Ô "Ý tưởng" ghi vào bảng `ideas`.
- **Dashboard:** giữ KPI và thẻ về việc, mục tiêu, thói quen; **ẩn** Brain thu nhỏ và phần "học" (Knowledge) ở đợt 1.
  *Trung chốt 07/11/2026 (critique Dashboard):* đầu trang là thẻ tiêu điểm **"Tuần này"** — một câu kết luận (quá hạn
  trước, rồi % việc đã xếp lịch xong, chưa xếp lịch thì số việc xong) + các số đi kèm; 4 KPI gộp thành **một khung**
  bên dưới; chế độ Thật không lấp bằng dữ liệu mẫu (sửa SPEC-v0.3 mục 5); "Nhịp làm & học" → "Nhịp làm" (chỉ việc xong).
  *Cập nhật 07/11/2026 (critique lần 2, Trung chốt):* câu kết luận xét **3 tín hiệu**, mỗi cái chấm ổn / cần để ý / chậm
  theo ngưỡng 70% / 40%: **việc theo lịch** tuần này (chỉ khi đã xếp lịch), **thói quen** 7 ngày (khi có thói quen),
  **ghi log** x/7 ngày gần nhất (khi đã từng ghi Daily Log). Có việc quá hạn → nói quá hạn trước; còn lại câu nói
  **tín hiệu yếu nhất** (vd "Tuần này đang chậm: mới ghi log 1/7 ngày (việc vẫn ổn)"). Không đo được gì thì không tô màu.
  Câu kết luận là chữ to nhất thẻ; biểu đồ quá ít dữ liệu thu thành một dòng tóm tắt.
  *Cập nhật 07/11/2026 (critique lần 3, Trung chốt):* thói quen và ghi log tính **từ thứ Hai tới hôm nay** (mẫu số = số
  ngày đã qua trong tuần), khớp nhãn "Tuần này · từ dd/mm"; câu kết luận không lặp chữ "Tuần này". Dưới câu kết luận có
  **một link sửa** theo tín hiệu yếu nhất (quá hạn → Tasks, ghi log / việc theo lịch → Today, thói quen → Goal). Khối không
  có dữ liệu gom vào một khung "Chưa có dữ liệu" cuối trang (mỗi khối một dòng + link); khối có dữ liệu xếp lưới dày
  không hở. Mỗi số liệu có chấm trạng thái; sparkline màu trung tính; chế độ Mẫu dùng **một** dải thông báo đầu trang
  (thay nhãn "Mẫu" trên từng khung) kèm nút "Về dữ liệu thật". Thay đổi dưới 5% không tô màu.
  Thẻ đếm ngược đọc ngày đích từ Cài đặt. Chế độ **Mẫu** giữ nguyên.
- **Người mới (dữ liệu trống):** mỗi màn có câu hướng dẫn ngắn thay vì bảng trống (ví dụ Today: "Chưa có việc nào —
  tạo việc đầu tiên ở Tasks").

## 8. Biến môi trường

| Biến | Đợt 1 |
|---|---|
| `DATABASE_URL` | **Mới** — chuỗi kết nối Neon (bí mật) |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Dùng lại OAuth client hiện có, thêm redirect URI `/auth/callback` |
| `ALLOWED_EMAILS` | **Mới** |
| `AUTH_SECRET` | Giữ |
| `APP_PASSWORD`, `NOTION_*`, `THESIS_DEADLINE`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_IDS` | **Bỏ** sau khi chuyển xong |

Trung tự tạo Neon, tự điền biến trên Vercel và Google Cloud Console; agent hướng dẫn từng bước.

## 9. Cách chuyển an toàn

- Làm trên nhánh dài **`v1`**; mỗi bước 1 PR vào `v1`. Vercel tạo bản preview cố định cho nhánh `v1` để Trung test.
- Production (bản Notion) **chạy bình thường** tới khi đợt 1 xong → merge `v1` vào `main` → mời bạn bè.
- Dữ liệu Notion của Trung **để nguyên** trong Notion (không xóa, không đọc nữa). Code Notion còn trong lịch sử git.
- Hai database Neon: một cho preview/dev, một cho production (Neon cho tạo branch database miễn phí).

## 10. Kiểm thử, thứ tự làm, tiêu chí

**Test (vitest):** test truy vấn chạy trên Postgres trong bộ nhớ (PGlite — chưa chắc chạy ổn với Drizzle + vitest 5, sẽ
kiểm tra ở bước 1; không được thì dùng database Neon riêng cho test). Bắt buộc có test **cách ly**: user A không đọc, sửa,
xóa được task/goal/thói quen của user B. Các test thuần hiện có (`lib/today`, `lib/goals`, dashboard…) giữ nguyên.

**Thứ tự đợt 1 (mỗi bước 1 PR vào `v1`):**

*Giai đoạn A — database + backend (vẫn đăng nhập bằng `APP_PASSWORD`, một user mặc định):*

1. Nền: Drizzle + schema (đủ cột `user_id`) + migration + user mặc định + khung test; Trung tạo Neon và đặt `DATABASE_URL`.
2. Tasks + Today trên database (kèm danh sách dự án).
3. Goal: mục tiêu, thói quen, nhìn lại, 7 thẻ ngày; Ghi nhanh (Daily Log, ý tưởng, ngày mai làm).
4. Dashboard trên database; ẩn phần Knowledge/Brain/Calendar. → Lúc này Trung dùng thử bản preview một mình.

*Giai đoạn B — đăng nhập + phân quyền:*

5. Đăng nhập Google + `ALLOWED_EMAILS` + cookie có `userId` + đăng xuất + test cách ly + trang Cài đặt (dự án, ngày đích,
   xóa tài khoản); bỏ `APP_PASSWORD`. User mặc định gắn vào tài khoản Google của Trung ở lần đăng nhập đầu.
6. Gỡ Notion (`lib/notion/`, `@notionhq/client`, biến môi trường), cập nhật README, `docs/huong-dan.md`, `AGENTS.md`
   (Stack, Quy tắc code); merge `v1` → `main`; tag `v1.0.0`.

**Tiêu chí hoàn thành v1.0:**

1. Hai tài khoản Google khác nhau đăng nhập → mỗi người thấy dữ liệu riêng; test cách ly qua.
2. Email ngoài danh sách không vào được.
3. Today, Tasks, Goal, Dashboard làm được mọi việc như v0.5 (danh sách test tay cuối mỗi bước).
4. Xóa tài khoản → mọi bảng không còn dòng nào của user đó.
5. Không còn import `@notionhq/client`; lint + build + test sạch; ảnh 1440×900 sáng/tối + mobile cho bước giao diện.

**Ngoài phạm vi v1.0:** chia sẻ/việc nhóm giữa bạn bè, thông báo/nhắc, app điện thoại, thu phí, đa ngôn ngữ, nhập dữ
liệu từ Notion.

**Rủi ro:**
- Hạn đồ án 06/12 → đợt 1 khoảng 8–12 giờ của Trung (tạo Neon, Google Console, test), rải 3–4 tuần; dừng giữa chừng thì
  production Notion vẫn chạy.
- Lỗi cách ly dữ liệu → mọi truy vấn qua `lib/db/` có `userId`, có test riêng.
- Gói free Neon (0,5 GB) dư cho 20 người dùng chữ; Neon "ngủ" khi không dùng → lần mở đầu chậm ~1 giây.

## 11. Câu hỏi Trung cần chốt

1. **Ai được vào:** **(a)** danh sách email `ALLOWED_EMAILS` trên Vercel *(đề xuất — đơn giản, Trung kiểm soát)*;
   **(b)** mã mời nhập lúc đăng nhập lần đầu; **(c)** ai có Google cũng vào.
2. **Cách làm đăng nhập:** **(a)** tự viết luồng Google OAuth (~150 dòng `fetch`, như Calendar đang làm) và dùng lại cookie
   HMAC hiện có *(đề xuất — không thêm thư viện, không lo thư viện chưa hợp Next 16)*; **(b)** dùng thư viện Auth.js /
   Better Auth (đỡ tự viết, thêm dependency và bảng riêng của thư viện).
3. **Truy vấn database:** **(a)** Drizzle ORM *(đề xuất)*; **(b)** SQL viết tay.
4. **Đợt 1 khi Brain ẩn:** `/` chuyển sang **Today** *(đề xuất)* hay sang Dashboard?
5. **Dự án:** mỗi người tự tạo danh sách ở Cài đặt *(đề xuất)*, hay gõ tự do khi tạo task?
6. **Thứ tự làm và cách chuyển** như mục 9–10 (database trước, đăng nhập ở bước 5)? *(đề xuất: có)*
7. **User mặc định** ở giai đoạn A gắn vào Google của Trung bằng email nào? *(đề xuất: email Trung đăng nhập Google, Trung
   điền vào biến `OWNER_EMAIL` lúc làm bước 5)*
