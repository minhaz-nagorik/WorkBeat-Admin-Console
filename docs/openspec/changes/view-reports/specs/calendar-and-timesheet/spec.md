## Purpose

The Calendar and Timesheet tabs: one employee's days by day, week or month, and the Monday-start
timesheet over a chosen date range with its PDF.

## ADDED Requirements

### Requirement: The calendar shows day, week and month views
<!-- source: backend `calendar-and-timesheets` · A9 · Prototype "Employee → Calendar" -->
The Calendar tab SHALL show `GET /v1/employees/:id/calendar` as a month grid shaded by tracked time, a Monday-start week with each day's tracked time, activity and split, or one day, with previous, next and Today controls. Days with `paused` MUST be marked "Paused", days omitted by retention "Deleted", future days blank; clicking a day MUST open its day view.

#### Scenario: A paused day
- **WHEN** a day has `paused` true
- **THEN** the month cell shows a Paused mark

### Requirement: The day view links to report and screenshots
<!-- source: Prototype "Employee → Calendar" -->
The day view SHALL show that day's tracked time, activity and top apps (from `usage-reports` for that day), and buttons to open that day in the Report tab and in the Screenshots tab.

#### Scenario: Opening screenshots from a day
- **WHEN** the reader clicks Screenshots for this day
- **THEN** the Screenshots tab opens on that date

### Requirement: The timesheet covers a chosen date range
<!-- source: backend `calendar-and-timesheets` · Prototype "Employee → Timesheet" -->
The Timesheet tab SHALL show `GET /v1/employees/:id/timesheet?from=&to=` with one row per day (first and last activity, tracked, activity, productive, neutral, unproductive, a Paused note) and totals, with the same date-range picker as the Report tab (presets and custom dates, default This week, owner 19 Nov 2026). Days before retention or after today MUST NOT be pickable.

#### Scenario: Last 30 days
- **WHEN** the reader picks Last 30 days
- **THEN** thirty day rows and their totals are shown

### Requirement: The timesheet downloads as PDF and CSV
<!-- source: backend `calendar-and-timesheets` · backend `data-export` -->
Download PDF SHALL fetch `GET /v1/employees/:id/timesheet.pdf?from=&to=` and save it; over 31 days it MUST be disabled with a note to pick a shorter range or use the CSV. It saves with the file name the response gives; Download CSV MUST save the shown rows as CSV with formula-leading cells prefixed with `'`.

#### Scenario: PDF download
- **WHEN** the reader clicks Download PDF
- **THEN** a PDF named for the employee and range is saved and nothing is stored by the app
