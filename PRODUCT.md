# Product

<!-- impeccable:product-schema 1 -->

> Bản ghi sản phẩm cho Impeccable (skill thiết kế). Nguồn sự thật về phạm vi là `SPEC.md` (một file hiện hành);
> file này chỉ tóm phần cần cho quyết định thiết kế. Lệch nhau thì SPEC thắng.

## Platform

web

## Users

- **Chính: Trung**, sinh viên năm 4 PTIT (IoT/Nhúng), làm đồ án (hạn 06/12/2026) và thực tập cùng lúc. Có nhiều việc
  song song, làm việc này thì rơi việc kia. Mở web trên máy tính để biết hôm nay làm gì, tuần này ra sao, đang hướng tới
  mục tiêu nào. (Trung xác nhận 06/11/2026.)
- **Nhóm ~20 bạn** của Trung, mỗi người một tài khoản email + mật khẩu do Trung tạo, dữ liệu riêng (mở từ 10/11/2026).
  Thiết kế vẫn ưu tiên Trung; người mới có câu hướng dẫn ở mỗi màn trống nhưng không có phần giới thiệu riêng.

## Product Purpose

Gom việc, mục tiêu, thói quen (và về sau kiến thức) vào một chỗ, để mở ra là biết hôm nay làm 3 việc gì, deadline nào
sắp tới, đang đi đúng hướng mục tiêu không.

**Thành công:** Trung mở web ≥ 5 ngày/tuần trong 2 tuần liên tiếp (`SPEC.md` mục 1, Trung giữ nguyên 06/11/2026).

## Positioning

**Một chuỗi duy nhất Goal → Task → Ngày.** Tasks là kho việc duy nhất; Goal xếp tầng Năm → Quý → Tháng → Tuần và gồm
các Task; Task được xếp vào ngày bằng cột **Ngày làm**; thói quen làm Goal tự xong. Notion hay Todoist để người dùng tự
nối các mảnh này; Brainrot nối sẵn. Lý do và phương án đã cân nhắc: `docs/specs/archive/SPEC-v0.5.md`.

## Operating Context

- Mở hằng ngày trên máy tính (desktop-first, ≥ 1280px là chuẩn). Trên mobile chỉ cần không vỡ layout.
- Các màn và câu hỏi mỗi màn trả lời:
  - **Today:** hôm nay làm gì? (Hôm nay làm, deadline 14 ngày, thói quen hôm nay, Ghi nhanh: ý tưởng, Daily Log, chọn
    việc ngày mai)
  - **Tasks:** tôi có những việc gì? (nơi duy nhất tạo, sửa, xoá việc)
  - **Goal:** tôi đang hướng tới điều gì? (mục tiêu xếp tầng, bảng thói quen tháng, 7 thẻ ngày của tuần, Nhìn lại)
  - **Dashboard:** tôi đang làm tốt không? (KPI, task theo dự án, mục tiêu tháng, nhịp làm, thói quen; chế độ Thật / Mẫu)
- Trung dành ≤ 2 giờ/tuần cho dự án; agent viết code, Trung review và test.

## Capabilities and Constraints

- Dữ liệu ở Postgres (Neon), mỗi người dùng chỉ thấy dữ liệu của mình. Đăng nhập bằng email + mật khẩu (không Google).
- Chi phí 0 đồng: chỉ gói miễn phí (Neon, Vercel Hobby), không dùng API LLM trả phí.
- Ngày giờ theo múi Asia/Ho_Chi_Minh.
- Xoá task là xoá thật nhưng có nút Hoàn tác 8 giây chèn lại đúng như cũ; xoá mục tiêu là xoá mềm (`SPEC.md` mục 5.2, 5.3).
- v1.1 (12/11/2026) thêm Knowledge và Brain 3D (`SPEC.md` mục 5.6, 5.7). Thẻ Next up (Google Calendar) ngoài phạm vi (mục 9).
- Không tự thêm tính năng ngoài SPEC; yêu cầu mới ghi vào Follow-ups của plan đang chạy.

## Brand Commitments

- Tên: **Brainrot** (Second Brain Web).
- Giao diện tiếng Việt; giữ tên màn Today / Tasks / Goal / Dashboard.
- Có cả theme sáng và tối, mặc định theo hệ điều hành, ghi nhớ lựa chọn.
- Mỗi Dự án có một màu cố định dùng chung giữa các màn, gán theo **thứ tự dự án của từng người** (4 màu đầu, còn lại xám),
  vẽ bằng pill bo tròn (redesign 11/2026, `DESIGN.md`).
- Hướng nhìn **Nhật ký kỹ thuật** (Trung chốt 10/11/2026): giấy kẻ ô, khung bo góc, chữ Manrope (bản mềm 12/11/2026: bỏ chữ mono, bỏ khung vuông), một màu cam
  tín hiệu. Thay hướng giấy kem / Lora / xanh chàm cũ.
- Giọng chữ: ngắn, thẳng, đời thường; không văn quảng cáo.

## Evidence on Hand

- Dữ liệu thật của Trung trên production; Dashboard có chế độ **Mẫu** với dữ liệu mẫu để xem trước.
- Không có lời chứng thực, khách hàng, số liệu người dùng hay báo chí. Không bịa những thứ này.

## Product Principles

1. **Mở ra là biết làm gì.** Mỗi màn trả lời đúng một câu hỏi; câu trả lời nằm ở màn hình đầu, không phải tự lọc.
2. **Một nơi cho mỗi thứ.** Việc chỉ tạo và sửa ở Tasks; các màn khác đọc và xếp lịch từ đó.
3. **Nối sẵn, không bắt người dùng tự nối.** Goal, Task, Ngày, thói quen liên kết tự động.
4. **Ít mà dùng hằng ngày.** Ưu tiên điều làm Trung mở web mỗi ngày hơn tính năng mới.

## Accessibility & Inclusion

- Desktop-first; dưới 768px sidebar thu thành thanh trên.
- Cả hai theme phải đủ tương phản; bảng màu dự án đã kiểm bằng validator (chỉ 4 màu phân biệt chắc chắn, còn lại xám + nhãn chữ).
