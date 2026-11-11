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
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  readout:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  none: "0px"
  sm: "4px"
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

## Overview

Mở ra như một trang nhật ký đo của dân kỹ thuật: nền giấy kẻ ô mảnh, khung vuông viền 1px, số liệu đọc bằng chữ mono,
một màu tín hiệu cam cho điều cần chú ý. Thông tin dày nhưng có trật tự: mỗi trang có **hàng chỉ số** ở đầu (đọc trong
2 giây), rồi **bảng chính** trả lời câu hỏi của trang, cột phải là thông tin phụ.

Cá tính nằm ở chi tiết chính xác (số thứ tự dòng `01`, nhãn `T-03`, `D-26`, lưới 24px), không ở trang trí. Nhãn dự án
và trạng thái là pill bo tròn mềm, chỗ duy nhất được bo tròn, để mắt bắt ngay "việc này thuộc đâu, có gấp không".

## Colors

- **Giấy kẻ ô** (`background`): nền trang, có lưới 24px rất mờ (`--grid`). Chỉ ở nền trang, không trong khung.
- **Surface**: nền khung (trắng / gần đen). `surface-muted` cho hàng tiêu đề bảng, vùng chọn.
- **Line** (`--line`): viền khung, kẻ dòng. Chỉ trang trí, **không** dùng làm viền control.
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

- **Be Vietnam Pro** (400, 500, 600) cho mọi chữ đọc; tiêu đề trang 30px 600, tiêu đề khung 14px 600. Trung đổi từ
  IBM Plex Sans ngày 11/11/2026 vì Plex Sans trông cứng; Be Vietnam Pro làm riêng cho tiếng Việt, mềm hơn.
- **IBM Plex Mono** (400) **chỉ** cho số và nhãn IN HOA ngắn: hàng chỉ số (24px), số thứ tự dòng `01`, `T-03`, `D-25`,
  ngày đứng riêng `13/11`, nhãn ô chỉ số (`VIỆC HÔM NAY`). Chữ thường lẫn số ("hạn 13/11", "8 dòng") dùng font chữ đọc
  với `tabular-nums`.
- Không chữ nào dưới 12px. Không dùng serif.

## Layout

- App shell đặt **một** bề rộng nội dung (`max-w-7xl`) và lề 16px (mobile) / 32px (desktop) cho mọi trang.
- Bố cục trang: tiêu đề + dòng phụ → hàng chỉ số (2 cột mobile, 4 cột desktop, ô chung viền) → lưới
  `minmax(0,1fr) 360px` (bảng chính | cột phụ) từ `xl`, một cột dưới đó.
- Sidebar 192px, mục có số `01…05` mono, mục đang chọn chữ đậm + ô vuông cam nhỏ; mobile thu thành thanh trên + ngăn kéo.
- Khoảng cách theo bội 4px; giữa các khung 24px.

## Elevation & Depth

Phẳng. Tách lớp bằng nền (giấy kẻ ô → surface) và viền 1px. Bóng chỉ cho lớp nổi (popover, menu, ngăn kéo, toast).

## Shapes

- Khung, bảng, ô nhập, nút, ô tích: **vuông** hoặc 4px (`--radius: 0.25rem`).
- Ô nhỏ bấm được (ô tích, ô thói quen): luôn bo 4px và có khe 4px giữa các ô — vuông góc hẳn trông thô (Trung, 11/11/2026).
- **Ngoại lệ duy nhất:** pill (nhãn dự án, trạng thái, nút "Làm hôm nay") bo tròn hẳn.

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
Dòng: số thứ tự mono `01` · ô tích vuông · tên việc · cột nhãn căn phải (pill + ngày mono). Dưới `md`: nhãn xuống dòng
dưới tên, không bao giờ bóp tên thành cột hẹp. Việc vừa tích **ở lại** gạch ngang, pill "xong", tới hết ngày.

### Hàng chỉ số
Ô chung viền, nhãn mono 12px viết hoa màu mực nhạt, giá trị mono 24px, chú thích 12px. Chỉ ô đếm ngược dùng màu cam.

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
- **Do** dùng chữ mono cho số và ngày.
- **Don't** viết mã màu cứng trong component.
- **Don't** thêm màu nhấn thứ hai cạnh cam tín hiệu.
- **Don't** bo tròn khung, bảng hay nút thường; bo tròn chỉ dành cho pill.
- **Don't** lồng Card trong Frame hay Frame trong Card; mỗi màn một họ khung.
- **Don't** dùng `opacity` cho chữ phụ; dùng `--muted-foreground`.
