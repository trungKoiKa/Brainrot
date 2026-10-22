# SPEC — Second Brain Web v0.2

> Bổ sung cho `SPEC.md` (v0.1). Mục nào không nhắc ở đây thì giữ nguyên như v0.1.
> Trung duyệt ngày 22/10/2026.

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

**Dữ liệu:**
- Lưu trong `localStorage` của trình duyệt → **chỉ có trên thiết bị đó**, không đồng bộ máy ↔ điện thoại. (Trung chấp nhận khi chọn cách A.)
- Dữ liệu planner cũ: xuất JSON ở app planner cũ → nhập vào `/planner` (tính năng có sẵn).
- Dự án/task của Planner **tách riêng** với Notion Tasks: không hiện ở Today, Tasks, Brain. (Hệ quả của cách A.)

**Kiểm thử:** mang theo unit test có sẵn của planner (week, progress, endWeek, planText, stats, merge)
→ thêm `vitest` làm devDependency và lệnh `npm test`. Từ v0.2: mỗi bước phải qua lint + build + test. *(chốt 22/10/2026)*

## 4. Các tính năng v0.2 khác (làm sau Planner, theo thứ tự)

1. **Ghi nhanh** trên Today: ô ghi Daily Log cuối ngày (Xong / Rơi / Học được / Ngày mai 3 việc / Tập thể dục)
   và ghi nhanh ý tưởng → Notion. Ý tưởng lưu ở **database "Ideas" mới** trong trang Second Brain
   (Ý tưởng · Ngày · Trạng thái: Mới / Đang nghĩ / Bỏ / Thành task). Agent hỏi Trung trước khi tạo database. *(chốt 22/10/2026)*
2. **Thêm/sửa task trên web** (Notion Tasks): tạo nhanh, đổi Ưu tiên / Deadline / Dự án / Ghi chú. Xóa: vẫn làm trong Notion.
3. **Tìm kiếm trên Brain**: ô "Tìm trang", gõ tên → camera bay tới node.
4. **Google Calendar "Next up"** trên Today: cần Trung tạo OAuth client trên Google Cloud. Làm cuối.

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
