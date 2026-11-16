## Purpose

Taking one employee out of monitoring for a set time, such as leave: who schedules it, what the
person is told it does, and how a pause is extended, ended or cancelled.

## ADDED Requirements

### Requirement: Pauses are listed for admins and the employee's manager
<!-- source: D31 · backend `monitoring-pauses` · A4 · Prototype "Pause monitoring" -->
The employee page SHALL have a "Pause monitoring" tab listing `GET /v1/employees/:id/pauses` newest first with when, length, reason, note, status and who scheduled it (`created_by_name`, or "a removed user" when `null`). Reasons MUST be labelled Annual leave, Sick leave, Personal time, Off-site or training and Other; status Scheduled, Active now, Ended and Cancelled. A `manager` MUST see the list without actions.

#### Scenario: A manager views pauses
- **WHEN** a `manager` opens the tab
- **THEN** pauses are listed and no Schedule, Extend, End now or Cancel control is shown

### Requirement: The page says what a pause does
<!-- source: D32 · D33 · D34 · Plan-v3.5 §2.4 -->
The tab and the schedule dialog SHALL say that while paused nothing is collected (no apps, websites, activity or screenshots), website blocking is lifted, tamper alerts keep working, the tray or menu bar icon shows monitoring is paused and until when, and the seat stays billed.

#### Scenario: Opening the dialog
- **WHEN** the admin opens Schedule pause
- **THEN** the dialog states that blocking is lifted and tamper alerts keep working

### Requirement: A company admin schedules a pause with an end
<!-- source: D31 · backend `monitoring-pauses` · Prototype "Pause monitoring" -->
A `company_admin` SHALL schedule a pause with start date and time (default now), a required end, a reason and an optional note, with presets Rest of today, Tomorrow and Next 7 days, through `POST /v1/employees/:id/pauses`. There MUST be no open-ended option. `422` MUST say the start can't be in the past or the end must be after the start; `409 CONFLICT` MUST say it overlaps another pause.

#### Scenario: Overlapping pause
- **WHEN** the admin schedules a pause that overlaps a scheduled one
- **THEN** the dialog says it overlaps another pause and nothing is created

### Requirement: Active and scheduled pauses are extended, ended or cancelled
<!-- source: D31 · A7 · backend `monitoring-pauses` -->
An active pause SHALL offer Extend (new end via `PATCH .../pauses/:pause_id`) and End now (cancel), and a scheduled pause Extend and Cancel, each confirmed in place. Ended and cancelled pauses MUST offer no action, and a `409 CONFLICT` MUST say the pause already ended or was cancelled and reload the list.

#### Scenario: Ending a pause now
- **WHEN** the admin confirms End now on an active pause
- **THEN** the pause shows as Cancelled and the employee's status no longer shows Paused after the next refresh
