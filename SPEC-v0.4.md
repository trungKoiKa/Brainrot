# SPEC — Second Brain Web v0.4: Mục tiêu · Thói quen · Nhìn lại

> Bổ sung cho `SPEC.md`, `SPEC-v0.2.md`, `SPEC-v0.3.md`. Mục nào không nhắc ở đây thì giữ nguyên.
>
> **Trạng thái:** NHÁP 26/10/2026 — chờ Trung duyệt. Mục 9 là các câu Trung cần chốt.
> Cảm hứng: template **Clarity Yearplan / Monthplan** của GON.LIFE (Google Sheets, bán có phí) — Trung gửi 4 ảnh
> giới thiệu + bản demo công khai "Clarity Monthplan - Demo Ver" (chỉ có tab "Tháng 1"). Brainrot lấy **ý tưởng**
> (mục tiêu xếp tầng, theo dõi thói quen, câu hỏi nhìn lại); **không** chép bố cục, hình minh họa hay chữ của template.

## 1. Mục tiêu

Thêm tầng "dài hạn" mà Brainrot còn thiếu, nối với tầng "hằng ngày" đã có (Tasks, Planner, Daily Log):

1. **Thói quen (Habit tracker):** nhiều thói quen, tích mỗi ngày, xem % theo thói quen và theo ngày.
2. **Mục tiêu xếp tầng:** Năm → Quý → Tháng → Tuần, chia **Ưu tiên / Thường**, có % hoàn thành cộng dồn lên trên.
3. **Nhìn lại (Reflection):** 4 câu hỏi cố định cho mỗi tuần / tháng / quý / năm.

Hơn template: dữ liệu ở Notion (đồng bộ máy ↔ điện thoại), mục tiêu **tự xong** khi thói quen đạt ngưỡng hoặc khi
các task gắn với nó xong — không phải tích tay mọi thứ.

## 2. Ràng buộc

| Ràng buộc | v0.3 | v0.4 |
|---|---|---|
| Chi phí | 0 đồng | Giữ 0 đồng |
| Database riêng | Không | Vẫn **không** — mọi dữ liệu mới ở **Notion** |
| Schema Notion | Thêm "Ngày xong" (Tasks) | Thêm **checkbox thói quen** vào Daily Log, database mới **Goals** và **Reflections**, relation Tasks → Goals (mục 3–5) |
| Dependency | recharts (Dashboard) | Không thêm |
| Thời gian | Trung chọn làm tiếp dù đang làm đồ án | Như v0.3 |

## 3. Thói quen

### 3.1 Dữ liệu *(đề xuất — mục 9 câu 1)*

- **Mỗi thói quen = một thuộc tính Checkbox trong database Daily Log** (đã là "1 trang / ngày"). "Tập thể dục"
  hiện có trở thành thói quen đầu tiên. Thêm/bớt thói quen = thêm/bớt cột checkbox trong Notion (Trung tự làm trong
  Notion, hoặc agent làm qua Notion MCP). Web tự nhận mọi cột checkbox của Daily Log là thói quen, thứ tự theo schema.
- Lý do chọn: không thêm database, không nhân số trang (10 thói quen × 365 ngày nếu tách bảng), Ghi nhanh Daily Log
  đã có sẵn đường ghi "1 bản ghi / ngày".
- Ngày chưa có bản ghi Daily Log → tích thói quen sẽ **tạo** bản ghi ngày đó (giống Ghi nhanh v0.2).

### 3.2 Giao diện

- **Today:** thẻ "Thói quen hôm nay" — danh sách ô tích, bấm là lưu ngay (cập nhật lạc quan, lỗi thì hoàn tác + báo).
- **Trang Mục tiêu, chế độ Tháng** (mục 6): lưới **thói quen × ngày trong tháng** (ô tích được cho hôm nay và các
  ngày đã qua; ngày tương lai mờ), cột % mỗi thói quen, hàng % mỗi ngày, thanh ngang % theo thói quen.
- **Dashboard:** thẻ "Thói quen" thay vai trò màu "có tập" của khối Nhịp hằng ngày: % từng thói quen trong kỳ đang
  chọn (7/30/90) + chuỗi ngày liên tiếp (streak) dài nhất. Có bản dữ liệu mẫu như các khối khác.

## 4. Mục tiêu xếp tầng

### 4.1 Dữ liệu — database Notion mới **Goals** *(agent tạo qua Notion MCP sau khi duyệt)*

| Thuộc tính | Kiểu | Ghi chú |
|---|---|---|
| Mục tiêu | Title | |
| Cấp | Select: Năm · Quý · Tháng · Tuần | |
| Kỳ | Date | Ngày đầu kỳ: 01/01, 01/04…, 01/MM, thứ Hai của tuần |
| Loại | Select: Ưu tiên · Thường | Template dùng đúng 2 loại này; đơn giản hơn Cao/Vừa/Thấp |
| Xong | Checkbox | Tích tay; hoặc tự xong (4.2) |
| Mục tiêu cha | Relation (Goals → Goals) | Tùy chọn: mục tiêu tháng thuộc mục tiêu quý… |
| Thói quen | Select (tên thói quen) | Tùy chọn, kèm **Ngưỡng %** (Number) |
| Tasks | Relation Tasks ↔ Goals | Tùy chọn; thêm cột "Mục tiêu" bên Tasks |

### 4.2 Khi nào một mục tiêu "xong"

1. Đã tích **Xong**; hoặc
2. Có gắn **Thói quen** + **Ngưỡng %**: % thói quen trong kỳ ≥ ngưỡng (vd. "Viết nhật ký đạt 90% trong tháng");
3. Có gắn **Tasks**: mọi task gắn đã xong. Đang làm dở → hiện thanh "x/y task".

Mục tiêu tự xong **chỉ tính trên web**, không ghi ngược vào cột Xong (tránh ghi đè lựa chọn tay của Trung).

### 4.3 % cộng dồn

- % của một kỳ = số mục tiêu xong / tổng mục tiêu của kỳ đó.
- Kỳ cha hiện thêm % các kỳ con: Năm → 4 cột Quý + 12 cột Tháng; Quý → 3 cột Tháng; Tháng → các cột Tuần.
- Mục tiêu Ưu tiên đứng trên, Thường ở dưới; có số "Xong / Đang làm / Tổng".

## 5. Nhìn lại (Reflection)

- Database Notion mới **Reflections**: Kỳ (Select Tuần/Tháng/Quý/Năm), Ngày đầu kỳ (Date), 4 ô văn bản:
  1. Điều gì tôi đã làm tốt và muốn tiếp tục?
  2. Bài học quan trọng nhất tôi rút ra là gì?
  3. Tôi biết ơn về điều gì?
  4. Ba điều cần tập trung ở kỳ tiếp theo?
- 1 bản ghi / kỳ: đã có → mở ra thấy sẵn, lưu = cập nhật (giống Daily Log). Mỗi ô ≤ 2000 ký tự.
- "Ba điều cần tập trung" của kỳ trước hiện nhỏ ở đầu kỳ sau (giống "Ngày mai 3 việc" → "3 việc hôm nay").

## 6. Trang mới `/goals` ("Mục tiêu") *(đề xuất — mục 9 câu 2)*

- Sidebar: Dashboard · Brain · Today · Tasks · **Mục tiêu** · Planner (icon `Target`).
- Thanh trên: chọn **Năm / Quý / Tháng / Tuần** + nút ‹ › đổi kỳ + "Hôm nay".
- Mỗi chế độ: thẻ % (vòng tròn) + danh sách mục tiêu (Ưu tiên/Thường, tích được, thêm nhanh 1 dòng) + biểu đồ kỳ con
  + Nhìn lại. Chế độ **Tháng** thêm lưới thói quen (3.2). Chế độ **Tuần** thêm các task Notion có deadline trong tuần.
- Component: dùng lại `Card`, `@reui/badge`, shadcn `chart` (vòng tròn = RadialBar / Pie), `progress`, `DeadlineField`.

## 7. Dashboard & Today

- Dashboard: thêm thẻ **"Mục tiêu tháng này"** (vòng tròn % + 3 mục tiêu Ưu tiên) và thẻ **"Thói quen"** (3.2).
  Bố cục cụ thể chốt khi làm, giữ thứ tự "số liệu → việc → học → nhịp".
- Today: thẻ "Thói quen hôm nay"; mục tiêu tuần Ưu tiên hiện dưới "3 việc hôm nay".

## 8. Ngoài phạm vi v0.4

- Nối Planner (localStorage) với Goals; nhắc nhở / thông báo; mục tiêu dạng số đo (vd. "tiết kiệm 20 triệu" theo
  tiến độ số tiền) — chỉ có Xong / chưa xong; nhiều người dùng.

## 9. Câu hỏi Trung cần chốt

1. Thói quen lưu bằng **cột checkbox trong Daily Log** (3.1)? *(đề xuất: có — ít đổi nhất, không thêm database)*
2. Trang riêng **`/goals`** trong sidebar (6)? *(đề xuất: có)*
3. Ban đầu theo dõi những thói quen nào? *(gợi ý: Tập thể dục (đã có), Đọc sách, Viết nhật ký, Học tiếng Anh, Ngủ trước 0h — Trung sửa danh sách)*
4. Thứ tự làm: **Thói quen → Mục tiêu → Nhìn lại**? *(đề xuất: có — thói quen nhỏ nhất, dùng được ngay)*

## 10. Tiêu chí hoàn thành v0.4

1. Tích thói quen trên Today → Notion Daily Log đúng ngày, đúng cột; lưới tháng và Dashboard hiện đúng %.
2. Thêm cột checkbox mới trong Daily Log → web tự hiện thói quen mới (sau tối đa 5 phút cache).
3. Tạo/tích mục tiêu ở cả 4 cấp; % kỳ cha đúng với kỳ con; mục tiêu gắn thói quen/task tự xong đúng 4.2.
4. Nhìn lại lưu/sửa được cho cả 4 cấp; "3 điều cần tập trung" hiện ở kỳ sau.
5. Lint + build + test (hàm tính % và tự xong có vitest); ảnh 1440×900 sáng/tối + mobile cho mỗi bước.
