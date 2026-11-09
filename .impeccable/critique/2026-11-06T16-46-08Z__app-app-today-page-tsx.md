---
target: Today
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\today\\page.tsx"
target_fingerprint: "sha256:c5a5216801f8edbffe72fe058e1326408ad814c89af3061c0caad4b79a054968"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\today\\page.tsx"
timestamp: 2026-11-06T16-46-08Z
slug: app-app-today-page-tsx
---
# Critique: Today (app/(app)/today/page.tsx), 06/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900, sáng + tối)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "Không còn việc nào chưa xong" không phân biệt "xong hết" với "chưa có việc"; Next up tự chuyển sang "Ngày mai" bằng nhãn nhỏ |
| 2 | Match System / Real World | 3 | Tiếng Việt, giọng sổ tay; lẫn "Next up", "Deadline", "Daily Log" |
| 3 | User Control and Freedom | 2 | Tích xong là một chiều: checkbox bị disabled (task-row.tsx:24) |
| 4 | Consistency and Standards | 2 | "Cả tuần" và "Mở" cùng tới /goals?level=week; nav "Goal" vs "trang Mục tiêu"; thẻ phải ẩn ở v1.0 vẫn hiện |
| 5 | Error Prevention | 2 | Daily Log mở sẵn 3 ô trống, dễ lưu log rỗng |
| 6 | Recognition Rather Than Recall | 3 | Nhãn rõ, có đếm "đã chọn N" |
| 7 | Flexibility and Efficiency | 1 | Không thêm việc từ Today, không phím tắt |
| 8 | Aesthetic and Minimalist Design | 2 | 7 khung ngang trọng lượng, 3/5 thẻ lưới trống; đếm ngược lặp ở sidebar |
| 9 | Error Recovery | 3 | ErrorNotice, role="alert", form giữ chữ khi lỗi |
| 10 | Help and Documentation | 2 | Empty state phần lớn là ngõ cụt |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict
Nửa vời. Riêng của Brainrot: thẻ đếm ngược đồ án, bảng màu giấy kem / than ấm, placeholder YOLOv8. Phần dưới là lưới thẻ ngang nhau kiểu starter kit. Detector: 11 mục (sáng), 9 (tối); thật: placeholder ô Ý tưởng 3.2:1 (quick-capture.tsx:36, cần 4.5:1), chữ "tiêu" rơi dòng một mình ở empty state Thói quen; cố ý theo DESIGN.md: nested-cards ×7 (Frame ReUI), Inter, nền kem. CLI: text-[0.65rem] ở habit-month.tsx:81.

## Priority Issues
- [P0] Next up và Kiến thức mới vẫn hiện, trái SPEC-v1.0 §3 dòng 37; Kiến thức mới luôn trống (data.ts:33 trả []). Fix: bỏ 2 thẻ khỏi page.tsx:66,68. → distill
- [P1] Không có tiêu điểm: đếm ngược đồ án to nhất, "Hôm nay làm" chỉ nửa cột. Fix: Hôm nay làm full-width ngay dưới tiêu đề; đếm ngược vào dòng phụ tiêu đề. → layout
- [P1] Daily Log mở sẵn buổi sáng (quick-capture.tsx:76 open={!todayLog}). Fix: thu gọn mặc định hoặc chỉ mở sau 18:00; ghép với Ngày mai làm thành cụm "cuối ngày". → clarify
- [P2] Empty state ngõ cụt và mơ hồ. Fix: tách "xong hết" khỏi "chưa có việc → link /tasks"; ẩn/thu Deadline khi trống. → onboard
- [P2] Cứng cho Trung: "Trung" (page.tsx:60), "Anh Trung" (sidebar), THESIS_DEADLINE từ env thay vì users.target_date (SPEC-v1.0 §5). → harden

## Persona Red Flags
- Trung buổi sáng: thấy 30 ngày trước, rồi "không còn việc", rồi lịch ngày mai 06:00, 2 thẻ trống, 3 ô viết nhật ký.
- Alex: không thêm việc tại Today, không phím tắt, không bỏ tích được.
- Sam: kiểm tra FrameTitle có phải h2; nút Lưu disabled nhạt không nói lý do.

## Minor Observations
- Placeholder ô Ý tưởng 3.2:1 (sáng). Straggler "tiêu". Skeleton "Today" → lời chào tiếng Việt. "✓ "/"• " là ký tự chữ, khác CheckIcon. Trang cao ~1230px.

## Questions to Consider
- Nếu Today chỉ hiện một thứ: đếm ngược hay việc tiếp theo?
- Sáng "lên kế hoạch và làm", tối "ghi log và chọn mai" có nên là hai trạng thái khác nhau?
