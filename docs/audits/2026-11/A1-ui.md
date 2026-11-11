# A1: Visual UI design review (Second Brain / Brainrot)

Scope: read-only. Sources read: PRODUCT.md, DESIGN.md, the shell, and the source of every listed surface. Screenshots checked: login, today, tasks, goals-month/week/year, dashboard and settings. Each was checked in light and dark at desktop size, and on mobile for today, tasks and dashboard. The error page was judged from source only, since there is no screenshot of it. The live server was not used.

Caveat: the small red square at the bottom-left of every capture is the Next dev indicator, not app UI. Recharts bars that look empty in the dark `-full` captures are a capture artifact, as noted in the brief.

## 1. Nielsen scores (0-4 each, /40)

Heuristics: H1 Visibility of status · H2 Match with the real world · H3 Control & freedom · H4 Consistency & standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility & efficiency · H8 Aesthetic & minimalist · H9 Error recovery · H10 Help & docs

| Surface | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Login | 2 | 3 | 2 | 2 | 2 | 3 | 2 | 3 | 3 | 1 | **23** |
| Today | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 3 | 2 | **27** |
| Tasks | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 3 | 2 | **27** |
| Goal (Y/M/W) | 2 | 3 | 3 | 1 | 2 | 2 | 2 | 1 | 3 | 2 | **21** |
| Dashboard | 3 | 2 | 3 | 1 | 3 | 3 | 3 | 2 | 2 | 2 | **24** |
| Settings | 3 | 2 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 2 | **26** |
| Error page | 1 | 3 | 2 | 1 | n/a→2 | 3 | 1 | 3 | 2 | 1 | **19** |

Key issue per heuristic:

**Login**
- H1: The only status shown is the button text "Đang kiểm tra…".
- H2: Plain wording works.
- H3: No "show password" toggle and no way to recover a password; you have to ask Trung.
- H4: Hand-rolled inputs and button (`login-form.tsx:21,32,42`) instead of `fieldClass` or a library Input, so there is no focus-visible ring.
- H5: No caps-lock warning.
- H6: OK.
- H7: Enter submits; nothing else.
- H8: Clean, but generic: a bare card on an empty field. The product name and purpose are absent ("Second Brain" only, while PRODUCT.md calls the brand Brainrot).
- H9: An inline alert exists.
- H10: No hint of who can log in or how to get an account.

**Today**
- H1: "0/5 việc xong" is good. The habit count "0/4 hôm nay" is tiny.
- H2: Mixed "Deadline", "Daily Log" and "Today" inside Vietnamese text.
- H3: You can move a task to today, but there is no undo on tick.
- H4: "Due today" is drawn three different ways (see section 3).
- H5: Ticking completes the task immediately.
- H6: Section labels "Trễ lịch" and "Hạn hôm nay" are tiny 12px grey and easy to miss.
- H7: Quick add is inline.
- H8: The deadline list repeats the same 5 tasks that are already in "Hôm nay làm"; the page is 1,800px tall.
- H9: There is an ErrorNotice.
- H10: Empty states explain the reason.

**Tasks**
- H1: Counts per project.
- H2: OK.
- H3: Delete has an 8s undo.
- H4: Priority is rendered three different ways (`task-row.tsx:12-16`). Project colour is never shown.
- H5: OK.
- H6: Edit and delete icons repeat on every row, at full opacity.
- H7: Filters are chips, but there is no search or sort.
- H8: The 2-column masonry leaves large holes; the meta line is a grey soup (priority · deadline · Làm · Đang làm · note).
- H9: OK.
- H10: The subtitle explains the page's role.

**Goal**
- H1: The progress ring "0%" and "0/4 xong" say the same thing twice.
- H2: "Ưu tiên/Thường", OK.
- H3: Goals can be moved to the next period.
- H4: Traffic-light green/amber/red for habits here, red-only in the Dashboard, indigo checkboxes in the grid. Per-row icon actions differ from Tasks.
- H5: Edit, delete and "…" sit right next to each other on every goal.
- H6: Week cards truncate "Dời sang…" to "Dời sang..." on two lines.
- H7: The week view's 7 columns at 1440 force 2-3 words per line.
- H8: The densest and noisiest page: 5 frames, nested lists, badges and three icon buttons per goal.
- H9: There is undo.
- H10: Reflection prompts guide the user.

**Dashboard**
- H1: The headline sentence "Có 2 việc quá hạn…" is a strong focal point.
- H2: "+1700%" and "-77 điểm" deltas are meaningless to a human (`dashboard-blocks.tsx:48-66`).
- H3: The period switch works.
- H4: "Hôm nay" is amber here and indigo or red elsewhere. The project bar chart uses indigo/grey instead of the four field colours. The habit bars are all red.
- H5: n/a.
- H6: Legends exist.
- H7: Clicking a bar opens Tasks.
- H8: KPI strip, sparklines, badges and dots: four status encodings in one row. The "Chưa có dữ liệu" leftover frame at the bottom looks unfinished.
- H9: Errors are mostly shown via a stale banner.
- H10: Chart subtitles explain the data.

**Settings**
- H1: A ✓ status after save.
- H2: The date input renders "12/06/2026" (US month/day) for 06/12, the opposite of the Vietnamese reading (`settings-forms.tsx:36`).
- H3: OK.
- H4: The read-only email field looks identical to editable ones (`settings-forms.tsx:27`). The sidebar entry for Settings is labelled with the user's name.
- H5: "Xóa" for a project is disabled at 40% opacity with only a `title` tooltip explaining why (`:153-156`).
- H6: OK.
- H7: OK.
- H8: Calm and readable.
- H9: OK.
- H10: Helper lines under fields.

**Error page** (`app/(app)/error.tsx`)
- H1: No error digest or time.
- H2: Copy is friendly.
- H3: Only "Thử lại"; no link back to Today.
- H4: Hand-rolled button with no focus ring and no hover (`:18-24`). It is a full Card with an 18px serif title, unlike the StaleBanner Alert used elsewhere.
- H7: No auto-retry.
- H10: No hint about what to do if retry fails.

## 2. Problems a redesign must solve

### P0
1. **Today on mobile: the late-task row collapses into a one-word column.** The badge and "Dời sang hôm nay" button are `shrink-0` siblings of the title (`components/tasks/today-plan.tsx:18-35, 88-93`). Fix: put row actions on their own line under 640px, or move them into a row menu or swipe action.
2. **Project/field colour, a brand commitment, is invisible everywhere.** `components/field-badge.tsx` is imported by no page. Today shows the project as 12px grey text (`today-plan.tsx:30`, `today/page.tsx:209`). Tasks groups by project with no swatch. The Dashboard project chart uses primary/grey (`dashboard-blocks.tsx:140-141`). Fix: one `ProjectBadge` (dot + label, field colour) used in every task row, group header, chart and Settings list.
3. **Status colour semantics are inconsistent across pages** (full table in section 3). The same states (due today, late plan, habit %) get indigo, amber or red depending on the page. Fix: define one status map (overdue = danger, due today = warning, planned today = primary, done = good) in a shared helper and add `warning` to DESIGN.md, which the code already uses but the spec does not list.

### P1
4. **Goal page has no focal point and the highest chrome density.** Each goal row carries an edit, delete and "…" icon plus a count badge plus an add-task link (`components/goals/goal-panel.tsx:42-43`, ~15 raw buttons). Fix: one primary column (the period's goals) with actions moved into a row menu revealed on hover or focus; habit grid and reflection as secondary tabs or sections.
5. **The week view's 7 fixed columns are too narrow at 1440** (`components/goals/week-cards.tsx:153`, `xl:grid-cols-7`). Titles wrap every 2 words and "Dời sang…" repeats per task (`:99-108`). Fix: a horizontal week-planner list (day rows) or a 7-column layout with compact chips and drag or a menu to reschedule.
6. **Dashboard KPI deltas are nonsense at small bases** ("+1700%", "-77 điểm"; `dashboard-blocks.tsx:48-66`, `dashboard-view.tsx:333-360`). Fix: show absolute deltas ("+17 việc") or hide them when the base is under N; use one status encoding per KPI instead of dot + badge + sparkline.
7. **The same content is duplicated on Today.** "Deadline 14 ngày tới" lists the 5 tasks already in "Hôm nay làm" (`today/page.tsx:177-203`). Fix: exclude tasks planned today, or merge them into one list grouped by Overdue / Today / Upcoming.
8. **Two control systems coexist: library components and hand-rolled buttons and inputs.** About 59 raw `<button>`s, against 4 files importing Button. `iconButton` is copy-pasted in 3 files (`task-row.tsx:18`, `goal-panel.tsx:42`, `habit-manager.tsx:13`), and the goal-panel and habit versions lack focus rings. Login and error page use their own styles. Fix: the rebuild must route every action through shadcn `Button` (variants primary/ghost/destructive/outline, size icon) and every field through `Input`/`Select`/`DatePicker`.
9. **Settings date input uses the browser locale** (MM/DD shown for 06/12; `settings-forms.tsx:36`). Fix: reuse the custom DeadlineField or a shadcn Calendar popover with a dd/MM format.
10. **Content width and left edge change between pages.** max-w varies: Today and Tasks 5xl, Goal and Dashboard 6xl, Settings 3xl, Error 2xl. Headings jump from x=297 to x=329 to x=457. Fix: one page container width (for example 6xl) with a narrower inner column only for forms.

### P2
11. **Priority has three visual treatments** (`task-row.tsx:12-16`: bold pill, outline pill, bare text), and "Thấp" looks like metadata. Fix: one Badge, varied by an icon or weight, or show only "Cao".
12. **The task meta line is undifferentiated grey 12px.** Deadline, "Làm: T3", "Đang làm" and note all look alike (`task-row.tsx:84-101`). Fix: icon-prefixed meta (calendar, clock) and a status Badge for "Đang làm".
13. **Disabled primary buttons are pale indigo and look like a broken colour** ("Thêm" on Today, Tasks and Goal; `form-bits.tsx:5`, `disabled:opacity-50`). Fix: the library's disabled style, or keep the button enabled and validate on submit.
14. **Tasks masonry leaves holes.** Two uneven columns of project frames on the Tasks page. Fix: a single list grouped by project with sticky group headers, or a table view (ReUI data-grid).
15. **Secondary sections on Today use dashed outlines** (`today/page.tsx:57,92`), which reads as "drop zone / unfinished". Fix: a quieter solid surface or plain section headings, not dashed borders.
16. **Habit colour differs between Goal and Dashboard.** Goal uses the green/amber/red tone (`habit-month.tsx:14`, `progress-ring.tsx:4`), while all Dashboard habit bars are red/salmon. A low habit rate in danger red also reads as "error". Fix: neutral-to-good scale for habits; reserve danger for overdue.
17. **Leftover "Chưa có dữ liệu" frame at the bottom of the Dashboard** (`dashboard-view.tsx:385`) reads as a bug. Fix: put the per-chart empty state inside the chart's own frame.
18. **Empty states on Goal Year are four identical "–" rings** with "Chưa có mục tiêu ưu tiên" (`goals/page.tsx` + `progress-ring`). Fix: one empty state with a CTA ("Thêm mục tiêu năm") and collapse the quarter cards until data exists.
19. **The error page is a bespoke card with no focus style and no escape route** (`app/(app)/error.tsx:13-25`). Fix: a library Alert/Empty pattern with "Thử lại" plus "Về Today", and focus-visible styling.
20. **Sidebar footer is inconsistent.** The date and countdown are hidden only on /today (`sidebar-account.tsx:39`), so the footer height jumps. Settings is labelled with the user name and a gear icon (`:48`). Fix: a stable account block (avatar + name with a dropdown for Cài đặt and Đăng xuất); the countdown always lives in one place.

### P3
21. **Mixed language labels.** Nav uses English (Dashboard/Today/Tasks/Goal, `sidebar.tsx:29-34`) beside Vietnamese, plus "Deadline", "Daily Log", "Review". PRODUCT.md keeps the screen names, so this is a decision for Trung; at least keep it consistent inside cards.
22. **Typography scale has too many tiny steps.** 12px grey labels ("Trễ lịch", "Mục tiêu tuần", "Ghi nhanh ý tưởng") do structural work that h3s should do. Card titles at 18px serif are close to body size, and the Goal page's "Mục tiêu tháng" heading is 24px while "Tiến độ các tuần" is 18px. Fix: a 4-step scale (display / section / item / meta) with labels never carrying structure.
23. **Login is generic.** There is no brand mark (the sidebar has a brain tile), no product tagline and no theme toggle (`app/login/page.tsx:9-10`). Fix: brand block plus one sentence of purpose.
24. **Native `<details>` triangles** ("Cuối ngày", "Đã xong (7)", "Xoá tài khoản…") use different disclosure icons from the chevrons elsewhere. Fix: the library Collapsible/Accordion everywhere.
25. **The read-only email field is styled like an editable one** (`settings-forms.tsx:27`). Fix: render it as text, or use the disabled Input style.

## 3. Cross-page inconsistencies (same thing, drawn differently)

| Concept | Today | Tasks | Goal | Dashboard |
|---|---|---|---|---|
| Due today | red "hạn hôm nay" badge (plan, `today-plan.tsx:76`); indigo text "Hôm nay" (deadline card, `today/page.tsx:191`) | indigo text (`task-row.tsx:90`) | outline "hạn" badge (`week-cards.tsx:97`) | amber warning badge (`dashboard-blocks.tsx:331`) |
| Late plan (Ngày làm in past) | amber badge "trễ từ…" | red text "Làm: T7" (`task-row.tsx:95`) | n/a | "rơi việc" amber |
| Overdue | red title + red pill | red title + red text | red "quá hạn" badge | red badge |
| Project | 12px grey text | frame title (no colour) | not shown | grey/indigo bars, grey axis labels |
| Habit progress | outline pill chips | n/a | green/amber/red bars + indigo checkboxes | red bars only |
| Progress count | "0/5 việc xong" (sans) | "6 việc" | ring + serif "0/4" | ring + sans "0/4" |
| Row actions | outline text buttons | pencil + trash icons | pencil + trash + "…" + "×" | text links "Mở Tasks" |
| Add form | input + pale "Thêm" | input + selects + pale "Thêm" | input + select + pale "Thêm" | n/a |
| Section label | 12px grey h3 | chip-row labels | badge "Ưu tiên"/"Thường" | 14px grey subtitle |
| Container | Card + dashed sections | Card | Card + grey inset box ("Kỳ trước…") | Card + KPI strip |

## 4. What works and should survive

1. **The one-question-per-page model and the focal card.** "Hôm nay làm" on Today and the headline sentence on Dashboard ("Có 2 việc quá hạn cần xử lý trước.") give each page a clear answer. Keep a sentence-led headline per page.
2. **Warm paper and charcoal palette with a single indigo accent.** Both themes feel deliberate and calm; dark mode is warm, not blue-black. Contrast is good in both.
3. **Lora headings with Inter body**, with full Vietnamese glyph support. It gives the app personality cheaply. Keep the serif for page and section titles only.
4. **Inline, low-friction capture.** Quick add on Today and Tasks, "Dời sang hôm nay", tomorrow picker, undo strips after delete and move. These are the daily-use hooks.
5. **Honest copy and explained empty states.** Each empty state says why it is empty and where to go (`today-plan.tsx:40-44`); helper lines in Settings are good. Keep the voice.

## 5. Notes for the rebuild
- Pick one status palette and one ProjectBadge before building any page; most inconsistency comes from status and project being styled locally per component.
- Use library primitives only: Button, Input, Select, Calendar/DatePicker, Badge, Collapsible, DropdownMenu (for row actions), Empty, Alert. Delete `form-bits.tsx` class strings and the three `iconButton` copies.
- Fix the container width once in the app shell, not per page.
