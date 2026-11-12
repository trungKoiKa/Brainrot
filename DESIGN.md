---
name: Brainrot
description: Nhật ký kỹ thuật hằng ngày gom việc, mục tiêu và thói quen của một sinh viên năm cuối (và nhóm bạn).
colors:
  graph-paper: "#f1f2ee"
  graph-paper-dark: "#0c0e0d"
  surface: "#ffffff"
  surface-dark: "#141716"
  surface-muted: "#f6f7f3"
  surface-muted-dark: "#191c1a"
  line: "#cfd3ca"
  line-dark: "#2d322e"
  input: "#848a7f"
  input-dark: "#6f776c"
  ink: "#121412"
  ink-dark: "#e4e8e2"
  ink-muted: "#50564d"
  ink-muted-dark: "#9ea69a"
  signal-orange: "#b03a0a"
  signal-orange-dark: "#ff8a3d"
  signal-wash: "#fdebe1"
  signal-wash-dark: "#3a2112"
  warning: "#8a5a00"
  warning-dark: "#f2b84b"
  danger: "#b42318"
  danger-dark: "#ff8b80"
  success: "#2b6f3a"
  success-dark: "#79c98a"
  project-1: "#2459b8"
  project-1-dark: "#7aa7ff"
  project-2: "#a8326a"
  project-2-dark: "#f08bbd"
  project-3: "#0f766e"
  project-3-dark: "#4fd1c5"
  project-4: "#6d4bc4"
  project-4-dark: "#b39dff"
  project-neutral: "#61675c"
  project-neutral-dark: "#9ea69a"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  readout:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# Brainrot — Nhật ký kỹ thuật

> Hướng thiết kế lại (redesign) **Trung chốt 10/11/2026**: phương án C "Kỹ thuật" trong 3 phương án Today
> (`/preview/a|b|c`), lấy **nhãn bo tròn (pill)** của phương án A cho dự án và trạng thái. Thay hoàn toàn hướng cũ
> (giấy kem, Lora, xanh chàm). Đầu vào: `docs/audits/2026-11-audit.md`.
>
> **Bản mềm (Trung chốt 12/11/2026):** khung vuông, chữ mono và control mỗi cái một kiểu bo trông "quá góc cạnh, quá thô"
> → khung bo 12px, control bo 8px cùng chiều cao, bỏ IBM Plex Mono, hàng chỉ số tách thành ô rời. Giữ giấy kẻ ô, một
> màu cam, pill, sidebar đánh số. Ảnh: `docs/audits/2026-11-soften/`.

## Overview

Mở ra như một trang nhật ký đo của dân kỹ thuật: nền giấy kẻ ô mảnh, khung bo góc viền 1px, số liệu đậm thẳng cột,
một màu tín hiệu cam cho điều cần chú ý. Thông tin dày nhưng có trật tự: mỗi trang có **hàng chỉ số** ở đầu (đọc trong
2 giây), rồi **bảng chính** trả lời câu hỏi của trang, cột phải là thông tin phụ.

Cá tính nằm ở chi tiết chính xác (số thứ tự dòng `01`, nhãn `T-03`, `D-26`, lưới 24px), không ở trang trí. Nhãn dự án
và trạng thái là pill bo tròn hẳn, để mắt bắt ngay "việc này thuộc đâu, có gấp không".

## Colors

- **Giấy kẻ ô** (`background`): nền trang, có lưới 24px rất mờ (`--grid`). Chỉ ở nền trang, không trong khung.
- **Surface**: nền khung (trắng / gần đen). `surface-muted` cho hàng tiêu đề bảng, vùng chọn.
- **Line** (`--line`): viền khung. Chỉ trang trí, **không** dùng làm viền control.
- **Line soft** (`--line-soft`): kẻ giữa các dòng trong khung và kẻ dưới hàng tiêu đề khung; nhạt hơn viền khung để khung
  vẫn là đường mạnh nhất.
- **Input** (`--input`): viền ô nhập, ô tích, select (≥ 3:1 trên surface, WCAG 1.4.11).
- **Tín hiệu cam** (`--primary`): nút chính, mục đang chọn, đếm ngược, focus ring. Màu nhấn duy nhất.
- **Trạng thái** (chữ ≥ 4,5:1 trên surface ở cả hai theme):
  - `warning` vàng đất: trễ lịch, thói quen chưa đạt.
  - `danger` đỏ: quá hạn, hạn hôm nay, xoá.
  - `success` xanh lá: xong, đạt.
- **Dự án** (`--field-1..4`, `--field-neutral`): xanh dương, hồng sẫm, xanh mòng két, tím; dự án thứ 5 trở đi xám.
  Khác hẳn màu trạng thái để "Đồ án" không bị đọc nhầm là "trễ". Màu gán theo **thứ tự dự án của từng người** (Cài đặt),
  không theo tên cứng.

**The One Status Map Rule.** Mỗi trạng thái chỉ có một cách vẽ ở mọi trang (bảng ở mục Components → Pill).

## Typography

- **Plus Jakarta Sans** (400, 500, 600) cho mọi chữ đọc; tiêu đề trang 30px 600, tiêu đề khung 14px 600. Trung chọn
  ngày 11/11/2026 sau khi so 6 font (Plex Sans rồi Be Vietnam Pro đều trông cứng).
- **Không dùng chữ mono** (bỏ IBM Plex Mono 12/11/2026: đứng cạnh Plus Jakarta Sans trông cứng). Số và ngày dùng cùng
  font với `tabular-nums` để thẳng cột: giá trị hàng chỉ số 24px 600, số thứ tự dòng `01`, `T-03`, `D-25`, ngày `13/11`.
  Nhãn ngắn IN HOA (`VIỆC HÔM NAY`, nhãn đầu trang) 12px 500, giãn chữ nhẹ. Class `font-mono` cũ trong code trỏ về font
  chữ đọc (`app/globals.css`), không thêm chỗ dùng mới.
- Không chữ nào dưới 12px. Không dùng serif.

## Layout

- App shell đặt **một** bề rộng nội dung (`max-w-7xl`) và lề 16px (mobile) / 32px (desktop) cho mọi trang.
- Bố cục trang: tiêu đề + dòng phụ → hàng chỉ số (2 cột mobile, 4 cột desktop, ô rời cách 12px) → lưới
  `minmax(0,1fr) 360px` (bảng chính | cột phụ) từ `xl`, một cột dưới đó.
- Sidebar: mỗi mục là một dòng bo 8px có số `01…07`, **không kẻ dòng**; rê chuột có nền `surface-muted`; mục đang chọn
  chữ đậm, nền cam nhạt (`accent-soft`), số cam và chấm tròn cam (Trung chốt 12/11/2026). Mobile thu thành thanh trên +
  ngăn kéo.
- Khoảng cách theo bội 4px; giữa các khung 24px.

## Elevation & Depth

Phẳng. Tách lớp bằng nền (giấy kẻ ô → surface) và viền 1px. Bóng chỉ cho lớp nổi (popover, menu, ngăn kéo, toast).

## Shapes

Ba mức bo, không trộn mức khác (Trung chốt 12/11/2026):

- **12px** (`rounded-xl`): khung (`Card`), ô chỉ số, nhóm việc, khung Brain, hộp đăng nhập, `Skeleton` của khung.
- **8px** (`rounded-lg`, `--radius: 0.5rem`): mọi control — ô nhập, ô chọn, ô ngày, nút, thanh chọn kỳ. Control đứng cùng
  hàng cao bằng nhau (36px; cảm ứng 40px).
- **4px**: ô nhỏ bấm được (ô tích, ô thói quen), có khe 4px giữa các ô.
- Pill (nhãn dự án, trạng thái, nút "Làm hôm nay") bo tròn hẳn.
- Ô chọn gốc của trình duyệt dùng class `select-chevron` (mũi tên riêng theo theme), không để mũi tên mặc định.
- Không ghép nhiều ô thành một khối chung viền; các ô ngang hàng là ô rời có khe.

## Components

### Pill (`components/pill.tsx`)
Chữ 12px 500, đệm 2px × 10px, nền là chính màu chữ trộn 13% với trong suốt; nhãn dự án có chấm 6px phía trước.

| Trạng thái | Pill |
|---|---|
| Dự án | chấm + tên, màu dự án |
| Trễ lịch | vàng "trễ N ngày" |
| Hạn hôm nay | đỏ "hạn hôm nay" |
| Quá hạn | đỏ "quá N ngày" |
| Xong | xanh lá "xong" |
| Đang làm | cam "đang làm" |

Nút pill (ví dụ "Làm hôm nay"): viền `--input`, nền surface, chữ 12px 500.

### Bảng việc (signature)
Dòng: số thứ tự `01` · ô tích · tên việc · cột nhãn căn phải (pill + ngày).
Giữa các dòng là kẻ mảnh `--line-soft` **thụt 16px hai đầu** (class `row-sep`), không chạy sát viền khung; rê chuột thì
dòng có nền `surface-muted`; dòng đang sửa giữ nền đó (Trung chốt 12/11/2026: kẻ đậm sát viền trông thô). Dưới `md`: nhãn xuống dòng
dưới tên, không bao giờ bóp tên thành cột hẹp. Việc vừa tích **ở lại** gạch ngang, pill "xong", tới hết ngày.

### Hàng chỉ số
Mỗi chỉ số một ô rời bo 12px, cách nhau 12px (`components/readout.tsx`): nhãn 12px 500 viết hoa màu mực nhạt, giá trị
24px 600, chú thích 12px. Chỉ ô đếm ngược dùng màu cam.

### Controls
Dùng component thư viện (`components/ui`, `components/reui`), không tự viết: `Button`, `Input`, `Textarea`, `Select`,
`Checkbox`, `Collapsible`, `ToggleGroup`/`Tabs`, `AlertDialog`, `Popover`, `DropdownMenu`, `Skeleton`, toast `sonner`
(có nút Hoàn tác, xếp chồng).
- Focus ring: 2px đặc màu `--ring` (cam), cách 2px, ≥ 3:1 ở cả hai theme.
- Vùng bấm ≥ 24px desktop, ≥ 40px cảm ứng.

### Trạng thái trống / tải / lỗi
Trống: một dòng 14px mực nhạt nói vì sao trống và chỗ để làm tiếp. Tải: `Skeleton` đúng bố cục thật. Lỗi: `Alert`
destructive có nút Thử lại.

## Motion
Chỉ `transition-colors` cho hover; mở lớp nổi theo component thư viện. Tôn trọng `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** lấy màu từ token trong `app/globals.css`; kiểm cả hai theme (1440×900) và 375px.
- **Do** đi kèm nhãn chữ với mọi màu dự án/trạng thái.
- **Do** dùng `tabular-nums` cho số và ngày.
- **Don't** viết mã màu cứng trong component.
- **Don't** thêm màu nhấn thứ hai cạnh cam tín hiệu.
- **Don't** để khung hay control vuông góc, và đừng thêm mức bo ngoài 12 / 8 / 4px; bo tròn hẳn chỉ dành cho pill.
- **Don't** dùng chữ mono.
- **Don't** lồng Card trong Frame hay Frame trong Card; mỗi màn một họ khung.
- **Don't** dùng `opacity` cho chữ phụ; dùng `--muted-foreground`.
