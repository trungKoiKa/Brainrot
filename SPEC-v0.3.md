# SPEC — Second Brain Web v0.3: Dashboard

> Bổ sung cho `SPEC.md` (v0.1) và `SPEC-v0.2.md`. Mục nào không nhắc ở đây thì giữ nguyên.
>
> **Trạng thái:** Trung duyệt 26/10/2026 (đồng ý cả 4 đề xuất mục 10). Đã triển khai, chờ Trung test — xem `docs/plans/active/v0.3.md`.
> Cảm hứng: ảnh dashboard mẫu của ReUI (Trung gửi 26/10/2026) — 4 thẻ số liệu có sparkline, biểu đồ cột,
> biểu đồ vùng, biểu đồ cột dày theo ngày và danh sách có thanh tiến độ.

## 1. Mục tiêu

Một trang **nhìn tổng quan** sức làm việc và học tập của Trung: đang tồn bao nhiêu việc, tuần này làm được bao
nhiêu, học được gì, nhịp hằng ngày ra sao. Trang chỉ **đọc**; thêm/sửa vẫn ở Today, Tasks, Planner, Notion.

## 2. Ràng buộc

| Ràng buộc | v0.2 | v0.3 |
|---|---|---|
| Thời gian / đồ án | Thấy lấn đồ án → "tạm dừng" | Trung chọn **làm tiếp** dù đang làm đồ án (26/10/2026) |
| Chi phí | 0 đồng | **Giữ 0 đồng.** Chỉ dùng phần **miễn phí** của ReUI (component + example `c-*`); block dashboard trả phí (Pro) **không dùng** |
| Dependency | `zustand`, `@dnd-kit/*`, `date-fns` (Planner); shadcn + ReUI (từ 26/10) | Thêm **`recharts`** qua shadcn `chart` — chỉ dùng trong Dashboard |
| Database riêng | Không | Vẫn **không** |
| Schema Notion | Không đổi | Thêm thuộc tính **"Ngày xong"** (Date) vào Tasks — xem mục 6 |

## 3. Điều hướng *(chốt 26/10/2026)*

- Trang mới **`/dashboard`**, tiêu đề "Dashboard", mô tả "Tổng quan việc và học tập."
- Sidebar: **Brain · Dashboard · Today · Tasks · Planner**, icon `LayoutDashboard` (lucide).
- Trang chủ `/` **vẫn là Brain**.

## 4. Bố cục (desktop 1440px; mobile xếp một cột)

Ánh xạ từ ảnh mẫu sang dữ liệu Brainrot:

| Ảnh mẫu | Dashboard Brainrot |
|---|---|
| Ô chọn khoảng ngày + nút Export | Bộ chọn kỳ **7 ngày · 30 ngày · 90 ngày** (mặc định 30) + công tắc **Dữ liệu: Thật / Mẫu**. Bỏ Export |
| 4 thẻ Signal Risk / Mesh Uptime / Edge Traffic / Sensor Reach | 4 thẻ số liệu (mục 4.1) |
| Threat Vectors (cột đôi theo nhóm) | **Task theo dự án** (mục 4.2) |
| Network Flow (2 đường vùng theo tháng) | **Nhịp làm & học** theo tuần (mục 4.3) |
| Cluster Load (cột dày, màu theo mức) | **Nhịp hằng ngày** từ Daily Log (mục 4.4) |
| Active Lanes (danh sách + thanh tiến độ) | **Dự án Planner tuần này** (mục 4.5) |

Hàng 1: 4 thẻ. Hàng 2: 4.2 (rộng 1/2) + 4.3 (1/2). Hàng 3: 4.4 (2/3) + 4.5 (1/3).

### 4.1 Thẻ số liệu (4 thẻ)

Mỗi thẻ: tên + phụ đề nhỏ, chấm trạng thái, **số lớn**, sparkline của kỳ đang chọn, dòng dưới có huy hiệu
tăng/giảm so với kỳ trước + một ghi chú ngắn.

| Thẻ | Số lớn | Sparkline | Huy hiệu / ghi chú | Chấm |
|---|---|---|---|---|
| **Việc tồn** · Notion Tasks | Số task chưa xong | Số task tồn theo ngày* | ±% so với kỳ trước · "N quá hạn" | đỏ nếu có task quá hạn, vàng nếu có task hạn ≤ 3 ngày, xanh nếu không |
| **Hoàn thành** · task xong | Số task xong trong kỳ | Task xong theo ngày* | ±% · "TB N/ngày" | xanh nếu ≥ kỳ trước, vàng nếu thấp hơn |
| **Planner** · tuần này | % slot đã xong tuần này | % hoàn thành các tuần đã lưu trữ | ±điểm % so với tuần trước · "x/y slot" | theo % (≥ 70 xanh, 40–69 vàng, < 40 đỏ) |
| **Đồ án** · hạn nộp | "Còn N ngày" | Daily Log có ghi theo ngày | "Ghi log N/M ngày" · ngày hạn `dd/mm` | đỏ ≤ 14 ngày, vàng ≤ 30, xanh còn lại |

\* cần "Ngày xong" (mục 6); chưa có → dùng dữ liệu mẫu và gắn nhãn "Mẫu".

### 4.2 Task theo dự án (biểu đồ cột)

- Mỗi dự án (thứ tự như select "Dự án": Đồ án, Học AI, Sản phẩm, Sức khỏe, Thực tập, Khác, rồi "Không có dự án")
  là một nhóm 2 cột: **Đang làm** và **Chưa làm** (task chưa xong, không phụ thuộc kỳ).
- Chú thích ở góc phải. Dự án không có task chưa xong → ẩn nhóm. Bấm nhóm → mở `/tasks` lọc theo dự án đó
  qua `/tasks?project=` *(chốt)*; dự án đang lọc luôn có chip trên Tasks, kể cả khi không còn task mở.

### 4.3 Nhịp làm & học (biểu đồ vùng)

- Trục X: **12 tuần gần nhất** (nhãn "dd/mm" của thứ Hai). Hai đường vùng:
  - **Task xong** mỗi tuần (cần "Ngày xong"; chưa có → mẫu).
  - **Kiến thức mới** mỗi tuần (Knowledge theo `Ngày học`, rơi về ngày tạo trang nếu trống) — dữ liệu thật.
- Huy hiệu góc phải: ±% tổng 4 tuần gần nhất so với 4 tuần trước đó.

### 4.4 Nhịp hằng ngày (cột dày)

- Mỗi cột = 1 ngày trong kỳ đang chọn. Chiều cao = **số dòng ở mục "Xong"** của Daily Log ngày đó
  (đếm dòng không rỗng). Không có log → cột xám thấp.
- Màu: thường = xám trung tính; **có tập thể dục** = màu lĩnh vực 3 (xanh lá); **ngày có "Rơi / chưa xong"** = vàng.
  Huy hiệu tóm tắt góc phải: "N ngày có log · N ngày tập · N ngày rơi việc".
- Đọc Daily Log theo kỳ (hiện code chỉ lấy 7 bản ghi gần nhất → mở rộng truy vấn tới 90 ngày, vẫn cache 5 phút).

### 4.5 Dự án Planner tuần này (danh sách tiến độ)

- Từng dự án trong Planner: chấm màu, tên, số slot xong/tổng, thanh tiến độ + %. Sắp xếp theo % tăng dần
  (dự án chậm nhất ở trên). Tối đa 5 dòng, còn lại "+N dự án".
- Dữ liệu Planner nằm trong `localStorage` → khối này **chạy ở trình duyệt** (đọc store zustand của Planner),
  thiết bị khác sẽ thấy khác. Chưa có dự án → "Chưa có dự án Planner tuần này" + link `/planner`.

## 5. Dữ liệu mẫu

- `lib/dashboard/sample.ts`: sinh dữ liệu **cố định theo seed** (cùng ngày → cùng số liệu, không nhảy khi tải lại),
  tính lùi từ hôm nay, đủ cho mọi khối ở kỳ 90 ngày: task (6 dự án, trạng thái, ưu tiên, deadline, ngày xong),
  kiến thức theo tuần, Daily Log 90 ngày (có/không log, tập, rơi việc), Planner (4 dự án, 12 tuần lưu trữ).
  Số liệu "hợp lý" với Trung: 2–6 task xong/ngày làm việc, cuối tuần ít hơn, dồn việc Đồ án gần hạn 06/12.
- **Công tắc Thật / Mẫu** ở đầu trang: Mẫu → mọi khối dùng dữ liệu mẫu (để xem trang "đầy" và để demo).
  Thật → dùng Notion + Planner; khối nào thiếu nguồn thật thì tự dùng mẫu và gắn huy hiệu **"Mẫu"** cạnh tiêu đề.
- Mặc định **Thật** *(chốt)*; lựa chọn (và kỳ) nhớ trong `localStorage`. Dữ liệu mẫu **không bao giờ ghi vào Notion**.

## 6. "Ngày xong" cho Tasks *(chốt 26/10/2026)*

- Thuộc tính **Date "Ngày xong"** đã thêm vào database Tasks qua Notion MCP (26/10/2026).
- Khi tích xong trên web (`markTaskDone`) → ghi Ngày xong = hôm nay (giờ VN). Sửa trạng thái về Chưa làm/Đang làm
  trên web → xóa Ngày xong. Tích trong Notion thì Trung tự điền (hoặc để trống; task xong không có Ngày xong
  → không tính vào biểu đồ theo thời gian, vẫn tính vào số tồn).
- Dữ liệu cũ: task đã xong trước v0.3 không có ngày → biểu đồ chỉ "thật" dần từ ngày bật tính năng.

## 7. Giao diện

- Màu từ token Brainrot (`--chart-1..5` = 4 màu lĩnh vực + xám), có sẵn cho cả 2 theme; không hard-code màu.
- Khung: dùng `Card` sẵn có của Brainrot cho mọi khối (một kiểu khung cho cả trang, giống Today).
- Component: shadcn `chart` (recharts) cho biểu đồ, theo mẫu ReUI `c-chart-1` (cột), `c-chart-13` (vùng gradient);
  `@reui/badge` cho huy hiệu ±% và trạng thái; `c-card-15` làm mẫu bố cục thẻ số liệu; shadcn `progress` cho 4.5.
- Tooltip khi rê chuột trên biểu đồ (ngày/tuần + giá trị). Số dùng định dạng `vi-VN`. Biểu đồ client-only
  (dynamic import `ssr: false` nếu recharts gây lệch SSR).
- Không hiệu ứng chuyển động ngoài mặc định của recharts; tôn trọng `prefers-reduced-motion`.

## 8. Kỹ thuật

- Trang server lấy Notion qua `lib/notion/` như các trang khác (cache 5 phút, `StaleBanner` khi Notion lỗi).
- Tính toán gom nhóm (theo ngày/tuần/dự án, ±% kỳ trước, màu chấm) ở `lib/dashboard/*.ts` — hàm thuần, có vitest.
- Khối Planner đọc store client; component biểu đồ là client component nhận dữ liệu đã tính sẵn.

## 9. Ngoài phạm vi v0.3

- Export / tải báo cáo; chọn khoảng ngày tùy ý (chỉ 7/30/90).
- Đồng bộ Planner giữa thiết bị; nối Planner ↔ Notion Tasks.
- Kanban cho Tasks (vẫn ở Follow-ups v0.2). LLM (vẫn chờ ngân sách).

## 10. Câu hỏi đã chốt (26/10/2026: đồng ý cả 4)

1. Đặt Dashboard ở `/dashboard`, sidebar sau Brain? *(đề xuất: có; trang chủ vẫn Brain)*
2. Thêm thuộc tính "Ngày xong" vào Notion Tasks (mục 6)? *(đề xuất: có — không có thì 2 khối luôn là mẫu)*
3. Công tắc Thật/Mẫu mặc định "Thật"? *(đề xuất: có)*
4. Bấm nhóm cột ở 4.2 → mở Tasks lọc theo dự án? *(đề xuất: có, việc nhỏ)*

## 11. Tiêu chí hoàn thành v0.3

1. `/dashboard` có đủ 6 khối mục 4, đúng ở 2 theme và mobile; sidebar có mục Dashboard.
2. Chế độ Mẫu: mọi khối có dữ liệu, không lỗi; tải lại cùng ngày → số liệu giống hệt.
3. Chế độ Thật: số liệu khớp Notion/Planner (đối chiếu tay ít nhất thẻ Việc tồn, Task theo dự án, Planner);
   khối thiếu nguồn thật có huy hiệu "Mẫu".
4. Notion lỗi → banner dữ liệu cũ, trang vẫn hiện.
5. Lint + build + test sạch; ảnh 1440×900 sáng/tối cho từng bước.
