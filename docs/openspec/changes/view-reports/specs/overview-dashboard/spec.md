## Purpose

The Overview page each company role lands on: what it shows to a Company Admin, a Manager and an IT
Admin, all from one dashboard call plus the range's productivity split.

## ADDED Requirements

### Requirement: Overview is one dashboard call shaped by role
<!-- source: Plan-v3.5 §4.5 "Dashboard" · backend `dashboard-summary` · Prototype "Overview" -->
Overview SHALL call `GET /v1/dashboard` and show cards for Online now and Offline from `devices`, and Open alerts from `devices.open_alert`; for `company_admin` also Seats used (`seats.used` of `seats.limit`, "unlimited" when null); and the newest five alerts from `alerts` with a View all link. A section absent from the response MUST NOT be shown.

#### Scenario: A manager's overview
- **WHEN** a `manager` opens Overview
- **THEN** device counts cover their team only and no seats card is shown

### Requirement: Report readers see today's activity and the range's split
<!-- source: D1 · backend `dashboard-summary` · backend `usage-reports` -->
For `company_admin` and `manager`, Overview SHALL show today's tracked time and activity percent from `today`, and a productivity split bar for the chosen range from `GET /v1/reports/productivity` with productive, neutral and unproductive percentages and the tracked total. A department dropdown MUST narrow the split for a `company_admin`.

#### Scenario: Changing the range
- **WHEN** an admin picks Last 7 days
- **THEN** the split bar and tracked total reload for that range

### Requirement: IT admins see device health, not activity
<!-- source: B18 · A14 · Plan-v3.5 §5.9 · backend `device-status` -->
For `it_admin`, Overview SHALL say activity reports are not available to IT Admins, show the device cards and the rollout table from `GET /v1/rollout` (healthy, each status and badge with its count, plain labels), each row linking to the Devices page filtered to it. No tracked time, activity, split or setup checklist MUST appear.

#### Scenario: Permission pending row
- **WHEN** an IT admin clicks the "Permission pending" row
- **THEN** the Devices page opens filtered to the `permission_pending` badge

#### Scenario: A new company
- **WHEN** an IT admin of a company with no device opens Overview
- **THEN** no setup checklist is shown and no `GET /v1/company/setup` call is made

### Requirement: Overview refreshes only when asked
<!-- source: A5 · product owner 19 Nov 2026 -->
Overview SHALL load its data when opened and again only when the user presses Refresh, which MUST reload the dashboard, the setup checklist, the rollout table and the productivity split. It MUST show when its data was loaded, in company time, and MUST NOT refetch on a timer or when the tab becomes visible again.

#### Scenario: Overview left open
- **WHEN** an admin leaves Overview open for an hour
- **THEN** no request is sent after it loaded and the page still shows the time it was loaded

#### Scenario: Pressing Refresh
- **WHEN** the admin presses Refresh
- **THEN** every card reloads, the chosen range and department stay, and the loaded time updates

### Requirement: Cards link to their lists
<!-- source: Prototype "Overview" -->
For `company_admin` and `it_admin` the Online and Offline cards SHALL open the Devices page filtered to that status and the Open alerts card filtered to the `open_alert` badge; for `manager` they MUST NOT be links.

#### Scenario: Open alerts card
- **WHEN** an admin clicks the Open alerts card
- **THEN** the Devices page opens filtered to the `open_alert` badge
