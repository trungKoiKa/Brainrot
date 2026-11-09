---
name: Brainrot
description: Sổ tay hằng ngày gom việc, mục tiêu và thói quen của một sinh viên năm cuối.
colors:
  paper: "#f6f4ef"
  paper-dark: "#141413"
  surface: "#ffffff"
  surface-dark: "#1d1c1a"
  surface-muted: "#efece5"
  surface-muted-dark: "#262522"
  line: "#e2ddd3"
  line-dark: "#34322e"
  ink: "#1f1d1a"
  ink-dark: "#ece9e2"
  ink-muted: "#6f6a61"
  ink-muted-dark: "#9c978d"
  indigo-signal: "#3b5bdb"
  indigo-signal-dark: "#91a7ff"
  indigo-wash: "#e5eafb"
  indigo-wash-dark: "#232a45"
  danger: "#c92a2a"
  danger-dark: "#ff8787"
  danger-soft: "#fdecec"
  danger-soft-dark: "#3a1f1f"
  good: "#2f7d32"
  good-dark: "#6cc36c"
  field-blue: "#2a78d6"
  field-pink: "#e87ba4"
  field-green: "#008300"
  field-amber: "#eda100"
  field-neutral: "#a19d94"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
  title:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-signal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
  button-danger-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  button-danger-ghost-hover:
    backgroundColor: "{colors.danger-soft}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  field-badge:
    textColor: "{colors.field-blue}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.label}"
  card-frame:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: Brainrot

## Overview

**Creative North Star: "Sổ tay của sinh viên" (The Student's Desk Notebook)**

Brainrot là cuốn sổ nằm sẵn trên bàn học: nền giấy kem ấm, tiêu đề chữ có chân như viết nắn nót, nội dung chữ không chân
gọn gàng để đọc nhanh. Mỗi trang trả lời một câu hỏi (hôm nay làm gì, tôi có việc gì, đang hướng tới đâu, làm có tốt
không), nên mỗi màn chỉ có một tiêu đề lớn và các khung nội dung xếp thoáng bên dưới.

Cảm giác **mềm và thân thiện** (Trung chốt 06/11/2026): góc bo rõ, màu nền chuyển lớp nhẹ, nhấn màu ít. Mật độ ở mức
công cụ dùng hằng ngày: chữ nội dung 14px, khoảng trắng rộng giữa các khung, không nhồi số liệu. Màu chỉ dùng để mang
nghĩa (đang chọn, trễ hạn, đã xong, thuộc lĩnh vực nào), không để trang trí.

Có hai theme sáng và tối ngang hàng. Theme tối là "sổ trong đêm": nền than ấm, không phải đen xanh lạnh.

**Key Characteristics:**
- Nền giấy kem (sáng) / than ấm (tối), khung nội dung trắng hoặc xám ấm nổi lên trên.
- Tiêu đề Lora (serif), nội dung Inter (sans), cả hai có bộ ký tự tiếng Việt.
- Một màu nhấn duy nhất: Xanh chàm.
- Bốn màu Lĩnh vực cố định, dùng chung giữa badge, biểu đồ và graph.
- Khung lồng nhau (Frame ReUI) bo 12px, chiều sâu bằng lớp màu chứ không bằng bóng.

## Colors

Bảng màu giấy và mực: trung tính ấm làm nền, một xanh chàm làm tín hiệu, bốn màu phân loại cho Lĩnh vực / Dự án.
Mọi màu khai báo bằng CSS variable trong `app/globals.css`; mỗi token có cặp giá trị sáng (key thường) và tối (hậu tố `-dark`).

### Primary
- **Xanh chàm** (Indigo Signal, `indigo-signal` / `indigo-signal-dark`): nút chính, link, mục sidebar đang chọn, vòng
  focus, số ngày còn lại đến hạn đồ án. **Xanh chàm nhạt** (`indigo-wash`) làm nền cho vùng đang chọn.

### Neutral
- **Giấy kem / Than ấm** (`paper`): nền trang.
- **Mặt khung** (`surface`): nền panel bên trong khung, popover, sidebar.
- **Giấy xám** (`surface-muted`): nền hover, nút phụ, viền ngoài của Frame (ở 50%).
- **Kẻ dòng** (`line`): viền khung, viền ô nhập, đường phân cách.
- **Mực** (`ink`) và **Mực nhạt** (`ink-muted`): chữ chính và chữ phụ (mô tả, nhãn, trạng thái trống).

### Trạng thái
- **Đỏ trễ hạn** (`danger`, nền `danger-soft`): quá hạn, lỗi, xác nhận xoá.
- **Xanh ổn** (`good`): trạng thái tốt (huy hiệu, chấm). Tách khỏi `field-green` để chỉnh riêng cho nền tối.

### Tertiary: màu Lĩnh vực / Dự án
- **Xanh dương** (`field-blue`), **Hồng** (`field-pink`), **Xanh lá** (`field-green`), **Hổ phách** (`field-amber`),
  **Xám** (`field-neutral`). Giá trị theme tối nằm trong `app/globals.css`. Ánh xạ: `lib/fields.ts`, lý do:
  `docs/decisions/0003-field-colors.md`. Cũng là `--chart-1..5` cho Recharts.

### Named Rules
**The One Ink Rule.** Xanh chàm là màu nhấn duy nhất. Không thêm màu thương hiệu thứ hai; cần phân biệt thì dùng màu Lĩnh vực.

**The Four Fields Rule.** Chỉ 4 màu Lĩnh vực được validator xác nhận phân biệt được; mọi lĩnh vực khác là xám và phải có
nhãn chữ đi kèm. Trên nền tối, CVD ΔE chỉ 6.9, nên màu không bao giờ là cách nhận diện duy nhất.

**The Token-Only Rule.** Component không viết mã màu cứng; chỉ dùng token (`bg-surface`, `text-muted-foreground`,
`var(--field-1)`), để cả hai theme luôn đúng.

## Typography

**Display Font:** Lora (dự phòng Georgia, serif)
**Body Font:** Inter (dự phòng system-ui, sans-serif)

**Character:** Lora mang nét viết tay chỉn chu của tiêu đề sổ; Inter trung tính, rõ ở cỡ nhỏ cho danh sách việc. Cả hai
nạp qua `next/font` với subset `vietnamese`.

### Hierarchy
- **Display** (Lora 600, 1.875rem → 2.25rem từ md): tiêu đề trang (`PageHeader`), mỗi màn một lần.
- **Headline** (Lora 600, 1.5rem): số lớn trên KPI, tiêu đề màn đăng nhập.
- **Title** (Lora 600, 1.125rem): tiêu đề khung (`Card`), tên mục tiêu; bản nghiêng màu mực nhạt cho châm ngôn năm.
- **Body** (Inter 400, 0.875rem): gần như toàn bộ nội dung, dòng task, ô nhập, nút.
- **Label** (Inter 500, 0.75rem): badge Lĩnh vực, ngày trong sidebar, chú thích biểu đồ.

### Named Rules
**The Serif-Means-Heading Rule.** Lora chỉ dùng cho tiêu đề và số nổi bật; mọi chữ thao tác (nút, ô nhập, danh sách) là Inter.

**The Tabular Numbers Rule.** Số đếm (KPI, ngày còn lại, phần trăm) dùng `tabular-nums` để không nhảy khi đổi giá trị.

## Layout

- **Khung app:** sidebar trái (thu gọn được thành cột icon, nhớ trong cookie `sidebar_state`), bên phải là thanh trên
  cao 48px, dính đầu trang, nền giấy mờ 85% có blur, rồi vùng nội dung.
- **Vùng nội dung:** đệm 16px ngang / 24px dọc trên mobile, 40px / 40px từ md. Tiêu đề trang cách nội dung 32px.
- **Lưới:** khung xếp bằng grid/flex với khoảng cách 16–24px; Dashboard và Today dùng lưới nhiều cột trên desktop, một cột trên mobile.
- **Desktop-first:** chuẩn là ≥ 1280px. Dưới 768px sidebar thành ngăn kéo mở từ thanh trên; graph không cần đẹp trên mobile.
- **Nhịp khoảng cách:** bậc 4 / 8 / 16 / 24 / 40px (Tailwind `1 / 2 / 4 / 6 / 10`).

## Elevation & Depth

Chiều sâu chủ yếu bằng **lớp màu**: giấy (`paper`) → viền Frame xám ấm 50% → panel `surface`. Code hiện tại gần như
không dùng bóng (vài `shadow-xs/sm` của shadcn trên popover, tooltip, sheet).

Hướng đã chốt là **mềm, thân thiện**: được phép thêm bóng rất nhẹ như phản hồi trạng thái (hover trên phần tử bấm được),
nhưng không dùng bóng để tách khung ở trạng thái nghỉ.

### Shadow Vocabulary
- **Nổi khi mở** (`shadow-md` / `shadow-lg` của Tailwind): popover, lịch chọn ngày, sheet mobile.
- **Gợi ý hover** (`shadow-sm`): tuỳ chọn cho thẻ bấm được; chưa dùng rộng.

### Named Rules
**The Paper-Stack Rule.** Khung ở trạng thái nghỉ thì phẳng; tách lớp bằng màu nền và viền 1px. Bóng chỉ xuất hiện khi phần tử nổi lên (mở, kéo, hover).

## Shapes

Góc bo mềm, nhất quán: khung ngoài 12px, panel bên trong bo đồng tâm (bằng 12px trừ phần đệm và viền), nút và ô nhập
8px, nút nhỏ và icon 6px, chip lọc và badge bo tròn hẳn (pill). Ô tích task là hình vuông bo 4px. Viền luôn 1px màu `line`.

**The Concentric Corners Rule.** Thứ gì nằm trong khung bo thì góc nhỏ hơn khung ngoài, để hai đường cong song song. Không đặt khung bo 12px trong khung bo 12px.

## Components

### Buttons
- **Shape:** bo 8px (nút thường), 6px (nút nhỏ, nút icon).
- **Primary:** nền Xanh chàm, chữ màu `surface`, Inter 14px 500, đệm 8px × 16px. Hover giảm còn 80%. Chỉ một nút chính mỗi khung.
- **Ghost:** chữ mực nhạt, hover nền `surface-muted` + chữ mực. Dùng cho thao tác phụ trên dòng (sửa, huỷ).
- **Danger ghost:** chữ đỏ, hover nền `danger-soft`. Dùng cho xoá; luôn có bước xác nhận ngay tại dòng.
- **Focus:** viền màu ring + vòng 3px ring 50%. Bấm: dịch xuống 1px.

### Chips
- **Filter chip** (bộ lọc Tasks): pill, viền `line`, chữ 14px mực nhạt, đệm 4px × 12px. Đang chọn: viền và chữ Xanh chàm, nền Xanh chàm nhạt; có `aria-pressed`. Chuyển màu bằng `transition-colors`.
- **Segmented chip** (Dashboard Thật / Mẫu): như filter chip nhưng không viền; đang chọn thêm chữ đậm 500.
- **Field badge:** pill, chữ 12px 500 màu Lĩnh vực, nền là chính màu đó trộn 14% với trong suốt. Không có viền.

### Cards / Containers
- **Corner Style:** Frame ReUI bo 12px, panel bên trong bo đồng tâm.
- **Background:** viền ngoài `surface-muted` 50% + viền 1px `line`; panel `surface`.
- **Shadow Strategy:** phẳng (xem Paper-Stack Rule).
- **Internal Padding:** 20px, 24px từ md. Tiêu đề khung (Lora 18px, heading cấp 2) cách nội dung 16px, nút hành động căn phải cùng hàng.
- **Thẻ tiêu điểm** (`focal`, mỗi trang tối đa một, ví dụ "Hôm nay làm"): tiêu đề Lora 24px (Headline), rộng hết hàng, đứng đầu.
- **Trạng thái trống:** một dòng chữ 14px mực nhạt, không hình minh hoạ.

### Inputs / Fields
- **Style:** nền giấy, viền 1px `line`, bo 8px, đệm 8px × 12px, chữ 14px.
- **Focus:** viền đổi sang Xanh chàm.
- **Error:** dòng báo dưới form chữ đỏ (`role="alert"`); thành công chữ mực nhạt có dấu ✓.

### Navigation
- **Sidebar** theo mẫu ReUI c-sidebar-2 (Icon Rail): logo vuông bo 8px nền Xanh chàm + chữ "Second Brain" Lora; menu
  icon Lucide + nhãn 14px; mục đang chọn nền `accent` và `aria-current="page"`. Chân sidebar: ngày hôm nay, số ngày còn
  đến hạn đồ án (Xanh chàm), nút đổi theme.
- **Thanh trên:** nút thu/mở sidebar, gạch đứng, tên màn hiện tại 14px 500.

### Week Day Cards (signature)
7 thẻ ngày của tuần ở màn Goal: mỗi thẻ một ngày, liệt kê việc có Ngày làm rơi vào ngày đó; dời việc sang ngày khác
ngay trên thẻ. Trên mobile thẻ thu gọn, có mũi tên xoay 180° khi mở.

## Do's and Don'ts

### Do:
- **Do** lấy màu từ token trong `app/globals.css` và kiểm tra cả theme sáng lẫn tối (ảnh 1440×900) cho mọi thay đổi giao diện.
- **Do** dùng component ReUI / shadcn đã cài (`Frame`, `Button`, `Badge`, `Alert`) đúng như bản phát hành, không tự viết lại.
- **Do** đi kèm nhãn chữ với mọi màu Lĩnh vực.
- **Do** chỉ dùng `transition-colors` (hoặc opacity/transform cụ thể) cho hover; không `transition-all` cho code mới.
- **Do** giữ tiêu đề trang một dòng Lora; phần giải thích để ở dòng phụ mực nhạt.

### Don't:
- **Don't** viết mã màu cứng trong component.
- **Don't** thêm màu nhấn thứ hai cạnh Xanh chàm.
- **Don't** dùng bóng để tách khung ở trạng thái nghỉ.
- **Don't** lồng Card trong Frame hay Frame trong Card.
- **Don't** dùng chữ nhỏ hơn 12px cho nội dung đọc. Không còn ngoại lệ: chữ viết tắt thứ ở bảng thói quen tháng đã nâng lên 12px (10/11/2026).
