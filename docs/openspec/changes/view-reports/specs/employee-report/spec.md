## Purpose

The employee page frame and its Report tab: who can open it, the date range and comparison, the
sections the report shows, and the CSV exports.

## ADDED Requirements

### Requirement: The employee page is open to report readers
<!-- source: backend `role-access` · backend `employee-directory` · Prototype "Employee" -->
The employee page SHALL be open to `company_admin` for any employee and to `manager` for their own team, showing name, department, email, the status from `presence` and the bound devices from the employee's `devices` (hostname, OS, status, last seen) for both roles, with tabs Report, Calendar, Timesheet, Screenshots, What is collected and Pause monitoring. A `404 NOT_FOUND` MUST say "This employee isn't on your team or no longer exists".

#### Scenario: A manager opens another team's employee
- **WHEN** a `manager` opens an employee outside their team
- **THEN** the page shows the not-found message and no data

### Requirement: IT Admins open the employee page without reports
<!-- source: A14 · product owner 17 Nov 2026 · backend round 6 · backend `role-access` -->
For `it_admin` the employee page SHALL show the header (name, department, email, status, devices) and only the What is collected and Pause monitoring tabs. It MUST NOT show or call reports, calendar, timesheet, screenshots, exports or notice acknowledgements.

#### Scenario: IT opens an employee
- **WHEN** an `it_admin` opens Ada Lovelace's employee page
- **THEN** only What is collected and Pause monitoring tabs show and no report route is called

#### Scenario: An employee with no device
- **WHEN** an admin opens an employee with no bound device
- **THEN** the header says no computer is set up yet and to run WorkBeat Setup for this person

### Requirement: The report takes a range with presets and comparison
<!-- source: backend `usage-reports` · A9 · Prototype "Employee → Report" -->
The Report tab SHALL offer presets Today, Yesterday, This week, Last 7 days, This month, Last 30 days and a custom from–to in the company's days, and an option to compare with the previous period of the same length. When the response's effective `from` differs from the chosen one, the tab MUST say data before that day was deleted by the retention setting.

#### Scenario: A range past retention
- **WHEN** the admin picks a range starting 60 days ago with 30-day retention
- **THEN** the report shows the retained days and says earlier data was deleted

#### Scenario: A custom range over 90 days
- **WHEN** the admin picks a custom range longer than 90 days
- **THEN** its start moves so the range is 90 days, the most the API accepts

### Requirement: The report shows time, activity and productivity
<!-- source: D1 · backend `usage-reports` · Prototype "Employee → Report" -->
The report SHALL show summary cards (tracked time, activity percent, productive and unproductive share) from `/v1/reports/activity` and `/productivity`, an hour-of-day chart of tracked minutes with the active part, top applications from `/reports/apps` and top websites from `/reports/websites` coloured by category, and a breakdown table by day, week or month. With comparison on, each card MUST show the change versus the previous period.

#### Scenario: Activity shown beside time
- **WHEN** an employee had 7 h tracked with 62% activity
- **THEN** the cards show 7 h tracked and 62% activity, and idle time is not subtracted

### Requirement: The breakdown comes from report periods
<!-- source: backend `usage-reports` (`group_by`) · Prototype "Employee → Report" -->
The breakdown SHALL call `/v1/reports/activity` and `/v1/reports/productivity` with `group_by` `day`, `week` or `month` and show one row per entry in `periods` (tracked time, activity, productive, neutral, unproductive), zero rows included. A day row MUST open that day in the Calendar tab.

#### Scenario: A week with a quiet day
- **WHEN** the range is Monday to Sunday and Saturday has no data
- **THEN** the breakdown has seven rows and Saturday shows zero

### Requirement: The employee page shows the employee's recent alerts
<!-- source: backend `alerts-feed` (`employee_id`) · Prototype "Employee" -->
The employee page SHALL show the newest five alerts from `GET /v1/alerts?employee_id=` with the Alerts page's labels and columns, or "No alerts for this person's computers", and a link that opens the Alerts page filtered to this employee.

#### Scenario: A manager's team member had a tamper event
- **WHEN** a `manager` opens a team member whose computer reported "WorkBeat was closed"
- **THEN** the alert is listed on the employee page and the link opens Alerts filtered to that person

### Requirement: The report can be customised
<!-- source: Prototype "Employee → Report" -->
Customize SHALL let the reader show or hide summary, hourly chart, breakdown, applications and websites, choose how many apps and sites to list (5, 8, 15 or all, passed as `limit`), filter them by category (passed as `category`), and reset to the default. The choice MUST be kept per reader in the browser only.

#### Scenario: Top 15 productive apps
- **WHEN** the reader picks Top 15 and Productive only
- **THEN** the applications list shows up to 15 productive apps

### Requirement: All apps and sites load a page at a time
<!-- source: backend `usage-reports` -->
With All chosen, the applications and websites lists SHALL each request pages of 100 and show a Show more control while `next_offset` is not null, appending the next page below.

#### Scenario: More than 100 websites
- **WHEN** the reader picks All and the range has 230 domains
- **THEN** 100 are listed with Show more, and two presses list all 230

### Requirement: Reports export as CSV
<!-- source: backend `data-export` · A12 -->
Export SHALL offer app sessions, website visits and daily summaries for the current range and scope through `/v1/exports/app-sessions.csv`, `/url-visits.csv` and `/daily-summaries.csv`, downloaded as a file. `422 EXPORT_TOO_LARGE` MUST say the export is over the row limit and to pick a shorter range.

#### Scenario: Too many rows
- **WHEN** an export returns `422 EXPORT_TOO_LARGE`
- **THEN** no file is downloaded and the message asks for a shorter range
