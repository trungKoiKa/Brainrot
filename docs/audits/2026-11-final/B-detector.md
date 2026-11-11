# Final audit B - Impeccable detector re-run (read-only)
Date 2026-11-11. Build http://localhost:3100 (demo account), Edge headless CDP 9337, viewport 1410x771.
Command: `impeccable detect --json [--cdp 9337 --target localhost:3100] ...`. All runs exit 0 (only advisory findings).
Raw JSON: final-audit/bdet/*.json (with config) and final-audit/bdet/raw-*.json (`--no-config`, same results, so nothing is hidden by DESIGN.md/.impeccable ignores).

## Static (app/, components/): 5 -> 7, all advisory
| Finding | Status | Verdict |
|---|---|---|
| design-system-font-size components/reui/badge.tsx:55 (0.6rem), :56 (0.625rem) | SAME | Vendor ReUI badge sizes; real only if those badge sizes are used |
| design-system-font-size components/ui/button.tsx:25, calendar.tsx:93, :102 (0.8rem) | SAME | shadcn vendor defaults, likely FP / low priority |
| design-system-font-size components/ui/toggle.tsx:18 (0.8rem) | NEW | Same vendor pattern as button (toggle newly added); low priority |
| codex-grid-background app/globals.css:186 (`@utility graph-paper`, 24px grid) | NEW | Intentional: DESIGN.md specifies the 24px graph-paper page background. FP by intent |

## Live, per route (old -> new count; light / dark)
| Route | Old | New light | New dark |
|---|---|---|---|
| /today | 7 (nested-cards 3, overused-font, cream-palette, skipped-heading, undersized-ui-text); dark 6 | 1 | 1 |
| /tasks | 8 (nested 6, font, cream) | 1 | 1 |
| /goals | 10 (nested 6, font, cream, skipped-heading, low-contrast) | 1 | 1 |
| /goals?level=week | 12 (nested 9, font, cream, skipped-heading) | 1 | 1 |
| /goals?level=year | 8 (nested 6, font, cream) | 1 | 1 |
| /dashboard | 10 (nested 8, font, cream); dark 9 | 1 | 1 |
| /settings | 6 (nested 4, font, cream) | 1 | 1 |
| /khong-co-trang | not scanned | 1 | 1 |
| /login | not scanned | skipped: redirects to /today while logged in (scan = /today, 1) | same |

The only live finding everywhere is `codex-grid-background` (advisory) = the graph-paper body background: NEW, intentional per DESIGN.md (likely FP).

## Old findings, all GONE
- nested-cards (all routes, incl. 7 weekday sections on week view, goal cards on year view): GONE.
- overused-font Inter: GONE (body font now IBM Plex Sans).
- cream-palette #f6f4ef: GONE (light bg now rgb(241,242,238) #f1f2ee graph-paper).
- skipped-heading /today, /goals, /goals?level=week: GONE. DOM check: h1 -> h2 -> h3 now ordered (week: h1 Goal > h2 "7 ngay trong tuan" > h3 weekdays).
- low-contrast #eda100 on white (/goals table cell): GONE.
- undersized-ui-text 10px "tre tu ..." badge on /today: GONE (DOM probe: no visible text below 12px on /today, /goals, week view).

## Side observation (not a detector finding)
- /today DOM holds two h1 ("Hom nay" visible, "Chao buoi sang, Demo" inside a display:none div with no class). Likely a hidden, preserved route subtree from client navigation (Next.js), not rendered or exposed to AT. Not a real issue; worth a glance only if the greeting was meant to be the visible h1.

## Limits
- CDP scan at 1410x771 desktop only; no mobile pass. /login not scanned logged-out.
- Detector does not check interaction states (hover/focus/open popovers); only the default rendered page.
