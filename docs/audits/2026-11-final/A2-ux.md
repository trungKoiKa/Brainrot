# Final audit A2: UX flow re-review (demo account, prod build :3100, 11/11/2026)

How I tested: the same six flows were driven on a headless Edge (CDP 9334) through DOM actions: clicks on checkboxes, menus, popovers and calendar days, the native value setter for inputs, and `requestSubmit`. Logged-in state used the demo session cookie from `cdp-login.mjs`. Before and after snapshots of demo tasks, goals, goal_tasks, user and projects were taken read-only through Neon (scripts in `final-audit/a2/`).

Data restored: the 3 test tasks were deleted. The moved Ngày làm for "Đo dòng…" and "Viết chương 3…" is back. "Đọc paper YOLOv8" is back to Đang làm (see N1). The Ngủ goal threshold is back to 80%. The display name is back to "Bạn Demo". The Daily Log draft is cleared, the habit is unticked, and Dashboard localStorage is back to Mẫu / 7 ngày. The task diff before and after is empty.

Left over: 5 soft-deleted goal rows (deleted_at set, so invisible): 2 test goals plus the 3 Tháng 12 copies whose carry-over was undone. There were no failed logins and no password changes. The password test used the server path that rejects "mới = hiện tại" before any check.

What I could not do: the login form submit (deep link → login → return). The demo password is not in the repo, so that leg is verified only up to `/login?next=…` and the hidden `next` field, plus a code read of `safeNextPath` and the redirect.

## Old bugs (audit A2, 10/11)

| # | Bug | Status | Evidence |
|---|---|---|---|
| 1 | A ticked task on Today vanishes, with no undo | **FIXED** | Tick → row stays struck through with a "xong" pill, plus a toast "Đã xong … \| Hoàn tác". Undo, re-tick and untick via the checkbox all work. A reload keeps the done row (`doneOn === today`). |
| 2 | Carry-over count mismatch | **FIXED** | Lowered the Ngủ goal's threshold to 50% → "tự xong". The button says "Chuyển 3", the toast says "Đã chuyển 3", the button hides, and Hoàn tác brings it back. The copies are soft-deleted. |
| 3 | Change password wipes fields; no client checks | **FIXED** | "abc" gives "Tối thiểu 8 ký tự (mới 3)" and disables the button. A mismatch shows "Chưa khớp…" (role=alert) and disables it. On a server error, all 3 fields keep their values at 0.3, 1.8 and 4.8 s. |
| 4 | Logged-out deep link loses its target | **FIXED** (form submit not exercised) | `/goals?level=week` → `/login?next=%2Fgoals%3Flevel%3Dweek`, and the hidden `next` is "/goals?level=week". The action redirects via `safeNextPath`. See N2 for a gap in it. |
| 5 | Task titles look like links but are spans (SPEC-v1.0 says "tên mở trang Tasks") | **NOT FIXED** | `url: ""` (lib/db/queries.ts:34,67) still makes MaybeLink render a span. It keeps `hover:text-primary` in today-plan.tsx:77 and goal-panel.tsx:384. |
| 6 | Raw English 404 | **FIXED** | `app/not-found.tsx`: "LỖI 404 · Không có trang này" with "Về Today" and "Mở Tasks". |
| 7 | Daily Log draft restored into a collapsed `<details>` (deferred P2) | NOT FIXED (deferred) | After a reload the details are closed, the summary says "· chưa ghi", and the textarea holds the draft (quick-capture.tsx:110). |
| 8 | Week "Dời sang…" offers past days (deferred P2) | NOT FIXED (deferred) | Options are T2 09/11, T4 11/11 … CN 15/11 (today is T4 11/11), with no next week (week-cards.tsx:106). Move and Hoàn tác themselves work. |
| 9 | TaskPicker search not diacritic-insensitive (deferred P2) | NOT FIXED (deferred) | "don" gives "Không có việc nào khớp", while "Dọn" finds it (goal-panel.tsx:635-636). |
| 10 | Year quarter cards ignore month goals (deferred P2) | NOT FIXED (deferred) | Year shows "Quý 4/2026 0/0 mục tiêu", while the Q4 page shows Tháng 11 at 0/4. |
| (P2) | Filters not in URL | NOT FIXED (deferred) | Tasks project and priority filters stay at `/tasks`. Clicking "Tất cả" after arriving from `?project=` leaves the param in the URL. Dashboard period and mode now persist in localStorage, not the URL. |

## New bugs and regressions

**N1 (P1, correctness): "Hoàn tác" after ticking a task that is *Đang làm* sets it to *Chưa làm*.**
- Repro: on Tasks, tick "Đọc paper YOLOv8 phần head" (đang làm), then press Hoàn tác. The "đang làm" pill is gone, and the DB status is "Chưa làm".
- Cause: undo calls `reopen` → `reopenTask` (lib/db/mutations.ts:31-33), which hard-codes `status: "Chưa làm"`. The optimistic update does the same (components/tasks/use-task-completion.ts:24).
- Same path: the Today toast and untick (today-plan.tsx:134, use-plan-tasks.ts:33). The redesign now offers this undo on Today, where in-progress tasks are common.
- Fix: pass the previous status to reopen and restore it.

**N2 (P1, security, verified only up to the redirect code): `safeNextPath` can be bypassed with tab or newline characters → open redirect after login.**
- `?next=%2F%09%2Fevil.com` decodes to "/\t/evil.com". It passes all checks in lib/next-path.ts:9-11.
- `redirect()` emits it raw (x-action-redirect). Both Next's client (`new URL(…)`, assign-location.js) and the browser's URL parser strip tab and LF, so it resolves to `http://evil.com/`. `node -e 'new URL("/\t/evil.com","http://localhost:3100").href'` gives `http://evil.com/`.
- Not exercised end to end, because that needs a valid login.
- Fix: reject any character below 0x20 or a backslash, or check that `new URL(next, base).origin === base.origin`.

**N3 (P3): focus no longer moves to the undo toast on Tasks.** The old audit saw focus land on Hoàn tác. Now, after complete or delete, focus stays on the row. A keyboard user must know sonner's Alt+T. Undo itself returns focus correctly to the row checkbox.

**N4 (P3): duplicate "xong" in Đã xong rows.** A row reads "… xong xong 08/11": a StatusPill at task-row.tsx:48 and "xong dd/mm" at :56.

**N5 (P3): Today readout "VIỆC HÔM NAY 0/2" vs list "Hôm nay làm · 8 dòng".** The KPI counts only tasks planned or due today. The 6 late rows shown in the same list are excluded (today/page.tsx:81). It reads as a mismatch.

**N6 (P3, cosmetic, low confidence): after "Thêm" on Tasks the Dự án and Ưu tiên selects briefly show the placeholder.** At +3.5 s the DOM value was "", then it re-synced to "Học AI" and "Cao" on the next render. This looks like the React 19 form-action reset racing the controlled `<select>`s (task-forms.tsx:60-66).

## Flow notes (unchanged frictions, not regressions)

- **Today:**
  - "Làm hôm nay" still has no toast or undo.
  - A late task moved to today loses its overdue signal: a past deadline shows as muted "hạn dd/mm".
  - An overdue no-plan task ("Trả sách", T+2) appears only in the Hạn card.
- **Tasks:**
  - Add (≈10 steps) keeps project and priority, with focus back on the title.
  - Edit plus linking a goal works, but goal options still read "· Tuần 46" and the row shows no goal indicator.
  - Stacked delete-undo for 2 tasks works, and the goal link survives the restore.
  - Reopen is silent, and with a project filter on, the reopened task vanishes.
  - Đã xong now shows a done date but is still ordered by project, not by recency.
- **Goal:**
  - Add goal: the form is still below the list and the carry button.
  - "Thêm làm mục tiêu" still has no undo and still matches exact titles only ("Ngủ trước 0h" is offered beside "Ngủ trước 0h ít nhất 80%…").
  - Unlink → toast Hoàn tác works.
  - The week board is now 4 columns (251px) and the page is 2223px tall.
- **Dashboard:**
  - The headline is still "Tuần này · từ 09/11" for every period.
  - "Xem việc quá hạn ở Tasks" still goes to `/tasks`, which has no overdue filter.
  - In Mẫu mode, project and task links go to the real Tasks page.
  - Mẫu persists across visits through localStorage. A returning user may land on sample data, but the banner and "Về dữ liệu thật" make that clear.
- **Settings:**
  - Name save → "Đã lưu." and the sidebar updates.
  - Project delete is disabled, with the reason only in `title` ("Còn việc trong dự án này").
  - "Xóa" and "Xoá tài khoản…" are still spelled two ways.
  - Logout lands on /login with no message.
- **Navigation:**
  - The sidebar order is Dashboard, Today, Tasks, Goal. Settings is reachable only via the name.
  - `/` redirects to /today.
  - `/goals?level=foo&period=garbage` falls back to the month view.
  - A logged-in visit to `/login?next=/goals` goes to /today and ignores `next` (minor).
