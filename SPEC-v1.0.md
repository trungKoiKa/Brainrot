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
> **Goal, đợt 1 (Trung chốt 07/11/2026, critique Goal):** mở Goal mặc định ở **Tháng**. Màu chỉ báo trạng thái: nhãn
> "Ưu tiên" trung tính (primary), "hạn" đỏ **chỉ khi đã quá hạn**, % ngày/kỳ **trung tính cho tới khi ngày/kỳ kết thúc**
> rồi mới xanh/vàng/đỏ (vàng dùng `--warning`, không dùng `--chart-4`). Thẻ ngày ở Tuần: "Dời sang…" là nút mở hàng
> chọn ngày (không đổi khi gõ phím mũi tên), dời xong hiện "Đã dời … sang … · **Hoàn tác**" ~5 giây. Bố cục: danh sách
> mục tiêu là thẻ tiêu điểm; vòng % + 3 ô số gộp thành một dòng; biểu đồ kỳ con ẩn khi chưa có mục tiêu nào; ở Tuần,
> 7 ngày đứng trước mục tiêu. Nút "Hôm nay" đổi thành "Kỳ này".
>
> **Goal, đợt 2 — chuỗi Mục tiêu → Việc → Ngày (Trung chốt 07/11/2026):** (1) dưới mỗi mục tiêu hiện các việc đã gắn
> (tên, Ngày làm hoặc "chưa xếp ngày", đã xong gạch ngang); (2) việc trên thẻ ngày ở Tuần ghi mục tiêu của nó;
> (3) ở Tuần có khay "Chưa xếp ngày": việc chưa xong đã gắn vào mục tiêu của tuần đó mà chưa có Ngày làm, có nút
> "Dời sang…" như thẻ ngày. **Nhìn lại → mục tiêu:** mỗi dòng của "mục tiêu cần tập trung" kỳ trước có nút "Thêm làm
> mục tiêu" (loại Ưu tiên; dòng trùng tên mục tiêu có sẵn thì ghi "Đã có"). **Chuyển kỳ:** nút "Chuyển N mục tiêu chưa
> xong sang <kỳ sau>" tạo bản sao (giữ loại, không sao thói quen/việc gắn, bỏ qua tên đã có ở kỳ sau). **Nhìn lại không mất
> chữ:** bản nháp đang gõ tự lưu trong trình duyệt theo từng kỳ, khôi phục khi quay lại, xoá khi lưu thành công.
>
> **Goal, đợt 3 (Trung chốt 07/11/2026, critique lần 2, 26/40):** (1) **Gắn việc từ dòng mục tiêu:** dòng mục tiêu có
> nút "Gắn việc" (chọn từ việc chưa xong và chưa gắn mục tiêu nào; mỗi việc vẫn chỉ một mục tiêu); mỗi việc đã gắn có nút
> bỏ gắn; mục tiêu chưa có việc hiện một dòng gợi ý. (2) Nhóm Ưu tiên / Thường **rỗng thì không hiện**; tháng chưa có
> thói quen thì thêm thói quen ngay trong thẻ Thói quen, không có thẻ Tổng kết trống. (3) Nút trên dòng mục tiêu: bút và
> thùng rác luôn thấy; "Gắn thói quen" và "Chuyển loại" nằm trong menu "⋯" có chữ. (4) Ở Tuần, trên 7 ngày có dải "Tập trung
> tuần này" liệt kê các mục tiêu Ưu tiên (xong thì gạch ngang). (5) % của ngày đã qua dưới 70% dùng nhãn viền trung tính
> (không vàng); xanh chỉ khi ≥ 70%.
>
> **Goal, đợt 4 (Trung chốt 07/11/2026, critique lần 3):** "Gắn việc" mở popover có ô tìm kiếm tự focus, giữ mở để gắn
> liên tiếp nhiều việc, hiện "Đang gắn…"; menu "⋯" là menu chuẩn (phím mũi tên, trả focus). Việc đã gắn dưới mục tiêu là dòng
> việc thật: ô tích xong / bỏ tích, tên mở trang Tasks, nút bỏ gắn ≥ 28px. Dải "Tập trung tuần này" thành các chip
> "mục tiêu · xong/tổng việc", bấm nhảy tới dòng mục tiêu. "Chuyển … sang kỳ sau" là nút phụ có viền.
>
> **Goal, đợt 5 (Trung chốt 07/11/2026, critique lần 4, 27/40):** khối mục tiêu **không dựng lại** sau khi gắn việc / tích
> việc (popover, ô tìm kiếm, thông báo còn nguyên; dữ liệu mới vào qua props). Gắn xong, focus về ô tìm kiếm và trình đọc
> màn hình nghe "Đã gắn: …". Tên mục tiêu chỉ là chữ (sửa bằng nút bút, không còn hai cách). Ô tích việc vùng bấm 24px, dòng
> việc xuống dòng được ở màn hẹp. Gợi ý "Gắn việc vào mục tiêu để xếp ngày…" hiện **một lần** cho cả khối, không lặp từng mục tiêu.
>
> **Goal, đợt 6 (Trung chốt 07/11/2026):** "Chuyển … sang kỳ sau" có **Hoàn tác** (xoá mềm đúng các bản sao vừa tạo; mục
> tiêu có sẵn ở kỳ sau không bị đụng). Bỏ gắn một việc khỏi mục tiêu hiện "Đã bỏ gắn … · Hoàn tác" ~5 giây (gắn lại đúng mục
> tiêu đó).
>
> **Goal, đợt 7 (Trung chốt 07/11/2026, critique lần 5, 28/40):** mọi lần lưu mục tiêu (sửa, đổi loại, tích, xoá, thêm) đều
> làm mới dữ liệu trang để chip "Tập trung tuần này" và danh sách việc không cũ; trong lúc còn lưu dở, bản lạc quan không bị
> dữ liệu server cũ ghi đè. "Đã bỏ gắn … · Hoàn tác" chỉ hiện khi bỏ gắn thành công. Biểu đồ kỳ con chỉ hiện khi **từ hai** kỳ
> con có mục tiêu; thẻ mục tiêu không bị kéo dãn theo biểu đồ.
>
> **Goal, đợt 8 (Trung chốt 07/11/2026):** gợi ý "Gắn việc vào mục tiêu…" chỉ hiện khi **chưa mục tiêu nào** có việc gắn
> (đã biết cách gắn thì không nhắc nữa). Màn hẹp (< 768px): nút bút / xoá / "⋯", ô tích việc và nút bỏ gắn có vùng bấm 40px.
>
> **Goal, đợt 9 (Trung chốt 07/11/2026, critique lần 6, 30/40):** dữ liệu server tới lúc đang lưu dở được giữ lại và áp ngay
> khi lưu xong (không bỏ sót). Dải hoàn tác (xoá mục tiêu, bỏ gắn việc) nằm trong vùng thông báo `aria-live` cố định để trình
> đọc màn hình luôn đọc. Màn hẹp: ô tích thói quen 32px, nút quản lý thói quen 40px.
>
> **Today, đợt 3 (Trung chốt 09/11/2026, critique lần 3, 27/40):** "Hôm nay làm" luôn có ô **"Thêm việc cho hôm nay…"**
> (chỉ tên; Ngày làm = ngày làm việc hiện tại; dự án / ưu tiên / deadline đặt ở Tasks) — không còn ngõ cụt khi trống hay khi đã
> xếp đủ. Daily Log có gợi ý trong ô nhập và **bản nháp tự lưu** trong trình duyệt theo ngày làm việc (khôi phục khi quay lại,
> xoá khi lưu thành công). Dòng mở "Daily Log hôm nay" / "Ngày mai làm" cao ≥ 36px và có viền focus.
>
> **Tasks, đợt 2 (Trung chốt 09/11/2026, critique lần 2, 28/40):** màn hẹp: nút sửa / xoá cao 40px; hộp "Xóa hẳn?" xuống
> dòng riêng, không ép tên việc. Dải "Hoàn tác" sau khi tích xong giữ **8 giây** và **tạm dừng khi rê chuột hoặc có focus**.
> Esc trong lịch / popover của form sửa chỉ đóng lịch, không đóng cả form (không mất chữ đang sửa). Trạng thái trống chỉ
> đường lên ô thêm việc.
>
> **Dashboard, đợt 4 (Trung chốt 10/11/2026, critique lần 4, 27/40):** tín hiệu tuần chỉ tính **ngày đã qua** (log hôm nay
> chưa viết không bị coi là bỏ lỡ); mẫu dưới 3 ngày không bao giờ đỏ, tối đa "Cần để ý". Chấm KPI **trung tính** (vòng rỗng)
> khi chưa đủ dữ liệu để phán xét: Xong = 0 hoặc kỳ trước = 0, Việc theo lịch tuần này chưa xếp việc, Đồ án chưa đặt hạn.
> Dữ liệu **Mẫu** không còn dồn hàng chục việc "quá hạn 100 ngày" (hạn cũ trên 7 ngày của việc chưa xong được bỏ). Nút chọn
> Kỳ / Dữ liệu cao 40px trên màn hẹp.
>
> **Đánh bóng cuối (Trung chốt 10/11/2026, critique lần cuối cả 4 trang: Today 30 · Tasks 29 · Goal 32 · Dashboard 33):**
> ô tích việc có vùng bấm 32–40px; chip lọc, nút nhỏ ở Today, "Dời sang…", "+ Gắn việc" cao 40px trên màn hẹp; Esc **không** đóng
> form sửa việc khi đã sửa dở (dùng nút Hủy); hoàn tác của Goal giữ 8 giây như Tasks; trạng thái trống của "Hôm nay làm" chỉ
> xuống ô thêm việc bên dưới (link sang Tasks chỉ khi việc còn lại đã xếp ngày khác).
>
> **Goal, đợt 10 (Trung chốt 10/11/2026):** dải "Hoàn tác" của Goal (xoá mục tiêu, bỏ gắn việc, dời ngày ở Tuần) **tạm dừng
> đếm khi rê chuột hoặc có focus**, rồi mới tự tắt sau 8 giây — cùng hành vi với Tasks (hook `useAutoDismiss`).
>
> **Dọn nốt sau critique cuối (Trung chốt 10/11/2026):** Dashboard — KPI chưa đủ dữ liệu hiện **số mờ, không sparkline** (không
> trông như hỏng); biểu đồ "Việc theo dự án" thấp hơn (h-48) và danh sách link bên dưới gọn (text-xs). Today — "Ghi nhanh ý
> tưởng" và "Cuối ngày" là **dải viền nét đứt**, không còn là thẻ đầy đủ, để "Hôm nay làm" là tiêu điểm duy nhất.
>
> **Sửa lỗi hoàn tác kẹt (Trung chốt 10/11/2026, chấm lại sau sửa cuối):** hook `useAutoDismiss` (nay ở `components/`, dùng cho Goal
> và Tasks) chỉ giữ khi **rê chuột hoặc có focus bàn phím** trên đúng dải đang hiện — focus do code chuyển vào nút Hoàn tác sau
> cú bấm chuột, hoặc dải cũ biến mất lúc chuột còn nằm trên nó, không còn làm dải sau bị kẹt không tự tắt. Today: "Ghi nhanh ý
> tưởng" có nhãn nhìn thấy; dòng mở "Daily Log" / "Ngày mai làm" cao 40px; buổi tối "Cuối ngày" viền liền (nổi hơn ban ngày).
>
> **Sửa tràn ngang 375px trang Goal (10/11/2026):** khi một mục tiêu có tiêu đề dài, cột lưới mặc định của `grid` co theo nội dung
> không ngắt dòng và đẩy cả trang rộng ra. Các lưới `lg:grid-cols-*` nay có nền `grid-cols-1` (cột `minmax(0,1fr)`) ở màn hẹp.
> Chữ viết tắt thứ ở bảng thói quen tháng nâng lên 12px (hết ngoại lệ 10.4px trong DESIGN.md).
>
> **Tasks, đợt 3 — xoá có hoàn tác (Trung chốt 10/11/2026):** bấm thùng rác **xoá ngay** (bỏ bước hỏi "Xóa hẳn?"), dải
> "Đã xóa “…” · **Hoàn tác**" hiện 8 giây ở cuối màn hình (tạm dừng khi rê chuột / focus bàn phím). Hoàn tác **chèn lại đúng id**
> với đủ trường (dự án, ưu tiên, deadline, Ngày làm, ghi chú, ngày tạo) và liên kết mục tiêu còn tồn tại; không ghi đè nếu id đã
> có. Không đổi schema (xoá vẫn là xoá thật; hoàn tác chỉ khả dụng trong phiên đang mở, hết 8 giây hoặc tải lại trang thì mất).
> Thay cho quy tắc "xóa hẳn, không hoàn tác" ngày 05/11/2026.
>
> **Dashboard, đợt 5 (Trung chốt 10/11/2026):** đầu tuần (thứ Hai–thứ Ba) kết luận **không tô màu**: "Tuần mới: …" (việc quá hạn vẫn
> đỏ); đường xu hướng KPI chỉ vẽ khi có ≥ 2 lần đổi giá trị (hết "bậc thang" đơn lẻ); "Việc theo dự án" chỉ có **một nhóm** thì
> hiện một dòng chữ + link thay cho biểu đồ cột. KPI "Việc theo lịch tuần này" cũng trung tính khi mới có dưới 3 việc xếp lịch.
>
> **Bước 5 — mở cho bạn bè (Trung chốt 10/11/2026):** **giữ email + mật khẩu** (không làm Google OAuth / `ALLOWED_EMAILS`); Trung tạo
> tài khoản từng bạn bằng `npm run user:password -- <email> "Tên"`. Cần làm trước khi mở: (A) **Đăng xuất**, trang **Cài đặt**
> (tên hiển thị, hạn + nhãn thẻ đếm ngược, đổi mật khẩu); lời chào, sidebar, đếm ngược đọc **theo từng người** thay vì chữ "Trung" /
> `THESIS_DEADLINE` chung (user mặc định của Trung vẫn dùng biến đó làm mặc định); (B) **quản lý dự án** riêng từng người (thêm /
> đổi tên / xoá khi không còn việc) — người mới chưa có dự án nào; (C) **chống dò mật khẩu** (khoá tạm sau nhiều lần sai), **xoá
> tài khoản** (gõ lại email để xác nhận), hướng dẫn tạo tài khoản. Mỗi tài khoản mới được tạo sẵn dự án "Chung".
>
> **Bước 5A đã làm (10/11/2026):** nút **Đăng xuất** + tên người dùng + liên kết **Cài đặt** ở chân sidebar; trang `/settings`
> (tên hiển thị, hạn + tên hạn cho thẻ đếm ngược, đổi mật khẩu); lời chào Today, sidebar, thẻ đếm ngược Dashboard đọc theo từng
> người. Riêng user mặc định chưa đặt hạn thì vẫn dùng `THESIS_DEADLINE`. Chưa cần migration mới (cột `users.name`, `target_date`,
> `target_label` có sẵn từ 0000).
>
> **Bước 5B đã làm (10/11/2026):** trang Cài đặt có khối **Dự án** riêng từng người: thêm, đổi tên tại chỗ (việc theo tên mới),
> xoá **chỉ khi không còn việc** (nút khoá kèm số việc). Tên dự án ≤ 40 ký tự, không trùng trong cùng một người (hai người được
> trùng tên). Tài khoản tạo bằng `user:password` có sẵn dự án "Chung".
>
> **Bước 5C đã làm (10/11/2026):** **chống dò mật khẩu** — sai **5 lần trong 15 phút** thì email đó bị khoá tạm 15 phút (bảng
> `login_attempts`, migration `0003`; lỗi bảng/kết nối ở bước kiểm tra thì bỏ qua để không khoá cả ứng dụng; đăng nhập đúng xoá lịch
> sử sai; email lạ cũng được ghi nên không lộ email nào có tài khoản). **Xoá tài khoản** ở Cài đặt: gõ lại email + nhập mật khẩu,
> xoá toàn bộ dữ liệu (cascade), không hoàn tác. `docs/huong-dan.md` thêm mục tạo tài khoản cho bạn bè. **Việc Trung cần làm:**
> chạy `npm run db:migrate` để áp migration `0003` lên Neon.
>
> **Xóa task (Trung chốt 05/11/2026):** mỗi dòng task (Tasks, cả việc chưa xong lẫn Đã xong) có icon thùng rác; bấm → hỏi
> xác nhận ngay tại dòng → **xóa hẳn** (không hoàn tác), liên kết với mục tiêu mất theo. Trước đây xóa trong Notion.
>
> **Hoàn tác tích xong (Trung chốt 07/11/2026, critique Tasks):** tích xong trên Tasks → hiện "Đã xong … · **Hoàn tác**"
> khoảng 5 giây (cũng là thông báo cho trình đọc màn hình). Trong "Đã xong", ô tích bỏ được → việc về **Chưa làm**, xoá
> Ngày xong, giữ liên kết mục tiêu. Tasks dùng khung Card chung; nhãn ưu tiên màu trung tính (đỏ chỉ cho quá hạn), ẩn ở
> việc đã xong; form thêm việc giữ dự án/ưu tiên vừa chọn, đưa con trỏ về ô tên sau khi thêm. Vẫn nhóm theo dự án.

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
