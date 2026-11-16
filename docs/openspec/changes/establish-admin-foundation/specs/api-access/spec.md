## Purpose

How every page talks to the API: with the user's token, through one client, with codes turned into
plain messages and live pages kept fresh by polling.

## ADDED Requirements

### Requirement: Every call carries the user's token and nothing else
<!-- source: A2 · Plan-v3.5 §2.2 · backend `user-authentication` -->
Every API call SHALL be made by the app's server with `Authorization: Bearer` and the session `token` from `POST /v1/auth/login`; the browser calls the app's server, never the API with the token. The app MUST NOT read the database or file storage directly, hold any API secret, or send a `company_id` to select a company.

#### Scenario: A page loads data
- **WHEN** the Devices page loads
- **THEN** it calls `GET /v1/devices` with the user's bearer token and no `company_id`

### Requirement: An expired session returns to sign-in
<!-- source: backend `user-authentication` · A12 -->
A `401 UNAUTHENTICATED` from any call, or a session past its `expires_at` (7 days after sign-in), SHALL clear the session cookie and show the sign-in page with "Your session ended. Sign in again", keeping the page address to return to after sign-in. There is no silent refresh.

#### Scenario: A removed user
- **WHEN** a user removed by their Company Admin makes a call with an unexpired token
- **THEN** the API answers `401` and the app shows the sign-in page with the session-ended message

### Requirement: Errors are shown in plain language
<!-- source: A4 · A12 · backend `api-envelope` -->
The app SHALL show `422 VALIDATION_FAILED` field errors beside the named fields, each `409` code as a sentence saying what to do next, `404 NOT_FOUND` as "This item no longer exists", and network errors, `429 RATE_LIMITED` and `5xx` as "Something went wrong. Try again" with a retry control. A raw `code`, stack trace or response body MUST NOT be shown.

#### Scenario: A validation error
- **WHEN** a form submit returns `422` naming `email`
- **THEN** the message appears under the email field and the form keeps what was typed

#### Scenario: A server error
- **WHEN** a list call returns `500`
- **THEN** the page shows the retry message and a Try again button, and no code

### Requirement: Live pages poll while visible
<!-- source: A5 · backend `alerts-feed` -->
The alerts count, the Alerts page, Overview, the Devices list and the setup checklist SHALL refetch every 30 seconds while the browser tab is visible and stop while it is hidden, refetching once when it becomes visible again. A poll MUST NOT reset the user's search, filter, page or open confirmation.

#### Scenario: A new tamper event
- **WHEN** a tamper event is stored while an admin has the Alerts page open
- **THEN** it appears within 1 minute without a reload

#### Scenario: A hidden tab
- **WHEN** the tab has been hidden for 10 minutes
- **THEN** no poll was sent during that time

### Requirement: Nothing secret is logged or stored in the browser
<!-- source: A6 · B6 -->
The app SHALL NOT write the session token, the licence key, the uninstall token or any signed URL to the console, error reporting, analytics, `localStorage`, `sessionStorage` or a URL. The session token MUST be kept only in an httpOnly, Secure, SameSite=Lax cookie set by the app's server.

#### Scenario: An error report
- **WHEN** a call that returned a signed URL later fails and is reported
- **THEN** the report contains no URL query string and no token
