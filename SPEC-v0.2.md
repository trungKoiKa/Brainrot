# SPEC — Second Brain Web v0.2

> Bổ sung cho `SPEC.md` (v0.1). Mục nào không nhắc ở đây thì giữ nguyên như v0.1.
> Trung duyệt ngày 22/10/2026.
>
> **Trạng thái:** v0.2 hoàn thành 22/10/2026 (tag `v0.2.0`, PR #15–#23). Kết quả: `docs/plans/completed/v0.2.md`.

## 1. Thay đổi ràng buộc so với v0.1

| Ràng buộc | v0.1 | v0.2 |
|---|---|---|
| Đóng băng đến 06/12/2026 | Có | **Bỏ** — Trung chọn "mở băng" (22/10/2026) |
| Thời gian test của Trung | ≤ 2 giờ/tuần | **Không giới hạn** (Trung chọn). Thấy lấn thời gian đồ án → nói "tạm dừng" |
| Chi phí | 0 đồng | **Giữ 0 đồng** (Trung chốt 22/10/2026). Không đưa LLM vào v0.2. **Ghi nhớ:** khi Trung có ngân sách vận hành AI, Trung muốn tích hợp LLM (Claude / Gemini / DeepSeek / OpenAI — chọn provider lúc đó) — xem mục 5 |
| Dependency | Không state library | **Cho phép** `zustand`, `@dnd-kit/*`, `date-fns` — chỉ dùng trong Planner; `vitest` (dev) |
| Database riêng | Không | Vẫn **không**. Planner lưu `localStorage` (không Supabase) |

## 2. Điều hướng

- Sidebar theo thứ tự: **Brain · Today · Tasks · Planner**.
- **Trang chủ `/` = Brain.** Today chuyển sang `/today`. Đăng nhập xong vào `/`.

## 3. Planner (`/planner`) — tích hợp nguyên repo `trungKoiKa/planner` (cách A)

Nguồn: https://github.com/trungKoiKa/planner (Vite + React 19 + zustand). Đưa vào Brainrot như một tính năng:

**Giữ:** dự án → task → slot theo ngày, bảng tuần, tiến độ, slot bị lỡ + menu Move, điều hướng tuần,
End week + Archive, Copy/Paste plan, Stats (streak, heatmap), kéo thả, phím tắt `N` / `←` `→`,
xuất/nhập JSON, hoàn tác khi xóa.

**Bỏ:** đăng nhập + đồng bộ Supabase (Brainrot đã có mật khẩu riêng, không thêm database), PWA/offline
(xung đột với Next.js), bộ chọn theme riêng (dùng nút sáng/tối của Brainrot).

**Đổi:**
- Code đặt ở `features/planner/`, chỉ chạy phía client (dynamic import, `ssr: false`) vì dữ liệu nằm trong `localStorage`.
- Các trang con của planner (Plan / Stats / Archive) giữ router dạng `#` bên trong `/planner`.
- Màu: biến màu của planner được giới hạn trong khung `.planner` và ánh xạ sang token của Brainrot
  (không đè `--line`, `--accent` của Brainrot), đổi theo theme sáng/tối như các trang khác.
- Font: dùng font của Brainrot (Inter + Lora) thay Fraunces/Newsreader/JetBrains Mono.
- Chữ giao diện bên trong planner **giữ tiếng Anh**; bỏ logo "weekly." và nút "♥ Support"; trang có tiêu đề
  "Planner" như các trang khác. *(chốt 22/10/2026)*

**Dữ liệu:**
- Lưu trong `localStorage` của trình duyệt → **chỉ có trên thiết bị đó**, không đồng bộ máy ↔ điện thoại. (Trung chấp nhận khi chọn cách A.)
- Dữ liệu planner cũ: xuất JSON ở app planner cũ → nhập vào `/planner` (tính năng có sẵn).
- Dự án/task của Planner **tách riêng** với Notion Tasks: không hiện ở Today, Tasks, Brain. (Hệ quả của cách A.)

**Kiểm thử:** mang theo unit test có sẵn của planner (week, progress, endWeek, planText, stats, merge)
→ thêm `vitest` làm devDependency và lệnh `npm test`. Từ v0.2: mỗi bước phải qua lint + build + test. *(chốt 22/10/2026)*

## 4. Các tính năng v0.2 khác (làm sau Planner, theo thứ tự)

1. **Ghi nhanh** trên Today *(chốt 22/10/2026)*:
   - **Ý tưởng:** 1 ô nhập + Enter → tạo trang trong database **Ideas** (đã tạo 22/10/2026, ID
     `309f392afcb24f67993d75f5934fe278`, biến `NOTION_IDEAS_DB`): Ý tưởng = nội dung, Ngày = hôm nay (giờ VN),
     Trạng thái = Mới. Chỉ ghi, chưa có trang xem/sửa ý tưởng trên web (xem trong Notion).
   - **Daily Log hôm nay:** form đủ 5 trường (Xong · Rơi / chưa xong · Học được · Ngày mai 3 việc · Tập thể dục).
     Mỗi ngày **1 bản ghi**: đã có bản ghi Date = hôm nay → mở form thấy sẵn nội dung, lưu = **cập nhật**; chưa có → tạo
     mới (Ngày = "dd/mm/yyyy", Date = hôm nay). "Ngày mai 3 việc" mỗi việc một dòng → sáng hôm sau thành khối 3 việc.
   - Lưu xong: báo "Đã lưu" và làm mới cache Daily Log; lỗi → giữ nguyên nội dung đã gõ + báo lỗi.
   - Giới hạn: mỗi trường ≤ 2000 ký tự (giới hạn một đoạn text của Notion).
2. **Thêm/sửa task trên web** (Notion Tasks) *(chốt 22/10/2026)*:
   - **Tạo:** một hàng ở đầu trang Tasks: Tên (bắt buộc) + Dự án + Ưu tiên + Deadline; Enter/nút Thêm là tạo.
     Trạng thái mặc định = Chưa làm. Ghi chú thêm sau qua phần sửa.
   - **Sửa:** nút ✎ riêng mỗi dòng → form sửa mở ngay tại chỗ; bấm tên task vẫn mở trang Notion.
     Sửa được: Tên, Trạng thái (Chưa làm / Đang làm), Dự án, Ưu tiên, Deadline, Ghi chú. Xong vẫn dùng ô tích.
   - Dự án chọn trong các lựa chọn hiện có của select "Dự án" (không tạo dự án mới từ web).
   - Lưu xong: làm mới cache Tasks; lỗi → giữ nội dung đã gõ + báo lỗi. Tên/Ghi chú ≤ 2000 ký tự.
   - Xóa task: vẫn làm trong Notion.
3. **Tìm kiếm trên Brain** *(chốt 22/10/2026)*: ô "Tìm trang" ở góc trên graph, phím `/` để nhảy vào ô.
   - Tìm trong **mọi node**: trang Knowledge, task chưa xong, Lĩnh vực, Dự án.
   - Khớp **không dấu, một phần** ("do an" → "Đồ án"); ưu tiên tên bắt đầu bằng chuỗi gõ, rồi đầu từ, rồi ở giữa.
   - Danh sách thả xuống tối đa 8 kết quả (chấm màu + loại); ↑↓ chọn, Enter/bấm → camera bay tới node.
   - Node được chọn + các node nối trực tiếp giữ màu, còn lại mờ đi; ✕ hoặc Esc bỏ chọn.
4. **Google Calendar "Next up"** trên Today *(chốt 22/10/2026)*:
   - Kết nối bằng **OAuth client + refresh token** (Trung chọn), quyền chỉ đọc `calendar.readonly`. Trung tự tạo
     client, lấy refresh token qua OAuth Playground và tự điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
     `GOOGLE_REFRESH_TOKEN` (tùy chọn `GOOGLE_CALENDAR_IDS`, mặc định `primary`). App phải ở trạng thái
     **In production** trên Google Auth Platform, vì ở Testing refresh token hết hạn sau 7 ngày.
   - Thẻ "Next up" cạnh "3 việc hôm nay": các sự kiện **còn lại hôm nay** (tối đa 5; giờ, tên, địa điểm hoặc link họp;
     đang diễn ra → nhãn "Đang diễn ra"). Hết sự kiện hôm nay → hiện **sự kiện sớm nhất ngày mai**.
   - Bỏ sự kiện đã hủy hoặc Trung đã từ chối. Cache 5 phút. Bấm tên → mở sự kiện trên Google Calendar.
   - Chưa có biến môi trường → thẻ báo "Chưa kết nối"; Google lỗi → thẻ báo lỗi, các thẻ khác vẫn chạy.

Mỗi tính năng: chốt chi tiết vào file này trước khi code.

## 5. Ngoài phạm vi v0.2

- LLM trong web — **để sau, có điều kiện**: khi Trung có chi phí vận hành AI thì tích hợp. Ứng viên: Ask trên
  dữ liệu Knowledge, evening review từ Daily Log, gợi ý xếp lịch cho Planner. Thiết kế để đổi provider bằng biến
  môi trường; kiểm tra giá/hạn mức chính thức lúc đó (chưa tra ở 22/10/2026).
- Đồng bộ dữ liệu Planner giữa các thiết bị; nối Planner với Notion Tasks (cách B — có thể làm ở v0.3)
- Postgres / Supabase / database riêng; nhiều người dùng; Obsidian

## 6. Tiêu chí hoàn thành v0.2

1. Sidebar Brain · Today · Tasks · Planner; `/` mở Brain; Today ở `/today`; mọi link/redirect cũ vẫn đúng.
2. `/planner` chạy đủ tính năng "Giữ" ở mục 3 sau khi đăng nhập Brainrot; dữ liệu còn sau khi tải lại trang.
3. Planner đổi theo theme sáng/tối của Brainrot; không làm vỡ màu các trang khác.
4. Nhập được file JSON xuất từ planner cũ.
5. Các tính năng mục 4 đạt tiêu chí riêng ghi khi chốt từng tính năng.
6. (Tiêu chí thật, giữ từ v0.1) Trung dùng ≥ 5 ngày/tuần trong 2 tuần liên tiếp.
