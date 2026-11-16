## Purpose

One employee's screenshots for one company day: who may see them, how they are shown, and how
their short-lived links are handled.

## ADDED Requirements

### Requirement: Only the admin and the employee's manager see screenshots
<!-- source: Plan-v3.5 §4.5 · backend `screenshot-access` · Prototype "Employee → Screenshots" -->
The Screenshots tab SHALL be shown to `company_admin` and to the employee's own `manager` and call `GET /v1/employees/:id/screenshots?date=` for the chosen company day. The tab MUST say screenshots are kept for the retention period and only Company Admins and this person's manager can see them.

#### Scenario: A manager of another team
- **WHEN** the call returns `404 NOT_FOUND`
- **THEN** the tab shows the not-found message and no image

### Requirement: Screenshots off shows why
<!-- source: backend `screenshot-access` · backend `monitoring-settings` -->
When the response has `screenshots_enabled` false the tab SHALL say the company's plan doesn't include screenshots, with a Billing link for a Company Admin; when the employee's interval is Off it MUST say screenshots are off for this person, with a link to What is collected for a Company Admin.

#### Scenario: Tier off
- **WHEN** `screenshots_enabled` is false
- **THEN** the tab shows the plan message and no grid

### Requirement: A day's screenshots show as a grid with a viewer
<!-- source: D23 · Prototype "Employee → Screenshots" -->
The tab SHALL show the day's items oldest first as thumbnails with time and hostname, a day picker with previous, next and Today limited to retained days, and a viewer that opens one image large with previous and next, its time, hostname and position ("3 of 24"). A day with no items MUST say no screenshots were taken that day.

#### Scenario: Stepping through
- **WHEN** the reader presses Next in the viewer on the last image
- **THEN** the Next control is disabled

### Requirement: Signed links are short-lived and never kept
<!-- source: A6 · backend `screenshot-access` -->
The app SHALL use each `view_url` only to display or download that image before its `expires_at`, MUST NOT cache, log or put it in the page address, and MUST refetch the day's list when a link has expired or an image fails to load.

#### Scenario: Viewer left open
- **WHEN** the viewer stays open for 6 minutes and the reader presses Next
- **THEN** the list is refetched and the next image loads with a fresh link
