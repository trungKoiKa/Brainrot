# A4 — Performance re-audit (branch `redesign-10-final`, build `os80slXqS-JSk5Evt9JiFWe`, Next 16 Turbopack)

Method: same as the first audit (`scratchpad/a4-perf.mjs`). Production server on :3100 (not rebuilt), headless Edge CDP 9336, demo account (27 tasks, 7 goals, 10 daily logs). Cold loads, cache disabled, own target per run. **5 runs per route on desktop (median, range in brackets), 3 on mobile.** /login measured in an incognito context. New raw JSON: `scratchpad/final-audit/a4/` (`d-*.json`, `m-*.json`, `htmljs.txt`, `rsc.txt`). Helper scripts: `final-audit/a4-sum2.mjs`, `htmljs.mjs`, `rsc.mjs`, `rtt.mjs`, `count.mjs`.

Neon noise: `select 1` from this machine now = 335, 237 ms cold, then 84–111 ms warm (median ~97 ms; first audit ~80 ms). 6 parallel = 218 ms. Server-side timings (docEnd, RSC) vary a lot between runs: for example /goals docEnd ranged 182–627 ms and /tasks RSC 236–1416 ms. Treat server differences under ~100 ms as noise.

## 1. Old → new, desktop 1440×900

JS: **net** = all scripts downloaded within ~2 s of load, the same method as the old table. It now includes idle chunks that `<Link>` prefetch pulls for other routes. **HTML** = chunks declared in the route's HTML, excluding the 39 KB gz `noModule` polyfill. This is the true first-load figure. It is available for the new build only.

| Route | JS net gz/raw old → new | JS HTML gz/raw (new) | TTFB | FCP | docEnd (stream done) | Content | LCP | TBT | DB q / seq RTTs old → new |
|---|---|---|---|---|---|---|---|---|---|
| /login | 136/449 → 166/521 | 162/521 | 47 → 12 | 124 → 124 | 48 → 36 | — → 103 | 124 → 124 | 0 → 0 | 0 → 0 |
| /today | 216/673 → 284/860 | 235/736 | 12 → 13 | 172 → 248 | **542 → 312** [166–511] | **769 → 520** | **820 → 548** | 26 → 21 | **14/4 → 9/2** (11/4 if a week goal is habit-linked) |
| /tasks | 244/760 → 324/983 | 269/846 | 12 → 18 | 192 → 236 | 239 → 244 | 510 → 513 | 192 → 236 | 57 → 24 | 6/2 → 6/1 |
| /goals (month) | 247/762 → 284/860 | 265/828 | 11 → 19 | 196 → 208 | **471 → 231** [182–627] | 514 → 532 | 196 → 208 | 20 → 22 | **14/4 → 9/2** (quarter/year: 11/4) |
| /goals?level=week | 247/762 → 284/860 | 265/828 | 12 → 13 | 184 → 164 | 249 → 235 | 518 → 501 | 184 → 520* | 39 → 0 | 14/4 → 9/2 |
| /dashboard | 331/1059 → 407/1272 | 225/710 + 121 lazy | 13 → 11 | 164 → 172 | 362 → 382 [226–795] | 703 → 673 | 832 → 700 | 92 → 56 | **15/4 → 9/2** |
| /settings | 210/651 → 288/869 | 227/714 | 12 → 11 | 288 → 164 | 133 → 192 | 324 → 449 | 288 → 472* | 17 → 0 | 3/1 → 2/1 |

\* The LCP element changed: it is now an element inside the streamed content instead of the static header, so LCP ≈ content time. This is not a slowdown.

RSC navigation fetch, median of 7 (range), old → new: /today 213 → 318 (213–631), /tasks 200 → 311 (236–1416), /goals 305 → 364 (274–764), /goals week 373 → 234, /dashboard 331 → 283, /settings 134 → 166. Payload size: /today 40 KB, /tasks 33, /goals 35, /dashboard 29, /settings 24 KB. These numbers come from Node fetches and are dominated by Neon noise today, so they are inconclusive.

CSS: 20 → 23 KB gz (116 → 141 KB raw). CLS ≤ 0.0023 everywhere. The remaining shift is still the sidebar account footer (`DIV.flex flex-col gap-2 p-2`, about 0.0011 ×2) from `<Suspense fallback={null}>` in `app/(app)/layout.tsx`.

### Mobile (412×823 DPR2, CPU 4×, slow 4G), old → new

| Route | FCP | Content | LCP | TTI≈ | TBT | Longest task | Script time (ScriptDuration) |
|---|---|---|---|---|---|---|---|
| /login | 1.76 → 1.71 s | — | 1.76 → 1.71 s | 3.9 → 3.4 s | 148 → 189 ms | 194 → 258 ms | — |
| /today | 1.82 → 1.80 s | 2.15 → 2.20 s | 2.19 → 2.25 s | 4.3 → **5.1 s** | 519 → **1114 ms** | 268 → 470 ms | 0.70 → **1.07 s** |
| /dashboard | 1.79 → 1.81 s | 6.7 → **7.8 s** | 6.75 → **7.9 s** | 7.3 → **8.5 s** | 1.21 → **2.43 s** | 598 → **1.19–1.35 s** | 1.60 → **2.73 s** |

Caveat: in the old runs Edge did not throttle the document request (TTFB 11–31 ms). The new runs do throttle it (TTFB about 570–590 ms), so new FCP and content times carry about 0.55 s more network latency than the old ones. Network latency does not explain the TBT and script-time increases, which are CPU-bound: main-thread JS cost grew about 50% on /today and about 70% on /dashboard.

## 2. Fonts, old → new

| | Old (Inter + Lora, variable) | New (IBM Plex Sans 400/500/600 + Plex Mono 400) |
|---|---|---|
| Bytes per page | 188–208 KB (5–6 files) | **89–98 KB (5–6 files)**, about −55% |
| Preloaded | 4 faces, 107 KB | 2 faces, 49 KB: Sans latin 39.6 + vietnamese 9.7 (HTTP `Link` header) |
| Fetched late, not preloaded | Inter + Lora latin-ext, 106 KB | Sans **latin-ext 25.6 KB** (still triggered by Vietnamese characters in the overlapping unicode-range), Mono latin 10.1 + vietnamese 4.2 (+ latin-ext 8.9 on /login, /today, /tasks) |

Plex Sans from Google is served as one variable file per subset, so the three weights do not multiply the bytes.

## 3. Server work now (from code)

- `lib/db/data.ts`: every getter and `scope()` is wrapped in React `cache()`. Layout and page share `getProfile`, and `resolveGoals` reuses the cached `getTasks` and `getHabits`. A per-request cache only, so this follows the SPEC "no shared cache" rule.
- `lib/db/goal-status.ts:44`: daily logs prefetched by the page are reused when they cover the needed range. /goals (month and week) and /dashboard (90 logs) therefore need no second stage. **/today does not pass a prefetch.** When a current-week priority goal is habit-linked, it still runs `getDailyLogsBetween` after stage 1 (2 more sequential queries, depth 4). The demo account has no such goal, so it measured depth 2.
- /tasks: `getTaskProjects` is now inside the `Promise.all` (`app/(app)/tasks/page.tsx:38`), giving depth 1.
- Floor that remains: every daily-log read takes 2 sequential queries (`withHabits`, `lib/db/queries.ts:54`), and `listTasks` and `listGoals` each read `goal_tasks` (2 reads of the same table per request).
- Refresh: `router.refresh()` has been removed from goal-panel, prev-focus and habit-manager. The only one left is `components/habits/use-habit-days.ts:43`, which is legitimate because `setDayHabitsAction` does not call `refreshData()` and the refresh is batched.

## 4. JS composition (new)

- Framework (react-dom 70, Next runtime 36, small runtime chunks): about 141 KB gz on every route. Unchanged.
- **App shell on every signed-in route: about 83 KB gz (was about 61).**
  - `2_ulfui2ssyz7` @base-ui floating: 31
  - `2xn2w1wre-ct6` lucide + base-ui: 14
  - `20di1uvkzueym` shadcn sidebar + tooltip: 12
  - **`2ts2sfkxbi6p1` sonner (Toaster in `components/app-shell.tsx:8`): 11 (new)**
  - `2qd5s8i54py9y` base-ui dialog: 8
  - `0_1f7b1jdwuog` ui primitives: 6
- Route chunks: /today `3jtbsw26ve_9j` 11; /tasks `3y1jk0zywl6fn` 32 (react-day-picker, toggle-group, task forms) + popover 7; /goals `0mpoteluwd984` 26 + `2ecq9fvd0p1k5` 10 + popover 7.
- /dashboard: `2eivf3nwhmz44` is the recharts chunk, **116 KB gz / 397 KB raw**. It still loads after hydration through `dynamic(..., { ssr: false })` in `components/dashboard/dashboard-client.tsx:8`. It renders 4 recharts wrappers (sparklines in KPI cells, `dashboard-blocks.tsx:119`, plus 3 charts).
- Prefetch: sidebar `<Link>` prefetch now downloads other routes' chunks once the page is idle, adding 43–175 KB gz to the network total. This is off the critical path but costs bandwidth on mobile.

## Top 5 remaining bottlenecks

1. **Dashboard is client-only recharts.** 116 KB gz chunk loaded after hydration, then a 1.2–1.35 s long task on mobile. Mobile content 7.8 s, TBT 2.4 s, both about 2× worse than before. Evidence: `components/dashboard/dashboard-client.tsx:8`, `dashboard-blocks.tsx` (4 `ChartContainer`, `ResponsiveContainer` each). Fix: SSR the KPIs and lists, use server SVG for the simple bars and sparklines, and lazy-load at most one interactive chart.
2. **Client JS and CPU grew on every page.** The shell rose from about 61 to about 83 KB gz (sonner +11, base-ui dialog/menus). First-load /today is 235 KB gz. Mobile /today script time went from 0.70 to 1.07 s and TBT from 519 to 1114 ms. Fix: lazy-load the Toaster on first toast, a server-rendered nav with a small client NavLink, and dialogs/menus only inside islands.
3. **Over-fetching remains.** `listTasks`, `listGoals` and `listReflections` return the whole history (`lib/db/queries.ts:16,95,119`). `goal_tasks` is read twice per request. Full `Task` objects go to client islands (/today RSC 40 KB with only 27 tasks; /goals HTML 174 KB raw). The cost grows linearly with each account's history.
4. **2-RTT floor and the /today critical path.** `withHabits` makes every daily-log read 2 sequential queries. /today does not pass prefetched logs to `resolveGoals` (worst case depth 4). The /today header sits inside the page-wide Suspense, so LCP is 548 ms against FCP 248 ms. Fix: fold `habit_days` into one SQL query, pass prefetched logs, give the header its own boundary, and give the account footer a fixed-height fallback.
5. **Fonts and date picker.** Fonts dropped from 208 to 89–98 KB, but 26 KB Plex Sans latin-ext plus 14–23 KB Mono are still fetched late, without preload. /tasks ships `react-day-picker` (32 KB gz chunk) on first load. Fix: a single Vietnamese+Latin subset through `next/font/local`, or preload latin-ext; load the calendar when the popover opens.
