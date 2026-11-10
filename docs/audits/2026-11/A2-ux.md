# Audit A2: UX flow review (Second Brain, demo account, prod build :3100, 10/11/2026)

How I tested: a headless Edge on CDP port 9334, driven by scripts that ran DOM actions (real clicks on buttons, menus and calendars, plus the native value setter for inputs). Screenshots are in the scratchpad (ux-*.png). Step counts include clicks and keystrokes, with each typed text counted as 1.

Data restored: the A2 tasks are deleted, the goals I added are deleted, the carry-over was undone, the profile and project names are back, "Gửi bản nháp chương 2" has Ngày làm 07/11 again, the habit is unticked and the Daily Log draft is cleared.
Side effects that remain: "Ghi chú…" and other seed data are untouched. "A2 test việc hôm nay" was soft-deleted. There were 2 failed change-password attempts on the demo account, which may count toward anti-bruteforce.

## Flow 1: Today
| Step | Count | Result |
|---|---|---|
| Add a task for today | 2 (type + Enter) | OK. Shows "Đã thêm …", focus goes back to the input. The message stays forever. |
| Tick it done | 1 | The row **disappears immediately**. There is no strikethrough and no Hoàn tác. |
| Move a late task to today | 1 ("Dời sang hôm nay") | OK. No confirmation or undo. The task jumps to the top of the list. |
| Daily Log draft | open 1 + type, leave, return | Restored with "Đã khôi phục bản nháp chưa lưu." After a full reload, though, the `<details>` is **collapsed** and the summary still says "· chưa ghi", so the draft is invisible. |
| Pick tasks for tomorrow | open 1 + tick 1 | OK. The list **reorders under the cursor** because the ticked item jumps up. An overdue task ("Trả sách", due 09/11) appears with no overdue marker. |
| Tick a habit | 1 | OK (aria-pressed, 1/4). |

Frictions:
- Overdue tasks with no Ngày làm ("Trả sách", due 09/11) are never shown in "Hôm nay làm". Only "Hạn hôm nay" is surfaced; the overdue ones appear only in the Deadline card further down.
- Once a late task is moved to today, it loses its overdue signal. "Gửi bản nháp" is 2 days overdue but shows no badge in the planned list.
- Task titles look clickable (hover:text-primary) but are plain spans. You cannot edit a task from Today.
- In "Mục tiêu tuần", the link "Mở" is vague.
- The Daily Log and Ngày mai làm are collapsed before 18:00, so you get no hint of pending work.

## Flow 2: Tasks
| Step | Count | Result |
|---|---|---|
| Add a task with project, priority, deadline and Ngày làm | ~10 (type, select×2, deadline open+pick, ngày làm open+pick, Thêm) | OK. Project and priority are kept. The new row is inserted mid-group with no highlight. The message auto-hides after 3 s. |
| Filter by project and priority | 2 | Works, but the **filter is not in the URL**: lost on reload or navigation, can't be shared, and Back does not undo it. |
| Edit, including linking a goal | 4 (✎, select goal, rename, Lưu) | OK. Goal options read like "· Tuần 46" (ISO week number is opaque). After saving, the **row shows no goal indicator anywhere**. |
| Complete, then Hoàn tác | 2 | OK. Toast lasts 8 s and focus moves to Hoàn tác. |
| Delete, then Hoàn tác | 2 | OK. The task is restored with its goal link. Deleting two tasks in quick succession leaves only the last one undoable. |
| Reopen a done task | 2 (open Đã xong, untick) | **Silent**: no toast. If a filter is active, the reopened task vanishes from view. The Đã xong list is not ordered by recency and shows no done date. |

Other: the deadline trigger shows only "20/11/2026" with no label after a pick, while Ngày làm shows "Ngày làm: …", which makes them ambiguous side by side. `/tasks?project=<unknown>` creates a phantom chip.

## Flow 3: Goal
Month view:
- Add a goal: 2 steps. Focus is lost to the body afterward. The add form sits *below* the list and the "Chuyển…" button.
- ⋯ → Gắn việc: 4 steps (⋯, Gắn việc, type, pick). The popover stays open and announces "Đã gắn" to screen readers only. **Search is not diacritic-insensitive**: "don" does not find "Dọn". The picker shows titles only, with no project or deadline.
- Unlink, then Hoàn tác: 2 steps. OK.
- Link a habit with a threshold: 5 steps (⋯, Gắn thói quen, select, number, Lưu). The default is 80%. With 40%, the goal immediately shows **"tự xong"** (50% after 10 of 30 days) even though its linked task is undone. That's a confusing early auto-complete.
- Carry over, then Hoàn tác: 2 steps. **BUG**: the button says "Chuyển 4 mục tiêu chưa xong" but the result says "Đã chuyển 5". After carrying, the button label stays unchanged. Undo works.
- "Thêm làm mục tiêu" from the previous focus: 1 step. It is added as Ưu tiên, with no undo. Matching is exact-title only: "Đo dòng tiêu thụ" is offered even though "Gửi chương 2 và đo xong dòng tiêu thụ" exists.

Week view:
- Dời sang… → day → Hoàn tác: 3 steps. OK.
- **Past days are offered as targets** (T2 09/11). There is no "next week" option.
- The 7 columns are narrow (~135px). "Dời sang…" wraps onto 2 lines on every task. The page is 2960px tall, and the week goals and Nhìn lại are far below.
- The "Chưa xếp ngày" tray works after linking a no-date task. It is dashed, sits above the days and shows the goal name.

Year view → Q4 → month: links work. **Inconsistent counts**: the Year card shows "Quý 4/2026 0/0 mục tiêu" while Q4 holds 6 month goals (the quarter page shows them). The year view looks empty for a user who only plans by month.

## Flow 4: Dashboard
- Switching the period (1) and Thật/Mẫu (1) both work, but **neither is in the URL**. The headline stays "Tuần này · từ 09/11" whatever the period, so only some cards react.
- The headline action "Xem việc quá hạn ở Tasks" links to plain `/tasks`. Tasks has **no overdue filter**, so the link is a weak dead end.
- In Mẫu mode, project links go to the real Tasks page (`/tasks?project=Sản phẩm`), which shows "Không có việc nào khớp bộ lọc".
- KPI deltas are odd: "Việc tồn 20 +1900%" at 30 days. The two habit figures disagree: "thói quen đạt 13%" in the headline vs "TB 14%" in the card.
- The goal list in "Mục tiêu tháng này" uses checkbox glyphs that are not interactive.
- Following a project link and pressing Back keeps the dashboard state (router cache).

## Flow 5: Settings
- Changing the name and countdown: 4 steps. The sidebar footer, the Today greeting (last word: "Bạn Demo Hai" → "Hai") and the Dashboard countdown card all updated.
- Add, rename and delete a project: 2, 3 and 1 steps. A rename cascades to tasks. Delete has no confirm, which is fine because it is only allowed with 0 tasks. When the project still has tasks, the delete button is disabled and the reason is in a `title` tooltip only. The count includes done tasks. You cannot reorder projects, even though their order drives the group order on Tasks.
- Wrong current password: shows "Mật khẩu hiện tại không đúng." and **clears all three fields**. A confirm mismatch is caught only server-side and also clears everything.
- Spelling is mixed on one page: "Xóa" / "Xoá".
- Logout: 1 step, immediate, lands on /login with no "đã đăng xuất" message.

## Flow 6: Navigation
- The sidebar order is Dashboard, Today, Tasks, Goal, yet "/" redirects to /today. Settings is reachable only through the name "Bạn Demo" in the footer.
- Goal level and period are real links, so Back works. Tasks filters and Dashboard toggles are client state only.
- **`/does-not-exist`** shows Next's default English "404: This page could not be found." with no sidebar and no link home.
- A deep link while logged out goes to /login without `?next=`, and after login you land on `/` (proxy.ts:14, app/login/actions.ts:77).
- `/goals?level=foo` and `period=garbage` fall back gracefully.

## Bugs
1. **Ticked tasks on Today vanish instead of staying struck through. No undo on Today.** Repro: tick any task in "Hôm nay làm". Cause: components/tasks/today-plan.tsx:64-65 only keeps a task visible while `initial` still says it's open. After refreshData the new `initial` has status Xong, and planToday (lib/today.ts:42) filters it out. The checkbox is locked, so reopening means going to Tasks › Đã xong.
2. **Carry-over count mismatch.** The button counts goals with `isGoalDone` (which includes autoDone): goal-panel.tsx:232 `counts.total - counts.completed`. The server copies every goal with `!g.done` (lib/db/mutations.ts:199). Repro: link a habit so a goal becomes "tự xong", then press Chuyển. The label says N and the result says N+1.
3. **Change password wipes every field on error** (settings-forms.tsx:54-75: uncontrolled inputs plus React form reset). There is no client-side check for mismatch or minimum length before the round trip.
4. **Logged-out deep links lose their target**: no `next` parameter (proxy.ts:14, login actions.ts:77).
5. **SPEC mismatch**: SPEC-v1.0 Goal đợt 4 says the linked task's "tên mở trang Tasks", but `url: ""` (lib/db/queries.ts:34) makes MaybeLink render a plain span everywhere (Today, Goal, week cards), still styled with hover:text-primary.
6. **Raw 404**: there is no `app/not-found.tsx`, so users get English text and no navigation.
7. **The Daily Log draft is restored into a collapsed `<details>`** after reload, with the summary still saying "chưa ghi" (quick-capture.tsx:110-113: `open` ignores `restored`).
8. Week "Dời sang…" offers past days (week-cards.tsx:112-124), so moving there creates an instant "trễ lịch".
9. The Goal TaskPicker search is case-insensitive but not diacritic-insensitive (goal-panel.tsx:670).
10. The Year view's quarter cards count only quarter-level goals ("Quý 4 0/0" while Q4 has 6 month goals).

## Top 10 UX improvements for the redesign
1. **A task detail drawer reachable from every surface** (Today, Goal, week cards, Dashboard). Clicking a title opens a side sheet to edit or reopen, replacing the dead "link-looking" spans and the trip to Tasks.
2. **One consistent toast or undo system** for every mutation: tick on Today, reopen, plan to today, "Thêm làm mục tiêu", add goal. Stack the toasts so rapid actions keep their undo.
3. **Make Today the true inbox**: one "Cần xử lý" group (late plans plus overdue deadlines plus due today), with inline overdue badges. Done items stay struck through with an untick until the day ends.
4. **Put view state in the URL**: Tasks project, priority and overdue filters; Dashboard period and Thật/Mẫu. Add an "Quá hạn" filter so the Dashboard headline action lands on exactly those tasks.
5. **Rework the week planner**: a 7-day board using full width (or a list for each day below md). Make "Dời sang" a compact date popover that includes next week, disable past days, and support drag-and-drop between days and the tray.
6. **Show the task↔goal relationship on Tasks**: a goal chip on each row and a "Mục tiêu" filter, with goal options named by period ("Tuần 9–15/11"), not "Tuần 46".
7. **Reorganise the Goal month page**: the add-goal input at the top of the list; the previous-focus box collapsed into a small banner; the carry-over moved to an end-of-period prompt with an accurate count. The year and quarter views should roll up child goals.
8. **Navigation**: order the sidebar Today, Tasks, Goal, Dashboard; give Settings an explicit gear entry; add a branded Vietnamese 404 and error page linking to Today; preserve `next` through login.
9. **Forms that don't lose input**: controlled password fields that keep values on error, client-side mismatch and length checks, focus on the failing field, and project delete with an explained disabled state (inline text, not a tooltip). Also a habit-threshold explanation, so a goal isn't marked "tự xong" mid-period without saying it's provisional.
10. **Vietnamese-aware search and pickers**: fold diacritics, and show project and deadline in the TaskPicker. Fix the unstable ordering in "Ngày mai làm" (keep the list order, mark the selection in place) and show the count of drafted Daily Log content in the summary.
