---
target: Dashboard
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
target_fingerprint: "sha256:b2c08db19e850330fa3ee5e471601b148d362941ac72bbe80182a37c61333585"
target_path: "D:\\Practice\\SecondBrain\\app\\(app)\\dashboard\\page.tsx"
timestamp: 2026-11-06T17-06-31Z
slug: app-app-dashboard-page-tsx
---
# Critique: Dashboard (app/(app)/dashboard/page.tsx), 07/11/2026

Method: dual-agent (A: design review · B: detector + CDP scan, 1440×900, sáng/tối dữ liệu thật + sáng dữ liệu Mẫu)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Chế độ Thật tự thay khối thiếu dữ liệu bằng mẫu, chỉ có nhãn "Mẫu" nhỏ |
| 2 | Match System / Real World | 2 | "TB 0/ngày" cạnh "1"; "—" màu hổ phách; sparkline Đồ án không nhãn |
| 3 | User Control and Freedom | 3 | 2 công tắc rõ, được nhớ; Mẫu bị nhớ sang hôm sau |
| 4 | Consistency and Standards | 2 | Xanh lá/hổ phách vừa là màu lĩnh vực vừa là trạng thái |
| 5 | Error Prevention | 2 | Dữ liệu mẫu lẫn trong chế độ Thật dễ dẫn tới kết luận sai |
| 6 | Recognition Rather Than Recall | 2 | Sparkline không trục/nhãn; "chuỗi 2 · dài nhất 3" không giải thích |
| 7 | Flexibility and Efficiency | 1 | KPI không bấm được; cột dự án chỉ bấm bằng chuột; hàng Sắp đến hạn không link |
| 8 | Aesthetic and Minimalist Design | 2 | ~10 khung; dữ liệu thưa → khung trống lớn |
| 9 | Error Recovery | 2 | Empty state ít chỉ bước tiếp |
| 10 | Help and Documentation | 2 | Không giải thích màu trạng thái, cách tính "Ổn" |
| **Total** | | **20/40** | **Acceptable** |

## Design Specificity Verdict
Template analytics (4 KPI + sparkline + biểu đồ) mặc theme sổ tay. Không có câu trả lời "tôi làm tốt không?". Detector: CLI sạch; live: nested-cards ×10, Inter, nền kem = cố ý; thật: badge "Quá hạn N ngày" 10px (dashboard-blocks.tsx:259, ReUI size sm) ×5 ở chế độ Mẫu; badge "1 ngày rơi việc" 4.46:1 ở theme tối (dashboard-view.tsx:235, --warning = --field-4 #c98500); chữ "thức." rơi dòng ở Brain (brain-view.tsx:20).

## Priority Issues
- [P0] Thẻ Brain và chuỗi "Kiến thức mới" vẫn hiện, trái SPEC-v1.0 (dòng 48, 110); subtitle "việc và học tập"; page.tsx vẫn gọi getKnowledge + getBrainGraph. → distill
- [P1] Chế độ Thật tự lấp khối thiếu dữ liệu bằng mẫu (dashboard-view.tsx:61-64; đúng SPEC-v0.3 mục 5 nhưng làm sai câu trả lời "làm tốt không"). Cần Trung chốt. → harden
- [P1] Không có tiêu điểm / kết luận: 4 KPI ngang nhau, ~10 khung. Fix: 1 thẻ focal tóm tắt tuần. → layout + clarify
- [P2] Số liệu và biểu đồ chưa trung thực: "TB 0/ngày", cột giả 0.4/0.25 cho ngày không log, tone "warn" khi không có dữ liệu, Sắp đến hạn hiện việc quá hạn 96 ngày dưới tiêu đề "hạn trong 14 ngày". → clarify
- [P2] Truy cập: badge 10px, KPI thiếu tabular-nums, cột dự án chỉ bấm chuột, biểu đồ không có tóm tắt chữ, badge tối 4.46:1. → audit

## Persona Red Flags
- Trung tối Chủ nhật: thấy thói quen mẫu 30% tưởng là thật; thẻ Brain nhắc tính năng chưa có; không phân biệt tuần tốt với tuần trống.
- Alex: KPI không drill-down; hàng Sắp đến hạn không link.
- Sam: cột biểu đồ không focus được; ~10 h2 phẳng; badge 10px.

## Questions to Consider
- Nếu Dashboard chỉ nói 1 câu khi mở, câu đó là gì?
- Dữ liệu thưa: hiện biểu đồ trống hay thu lại còn 2-3 khối có dữ liệu?
