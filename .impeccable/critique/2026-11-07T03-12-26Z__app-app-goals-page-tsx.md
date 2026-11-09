---
target: Goal
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\goals\\page.tsx"
target_fingerprint: "sha256:3bc3952bb2f500b7df99bcddd7d5034a8b93b84b805c7051d30134c75d98da6b"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\goals\\page.tsx"
timestamp: 2026-11-07T03-12-26Z
slug: app-app-goals-page-tsx
---
# Critique: Goal (app/(app)/goals/page.tsx), 07/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900; Tháng + Tuần × sáng/tối; ảnh thêm cấp Năm). Dữ liệu thật thưa → bảng thói quen, thẻ ngày có việc đánh giá từ code [src].

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Tháng mới qua 7 ngày, 0% đã tô đỏ (progress-ring.tsx:2) |
| 2 | Match System / Real World | 2 | Tiêu đề "Goal" vs "Mục tiêu"; "kỳ con"; icon xoay vòng cho "Đang làm" |
| 3 | User Control and Freedom | 3 | Xoá mục tiêu có hoàn tác; "Dời sang…" không; đổi kỳ mất chữ Nhìn lại chưa lưu |
| 4 | Consistency and Standards | 2 | "Ưu tiên" đỏ như lỗi; thẻ ngày tự viết; vàng = màu Lĩnh vực |
| 5 | Error Prevention | 2 | Select "Dời sang…" đổi ngay khi bấm mũi tên (week-cards.tsx:97) |
| 6 | Recognition Rather Than Recall | 2 | Mục tiêu ↔ việc phải nhớ; nút trên dòng chỉ hiện khi rê chuột |
| 7 | Flexibility and Efficiency | 1 | Không chuyển mục tiêu chưa xong sang kỳ sau; "Ba mục tiêu…" không thành mục tiêu |
| 8 | Aesthetic and Minimalist Design | 2 | Vòng % + 3 ô số lặp nhau; biểu đồ kỳ con toàn "—" |
| 9 | Error Recovery | 3 | Báo lỗi + quay về; gắn thói quen không có trạng thái chờ |
| 10 | Help and Documentation | 2 | Không giải thích cách tự xong |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict
Giống mẫu mục tiêu/thói quen chung; chuỗi Goal → Việc → Ngày chưa thấy: mục tiêu chỉ có chip "x/y task", thẻ ngày không nói việc thuộc mục tiêu nào. Detector: CLI 1 (0.65rem ở habit-month:81); live thật: badge 9.6–10px (goal-panel.tsx:142, week-cards.tsx:59,66), thẻ ngày rounded-2xl lồng trong Frame (week-cards.tsx:40); cố ý: Inter, nền kem, Frame. Không lỗi tương phản. h3 đọc "Ưu tiên0"; h3 nằm trong button (week-cards.tsx:42-50).

## Priority Issues
- [P1] Chuỗi Goal → Việc → Ngày không hiện. Fix: việc gắn mục tiêu hiện dưới mục tiêu kèm Ngày làm; thẻ ngày ghi mục tiêu; khay "Chưa xếp ngày" ở cấp Tuần. Cần SPEC. → shape + layout
- [P1] Màu: "Ưu tiên" đỏ, "hạn" đỏ dù chưa quá; vàng dùng --chart-4; 0% đầu kỳ tô đỏ. → quieter + colorize
- [P1] Select "Dời sang…" ghi ngay khi dùng phím mũi tên, không hoàn tác. → harden
- [P2] Không có tiêu điểm; vòng + 3 ô lặp; thẻ ngày bo 16px trong khung 12px; Tuần: thẻ ngày dưới màn hình đầu. → layout + distill
- [P2] Nhìn lại cuối tuần là ngõ cụt: "Ba mục tiêu…" không thành mục tiêu, không chuyển việc chưa xong, mất chữ khi đổi kỳ. → shape + harden

## Persona Red Flags
- Trung Chủ nhật: lên kế hoạch tuần sau phải đi Goal → Tasks → Goal; thói quen không thấy ở cấp Tuần; 0%/— đỏ đọc như thất bại.
- Sam: select đổi ngay bằng phím; nút đầu thẻ ngày vẫn nhận focus trên desktop; ô thói quen 20px; badge 10px; "0%" không nói đo cái gì.
- Alex: không phím tắt đổi cấp/kỳ; không sắp xếp mục tiêu; không chuyển hàng loạt.

## Questions to Consider
- Mặc định mở cấp Tuần (có 7 thẻ ngày) thay vì Tháng?
- Trang nên mở bằng "bước tiếp theo" thay vì vòng 0%?
