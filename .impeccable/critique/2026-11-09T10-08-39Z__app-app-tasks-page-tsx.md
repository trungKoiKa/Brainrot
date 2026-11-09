---
target: Tasks
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\tasks\\page.tsx"
target_fingerprint: "sha256:2439b5c314de261e02931aa160b71751efcd9189270653861226e886837aae82"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\tasks\\page.tsx"
timestamp: 2026-11-09T10-08-39Z
slug: app-app-tasks-page-tsx
---
# Critique: Tasks (app/(app)/tasks/page.tsx), 09/11/2026 — lần 2

Method: dual-agent (A: design review · B: detector nguồn + CDP /tasks). Trạng thái có dữ liệu (nhóm dự án, chip lọc, dòng việc, form sửa, hoàn tác, xác nhận xoá) đánh giá từ code [src].

## Design Health Score: 28/40 (lần 1: 21/40)
1 Status 3 · 2 Real world 3 · 3 Control 3 · 4 Consistency 3 · 5 Error prevention 3 · 6 Recognition 3 · 7 Flexibility 2 · 8 Minimalist 3 · 9 Recovery 3 · 10 Help 2

## Priority issues
- P1: Nút sửa/xoá 28px; hộp "Xóa hẳn?" ép tên việc ở màn hẹp (task-row.tsx).
- P2: Dải Hoàn tác 5s, không tạm dừng khi rê/focus (task-board.tsx).
- P2: Esc trong lịch của form sửa có thể đóng cả form và mất chữ (task-forms.tsx).
- P3: Form thêm 4 hàng ở 375px; trạng thái trống không chỉ đường.

## Detector
Nguồn: 0 phát hiện. Trang: overused-font (chủ đích), nested-cards x1 (track/clip, chưa xác nhận).
