## Why

Reports are why a company buys WorkBeat: app and website use, activity level, the productivity
split, a calendar, a weekly timesheet and the optional screenshot timeline (Plan-v3.5 §4.4 "Reports
and data lifecycle", §4.5 "Dashboard", "Employees"). Company Admins read every employee, Managers
their own team, IT Admins no activity at all (backend `role-access`, B18). Tracked time is all
foreground time with activity percent beside it (D1).

## What Changes

- **Overview**: one dashboard call shaped by role — device counts, today's activity, recent alerts,
  seats for the admin, the rollout table for IT, and the range's productivity split.
- **Employee report**: the employee page header and tabs, and the Report tab with a date range,
  comparison, customisable sections, hourly chart, top apps and sites, breakdown and CSV export.
- **Calendar and timesheet**: day, week and month calendar; weekly timesheet with PDF and CSV.
- **Screenshot timeline**: one day's screenshots for the admin and the employee's manager, through
  5-minute signed links.

## Capabilities

### New Capabilities

- `overview-dashboard`: the Overview page per role.
- `employee-report`: the employee page frame and its Report tab with exports.
- `calendar-and-timesheet`: the Calendar and Timesheet tabs.
- `screenshot-timeline`: the Screenshots tab and viewer.

### Modified Capabilities

None.

## Impact

- Consumes backend `dashboard-summary` (`GET /v1/dashboard`), `usage-reports` (`GET /v1/reports/apps`,
  `/websites`, `/activity`, `/productivity`, with `group_by`), `calendar-and-timesheets`, `data-export`
  (`/v1/exports/*.csv`), `screenshot-access`, `device-status` (`GET /v1/rollout`),
  `alerts-feed` (`employee_id`), `employee-directory` (`presence`, `devices`).
- Builds on `establish-admin-foundation` and `manage-employees` (the employee page's other tabs).
- Design: Prototype "Overview", "Employee" (Status, Report, Calendar, Timesheet, Screenshots);
  deviations in [design.md](design.md).
