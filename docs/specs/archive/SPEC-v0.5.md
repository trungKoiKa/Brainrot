> **Đã lưu trữ (11/11/2026).** File này là lịch sử, giữ nguyên văn. Hành vi hiện hành của sản phẩm: [`SPEC.md`](../../../SPEC.md).

# SPEC — Second Brain Web v0.5: Một kho việc (bỏ Planner)

> Bổ sung cho `SPEC.md`, `SPEC-v0.2.md` → `SPEC-v0.4.md`. Mục nào không nhắc ở đây thì giữ nguyên.
>
> **Trạng thái:** Trung duyệt 26/10/2026 theo các phương án đề xuất ở mục 10 (cột "Ngày làm", 10.2 (a), 10.3 (a), thứ tự mục 7). Trung đã chốt: **bỏ Planner**, không cần chuyển dữ liệu Planner
> (chưa dùng thật). Tiến độ: `docs/plans/active/v0.5.md`.

## 1. Vấn đề

Sau v0.4, "công việc" nằm ở **hai kho không nối nhau**:

- **Notion Tasks** — Today, Tasks, Goal (thẻ 7 ngày), Dashboard cùng đọc.
- **Planner** — dự án → task → ô theo thứ, lưu `localStorage` của từng trình duyệt; không đồng bộ, không lên điện thoại.

Hệ quả: một việc phải nhập hai lần; Today không biết ô Planner của hôm nay; thẻ 7 ngày phải ghép hai nguồn; "dự án" có
hai bản (cột Dự án trong Notion và dự án Planner). GTD gọi đây là mất "hệ thống tin cậy duy nhất".

## 2. Mục tiêu

**Một kho việc duy nhất: Notion Tasks.** Mỗi màn hình trả lời một câu hỏi, cùng đọc kho đó:

| Màn | Câu hỏi | Dữ liệu |
|---|---|---|
| **Goal** | Tôi đang hướng tới điều gì? | Goals; tiến độ từ task gắn + thói quen (v0.4) |
| **Tasks** | Tôi có những việc gì? | Notion Tasks theo dự án — **nơi duy nhất tạo/sửa việc** |
| **Today** | Hôm nay làm gì? | Task có **Ngày làm** hoặc **Hạn** hôm nay + thói quen + Ghi nhanh |
| **Goal → Tuần** | Tuần này làm gì vào ngày nào? | Cùng task đó, xếp theo Ngày làm thành 7 thẻ |
| **Dashboard** | Tôi đang làm tốt không? | Số liệu từ tất cả nguồn trên |

Ba sợi dây nối: **Goal gồm Task** (relation "Mục tiêu", đã có) · **Task xếp vào Ngày** (cột "Ngày làm", mới) ·
**Thói quen làm Goal tự xong** (đã có).

## 3. Dữ liệu

- Notion Tasks thêm cột **"Ngày làm"** (Date) — ngày *định làm*, khác **"Hạn"** (ngày *phải xong*). Chỉ **thêm**, không
  sửa/xóa cột cũ. Task không có Ngày làm vẫn hợp lệ (chưa xếp lịch).
- Đọc vào `Task.plannedOn: string | null` (YYYY-MM-DD, giờ Việt Nam).
- Không thêm database mới.

## 4. Thay đổi theo màn

### 4.1 Tasks
- Form thêm/sửa task có ô **Ngày làm** (dùng `DeadlineField` như Hạn). Dòng task hiện "Làm: T4 28/10" khi có.

### 4.2 Today
- Khối **"Hôm nay làm"** thay "3 việc hôm nay":
  1. Task chưa xong có **Ngày làm = hôm nay**, xếp Cao → Thấp;
  2. Task chưa xong có **Ngày làm < hôm nay** (trễ) — hiện nhãn "trễ từ T2 26/10", nút **"Dời sang hôm nay"**;
  3. Task chưa xong có **Hạn = hôm nay** mà chưa có Ngày làm hôm nay.
  Tích xong ngay tại đây (như cũ). Trống → gợi ý 3 task ưu tiên cao nhất kèm nút **"Làm hôm nay"** (đặt Ngày làm).
- Mục tiêu tuần Ưu tiên vẫn hiện ở cuối khối (v0.4).
- Ghi nhanh: ô **"Ngày mai 3 việc"** (chữ) → xem câu 10.2.

### 4.3 Goal → chế độ Tuần (thẻ 7 ngày)
- Mỗi thẻ ngày: task có **Ngày làm** ngày đó; task đã xong có **Ngày xong** ngày đó; task có **Hạn** ngày đó (nhãn "hạn").
  Bỏ phần ô Planner.
- Mỗi task trong thẻ có menu **"Dời sang…"** (7 ngày trong tuần + "Bỏ lịch") → ghi Ngày làm. Thay cho kéo ô ở Planner.
- % ngày = task xong / tổng task của ngày.

### 4.4 Dashboard
- KPI **"Planner"** → **"Tuần này"**: % task có Ngày làm trong tuần đã xong; sparkline 12 tuần; ghi chú "x/y task".
- Thẻ **"Dự án Planner"** → xem câu 10.3.
- Dữ liệu mẫu (chế độ Mẫu) đổi theo.

### 4.5 Gỡ Planner
- Bỏ mục **Planner** khỏi sidebar; `/planner` chuyển hướng (307) sang `/goals?level=week`.
- Xóa `features/planner/`, `components/planner-view.tsx`, `app/(app)/planner/`; gỡ dependency chỉ Planner dùng
  (`zustand`, `@dnd-kit/*`; `date-fns` kiểm tra lại). Lịch sử git giữ code cũ.
- Dữ liệu `localStorage` Planner trên trình duyệt để nguyên (không đọc nữa); không chuyển sang Notion (Trung chốt).

## 5. Ngoài phạm vi v0.5

- Kéo thả task giữa các ngày; khối giờ trong ngày (time-blocking theo giờ).
- Tự điền "Xong" của Daily Log từ task đã tích.
- Lặp lại task (hằng tuần…), nhắc nhở.

## 6. Kiểm thử (vitest)

- "Hôm nay làm": đúng 3 nhóm và thứ tự 4.2; task xong không hiện; task trễ có nhãn đúng số ngày.
- Thẻ 7 ngày: task thuộc ngày theo Ngày làm / Ngày xong / Hạn, không lặp một task hai lần trong cùng thẻ.
- KPI "Tuần này": tuần không có task xếp lịch → "—", không chia cho 0.
- Đọc/ghi "Ngày làm": parse form hợp lệ, xóa được (để trống).

## 7. Thứ tự làm (mỗi bước 1 PR)

1. Cột Ngày làm: Notion + đọc/ghi + form Tasks.
2. Today "Hôm nay làm" (+ Ghi nhanh theo câu 10.2).
3. Thẻ 7 ngày đọc Ngày làm + "Dời sang…".
4. Dashboard bỏ Planner (KPI "Tuần này", câu 10.3).
5. Gỡ Planner (sidebar, route, code, dependency); đóng plan, tag `v0.5.0`.

## 8. Tiêu chí hoàn thành v0.5

1. Tạo task có Ngày làm ở Tasks → hiện ở Today (đúng ngày) và đúng thẻ ở chế độ Tuần.
2. Dời task sang ngày khác ở thẻ 7 ngày → Notion đổi Ngày làm; Today đổi theo.
3. Không còn chỗ nào trong app đọc/ghi Planner; `/planner` chuyển sang chế độ Tuần.
4. Dashboard không còn thẻ/KPI Planner; KPI "Tuần này" đúng.
5. Test mục 6 qua; lint + build sạch; ảnh 1440×900 sáng/tối + mobile cho mỗi bước giao diện.

## 9. Rủi ro

- Trung chỉ có ≤ 2 giờ/tuần và hạn đồ án 06/12/2026 → làm từng bước nhỏ, mỗi bước dùng được ngay; có thể dừng sau
  bước 3 mà app vẫn nhất quán (Planner chỉ còn là trang thừa).
- Thêm cột Notion → Trung không phải làm gì trên Vercel (không có biến môi trường mới).

## 10. Câu hỏi Trung cần chốt

1. Tên cột **"Ngày làm"** (Date) trong Notion Tasks? *(đề xuất: có)*
2. Ô **"Ngày mai 3 việc"** trong Ghi nhanh (chữ tự do, lại là một danh sách việc nữa):
   **(a)** thay bằng chọn task → đặt Ngày làm = ngày mai *(đề xuất — đúng "một kho việc")*;
   **(b)** giữ nguyên như ghi chú.
3. Chỗ trống của thẻ **"Dự án Planner"** trên Dashboard:
   **(a)** thẻ **"Sắp đến hạn"** (task có Hạn trong 14 ngày) *(đề xuất)*; **(b)** bỏ hẳn, "Mục tiêu tháng này" cao lên.
4. Thứ tự làm như mục 7? *(đề xuất: có)*
