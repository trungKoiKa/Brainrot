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

Đọc `SPEC.md` trước khi làm bất cứ việc gì. SPEC là nguồn sự thật về phạm vi; không tự thêm tính năng ngoài SPEC.

> **Trạng thái:** v0.1 và **v0.2 xong 22/10/2026** (production https://brainrot-blue.vercel.app; tag `v0.1.0`, `v0.2.0`).
> Phạm vi: `SPEC.md` + `SPEC-v0.2.md`; kết quả ở `docs/plans/completed/`. **v0.3 (Dashboard)**: `SPEC-v0.3.md` đã duyệt và triển khai,
> plan `docs/plans/active/v0.3.md` chờ Trung test. **v0.4 (Mục tiêu · Thói quen · Nhìn lại)**: `SPEC-v0.4.md` đã duyệt, code xong 7 bước
> (26/10/2026, tag `v0.4.0`), plan `docs/plans/active/v0.4.md` chờ Trung test.
> **v0.5 (Một kho việc, bỏ Planner)**: `SPEC-v0.5.md` đã duyệt, code xong 5 bước (26/10/2026,
> tag `v0.5.0`), plan `docs/plans/active/v0.5.md` chờ Trung test. Planner đã gỡ; Notion Tasks là kho việc duy nhất.
> **v1.0 (Postgres, bỏ Notion)**: `SPEC-v1.0.md` đã duyệt 27/10/2026, **lên production 05/11/2026** (tag `v1.0.0`),
> đăng nhập email + mật khẩu. Plan `docs/plans/active/v1.0.md`. **Bước 5 xong 10/11/2026** (giữ email + mật khẩu, không Google): đăng xuất, Cài đặt
> (tên, hạn đếm ngược, dự án riêng, đổi mật khẩu, xoá tài khoản), chống dò mật khẩu; Trung tạo tài khoản bạn bằng `npm run user:password`.
> **Redesign 11/2026 lên production 11/11/2026** (PR #110, tag `v1.1.0-ui`): rà soát `docs/audits/2026-11-audit.md`, hướng nhìn `DESIGN.md`.
> Yêu cầu mới → ghi vào "Follow-ups" của plan đang chạy, chốt SPEC trước khi code.

## Thứ tự ưu tiên khi hướng dẫn mâu thuẫn

1. Yêu cầu của Trung trong chat.
2. `SPEC.md` (phạm vi, hành vi sản phẩm).
3. Các mục bên dưới của file này (quy tắc dự án).
4. Khối Harness ở trên và `docs/WORKFLOW.md` (cách làm việc chung).

Harness tự nói repo sở hữu quy trình riêng, nên khi lệch nhau thì quy tắc dự án thắng.

## Harness trong dự án này

- **Sản phẩm:** nguồn sự thật là `SPEC.md` ở gốc repo. Không tách SPEC ra `docs/product/` ở v0.1.
- **Quyết định thiết kế/sản phẩm** Trung đã chốt → cập nhật thẳng vào `SPEC.md` (SPEC yêu cầu vậy).
  `docs/decisions/` chỉ dùng cho quyết định kỹ thuật lâu dài (ví dụ cách tổ chức database), dùng template `docs/templates/decision.md`.
- **Plan:** v0.1, v0.2 ở `docs/plans/completed/`. Phiên bản mới → plan mới trong `docs/plans/active/`, cập nhật sau mỗi bước.
- **Bằng chứng từ v0.2:** thêm `npm test` (vitest) và ảnh chụp thật 1440×900 ở 2 theme cho mọi thay đổi giao diện.
- **Bằng chứng hoàn thành (proof):** `npm run build` + `npm run lint` không lỗi, và Trung test tay theo
  danh sách ở cuối mỗi bước. Không thêm framework test ở v0.1 (giữ ít dependency).
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

Trung, sinh viên năm 4 PTIT (IoT/Nhúng), đang làm đồ án hạn 06/12/2026. Thời gian cho dự án này ≤ 2 giờ/tuần.
Trung không muốn tự viết code ở dự án này: agent viết, Trung review, test và quyết định.

## Cách giao tiếp

- Trả lời bằng tiếng Việt, ngắn gọn, thẳng thắn, đi vào trọng tâm.
- Thuật ngữ tiếng Anh / khái niệm mới → giải thích ngắn trong ngoặc. Ví dụ: "middleware (đoạn code chạy trước mỗi request để kiểm tra đăng nhập)".
- Không bịa thông tin. Không chắc về API/thư viện → kiểm tra docs hoặc source, nói rõ là chưa chắc.
- Khi có quyết định thiết kế chưa có trong SPEC → hỏi Trung, đưa phương án đề xuất, không tự quyết.
- Phản biện nếu yêu cầu mới làm phình phạm vi hoặc ảnh hưởng mốc 08/11.

## Stack

Next.js (App Router) + TypeScript (strict) · Tailwind CSS · Drizzle ORM + Neon Postgres · react-force-graph-3d · Vercel

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
- Ưu tiên đơn giản, ít dependency. Không thêm database, auth library hay state library ở v0.1.

## Bảo mật

- Không bao giờ commit `.env.local`, token, mật khẩu. Kiểm tra `.gitignore` trước mỗi commit.
- Không in token/secret ra log hay ra màn hình.
- Trung tự điền biến môi trường trên Vercel và tự gõ mật khẩu (`npm run user:password`); agent chỉ hướng dẫn.

## Quy trình

- Lập plan theo mục 12 của SPEC, cho Trung duyệt trước khi code.
- Làm từng bước nhỏ; mỗi bước chạy được (`npm run dev`, `npm run build`, `npm run lint` không lỗi) rồi mới commit.
- Commit message ngắn, tiếng Anh, dạng `feat: ...`, `fix: ...`.
- Cuối mỗi bước: tóm tắt 2–3 dòng đã làm gì + Trung cần test gì.

## Lệnh

```
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm test                      # vitest: lib Brainrot (từ v0.2; Planner gỡ ở v0.5)
scripts/bin/harness doctor    # kiểm tra Harness còn nguyên vẹn
```
