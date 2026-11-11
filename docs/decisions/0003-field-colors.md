# 0003 Màu Lĩnh vực: 4 slot đã kiểm định + xám trung tính

Date: 2026-10-22

## Status

Accepted (Trung chốt 22/10/2026). Cập nhật 11/2026: quy tắc "4 màu đã kiểm định + xám" vẫn giữ, nhưng ở v1.0 áp cho
**Dự án** theo thứ tự dự án của từng người (`DESIGN.md`); "Lĩnh vực" của Knowledge chỉ quay lại nếu làm v1.1 (`SPEC.md` mục 10).

## Context

- SPEC mục 8: mỗi Lĩnh vực một màu cố định, dùng chung cho badge (Today) và node graph (Brain).
- Bảng 6 màu ban đầu chọn bằng mắt. Validator của skill `dataviz` (`scripts/validate_palette.js`, `--pairs all`
  vì graph là dạng tán xạ — mọi cặp màu có thể đứng cạnh nhau) báo FAIL ở cả 2 theme:
  xanh dương/tím chỉ ΔE 13.8 với mắt thường (ngưỡng 15), hồng/xanh lá ΔE 3.3 với người mù màu đỏ-lục.
- Thử mọi tổ hợp 5 trong 8 màu của bảng mẫu dataviz: **không tổ hợp 5 màu nào** đạt ngưỡng mắt thường ở cả
  nền sáng `#f6f4ef` và nền tối `#141413`. Tối đa 4 màu.
- Trung có 6 Lĩnh vực và dự định thêm nữa.

## Decision

1. 4 slot màu (`--field-1..4` trong `app/globals.css`), mỗi theme một bước riêng:

   | Slot | Màu | Sáng | Tối | Lĩnh vực hiện tại |
   |---|---|---|---|---|
   | 1 | xanh dương | `#2a78d6` | `#3987e5` | Computer Vision |
   | 2 | hồng | `#e87ba4` | `#d55181` | AI Agent |
   | 3 | xanh lá | `#008300` | `#008300` | Embedded/Edge AI |
   | 4 | vàng hổ phách | `#eda100` | `#c98500` | Đồ án |

   Kết quả validator: sáng — mắt thường ΔE 19.6, mù màu ΔE 13; tối — mắt thường ΔE 19.3, mù màu ΔE 6.9.
2. Mọi Lĩnh vực khác (Kỹ năng sống, Khác, và lĩnh vực mới thêm trong Notion) → `--field-neutral` (xám).
3. Gán Lĩnh vực → slot ở **một chỗ**: `FIELD_SLOTS` trong `lib/fields.ts`.
3b. *(bổ sung 22/10/2026, sau khi Trung thấy graph toàn một màu)* Dự án dùng **cùng 4 slot theo chủ đề**
   (`PROJECT_SLOTS`): Học AI = 1 (xanh dương), Sản phẩm = 2, Thực tập = 3, Đồ án = 4 (vàng, trùng Lĩnh vực Đồ án);
   Sức khỏe, Khác → xám. Task lấy màu dự án, trộn 45% về màu nền ("Task màu nhạt", SPEC 7.3).
4. Màu luôn có cách nhận diện thứ hai: tên cụm vẽ cố định trên graph + chip chú thích có tên và số lượng
   (bắt buộc vì ΔE mù màu ở theme tối nằm trong vùng 6–8; một số màu dưới 3:1 tương phản trên nền sáng).
5. Không bao giờ tự sinh màu thứ 5+ bằng thuật toán.

## Alternatives Considered

1. Giữ 6 màu cũ — thất bại validator, xanh dương/tím khó phân biệt kể cả với mắt thường.
2. 5 màu từ bảng mẫu — không tổ hợp nào đạt ở cả 2 theme.
3. Màu theo thứ hạng (cụm to nhất được màu) — vi phạm "màu đi theo thực thể, không theo thứ hạng":
   thêm dữ liệu là cụm đổi màu.

## Consequences

Positive:

- 4 cụm chính phân biệt rõ ở cả 2 theme; thêm Lĩnh vực trong Notion không làm vỡ giao diện (tự xám).
- Đổi lĩnh vực được tô màu chỉ sửa 1 dòng.

Tradeoffs:

- Kỹ năng sống và Khác cùng màu xám → phân biệt bằng tên cụm / chip, không bằng màu.
- Lệch câu chữ SPEC mục 8 ("mỗi Lĩnh vực một màu") — đã ghi chú vào SPEC.

## Follow-Up

- Khi cần tô màu > 4 Lĩnh vực: chọn giữa (a) gom thành nhóm cha, mỗi nhóm 1 màu, hoặc (b) chỉ tô 4 lĩnh vực đang
  tập trung, đổi `FIELD_SLOTS` khi trọng tâm thay đổi. Chạy lại validator nếu đổi mã màu.
