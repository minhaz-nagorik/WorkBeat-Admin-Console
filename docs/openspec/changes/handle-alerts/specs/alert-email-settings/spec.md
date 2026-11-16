## Purpose

Who is emailed about which alerts, and how often: a Company Admin setting stored in the company's
`alert_email`, summarised on the Alerts page for everyone.

## ADDED Requirements

### Requirement: The Alerts page says who gets emails and how
<!-- source: backend `company-settings` · Prototype "Alerts" -->
For a `company_admin` the Alerts page subtitle SHALL name the roles in `alert_email.roles` and the delivery ("as they happen", "as an hourly digest", "as a daily digest at 09:00"), read from `GET /v1/company/settings`, and say "nobody" when no role is chosen. Other roles MUST see the subtitle without the email sentence and MUST NOT call the settings route, which only `company_admin` may read.

#### Scenario: Admins and IT, instant
- **WHEN** `alert_email` has roles `company_admin` and `it_admin` and delivery `instant`
- **THEN** the subtitle says emails go to Company Admins and IT Admins as they happen

#### Scenario: A manager opens Alerts
- **WHEN** a `manager` opens Alerts
- **THEN** no call to `GET /v1/company/settings` is made and the subtitle has no email sentence

### Requirement: A Company Admin edits alert emails
<!-- source: backend `company-settings` · backend `alert-emails` · Prototype "Alerts" -->
An "Email settings" button, shown to `company_admin` only, SHALL open a dialog with a checkbox per role (Company Admins, IT Admins, Managers — own team only), a checkbox per alert type using the plain labels, and a delivery choice (As they happen, Hourly digest, Daily digest at 09:00), saved with `PATCH /v1/company/settings` `alert_email`.

#### Scenario: Switching to a daily digest
- **WHEN** an admin picks Daily digest and saves
- **THEN** the page sends `alert_email.delivery` `daily` and the subtitle updates

### Requirement: The dialog refuses settings that would hide alerts
<!-- source: A12 · backend `company-settings` -->
The dialog SHALL refuse to save with no role or no alert type ticked, saying why, and MUST show a `422 VALIDATION_FAILED` from the API beside the field it names without closing.

#### Scenario: No recipient
- **WHEN** an admin unticks every role and saves
- **THEN** the dialog says to pick at least one group, or alerts will go unseen, and sends nothing

### Requirement: The dialog says what an email contains
<!-- source: backend `alert-emails` · D4 -->
The dialog SHALL state that an alert email names only the alert, the computer, the person and the time, and never a website, window title or screenshot.

#### Scenario: Opening the dialog
- **WHEN** an admin opens Email settings
- **THEN** a line says what an alert email does and does not contain
