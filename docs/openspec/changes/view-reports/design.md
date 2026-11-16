## Context

The prototype's Overview and Employee pages show per-person live presence and a status timeline that
no backend route supplies. The backend specs win (A1); nothing here invents a route.

## Decisions

- **Overview has no per-employee table.** Amends Prototype "Overview" (Employee / Tracked / Activity /
  Split / Status rows). `usage-reports` returns one scope per call; a row per employee would be one
  call per person. Overview shows the scope's totals; per-person figures are on each employee page.
- **No "Right now" card or status timeline.** Amends Prototype "Employee → Status". No route returns
  status segments. The employee page shows the current `presence`, the bound `devices` (both from
  the employee routes, backend reply 16 Nov 2026), and the employee's alerts from
  `GET /v1/alerts?employee_id=`.
- **Breakdown from `periods`.** The report's day/week/month breakdown uses `group_by` on
  `/reports/activity` and `/reports/productivity` (backend reply 16 Nov 2026). The periods carry no
  idle time, so the breakdown has no idle column.
- **Screenshot interval text.** Amends Prototype "Screenshots" ("one screenshot every N minutes",
  company-wide). The interval is per employee (D37) and comes from `monitoring-settings`.
- **Paused notes.** The prototype's per-hour "paused" marks and "lunch"/"sensitive site" tiles have
  no data source; only the calendar's per-day `paused` flag is shown.
