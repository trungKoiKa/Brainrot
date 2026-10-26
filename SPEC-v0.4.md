# SPEC — Second Brain Web v0.4: Mục tiêu · Thói quen · Nhìn lại

> Bổ sung cho `SPEC.md`, `SPEC-v0.2.md`, `SPEC-v0.3.md`. Mục nào không nhắc ở đây thì giữ nguyên.
>
> **Trạng thái:** Trung duyệt bản 2 ngày 26/10/2026 (đồng ý cả 4 câu mục 10, dùng danh sách thói quen gợi ý).
> Tiến độ: `docs/plans/active/v0.4.md`.
>
> **Nguồn ý tưởng:** template **Clarity Yearplan / Monthplan** của GON.LIFE (Google Sheets, bán có phí): 4 ảnh giới
> thiệu, bản demo công khai "Clarity Monthplan - Demo Ver", và bản phân tích của Trung `clarity-yearplan-spec.md`
> (bản Yearplan 13 tab). Brainrot lấy **ý tưởng** (mục tiêu xếp tầng, theo dõi thói quen, câu hỏi nhìn lại);
> **không** dùng logo, sticker, ảnh, font hay bảng màu của template. Giao diện dùng **màu Brainrot** *(Trung chốt 26/10/2026)*.

## 1. Mục tiêu

Thêm tầng "dài hạn" mà Brainrot còn thiếu, nối với tầng "hằng ngày" đã có (Tasks, Planner, Daily Log):

1. **Thói quen (Habit tracker):** thói quen theo tháng, tích mỗi ngày, % theo thói quen và theo ngày.
2. **Mục tiêu xếp tầng:** Năm → Quý → Tháng → Tuần, chia **Ưu tiên / Thường**, có bộ đếm và % từng kỳ.
3. **Nhìn lại (Reflection):** 4 câu hỏi cho mỗi tuần / tháng / quý / năm, + châm ngôn năm.

Hơn template:
- Dữ liệu ở Notion → đồng bộ máy ↔ điện thoại, một nguồn duy nhất (sửa ở đâu cũng thấy ở mọi nơi).
- Mục tiêu **tự xong** khi thói quen đạt ngưỡng hoặc khi các task gắn với nó xong.
- Cấp **Ngày** không bắt nhập lại task: lấy từ Notion Tasks, Planner, Daily Log đã có (mục 6.3).
- Lịch sinh theo năm thật (template gốc lệch: Year 2026 nhưng ngày là của 2025).

## 2. Ràng buộc

| Ràng buộc | v0.3 | v0.4 |
|---|---|---|
| Chi phí | 0 đồng | Giữ 0 đồng |
| Database riêng | Không | Vẫn **không** — mọi dữ liệu mới ở **Notion** |
| Schema Notion | Thêm "Ngày xong" (Tasks) | Database mới **Habits**, **Goals**, **Reflections**; Daily Log thêm cột multi-select **"Thói quen"**; relation Tasks ↔ Goals (mục 3–5). Chỉ **thêm**, không sửa/xóa cột cũ |
| Dependency | recharts (Dashboard) | Không thêm |
| Giao diện | Token màu Brainrot | Như cũ — **không** dùng bảng màu/hình của template |

## 3. Thói quen

### 3.1 Dữ liệu *(đề xuất — mục 10 câu 1)*

- **Database Habits** (danh sách thói quen): Tên (Title) · Từ tháng (Date, ngày 1 của tháng bắt đầu) ·
  Đến tháng (Date, tùy chọn — trống = vẫn đang theo dõi) · Thứ tự (Number).
  Thói quen **của một tháng** = các dòng có Từ tháng ≤ tháng đó và (Đến tháng trống hoặc ≥ tháng đó).
  → Thói quen chưa kết thúc **tự sang tháng sau** (thay cho nút "copy từ tháng trước" của template);
  ngừng theo dõi = điền "Đến tháng", **lịch sử còn nguyên**.
- **Daily Log** thêm cột **"Thói quen" (Multi-select)**: tên các thói quen đã làm trong ngày.
  Lý do không dùng "mỗi thói quen một cột checkbox": xóa cột là mất lịch sử, và đổi thói quen theo tháng phải sửa schema.
- Cột "Tập thể dục" (checkbox) hiện có: tạo thói quen "Tập thể dục" trong Habits; ngày cũ đã tích checkbox được tính
  là đã làm. Mỗi lần ghi thói quen, web ghi multi-select **và** giữ checkbox khớp theo (có/không "Tập thể dục").
- Khi đã có database Habits, Ghi nhanh Daily Log trên Today **bỏ ô "Tập thể dục"** (thẻ "Thói quen hôm nay" lo phần
  này) — tránh hai nơi ghi đè nhau. Chưa có `NOTION_HABITS_DB` thì Ghi nhanh giữ ô như cũ.
- Ngày chưa có bản ghi Daily Log → tích thói quen sẽ **tạo** bản ghi ngày đó (giống Ghi nhanh v0.2).

### 3.2 Tính toán

- `% thói quen trong tháng = số ngày đã tích / số ngày đã qua của tháng` (tháng hiện tại) hoặc / số ngày của tháng
  (tháng đã qua). Template chia cho cả tháng ngay từ đầu tháng → % thấp vô lý những ngày đầu; Brainrot chia cho số ngày đã qua.
- `% ngày = số thói quen đã tích trong ngày / số thói quen của tháng đó`.
- Chuỗi ngày liên tiếp (streak) hiện tại và dài nhất của từng thói quen.

### 3.3 Giao diện

- **Today:** thẻ "Thói quen hôm nay" — các ô tích, bấm là lưu (cập nhật lạc quan; lỗi thì hoàn tác + báo).
- **Trang Mục tiêu, chế độ Tháng:** bảng **thói quen × ngày trong tháng** (đúng 28–31 cột); ô tích được cho hôm nay và
  ngày đã qua, ngày tương lai mờ; cột % mỗi thói quen (màu theo ngưỡng: ≥ 70% xanh, 40–69% vàng, < 40% đỏ — cùng
  quy ước chấm màu Dashboard); hàng cột nhỏ % mỗi ngày phía trên; thanh ngang % theo thói quen bên phải.
  Mobile: bảng cuộn ngang, cột tên thói quen dính bên trái.
- **Quản lý thói quen** ngay trên web: thêm (Từ tháng = tháng đang xem), đổi thứ tự (nút lên/xuống),
  ngừng theo dõi **từ tháng sau** (Đến tháng = tháng đang xem). **Đổi tên làm trong Notion** (sửa cả dòng Habits và
  lựa chọn của cột "Thói quen") — Daily Log lưu theo tên, đổi tên trên web sẽ tách rời lịch sử.
- Bảng tự cuộn tới cột hôm nay; hàng cột nhỏ phía trên: ngày 0% là vạch xám, không tô đỏ.
- **Dashboard:** thẻ "Thói quen" cạnh "Nhịp hằng ngày" (hàng cuối, 1/3): % từng thói quen trong kỳ đang chọn (7/30/90)
  tính trên số ngày thói quen **được theo dõi** trong kỳ, % trung bình, chuỗi hiện tại + dài nhất. Có bản dữ liệu mẫu.

## 4. Mục tiêu xếp tầng

### 4.1 Dữ liệu — database **Goals**

| Thuộc tính | Kiểu | Ghi chú |
|---|---|---|
| Mục tiêu | Title | |
| Cấp | Select: Năm · Quý · Tháng · Tuần | |
| Kỳ | Date | Ngày đầu kỳ: 01/01 · 01/01, 01/04, 01/07, 01/10 · 01/MM · **thứ Hai** của tuần |
| Loại | Select: Ưu tiên · Thường | |
| Xong | Checkbox | Tích tay; hoặc tự xong (4.3) |
| Mục tiêu cha | Relation (Goals → Goals) | **Để sau v0.4** — biểu đồ kỳ con đã cho thấy quan hệ cha–con theo thời gian |
| Thói quen | Relation → Habits | Tùy chọn, kèm **Ngưỡng %** (Number) |
| Tasks | Relation Tasks ↔ Goals | Tùy chọn; bên Tasks có cột "Mục tiêu" |

**Tuần vắt qua 2 tháng** (vd. 29/12–04/01): một tuần = một bộ mục tiêu (định danh bằng thứ Hai), hiện ở **cả hai
tháng**. Template tách thành 2 bộ riêng ở Week cuối tháng 12 và Week 1 tháng 1 → dễ lệch nhau.

### 4.2 Bộ đếm và %

```
total      = số mục tiêu có tên (bỏ dòng trống)
completed  = số mục tiêu xong (4.3)
inProgress = total − completed
progress   = total ? round(completed / total × 100) : 0
```

- % của mỗi kỳ tính trên **danh sách mục tiêu của chính kỳ đó** (giống template). Không làm công tắc "cộng dồn"
  (rollup) — kỳ cha hiện thêm biểu đồ % các kỳ con để thấy bức tranh chung:
  Năm → 4 cột Quý + 12 cột Tháng · Quý → 3 cột Tháng · Tháng → các cột Tuần.
- Ưu tiên ở trên, Thường ở dưới, nhãn nhóm viết **dọc** (`writing-mode: vertical-rl`) như template, màu Brainrot.
- Khuyến nghị **≤ 3 mục tiêu Ưu tiên** mỗi kỳ (template dùng 3 Ưu tiên + 7 Thường): thêm cái thứ 4 → nhắc nhẹ, không chặn.
  Không giới hạn số mục tiêu Thường.

### 4.3 Khi nào một mục tiêu "xong"

1. Đã tích **Xong**; hoặc
2. Có gắn **Thói quen** + **Ngưỡng %**: % thói quen trong kỳ (3.2) ≥ ngưỡng (vd. "Viết nhật ký đạt 90% trong tháng");
3. Có gắn **Tasks**: mọi task gắn đã xong. Đang dở → hiện thanh "x/y task".

Tự xong **chỉ tính trên web**, không ghi ngược vào cột Xong (không đè lựa chọn tay của Trung). Mục tiêu tự xong có
nhãn nhỏ cho biết lý do ("theo thói quen" / "theo task").

### 4.4 Thao tác trên web

- Thêm nhanh (1 dòng + Enter, chọn Ưu tiên/Thường; trong nhóm sắp theo thời điểm tạo), **sửa tên tại chỗ**, tích/bỏ tích (gạch ngang khi xong),
  **đổi Ưu tiên ↔ Thường**, gắn thói quen + ngưỡng, **xóa** (chuyển vào Trash của Notion, có hoàn tác 5 giây).
- Gắn thói quen: nút 🔗 trên dòng mục tiêu → chọn thói quen (được theo dõi trong kỳ) + ngưỡng % (1–100, mặc định 80).
- Gắn task: trong form sửa task (Tasks) chọn "Mục tiêu" — mục tiêu Tháng/Tuần **hiện tại** chưa tích xong, cộng mục tiêu
  task đang gắn (để mở form không làm mất liên kết). Form gắn **1** mục tiêu; task gắn nhiều mục tiêu (sửa trong Notion)
  thì form giữ cái đầu.
- Mục tiêu tự xong: ô tích nhạt + chữ "tự xong", dưới tên ghi lý do ("Tập thể dục 82% / 80%", "3/3 task"); bấm ô tích vẫn
  tích tay được.

## 5. Nhìn lại (Reflection)

- Database **Reflections**: Cấp (Select Tuần/Tháng/Quý/Năm) · Kỳ (Date, như Goals) · 4 ô văn bản · **Châm ngôn** (chỉ cấp Năm).
- 4 câu hỏi, **câu 4 đổi chữ theo cấp**:
  1. Điều gì tôi đã làm tốt và muốn tiếp tục phát huy?
  2. Bài học quan trọng nhất tôi rút ra được là gì?
  3. Tôi biết ơn về điều gì?
  4. Ba mục tiêu tôi cần tập trung trong **tuần / tháng / quý / năm** tiếp theo là?
- 1 bản ghi / kỳ: đã có → mở ra thấy sẵn, lưu = cập nhật (giống Daily Log). Mỗi ô ≤ 2000 ký tự.
- Câu 4 của kỳ trước hiện nhỏ ở đầu kỳ sau ("Kỳ trước bạn định tập trung: …").
- **Châm ngôn năm** hiện ở đầu trang Mục tiêu (chế độ Năm) và dưới tiêu đề Dashboard.

## 6. Trang mới `/goals` ("Mục tiêu") *(đề xuất — mục 10 câu 2)*

### 6.1 Điều hướng

- Sidebar: Dashboard · Brain · Today · Tasks · **Mục tiêu** · Planner (icon `Target`).
- Thanh trên: chọn **Năm / Quý / Tháng / Tuần** + ‹ › đổi kỳ + "Hôm nay". Đổi cấp giữ ngữ cảnh (đang xem tháng 10 →
  bấm Năm ra năm đó; nếu kỳ đang xem chứa hôm nay thì lấy kỳ chứa hôm nay). Kỳ hiện tại tự lấy theo ngày hôm nay
  (giờ VN), không cần ô "Current Month/Week" nhập tay như template. URL giữ kỳ đang xem:
  `/goals?level=month&period=2026-10` (`2026`, `2026-Q4`, `2026-10`, `2026-W44` theo ISO week).

### 6.2 Lịch

- Tuần bắt đầu **Thứ Hai**. Tuần 1 của tháng = tuần chứa ngày 1; mỗi tháng có **4–6 tuần**.
- Mọi ngày sinh theo năm đang xem bằng `date-fns`, tính theo Asia/Ho_Chi_Minh. Quý: Q1 = tháng 1–3 … Q4 = 10–12.

### 6.3 Nội dung từng chế độ

| Chế độ | Nội dung |
|---|---|
| **Năm** | Châm ngôn · bộ đếm + vòng tròn % mục tiêu năm · biểu đồ 4 quý + 12 tháng · 4 thẻ quý nhỏ (% + mục tiêu Ưu tiên) · Nhìn lại năm |
| **Quý** | Bộ đếm + vòng tròn % · danh sách mục tiêu quý · 3 thẻ tháng (% + mục tiêu Ưu tiên) · Nhìn lại quý |
| **Tháng** | Bộ đếm + vòng tròn % · mục tiêu tháng · biểu đồ % các tuần · **bảng thói quen** (3.3) · Nhìn lại tháng |
| **Tuần** | Bộ đếm + vòng tròn % · mục tiêu tuần · **7 thẻ ngày** Thứ Hai → Chủ nhật · Nhìn lại tuần |

**Thẻ ngày (chế độ Tuần)** — chỉ **đọc** dữ liệu đã có, không thêm danh sách task thứ ba:
- Task Notion có **Deadline** hoặc **Ngày xong** rơi vào ngày đó (tích xong được ngay tại đây);
- Các ô Planner của ngày đó (đọc store Planner ở trình duyệt, như Dashboard);
- Ghi chú ngày = Daily Log (Xong · Rơi / chưa xong) — bấm để mở Ghi nhanh của ngày đó;
- % ngày = (task Notion xong + ô Planner xong) / tổng; ngày ngoài tháng/tuần vẫn hiện (tuần là tuần đầy đủ).
- Desktop: 7 thẻ ngang; mobile: danh sách dọc, ngày hôm nay mở sẵn.

### 6.4 Component

Dùng lại `Card`, `@reui/badge`, shadcn `chart` (vòng tròn = RadialBar/Pie), `progress`, `DeadlineField`, token màu Brainrot.

## 7. Dashboard & Today

- Dashboard: thẻ **"Mục tiêu tháng này"** (vòng tròn % + mục tiêu Ưu tiên + số mục tiêu thường) ở hàng 2, cột phải xếp
  chồng trên "Dự án Planner" (cạnh "Task theo dự án") — cùng nhóm "việc cần làm"; chế độ Thật chưa đặt mục tiêu → link
  "Đặt mục tiêu" (không dùng mẫu). Thẻ **"Thói quen"** (3.3). Châm ngôn năm dưới tiêu đề (bước 5).
- Today: thẻ "Thói quen hôm nay"; mục tiêu tuần Ưu tiên hiện ở cuối thẻ "3 việc hôm nay" (✓ khi xong, kể cả tự xong).

## 8. Ngoài phạm vi v0.4

- Kéo thả sắp xếp mục tiêu (cần cột "Thứ tự" + mở rộng `@dnd-kit` ra ngoài Planner) — để sau.
- Nối Planner (localStorage) ghi ngược vào Goals; nhắc nhở / thông báo; mục tiêu dạng số đo ("tiết kiệm 20 triệu"
  theo số tiền); bỏ hẳn cột checkbox "Tập thể dục".
- Từ template, **không làm**: dải họa tiết, emoji trái cây từng ngày, ảnh banner, mascot, font viết tay, ô
  "Current Month/Week" nhập tay.

## 9. Kiểm thử (vitest)

- Lịch: tháng 2/2026 có **28** ngày; 01/01/2026 là **Thứ Năm**, nằm ở Tuần 1; tháng có 6 tuần hiện đủ Tuần 1–6;
  tuần 29/12/2025–04/01/2026 là cùng một tuần ở cả tháng 12 và tháng 1.
- Bộ đếm: tích 4/10 mục tiêu → Xong 4 · Đang làm 6 · Tổng 10 · 40%; dòng trống không tính.
- Thói quen: % theo số ngày đã qua; thói quen ngừng ("Đến tháng") không hiện ở tháng sau nhưng tháng cũ còn dữ liệu;
  ngày cũ chỉ có checkbox "Tập thể dục" vẫn được tính.
- Tự xong: theo ngưỡng thói quen; theo task gắn (đủ / thiếu).
- Câu 4 Nhìn lại đổi chữ đúng theo cấp.

## 10. Câu hỏi Trung cần chốt

1. Thói quen lưu bằng database **Habits** + cột multi-select **"Thói quen"** trong Daily Log (3.1)? *(đề xuất: có)*
2. Trang riêng **`/goals`** trong sidebar (6)? *(đề xuất: có)*
3. Thói quen ban đầu? *(gợi ý: Tập thể dục (đã có), Đọc sách, Viết nhật ký, Học tiếng Anh, Ngủ trước 0h — Trung sửa)*
4. Thứ tự làm: **Thói quen → Mục tiêu → Nhìn lại → Thẻ ngày (chế độ Tuần)**? *(đề xuất: có)*

## 11. Tiêu chí hoàn thành v0.4

1. Tích thói quen trên Today → Daily Log đúng ngày, đúng giá trị; bảng tháng và Dashboard hiện đúng %.
2. Thêm/ngừng thói quen trên web → tháng sau tự có / tự ẩn; lịch sử tháng cũ không mất.
3. Tạo / sửa / tích / đổi loại / xóa mục tiêu ở cả 4 cấp; bộ đếm và % đúng 4.2; tự xong đúng 4.3.
4. Nhìn lại lưu/sửa được cho 4 cấp, câu 4 đúng chữ; câu 4 kỳ trước hiện ở kỳ sau; châm ngôn hiện ở Dashboard.
5. Chế độ Tuần hiện 7 thẻ ngày với task Notion + Planner + Daily Log, không nhập lại.
6. Các test mục 9 qua; lint + build sạch; ảnh 1440×900 sáng/tối + mobile cho mỗi bước.
