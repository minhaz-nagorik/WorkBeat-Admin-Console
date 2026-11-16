## Purpose

The Licences page: each company's one licence key, masked, its seats, and the reissue action that
replaces a leaked key without touching devices or seats.

## ADDED Requirements

### Requirement: Licences are listed masked
<!-- source: D43 · B6 · backend `staff-companies` · Prototype "Licenses" -->
The Licences page SHALL list each company from `GET /v1/staff/companies` with the key masked as `WB-••••-••••-••••-` plus `key_last4`, `seats_used` of `seat_limit` and status, searchable through `q` by company name, slug or last four. The full key MUST NOT be shown on this page.

#### Scenario: Searching by company
- **WHEN** staff type `nagorik`
- **THEN** Nagorik Technologies is listed with its seats and status

### Requirement: Reissue explains what changes and what does not
<!-- source: D43 · backend `staff-license-reissue` · A7 -->
Reissue key SHALL confirm in a dialog that the current key stops working for new installs at once and installs started with the old key but not finished are cancelled, while enrolled computers keep working and the seats in use carry over, then call `POST /v1/staff/companies/:id/license/reissue`.

#### Scenario: Confirming a reissue
- **WHEN** staff confirm Reissue key for a company using 50 of 50 seats
- **THEN** the dialog says 50 of 50 seats stay in use on the new key

### Requirement: The new key is shown once
<!-- source: A6 · backend `staff-license-reissue` -->
After a reissue the dialog SHALL show the returned `key` once with a Copy button and say it was emailed to the company's Company Admins. The key MUST be cleared when the dialog closes and MUST NOT be logged, stored in the browser or put in a URL.

#### Scenario: Closing the dialog
- **WHEN** staff close the new-key dialog
- **THEN** the key is no longer on the page and cannot be shown again
