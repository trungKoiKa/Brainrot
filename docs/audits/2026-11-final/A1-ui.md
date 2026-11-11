# A1 (re-run): Visual UI review after the "technical log" redesign

Read-only. Branch `redesign-10-final`. Production build on :3100, demo account, Edge headless CDP :9333.
Captures: `final-audit/a1/<slug>-<light|dark>[-full|-m].png` for login, today, tasks, goals-month/week/year,
dashboard, settings and 404 (`/khong-co-trang`), at 1440x900 and 375. Error boundary `app/(app)/error.tsx` judged from source.
Scratch script: `shoot-a1.mjs` (shoot-all + 404 route).

Capture notes. These are not app bugs:
- The faded pink tab at the left edge, y≈800–920, is `<a id="bottomBar">` injected by a browser extension (`chrome-extension://` img), not the app.
- In `-full` captures the sidebar background stops at 900px because it is `h-svh` fixed.
- Recharts bars are empty in light `-full` captures. This is a known capture artifact; the bars render in the viewport shot.
- Dashboard numbers differ slightly between the light and dark runs (18 vs 19 tasks). Data changed between captures, probably another agent.

## 1. Scores (Nielsen, 0–4 each, /40)

| Surface | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | New | Old |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Login | 2 | 3 | 2 | 3 | 2 | 3 | 2 | 4 | 3 | 3 | **27** | 23 |
| Today | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 3 | **31** | 27 |
| Tasks | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **31** | 27 |
| Goal (Y/M/W) | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 3 | 2 | **27** | 21 |
| Dashboard | 4 | 2 | 3 | 2 | 3 | 3 | 3 | 3 | 2 | 3 | **28** | 24 |
| Settings | 3 | 2 | 3 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | **28** | 26 |
| 404 (new) | 3 | 4 | 4 | 4 | 3 | 4 | 3 | 4 | 3 | 3 | **35** | n/a |
| Error boundary (source) | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 2 | **31** | 19 |

Key observations by surface:

**Login.** Strong brand block ("BRAINROT · ĐĂNG NHẬP", "Mở nhật ký của bạn"), graph paper, a square frame and a note on how to get an account. Both themes and 375 look clean.
- Still missing: a show-password toggle and a caps-lock hint.
- Inputs look about 6px rounded against a frame that is 0px. Minor.

**Today.** The KPI row, numbered rows `01…08`, project pills and status pills all match DESIGN. The mobile row now wraps its tags under the title, and the deadline list no longer repeats planned tasks.
- "VIỆC HÔM NAY 0/2" sits above an "8 dòng" list. The 6 late rows are not counted, which reads as a contradiction.
- The deadline side list uses a third notation: `T+2` in red text plus a red title (`app/(app)/today/page.tsx:153,165,171`), instead of the "quá N ngày" pill.
- Native `<details>` triangles in "Cuối ngày" remain.

**Tasks.** Project-coloured square swatches on group headers, a KPI row, filter chips, "đang làm", "quá N ngày" and "hạn hôm nay" pills all match DESIGN.
- A late plan is drawn as amber mono text "làm T3 10/11" (`components/tasks/task-row.tsx:56-60`), while Today draws the same state as a "trễ N ngày" pill.
- Priority adds a fourth, grey pill kind that DESIGN does not list (`task-row.tsx:46`).
- Pencil and trash icons appear on every row at full strength.
- The project filter chips carry no colour dot.

**Goal.** Better than before: a "…" row menu, square tabs, the week view as a 4-column grid at 1440 and an accordion at 375, and orange habit checkboxes. It is still the noisiest page.
- Square bordered `Badge`s ("Ưu tiên", "Thường", "0/3 task", "quá hạn", "hạn", "Hôm nay") form a second label family next to pills.
- No project colour appears anywhere.
- Habit percentages use the red/amber/green traffic light (`components/habits/habit-month.tsx:14`, `components/goals/progress-ring.tsx:4`).
- There are dashed dividers (`goal-panel.tsx:184`, `week-cards.tsx:139`), a grey "Kỳ trước…" inset box inside the frame, and no KPI row.
- On Month at 1440 the right column holds only "Tiến độ các tuần" (≈230px tall), with a large void under it.
- Year view: four identical empty "–" quarter rings.
- **375 bug:** the "×" (unlink) for each linked task wraps onto its own line under the task (`goal-panel.tsx:376`, `flex-wrap`), leaving orphan × marks (see `crop-week-m.png`).

**Dashboard.** The headline sentence works and the layout grid is good, but it is the page least aligned with DESIGN.
- The KPI row uses sans labels with coloured dots, sparklines and delta badges (`dashboard-blocks.tsx:86`), not the mono uppercase readout row used on Today and Tasks.
- "Việc theo dự án" bars are orange/grey (`dashboard-blocks.tsx:143-144`), not project colours.
- Deadlines use square `Badge`s "Quá hạn 3 ngày", "Hôm nay" (outline) and "Ngày mai" (`dashboard-blocks.tsx:334`), which conflict with the pill map: due today should be a red pill.
- All habit bars are red.
- The "Chưa có dữ liệu" leftover frame remains (`dashboard-view.tsx:385`).
- The period and "Thật/Mẫu" segmented controls are fully rounded (`dashboard-view.tsx:416-423`), while the Goal tabs are square.

**Settings.** Calm and aligned to the same left edge.
- The date still renders browser-locale "12/06/2026" (`components/settings/settings-forms.tsx:38`, native `type="date"`).
- The project list shows no colour swatch, even though DESIGN says colour is assigned by project order here.
- The "Xóa" button is 40%-opacity pink when disabled (`:196`).
- The email field is read-only and its text is muted, but it keeps the same editable frame (`:27`).
- Buttons are hand-rolled (`:47,137,169`), so "Lưu" and "Đổi mật khẩu" have different heights.
- A native `<details>` holds "Xoá tài khoản…" (`:214`).

**404.** Mono "LỖI 404", a clear title, a primary "Về Today" and an outline "Mở Tasks". Good in both themes and at 375. It has no app shell, which is acceptable.

**Error boundary.** Now uses the library `Alert`, "Thử lại" and "Về Today", and focuses the h1. It is centred (`mx-auto max-w-xl`) instead of following the shell's left edge. Minor.

## 2. Old P0/P1 status

| # | Old issue | Status | Evidence |
|---|---|---|---|
| P0-1 | Today mobile row collapses to a one-word column | **FIXED** | `today-light-m.png`: tags wrap under the title |
| P0-2 | Project colour invisible | **PARTLY** | Fixed on Today (pills) and Tasks (header swatch). Still absent on Goal, the Dashboard project chart (`dashboard-blocks.tsx:143`), the Settings project list and the Tasks filter chips |
| P0-3 | Status colours inconsistent across pages | **PARTLY** | `StatusPill` is used only in `today-plan.tsx` and `task-row.tsx`. Goal week uses square Badges (`week-cards.tsx:91`), Dashboard uses square Badges with different wording (`dashboard-blocks.tsx:334`), Today's deadline list uses `T+N` red text, and Tasks shows a late plan as amber text. Today never shows "quá N ngày" on a late row (`today-plan.tsx:53-54`): "Gửi bản nháp chương 2" is "trễ 4 ngày" on Today but "quá 3 ngày" on Tasks |
| P1-4 | Goal has no focal point and dense chrome | **PARTLY** | Goal actions moved to "…". Linked-task ×, square badges, the inset box and dashed dividers remain. Still no KPI row |
| P1-5 | Week view: 7 narrow columns | **FIXED** | 4+3 grid at 1440, accordion at 375. "Dời sang…" still repeats on every task |
| P1-6 | Meaningless KPI deltas | **PARTLY** | "+1700%" became "gấp 9 lần"; "-77 điểm" remains (`dashboard-blocks.tsx:63`) |
| P1-7 | Today duplicates tasks in the deadline list | **FIXED** | The deadline list shows only unplanned tasks |
| P1-8 | Two control systems | **PARTLY** | About 34 raw `<button>`s outside `ui/`: `goal-panel` 8, `settings-forms` 6, `habit-manager` 4, `week-cards` 4… Native `<select>` remains in `task-forms.tsx:35` and `goal-panel.tsx:458,535`, plus 3 native `<details>` and a native date input |
| P1-9 | Settings date uses browser locale | **NOT FIXED** | `settings-forms.tsx:38`; screenshot shows 12/06/2026 |
| P1-10 | Content width and left edge jump | **FIXED** | Every page starts at x=288 with the same header pattern. Settings uses an intentional narrower form column |

Old P2/P3, briefly:
- P2-13, pale disabled "Thêm"/"Lưu": **NOT FIXED** (`form-bits.tsx:6` `disabled:opacity-50`).
- P2-15, dashed sections: Today **FIXED**; Goal still uses dashes.
- P2-16, habit colours: **NOT FIXED** (red on Dashboard, traffic light on Goal).
- P2-17, "Chưa có dữ liệu" frame: **NOT FIXED**.
- P2-18, Year empty rings: **NOT FIXED**.
- P2-19, error page: **FIXED**.
- P2-20, sidebar footer: **NOT FIXED**. Date and countdown are hidden only on Today (`sidebar-account.tsx:38`) and the Settings item is labelled with the user name (`:48`).
- P3-23, generic login: **FIXED**.
- P3-24, native `<details>`: **NOT FIXED**.
- P3-25, read-only email: **PARTLY**.

## 3. DESIGN.md consistency check

| Rule | Result |
|---|---|
| Status pills the same everywhere | **Fail.** Pills on Today and Tasks; square Badges on Goal and Dashboard; text on the Today deadline list and the Tasks late plan |
| Project colours visible | **Partial.** Today and Tasks only |
| One frame family | **Mostly pass.** Square 1px frames everywhere. Exceptions: the grey inset "Kỳ trước…" box inside the Goal frame, and the dashed "Chưa xếp ngày" tray |
| No serif | **Pass visually.** `font-serif` maps to Plex Sans (`globals.css:170`), but the class is still used in `progress-ring.tsx:38` and `week-cards.tsx:140`. Cleanup only |
| Rounded only for pills | **Minor fails.** Habit toggle chips (`habit-today.tsx:37`), Dashboard segmented controls (`dashboard-view.tsx:416`), and inputs that look over 4px |
| One accent (orange) | **Pass.** Green appears only for success; red is used for low habits, which DESIGN reserves for overdue |
| KPI row on every page | Today and Tasks pass. Goal has none. Dashboard uses a different style |

## 4. Remaining issues

### P0
None. No blocking layout breakage was seen at 1440 or 375 in either theme.

### P1
1. **One Status Map is still broken across pages.** Fix: route Goal week (`week-cards.tsx:91,178`), Dashboard deadlines (`dashboard-blocks.tsx:334`), the Today deadline list (`today/page.tsx:165-171`) and the Tasks late plan (`task-row.tsx:56-60`) through `StatusPill` with the same wording.
2. **Today hides the overdue state on late-plan rows** (`today-plan.tsx:53-54`). The same task reads "trễ 4 ngày" on Today and "quá 3 ngày" on Tasks; Today should show both pills, or overdue first.
3. **No project colour on Goal (linked tasks, week cards), the Dashboard project chart (`dashboard-blocks.tsx:143-144`) or the Settings project list.** Use `--field-N` and `ProjectPill` or a swatch.
4. **Goal at 375: orphan "×" lines under every linked task** (`goal-panel.tsx:376`). Keep × on the title row; `flex-nowrap` with `min-w-0` on the title.
5. **Habit progress in danger red and the traffic light** (`habit-month.tsx:14`, `progress-ring.tsx:4`, Dashboard habit bars). DESIGN says warning means "thói quen chưa đạt"; red is for overdue.
6. **Settings date shows MM/DD** (`settings-forms.tsx:38`). Reuse `DeadlineField`.
7. **Dashboard KPI row diverges from the readout pattern** (`dashboard-blocks.tsx:86`), and "-77 điểm" is still opaque (`:63`).

### P2
8. Square `Badge` label family on Goal ("Ưu tiên", "Thường", "0/3 task") beside pills (`goal-panel.tsx:179,242,246`). Pick one.
9. Disabled primary buttons look like a broken pale orange (`form-bits.tsx:6`).
10. Today KPI "0/2" vs an 8-row list, because late rows are uncounted. Label it, or count them.
11. Leftover "Chưa có dữ liệu" frame (`dashboard-view.tsx:385`).
12. Year view: four identical empty quarter rings, and no CTA beyond the input.
13. Goal Month at 1440 has a large empty right column under "Tiến độ các tuần".
14. Remaining hand-rolled controls in Settings and Goal: button heights differ ("Lưu" vs "Đổi mật khẩu"). Native selects and dashed dividers on Goal.
15. Sidebar footer: date and countdown vanish only on Today; the Settings item is labelled with the user name (`sidebar-account.tsx:38,48`).
16. Dashboard segmented controls are rounded while the Goal tabs are square.

### P3
17. Native `<details>` triangles (`quick-capture.tsx:110`, `today-plan.tsx:190`, `settings-forms.tsx:214`).
18. Priority as a fourth, grey pill kind (`task-row.tsx:46`). Consider showing only "ưu tiên cao".
19. `T+2` vs `T-05` padding is inconsistent (`today/page.tsx:153`).
20. Read-only email keeps the editable frame. The disabled "Xóa" is 40%-opacity pink.
21. Dead `font-serif` classes (`progress-ring.tsx:38`, `week-cards.tsx:140`).
22. Login: no show-password toggle and no caps-lock hint.

## 5. What improved most
- One shell, one left edge, one header pattern (mono eyebrow, 30px title, subtitle) on every page. The graph paper and square frames hold together in both themes.
- Today and Tasks are now the reference implementation: KPI readouts, numbered rows, project and status pills, a clean wrap at 375.
- The 404 page, error boundary and login are now on-brand with clear exits.
