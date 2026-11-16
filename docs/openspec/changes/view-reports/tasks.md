> **Read first — this task list is not the requirement.**
> Capabilities: `overview-dashboard · employee-report · calendar-and-timesheet · screenshot-timeline`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show view-reports`.
> Design: [design.md](design.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. overview-dashboard

- [ ] 1.1 Overview from `GET /v1/dashboard`: device cards, seats (admin), recent alerts
- [ ] 1.2 Today's activity and range productivity split with department filter
- [ ] 1.3 IT view with `GET /v1/rollout` table linking to filtered Devices
- [ ] 1.4 Tests: role test (admin seats + split, manager team counts no seats, IT no activity); cards link only for admin and IT

## 2. employee-report

- [ ] 2.1 Employee page header with `presence` and `devices`, recent alerts from `GET /v1/alerts?employee_id=`, tabs, `404` message
- [ ] 2.2 Range presets, custom range, comparison, retention notice
- [ ] 2.3 Summary cards, hourly chart, top apps and sites, breakdown from `group_by` `periods`
- [ ] 2.4 Customize panel kept per reader in the browser
- [ ] 2.5 CSV exports and `EXPORT_TOO_LARGE`
- [ ] 2.6 Tests: role test (admin any, manager own team, IT none); manager sees devices and alerts; breakdown has a row for every period; clamped range notice; export too large downloads nothing

## 3. calendar-and-timesheet

- [ ] 3.1 Month, week and day views with paused and deleted marks
- [ ] 3.2 Timesheet week view, navigation bounds, totals
- [ ] 3.3 PDF and CSV download
- [ ] 3.4 Tests: role test; week bounds; CSV formula cells prefixed

## 4. screenshot-timeline

- [ ] 4.1 Day grid, day picker, viewer with previous and next
- [ ] 4.2 Tier off and interval off states
- [ ] 4.3 Signed-link handling: no cache, refetch on expiry
- [ ] 4.4 Tests: role test (admin, own manager; IT and others never); expired link refetches; no `view_url` in logs or address
