---
target: Today
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\today\\page.tsx"
target_fingerprint: "sha256:ade2f04791bc0164efadf87ce8761e1bc54d87b6974eb363c1de02e47cadd796"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\today\\page.tsx"
timestamp: 2026-11-06T16-55-11Z
slug: app-app-today-page-tsx
---
# Critique: Today (app/(app)/today/page.tsx), lần 2, 06/11/2026 (~00:00, trạng thái buổi tối)

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900, sáng + tối)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Đếm ngược, "chưa ghi", "đã chọn 0" rõ; Hôm nay làm thiếu "x/y xong" |
| 2 | Match System / Real World | 3 | "Cả tuần" thực ra mở mục tiêu tuần |
| 3 | User Control and Freedom | 2 | Tích xong không bỏ tích được (task-row.tsx:24) |
| 4 | Consistency and Standards | 2 | "Cả tuần" + "Mở" cùng 1 trang; đếm ngược lặp ở sidebar; nút Lưu / Lưu Daily Log / Cập nhật |
| 5 | Error Prevention | 3 | Lưu ý tưởng khoá khi trống; Daily Log không cảnh báo khi rời trang |
| 6 | Recognition Rather Than Recall | 3 | Chọn việc ngày mai không hiện deadline |
| 7 | Flexibility and Efficiency | 1 | Không phím tắt, không autofocus |
| 8 | Aesthetic and Minimalist Design | 2 | Buổi tối: 3 thẻ trống nằm trên việc chính; "Ghi nhanh" + "Ý tưởng" lặp tiêu đề |
| 9 | Error Recovery | 3 | ErrorNotice, role=alert, form giữ chữ |
| 10 | Help and Documentation | 2 | Empty state Hôm nay làm / Deadline không dẫn sang Tasks |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
Chất riêng ở màu, font, đếm ngược; bố cục vẫn là chồng 5 khung ngang nhau. Detector: hết lỗi thật (placeholder và straggler đã sửa); còn overused-font, cream-palette, nested-cards ×5 đều cố ý theo DESIGN.md. habit-month.tsx:81 (0.65rem) thuộc Goals, không phải Today.

## Priority Issues
- [P1] "Không còn việc nào chưa xong" khi kho việc trống, trái SPEC-v1.0 dòng 106 ("Chưa có việc nào — tạo việc đầu tiên ở Tasks"). Fix: 3 trạng thái (chưa có việc → link Tasks; xong hết; đã tích hết việc hôm nay → "n/n xong"). → onboard
- [P1] Buổi tối, việc chính (Cuối ngày) nằm cuối trang, nút Lưu Daily Log bị cắt ở mép 900px. Fix: khi evening, đưa Cuối ngày lên ngay dưới Hôm nay làm; Ghi nhanh thành 1 hàng. → layout
- [P2] Thẻ tiêu điểm không nổi hơn thẻ khác: mọi tiêu đề thẻ cùng Lora 18px. Fix: tiêu đề Hôm nay làm cỡ headline, "x/y xong" thay "Cả tuần", bỏ nhãn "Ý tưởng" lặp, bỏ đếm ngược lặp ở sidebar. → bolder + distill
- [P2] Bàn phím / trình đọc màn hình: ô nhập chỉ đổi viền 1px khi focus (form-bits.tsx:2); tiêu đề thẻ là div, không có h2. Fix: vòng focus-visible, FrameTitle render h2. → harden
- [P3] Sau 0:00 ngày đổi: Cuối ngày thu lại, Daily Log chuyển sang ngày mới, lời chào "buổi sáng" lúc 1 giờ. Cần Trung chốt. → harden

## Persona Red Flags
- Trung buổi sáng: thấy "không còn việc" dù chưa có việc; không link sang Tasks; không ghi nhận "tối qua đã chọn việc này".
- Alex: không phím tắt; chọn việc mai giới hạn 8 việc không có "xem thêm".
- Sam: không có h2; focus ô nhập khó thấy; ô đã tích bị disabled, rời khỏi thứ tự tab.

## Minor Observations
- "Rơi / chưa xong" khó hiểu; 3 ô textarea nặng cho việc 30 giây; tam giác summary chưa có style; thẻ Deadline trống chiếm nửa hàng.

## Questions to Consider
- Mục tiêu là mở web ≥ 5 ngày/tuần: sao lúc kết thúc ngày (Daily Log) lại có phản hồi nhạt nhất trang?
- Còn 30 ngày: Today có nên xoay quanh đồ án thay vì coi nó là một dòng?
