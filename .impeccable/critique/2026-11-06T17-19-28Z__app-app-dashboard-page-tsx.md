---
target: Dashboard
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
target_fingerprint: "sha256:fbe73859c3fb7c33cfe8841807ce462443308cbfe3eef9932949cb25b77b8c34"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
timestamp: 2026-11-06T17-19-28Z
slug: app-app-dashboard-page-tsx
---
# Critique: Dashboard (app/(app)/dashboard/page.tsx), lần 2, 07/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900, sáng/tối dữ liệu thật + sáng Mẫu)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Có câu kết luận; nút "Kỳ" không áp dụng cho thẻ Tuần này, Nhịp làm, Sắp đến hạn |
| 2 | Match System / Real World | 3 | "Việc theo lịch", "điểm", "rơi việc" cần biết app |
| 3 | User Control and Freedom | 3 | Chỉ đọc, công tắc được nhớ |
| 4 | Consistency and Standards | 2 | 5 khung thời gian trên 1 trang; màu lĩnh vực dùng làm màu trạng thái |
| 5 | Error Prevention | 3 | Chế độ Mẫu được nhớ sang lần sau |
| 6 | Recognition Rather Than Recall | 2 | "chuỗi 2 · dài nhất 3" thiếu đơn vị; sparkline không trục |
| 7 | Flexibility and Efficiency | 1 | Hàng Sắp đến hạn không link (url ""), cột dự án chỉ bấm chuột |
| 8 | Aesthetic and Minimalist Design | 2 | Dữ liệu thưa: 3 biểu đồ toàn số 0; khoảng trống dưới Task theo dự án |
| 9 | Error Recovery | 3 | Quá hạn đứng đầu; empty state chỉ chỗ sửa |
| 10 | Help and Documentation | 2 | Không giải thích ngưỡng "ổn"/"chậm" |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
400px đầu có chất riêng (câu kết luận, đồ án 29 ngày); phần dưới vẫn là template biểu đồ. Detector: CLI sạch; live 10 mục mỗi lần quét, 9 cố ý (Inter, nền kem, nested-cards ×8); thật: badge "1 ngày rơi việc" 4.46:1 ở theme tối (--field-4 #c98500).

## Priority Issues
- [P1] Biểu đồ không có dữ liệu chiếm >60% trang ở chế độ Thật (Nhịp làm 11 tuần 0, Nhịp hằng ngày 29 cột giả). Fix: ít dữ liệu → 1 dòng tóm tắt; ẩn sparkline phẳng; đưa tỉ lệ ghi log lên thẻ Tuần này. → distill + onboard
- [P1] Thẻ Tuần này: nhãn to hơn câu trả lời; "1 việc xong, chưa xếp lịch" tô xanh "ổn" (stats.ts:285). Fix: câu kết luận Lora ≥24px, tone none/warn khi chưa xếp lịch. → typeset + clarify
- [P1] Ngõ cụt + bàn phím: hàng Sắp đến hạn không link (queries.ts:34 url ""), cột dự án chỉ chuột, biểu đồ không có tóm tắt chữ. → harden
- [P2] Lưới 2 cột hở ~280px dưới Task theo dự án. → layout
- [P2] Nút "Kỳ" không rõ áp dụng cho khối nào; màu lĩnh vực dùng làm trạng thái. → clarify + colorize
- [P3] Chế độ Mẫu: nhãn "Mẫu" lặp 7 lần → 1 banner đầu trang. → quieter

## Persona Red Flags
- Trung tối Chủ nhật: không so tuần này với tuần trước; câu kết luận chỉ nhìn việc, bỏ qua thói quen/log; không link sang Nhìn lại.
- Alex: không đi từ số sang danh sách việc bằng bàn phím; sparkline không giá trị.
- Sam: cột dự án và biểu đồ không đọc được bằng trình đọc màn hình.

## Questions to Consider
- Dashboard có nên đo chính thói quen mở app / ghi log (thước đo thành công) trước tiên?
- Người dùng ít dữ liệu có cần 3 biểu đồ chuỗi thời gian, hay một bảng "tuần này vs tuần trước" là đủ?
