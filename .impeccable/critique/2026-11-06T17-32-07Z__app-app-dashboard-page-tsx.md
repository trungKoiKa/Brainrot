---
target: Dashboard
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
target_fingerprint: "sha256:fbe73859c3fb7c33cfe8841807ce462443308cbfe3eef9932949cb25b77b8c34"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
timestamp: 2026-11-06T17-32-07Z
slug: app-app-dashboard-page-tsx
---
# Critique: Dashboard (app/(app)/dashboard/page.tsx), lần 3, 07/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900; sáng/tối × Thật/Mẫu)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Nhãn "Tuần này · từ 02/11" nhưng log/thói quen tính 7 ngày gần nhất |
| 2 | Match System / Real World | 3 | "Task theo dự án" lẫn tiếng Anh |
| 3 | User Control and Freedom | 3 | Chỉ đọc, công tắc được nhớ |
| 4 | Consistency and Standards | 2 | Nút Kỳ chỉ đổi một phần; vàng mang 4 nghĩa; 3 kiểu link |
| 5 | Error Prevention | 3 | Mẫu có nhãn rõ |
| 6 | Recognition Rather Than Recall | 3 | Phải nhớ 5 khung thời gian |
| 7 | Flexibility and Efficiency | 2 | Câu kết luận là ngõ cụt, không link tới chỗ sửa |
| 8 | Aesthetic and Minimalist Design | 2 | 6 khung chỉ để nói "trống"; Mẫu lặp 8 lần |
| 9 | Error Recovery | 3 | Empty state chỉ chỗ sửa; thẻ tiêu điểm thì không |
| 10 | Help and Documentation | 2 | Không giải thích ngưỡng 70/40 |
| **Total** | | **26/40** | **Acceptable (65%)** |

## Design Specificity Verdict
Câu kết luận tiếng Việt, chấm tín hiệu yếu nhất = chất riêng; phần dưới vẫn khung mẫu ReUI. Detector: CLI sạch; live 4 lần quét (sáng/tối × Thật/Mẫu) chỉ còn Inter, nền kem, nested-cards ×8 = cố ý. Không còn lỗi tương phản.

## Priority Issues
- [P1] Câu kết luận chẩn đoán nhưng không chỉ cách sửa. Fix: weekSummary trả action {label, href} theo tín hiệu yếu nhất (log → Today, thói quen → Goal, quá hạn → Tasks). → clarify
- [P1] Nhãn "Tuần này" vs dữ liệu 7 ngày cuộn (stats.ts:288, 293). Fix: tính từ thứ Hai, mẫu số = số ngày đã qua, hoặc đổi nhãn "7 ngày qua". → clarify
- [P2] Trạng thái thưa: 6 khung trống, lỗ ~250px dưới Task theo dự án. → layout + distill
- [P2] Màu quá tải nghĩa (vàng = cảnh báo / rơi việc / Mẫu / đồ án); tone KPI chỉ ở sparkline (aria-hidden). → colorize + quieter
- [P3] Huy hiệu -1% tô đỏ; trục Y số lẻ (0,2,4,7); ngày 0 việc vẽ cột 0.4. → polish

## Persona Red Flags
- Trung tối CN: chấm đỏ "đang chậm" không có bước tiếp; không link Nhìn lại / xếp tuần sau; "Việc theo lịch" là "—" đúng lúc cần lên kế hoạch.
- Alex: câu kết luận và số không bấm được; nút Kỳ không đổi thẻ tiêu điểm.
- Sam: tone KPI chỉ bằng màu và aria-hidden; ngày vừa tập vừa rơi việc chỉ hiện xanh.

## Questions to Consider
- Câu kết luận + link sửa có nên nằm ở Today (mở hằng ngày), còn Dashboard là màn "nhìn lại tuần" tối Chủ nhật?
- Ghi log là tín hiệu "làm tốt" hay chỉ là độ tin cậy của câu kết luận ("ít dữ liệu, chưa chắc")?
