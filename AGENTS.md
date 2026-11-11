# Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness

Start with the requested outcome and use the repository as the system of record.
Find the relevant code, interfaces, commands, tests, and evidence through the
repository map in `docs/README.md`. `docs/WORKFLOW.md` describes repository
understanding, missing capabilities, authority, and trust.

- Respect the requested scope. Inspection does not authorize edits or operation.
- Prefer source references over duplicate summaries. Preserve product intent
  and rationale that code and tests do not express.
- Identify missing capabilities needed to act, observe, or verify. Report what
  is unavailable or unproven instead of inventing commands or claiming success.
- Before changing externally observable policy, establish repository authority.
  Stop at material unresolved choices; configurable defaults are not authority.
- Preserve user-owned state and use the repository's native safety and validation
  checks. Explain observed results and their limits.
- Only invoke a Harness skill when the user explicitly requests it.

Consumer repositories own their task workflow and planning. Harness provides
context and optional tools, without a task database or orchestration lifecycle.
<!-- HARNESS:END -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Second Brain Web (repo Brainrot)

> File này là **nguồn hướng dẫn duy nhất** cho mọi agent. `CLAUDE.md` chỉ import file này.
> Sửa quy tắc dự án ở đây, **bên ngoài** cặp marker `HARNESS:BEGIN/END`
> (phần trong marker do `harness update` quản lý).

Đọc `SPEC.md` trước khi làm bất cứ việc gì. SPEC là nguồn sự thật **duy nhất** về phạm vi; không tự thêm tính năng ngoài SPEC.

> **Trạng thái (11/11/2026):** **v1.0 đang chạy production** (https://brainrot-blue.vercel.app; Postgres, email + mật khẩu,
> nhiều người dùng; tag `v1.0.0`, redesign `v1.1.0-ui`). Trung muốn **hoàn thành cả project trong tuần 11–18/11/2026**:
> plan `docs/plans/active/v1.1.md`; phần v1.1 (Knowledge, Brain, Calendar) ở `SPEC.md` mục 10, **chờ Trung duyệt** mới code.
> SPEC cũ (v0.1 → v1.0) là lịch sử ở `docs/specs/archive/`; plan cũ ở `docs/plans/completed/`.
> Yêu cầu mới → ghi vào "Follow-ups" của plan đang chạy, chốt SPEC trước khi code.

## Thứ tự ưu tiên khi hướng dẫn mâu thuẫn

1. Yêu cầu của Trung trong chat.
2. `SPEC.md` (phạm vi, hành vi sản phẩm).
3. Các mục bên dưới của file này (quy tắc dự án).
4. Khối Harness ở trên và `docs/WORKFLOW.md` (cách làm việc chung).

Harness tự nói repo sở hữu quy trình riêng, nên khi lệch nhau thì quy tắc dự án thắng.

## Harness trong dự án này

- **Sản phẩm:** nguồn sự thật là `SPEC.md` ở gốc repo (một file hiện hành). Không tách SPEC ra `docs/product/`.
- **Quyết định thiết kế/sản phẩm** Trung đã chốt → cập nhật thẳng vào `SPEC.md` (SPEC yêu cầu vậy).
  `docs/decisions/` chỉ dùng cho quyết định kỹ thuật lâu dài (ví dụ cách tổ chức database), dùng template `docs/templates/decision.md`.
  Khi quyết định mới thay quyết định cũ: sửa thẳng đoạn tương ứng trong `SPEC.md` (không viết ghi chú chồng lên)
  và thêm một dòng vào mục 11 "Nhật ký quyết định".
- **Plan:** plan đang chạy ở `docs/plans/active/` (cập nhật sau mỗi bước); xong thì chuyển sang `docs/plans/completed/`.
  Mục "Active Plans" trong `docs/plans/README.md` là chữ mặc định của Harness, không phản ánh repo này.
- **Bằng chứng hoàn thành (proof):** `npm run lint` + `npm test` (vitest) + `npm run build` không lỗi; ảnh chụp thật
  1440×900 ở 2 theme cho mọi thay đổi giao diện; Trung test tay theo danh sách ở cuối mỗi bước.
- **Git:** Trung cho phép agent tự tạo nhánh, commit, push, mở PR và **tự merge PR** vào `main`
  sau khi bước đó build/lint sạch. Không đổi CI hay branch protection nếu Trung chưa yêu cầu.
  **Giữ nhánh sau khi merge** (Trung yêu cầu 26/10/2026): `gh pr merge --merge`, **không** `--delete-branch`.
- **Skill Harness** (`.agents/skills/`) chỉ chạy khi Trung gọi tên rõ ràng.
- `docs/README.md` là file của Harness, có nhắc `ARCHITECTURE.md`, `HARNESS.md`, `crates/`…
  của repo gốc Harness. Các file đó **không tồn tại** ở đây; bỏ qua.
- Không sửa file Harness quản lý (`docs/WORKFLOW.md`, `docs/README.md`, `docs/templates/`, `.agents/`, `.harness-core/`)
  trừ khi Trung yêu cầu; cập nhật bằng `scripts/bin/harness update`.
- Khi scaffold Next.js (`create-next-app`): không để nó ghi đè `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `docs/`.

## Về người dùng

Trung, sinh viên năm 4 PTIT (IoT/Nhúng), đang làm đồ án hạn 06/12/2026. Thời gian cho dự án này ≤ 2 giờ/tuần
(riêng tuần 11–18/11/2026 Trung chấp nhận khoảng 2–3 giờ để chốt project).
Trung không muốn tự viết code ở dự án này: agent viết, Trung review, test và quyết định.

## Cách giao tiếp

- Trả lời bằng tiếng Việt, ngắn gọn, thẳng thắn, đi vào trọng tâm.
- Thuật ngữ tiếng Anh / khái niệm mới → giải thích ngắn trong ngoặc. Ví dụ: "middleware (đoạn code chạy trước mỗi request để kiểm tra đăng nhập)".
- Không bịa thông tin. Không chắc về API/thư viện → kiểm tra docs hoặc source, nói rõ là chưa chắc.
- Khi có quyết định thiết kế chưa có trong SPEC → hỏi Trung, đưa phương án đề xuất, không tự quyết.
- Phản biện nếu yêu cầu mới làm phình phạm vi hoặc ảnh hưởng mốc chốt project 18/11/2026 và hạn đồ án 06/12/2026.

## Stack

Next.js 16 (App Router) + TypeScript (strict) · Tailwind CSS v4 · shadcn/ui + ReUI · Drizzle ORM + Neon Postgres · Recharts ·
Vitest · Vercel. `react-force-graph-3d` (Brain) còn trong dependency nhưng trang đang ẩn tới khi làm `SPEC.md` mục 10.2.

## Quy tắc code

- Mọi truy vấn database nằm trong `lib/db/` (server-only). Component không gọi database trực tiếp.
- Mọi hàm `lib/db/` nhận `userId` (lấy từ cookie đã ký, không bao giờ từ form/URL) và lọc theo nó; sửa schema thì
  `npm run db:generate` rồi commit migration.
- Đọc secret (`DATABASE_URL`, `AUTH_SECRET`…) từ biến môi trường; không hard-code.
- Không cache dữ liệu dùng chung; sau khi ghi thì `refreshData()` (`lib/db/revalidate.ts`).
- Graph 3D: dynamic import, `ssr: false`.
- Màu dùng CSS variables cho cả theme sáng và tối; không hard-code màu trong component.
- Giao diện theo `DESIGN.md` (hướng "Nhật ký kỹ thuật", redesign 11/2026): dùng component thư viện trong `components/ui/`,
  `components/reui/` (Button, Input, Checkbox, Select, Collapsible, ToggleGroup, AlertDialog, Skeleton, toast `sonner`…),
  khung `components/card.tsx`, nhãn `components/pill.tsx`; không tự viết lại nút/ô nhập/dải hoàn tác.
- Ngày giờ tính theo múi giờ Asia/Ho_Chi_Minh.
- Ưu tiên đơn giản, ít dependency. Không thêm auth library hay state library; thêm dependency mới phải nêu lý do trong PR.

## Bảo mật

- Không bao giờ commit `.env.local`, token, mật khẩu. Kiểm tra `.gitignore` trước mỗi commit.
- Không in token/secret ra log hay ra màn hình.
- Trung tự điền biến môi trường trên Vercel và tự gõ mật khẩu (`npm run user:password`); agent chỉ hướng dẫn.

## Quy trình

- Tính năng mới: viết vào `SPEC.md` (kèm câu hỏi cần chốt), cho Trung duyệt trước khi code; lập plan trong `docs/plans/active/`.
- Làm từng bước nhỏ; mỗi bước chạy được (`npm run dev`, `npm run build`, `npm run lint` không lỗi) rồi mới commit.
- Commit message ngắn, tiếng Anh, dạng `feat: ...`, `fix: ...`.
- Cuối mỗi bước: tóm tắt 2–3 dòng đã làm gì + Trung cần test gì.

## Lệnh

```
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm test                      # vitest (truy vấn chạy trên PGlite)
npm run db:generate           # sau khi sửa lib/db/schema.ts → commit migration
npm run demo:seed             # làm mới tài khoản demo để chụp ảnh / rà soát
scripts/bin/harness doctor    # kiểm tra Harness còn nguyên vẹn
```
