CLAUDE.md — Second Brain Web

Đọc SPEC.md trước khi làm bất cứ việc gì. SPEC là nguồn sự thật về phạm vi; không tự thêm tính năng ngoài SPEC.

Về người dùng
Trung, sinh viên năm 4 PTIT (IoT/Nhúng), đang làm đồ án hạn 06/12/2026. Thời gian cho dự án này ≤ 2 giờ/tuần.
Trung không muốn tự viết code ở dự án này: Claude Code viết, Trung review, test và quyết định.
Cách giao tiếp
Trả lời bằng tiếng Việt, ngắn gọn, thẳng thắn, đi vào trọng tâm.
Thuật ngữ tiếng Anh / khái niệm mới → giải thích ngắn trong ngoặc. Ví dụ: "middleware (đoạn code chạy trước mỗi request để kiểm tra đăng nhập)".
Không bịa thông tin. Không chắc về API/thư viện → kiểm tra docs hoặc source, nói rõ là chưa chắc.
Khi có quyết định thiết kế chưa có trong SPEC → hỏi Trung, đưa phương án đề xuất, không tự quyết.
Phản biện nếu yêu cầu mới làm phình phạm vi hoặc ảnh hưởng mốc 08/11.
Stack

Next.js (App Router) + TypeScript (strict) · Tailwind CSS · @notionhq/client · react-force-graph-3d · Vercel

Quy tắc code
Mọi lời gọi Notion nằm trong lib/notion/ (server-only). Component không gọi Notion trực tiếp.
Đọc ID database và secret từ biến môi trường; không hard-code.
Cache đọc 5 phút; sau khi ghi (tích xong) thì revalidate.
Graph 3D: dynamic import, ssr: false.
Màu dùng CSS variables cho cả theme sáng và tối; không hard-code màu trong component.
Ngày giờ tính theo múi giờ Asia/Ho_Chi_Minh.
Ưu tiên đơn giản, ít dependency. Không thêm database, auth library hay state library ở v0.1.
Bảo mật
Không bao giờ commit .env.local, token, mật khẩu. Kiểm tra .gitignore trước commit đầu tiên.
Không in token/secret ra log hay ra màn hình.
Trung tự tạo Notion token và tự điền biến môi trường trên Vercel; Claude Code chỉ hướng dẫn.
Quy trình
Lập plan theo mục 12 của SPEC, cho Trung duyệt trước khi code.
Làm từng bước nhỏ; mỗi bước chạy được (npm run dev, npm run build, npm run lint không lỗi) rồi mới commit.
Commit message ngắn, tiếng Anh, dạng feat: ..., fix: ....
Cuối mỗi bước: tóm tắt 2–3 dòng đã làm gì + Trung cần test gì.
Lệnh
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint