---
target: Tasks
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\tasks\\page.tsx"
target_fingerprint: "sha256:2e7aecf90bdb770da742ec0bbaf6f55a483c0192031fb1d72841cd43d5baae60"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\tasks\\page.tsx"
timestamp: 2026-11-06T17-54-08Z
slug: app-app-tasks-page-tsx
---
# Critique: Tasks (app/(app)/tasks/page.tsx), 07/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900, sáng + tối). Dữ liệu thật: 0 việc mở, 1 việc xong → trạng thái có nhiều việc đánh giá từ code [src].

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Việc mới chỉ hiện sau khi server trả về; lỗi hiện đầu bảng, ngoài tầm nhìn; dòng "Đã thêm" không tự mất |
| 2 | Match System / Real World | 3 | Lẫn "task", "Deadline", "Goal" với "Hạn", "Mục tiêu" |
| 3 | User Control and Freedom | 1 | Tích xong không hoàn tác được (task-row.tsx:24); Esc không huỷ xác nhận xoá; mở ✎ dòng khác mất bản sửa |
| 4 | Consistency and Standards | 2 | Khung tự viết bo 16px thay Card/Frame; ✎ là ký tự còn xoá là icon |
| 5 | Error Prevention | 2 | Xoá có xác nhận; tích nhầm thì vĩnh viễn |
| 6 | Recognition Rather Than Recall | 3 | Dòng việc không hiện mục tiêu gắn kèm |
| 7 | Flexibility and Efficiency | 1 | Dự án/ưu tiên reset sau mỗi lần thêm (task-forms.tsx:50); không phím tắt; bộ lọc không lưu vào URL |
| 8 | Aesthetic and Minimalist Design | 3 | Gọn; hàng lọc Dự án chỉ có "Tất cả" khi trống |
| 9 | Error Recovery | 2 | "Không lưu được, thử lại sau" chung chung |
| 10 | Help and Documentation | 2 | Chỉ có dòng phụ "Bấm ✎ để sửa" |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict
Trang CRUD to-do chuẩn; không thể hiện chuỗi Goal → Task → Ngày (dòng không hiện mục tiêu, Ngày làm chỉ là nhãn nhỏ). Detector: CLI sạch; live sáng 2 / tối 1 mục, đều cố ý (Inter, nền kem). Tương phản đạt hết; form thêm việc có nhãn đủ.

## Priority Issues
- [P1] Tích xong không hoàn tác được (disabled; EDITABLE_STATUSES bỏ "Xong"). Cần Trung chốt SPEC: nút Hoàn tác vài giây + bỏ tích trong "Đã xong". → harden
- [P2] Khung tự viết rounded-2xl (task-board.tsx:65,71,98; task-forms.tsx:56) thay Card/Frame của DESIGN.md. → polish
- [P2] Đỏ/chàm quá nhiều nghĩa: ưu tiên Cao = đỏ như quá hạn và xoá; việc xong vẫn hiện "Cao" đỏ. → quieter
- [P2] Form thêm việc chậm khi thêm liên tiếp: reset dự án/ưu tiên, select trống trông như đã chọn, dòng "Đã thêm" không tự mất, gắn mục tiêu phải sửa lần hai. → harden
- [P3] Trình đọc màn hình: nút ngày chỉ đọc "Deadline" không đọc ngày đã chọn (deadline-field.tsx:47); focus rơi về body sau tích/xoá/sửa; Esc; ✎ là ký tự. → audit

## Persona Red Flags
- Trung sáng thứ Hai lên kế hoạch: không thấy việc nào chưa xếp lịch, xếp 1 việc mất ~5 thao tác, lịch tuần ở Goal, hạn 14 ngày ở Today.
- Alex: chọn lại dự án 10 lần khi thêm 10 việc; không gõ ngày nhanh.
- Sam: không nghe ngày đã chọn; mất focus sau mỗi thao tác.

## Edge cases [src]
- Tiêu đề dài không ngắt dòng (task-row.tsx:57-62). PROJECT_ORDER cứng theo dự án của Trung → bạn bè dùng sẽ lệch thứ tự.

## Questions to Consider
- Nhóm theo dự án hay theo thời gian (Quá hạn / Tuần này / Chưa xếp lịch)?
- Xoá là vĩnh viễn, tích xong cũng vĩnh viễn: có cần ít nhất một nút hoàn tác?
