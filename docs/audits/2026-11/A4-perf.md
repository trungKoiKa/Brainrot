# A4 — Performance audit (Second Brain, branch `redesign`, build 16.4.2 Turbopack)

Method: production `next start` on :3100, dedicated headless Edge (CDP 9336), demo account (27 tasks, 14 goals, 9 daily logs, 2 reflections — small data set; real accounts will be heavier). Cold loads with cache disabled, own CDP target per run, 3 runs per route, median shown. Probe script: `scratchpad/a4-perf.mjs`, summariser `scratchpad/a4-sum.mjs`, raw JSON in `scratchpad/a4/`. "content" = first frame with no `animate-pulse` skeleton and >50 chars of text in `<main>`. TTI is approximated as max(DCL, end of last long task). Neon RTT measured from this machine: `select 1` warm ≈ 80 ms (first 2 calls 270–380 ms cold), 6 parallel ≈ 210 ms.

## 1. Numbers per route (desktop 1440×900, no throttling)

| Route | Build | JS first load gz / raw (files) | Doc HTML gz/raw | Fonts | TTFB | FCP | Server stream done (docEnd) | Content | LCP | TBT | CLS | RSC nav fetch (median) | DB queries / critical-path RTTs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| /login | ○ static | 136 / 449 KB (7) | 3 / 10 KB | 104 KB (4) | 47 ms | 124 | 48 | — | 124 | 0 | 0 | — | 0 (form only) |
| /today | ◐ PPR | 216 / 673 KB (12) | 21 / 96 KB | 188 KB (5) | 12 | 172 | 542 | 769 | 820 (H1) | 26 | 0.0046 | 213 ms, 40 KB | **14 / 4** |
| /tasks | ◐ | 244 / 760 KB (13) | 19 / 128 KB | 208 KB (6) | 12 | 192 | 239 | 510 | 192 | 57 | 0.0045 | 200 ms, 24 KB | 6 / 2 (1 needless) |
| /goals (month) | ◐ | 247 / 762 KB (13) | 24 / 180 KB | 208 KB | 11 | 196 | 471 | 514 | 196 | 20 | 0.0010 | 305 ms, 35 KB | **14 / 4** |
| /goals?level=week | ◐ | 247 / 762 KB (13) | 22 / 128 KB | 208 KB | 12 | 184 | 249 | 518 | 184 | 39 | 0.0011 | 373 ms, 37 KB | 14 / 4 |
| /dashboard | ◐ | **331 / 1059 KB (14)** | 13 / 50 KB | 208 KB | 13 | 164 | 362 | **703** | 832 | 92 | 0.0010 | 331 ms, 23 KB | **15 / 4** |
| /settings | ◐ | 210 / 651 KB (12) | 15 / 73 KB | 208 KB | 12 | 288 | 133 | 324 | 288 | 17 | 0.0011 | 134 ms, 26 KB | 3 / 1 |

CSS: 2 files, 20 KB gz / 116 KB raw, same everywhere (fine).

### Mobile profile (412×823 DPR2, CPU 4×, "Slow 4G" 562 ms RTT / 1.47 Mbps down)

| Route | FCP | Content | LCP | DCL | load | TTI≈ | TBT | Longest task |
|---|---|---|---|---|---|---|---|---|
| /login | 1.76 s | — | 1.76 s | 1.75 s | 3.2 s | 3.9 s | 148 ms | 194 ms |
| /today | 1.82 s | **2.15 s** | 2.19 s | 1.85 s | 4.1 s | **4.3 s** | 519 ms | 268 ms |
| /dashboard | 1.79 s | **6.7 s** | 6.75 s | 1.80 s | 4.05 s | **7.3 s** | **1.21 s** | **598 ms** (chart render) |

Caveat: navigation timing shows TTFB ≈ 11 ms on the throttled runs, i.e. Edge's emulation did not delay the document request itself (sub-resources were throttled: load 3–4 s). Real slow-4G numbers are ~0.6–1.2 s worse than shown.

## 2. JS shipped — what is in the chunks

Chunks identified by content markers (`.next/static/chunks`, production has no module paths):

| Chunk | gz / raw | Routes | Content |
|---|---|---|---|
| 375q92w32ud8u.js | **116 / 396 KB** | /dashboard only, loaded *after* hydration | recharts (+ its redux toolkit, immer, d3 scales), `dashboard-view.tsx`, `dashboard-blocks.tsx`, `lib/dashboard/stats`, `lib/dashboard/sample` |
| 1vo0wohvofgd7.js | 71 / 225 KB | all | react-dom 19 |
| 1rw_nu2ykodqp.js | 38 / 143 KB | all | Next app router runtime |
| 2icwl0hi9rkvc.js | 31 / 89 KB | all app routes | @base-ui/react (floating-ui: tooltip, popover, menu, dialog/sheet) |
| 21ok1k7yhaeos.js | 15 / 46 KB | all app routes | shadcn `components/ui/sidebar.tsx` (723 lines) + app-shell/sidebar |
| 2g0uxtrihr2v1.js | 15 / 35 KB | all app routes | lucide icons + base-ui bits |
| 24-dx65rnp0pf.js | 27 / 92 KB | /tasks | react-day-picker + date-fns (only `vi` locale — good) for `deadline-field.tsx`, task forms |
| 354orxirtdk9_.js | 27 / 83 KB | /goals | `goal-panel.tsx` (732 lines), habit-month, week-cards, reflection-form, popovers |
| 1guwe024enwr1.js | 13 / 36 KB | /goals | goal-page client islands |
| 2vzf6u4dfpgji.js | 10 / 30 KB | /today | today-plan, quick-capture, habit-today |
| 2y9b9lzpfjph7.js | 9 / 26 KB | /tasks | task-board/task-row |

So every signed-in page pays ~**61 KB gz / 170 KB raw** for the shell (base-ui floating + shadcn sidebar + lucide) on top of React/Next (~110 KB gz). /dashboard adds a 116 KB gz chart chunk that is only requested after hydration (`components/dashboard/dashboard-client.tsx:7-8` `dynamic(..., { ssr: false })`), creating a JS → render waterfall.

Client components that could be server components / islands:
- `components/app-shell.tsx:1` and `components/sidebar.tsx:1` are `"use client"` and wrap every page; the nav list, links, active state (could use a tiny client `NavLink` with `usePathname`) can be server. Tooltip provider + Sheet are needed only for collapsed/mobile modes.
- `components/dashboard/dashboard-view.tsx` (433 lines) + `dashboard-blocks.tsx` (435 lines) are entirely client; KPI tiles, due-soon list, project lists are static output of pure functions in `lib/dashboard/stats` and could render on the server. Only the Real/Sample toggle (localStorage, line 46) forces client; a `?sample=1` search param would allow SSR.
- `components/goals/goal-panel.tsx` (732 lines) — list rendering could be server with client islands for edit/popovers.
- `components/ui/calendar.tsx` / `deadline-field.tsx` — load the date picker lazily on popover open, or use `<input type="date">`.

## 3. Server work per request

No per-request memoisation: `lib/db/data.ts` getters are plain async functions (no React `cache()`), `scope()` re-reads the cookie and HMAC each call. Every Neon HTTP query = 1 HTTPS round trip (~80 ms from here).

Query counting (q = queries; `withHabits` makes listing daily logs 2 sequential queries, `listTasks` and `listGoals` are 2 parallel queries each and **both** read `goal_tasks`):

- **Layout** (`app/(app)/layout.tsx` Account): `getProfile` → 1 q (parallel with page).
- **/today** (`app/(app)/today/page.tsx:38` Promise.all): profile 1, habits 1, goals 2, tasks 2, recent logs 2-seq = 8 q, depth 2; then `resolveGoals` (`:51`, `lib/db/goal-status.ts:29`) habits 1, logs-between 2-seq, tasks 2 = 5 q, depth 2. **Total 14 q, 4 sequential RTTs.** Duplicates in one request: users ×2, habits ×2, tasks ×2, goal_tasks ×3, daily_logs/habit_days ×2.
- **/tasks** (`app/(app)/tasks/page.tsx:27-28`): tasks 2 + goals 2 in parallel, then `await getTaskProjects()` sequentially (needless waterfall, 1 extra RTT). 6 q, depth 2.
- **/goals** (`app/(app)/goals/page.tsx:58`, `:70`): goals 2, habits 1, reflections 1, logs-between 2-seq, tasks 2 → then resolveGoals 5 more. **14 q, depth 4**, same duplication pattern.
- **/dashboard** (`app/(app)/dashboard/page.tsx:30`, `:41`): profile, tasks 2, logs90 2-seq, habits, goals 2, reflections → 9 q; resolveGoals 5 → **15 q, depth 4**. Then the browser must still download+run 116 KB gz before anything renders.
- **/settings**: profile 1 + projects-with-counts 1 → 3 q, depth 1. Fastest route (docEnd 133 ms).

Measured: docEnd / RSC fetch medians correlate with depth: depth-1 settings 133 ms; depth-2 tasks ~200–240 ms; depth-4 today/goals/dashboard 300–540 ms.

Over-fetching:
- `listTasks` (`lib/db/queries.ts:17`) returns **every task the user ever created**, done ones included, on /today, /tasks, /goals, /dashboard; /today only needs open tasks + today/tomorrow plan + 14-day deadlines + done-today. The full list is serialised to client components (`TodayPlan`, `TomorrowPicker` today/page.tsx:63,82,150; `WeekCards` goals/page.tsx:171 receives all tasks). With 27 demo tasks /today's RSC payload is already 40 KB raw; it grows linearly with history.
- `listGoals` (`queries.ts:96`) loads all goals ever and the page filters by period in JS; `listReflections` (`:120`) loads all reflections to pick 1–3.
- Dashboard ships all tasks + 90 logs to the client (`DashInput`) and computes stats in the browser.

## 4. Client runtime

- Long tasks desktop: 50–130 ms around hydration (worst /tasks 129 ms, /dashboard 124 ms after chart mount). TBT ≤ 92 ms desktop. Mobile 4×: /today TBT 519 ms, /dashboard 1.21 s with a 598 ms task when recharts renders.
- CLS is very low (≤ 0.005). Sources: sidebar footer pops in because `<Suspense fallback={null}>` around `Account` (`app/(app)/layout.tsx`) — shift 0.0012 at ~670 ms on `DIV.flex flex-col gap-2 p-2`; /today swaps the whole skeleton including the header (0.0034).
- /today LCP 820 ms vs FCP 172 ms because the `PageHeader` (greeting) is inside the page-wide Suspense (`TodaySkeleton` shows "Hôm nay / Đang tải…"), so the LCP element (H1) only appears after all 4 RTTs. Other pages keep the header in the static shell (LCP = FCP).
- Re-render/refresh pattern: every write action calls `refreshData()` = `revalidatePath("/", "layout")` (22 call sites in `app/actions/*`), which already makes the action response carry a fresh RSC render of the current page (all 14 queries). `components/goals/goal-panel.tsx:105,119,130,139,240,611,631`, `prev-focus.tsx:32`, `habit-manager.tsx:29` additionally call `router.refresh()` → **a second full server render (another ~14 queries, ~300 ms) per save**. (Verify against Next 16 docs before removing; behaviour of revalidatePath-in-action re-rendering is documented in earlier versions.) Ticking a task on /today re-runs the whole /today data load.
- Fonts (`app/layout.tsx`): Inter + Lora variable, subsets latin+vietnamese. The browser downloads **6 woff2 = 208 KB** on app pages (more bytes than the gz JS of /today): the 4 preloaded latin/vietnamese faces (107 KB) **plus Inter latin-ext (85.6 KB) and Lora latin-ext (20.5 KB) which are not preloaded** — Vietnamese characters (ă, đ, ơ, ư, ĩ, ũ) fall in the overlapping latin-ext unicode-range so those faces are fetched late (after CSS + render). Lora is only used for headings/motto.
- Images: none (`next/image` / `<img>` unused). Good.
- DOM size: dashboard 4.3k nodes (charts), others 500–1,400.

## 5. Caching / prerender

- Build: /login ○ static; /today, /tasks, /goals, /dashboard, /settings ◐ partial prerender (Cache Components). Static shell (sidebar, page header except /today, skeleton) is served at TTFB ≈ 12 ms, FCP 160–290 ms desktop; all data holes are dynamic (`await connection()` in each content component) with no data cache (by design, SPEC-v1.0 §4).
- Suspense: one boundary per page around all content + one for the sidebar account. Nothing is prioritised: the fastest piece of data waits for the slowest (resolveGoals 2nd stage). /dashboard has a second, client-side "boundary" (dynamic ssr:false) so content needs server stream + JS download + JS execution.
- `/` → 307 `/today` (next.config redirect) and login `redirect("/")` → 2 hops after sign-in; could redirect straight to `/today`.

## Top 5 bottlenecks (evidence)

1. **Dashboard chart bundle + client-only render** — 116 KB gz / 396 KB raw recharts chunk loaded after hydration (`components/dashboard/dashboard-client.tsx:7-8`); desktop content 703 ms vs stream done 362 ms; mobile content 6.7 s, TTI ≈ 7.3 s, TBT 1.2 s, 598 ms long task.
2. **Server waterfalls + duplicate queries** — 14–15 Neon queries, 4 sequential RTTs on /today, /goals, /dashboard (`today/page.tsx:38→51`, `goals/page.tsx:58→70`, `dashboard/page.tsx:30→41`, `goal-status.ts:29`, `queries.ts:57` withHabits second query, `tasks/page.tsx:28`), no `cache()` in `lib/db/data.ts`.
3. **Fonts 208 KB, 105 KB of it un-preloaded latin-ext** (`app/layout.tsx` Inter+Lora).
4. **Over-fetching all tasks/goals/reflections** and serialising them to client components (`queries.ts:17,96,120`; /today RSC 40 KB with only 27 tasks; grows with history).
5. **Double refresh after writes** — `revalidatePath` in actions + `router.refresh()` in goal-panel/prev-focus/habit-manager → two full page renders per save; plus the all-client app shell (~61 KB gz base-ui/sidebar/lucide on every route).

## Recommendations (ranked by impact ÷ effort)

1. **Wrap data getters in React `cache()`** (per-request, not shared — respects the "no shared cache" rule) and make `resolveGoals` reuse already-loaded tasks/habits (pass them in). Removes ~5 duplicate queries per heavy page. *Low effort, medium-high impact.*
2. **Flatten waterfalls**: start the habit-log window query in the first `Promise.all` (on /today and /dashboard the window is the current week/month, known before goals load); fold `habit_days` into the daily-log query (one SQL with `json_agg`/left join); move `getTaskProjects` into the Promise.all on /tasks. Depth 4 → 1–2 ≈ −150…−250 ms per page at 80 ms RTT. *Low-medium effort.*
3. **Dashboard redesign: server-render KPIs and charts.** The charts are bars/area/line on ≤ 90 points; hand-written server SVG (or a tiny client sparkline) is ~0 KB JS vs 116 KB gz. If a library is kept, load it only for the one interactive chart, below the fold, and SSR everything else. Replace localStorage Real/Sample toggle with a search param so the page can SSR. *Medium effort, highest impact on mobile.*
4. **Fonts**: one family (drop Lora or use a system serif stack for headings), or self-host a single Vietnamese+Latin subset via `next/font/local` so no un-preloaded latin-ext faces are fetched. Target ≤ 60–80 KB. *Low effort.* (Exact next/font behaviour for undeclared subsets not verified in source — check the emitted CSS.)
5. **Query only what the view needs**: `listTasks` with a filter (open OR done within window), goals by period in SQL, reflection by period; pass slim DTOs (id/title/status/date) to client components instead of full `Task`. *Medium effort, scales with data.*
6. **Drop `router.refresh()` where the action already calls `refreshData()`**; use `useOptimistic` + the action's own refreshed payload. Consider a narrower revalidation than `revalidatePath("/", "layout")`. *Low effort.*
7. **Shell split for the redesign**: server-rendered nav with a small client `NavLink`/toggle; avoid tooltip-per-nav-item and Sheet unless mobile; keep base-ui popovers/menus inside lazily loaded islands. Saves up to ~40–60 KB gz on every page. *Medium effort.*
8. **/today**: put the greeting header in its own Suspense fed by `getProfile` only (1 RTT) or keep it in the static shell with a time-independent title → LCP ≈ FCP. Give the sidebar account a fixed-height fallback (kills the tiny shift). *Low effort.*
9. **/tasks date picker**: dynamic-import `DeadlineField`'s calendar on popover open, or native date input (−27 KB gz on /tasks). *Low effort.*
10. Redirect login straight to `/today` (one fewer hop). *Trivial.*

Design rules to bake into the redesign: server components by default, client islands only for inputs/toggles/popovers; no chart library on the critical path (server SVG); one font family; each page's data fetched in a single parallel stage with slim DTOs; a separate Suspense boundary for the above-the-fold card so it does not wait for secondary data; optimistic UI without an extra `router.refresh()`.
