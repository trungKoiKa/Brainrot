# Audit B - detector evidence
Note: all runs finished before the restart (pages had demo data; tab still logged in, light theme restored). No re-login needed.

## Static (app components): 5 findings, all design-system-font-size (advisory) = baseline
- components/reui/badge.tsx:55 (0.6rem), :56 (0.625rem)
- components/ui/button.tsx:25 (0.8rem)
- components/ui/calendar.tsx:93, :102 (0.8rem)
File: scratchpad/static.json

## Live (rule: count)
- /today: nested-cards 3, overused-font 1, cream-palette 1, skipped-heading 1, undersized-ui-text 1
- /today dark: nested-cards 3, overused-font 1, skipped-heading 1, undersized-ui-text 1 (no cream)
- /tasks: nested-cards 6, overused-font, cream-palette
- /goals: nested-cards 6, overused-font, cream-palette, skipped-heading, low-contrast 1
- /goals?level=week: nested-cards 9, overused-font, cream-palette, skipped-heading 1
- /goals?level=year: nested-cards 6, overused-font, cream-palette
- /dashboard: nested-cards 8, overused-font, cream-palette
- /dashboard dark: nested-cards 8, overused-font
- /settings: nested-cards 4, overused-font, cream-palette
Files: scratchpad/bdet-*.json

## NEW vs baseline
1. low-contrast /goals: tr:nth-of-type(2) > td.border-t.border-line:nth-of-type(31), text #eda100 on #ffffff = 2.2:1 (need 4.5). Likely a calendar/heatmap day cell (amber text on white); real.
2. undersized-ui-text /today (light+dark): span.relative.inline-flex, 10px "trễ từ T7 07/11" (below 11px floor). Real; it is a late/overdue badge.
3. skipped-heading /today (h1 "Chào buổi sáng, Demo" -> h3 "Trễ lịch") and /goals?level=week (h1 "Goal" -> h3 "Thứ Hai"); baseline only had /goals. Likely same cause as baseline (card titles with heading levels), but /today h3 may be a genuine skip.
4. nested-cards extra on /goals?level=week: section.min-w-0.rounded-lg:nth-of-type(1..7) (7 weekday sections), and a.block.rounded-xl (4 goal cards, /goals?level=year). Not on the Frame/progress-track selector; may be real nested card-in-card.

## Likely false positives
- nested-cards on div.relative.flex > div.relative.overflow-hidden (Frame panel / progress track): baseline, all pages.
- overused-font Inter (global), cream-palette #f6f4ef (light only): intentional per baseline.
- skipped-heading on /goals: role=heading aria-level=2 not seen by detector.

## Failed steps
None. Detect exit code 2 = findings present, not failure.
