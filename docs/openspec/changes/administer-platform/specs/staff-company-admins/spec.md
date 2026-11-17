## Purpose

The Company admins page where WorkBeat staff find a customer's Company Admin and reissue their
password as a temporary one when they are locked out.

## ADDED Requirements

### Requirement: Company Admins are listed across companies
<!-- source: product owner 17 Nov 2026 · backend round 5 `GET /v1/staff/company-admins` · D41 -->
The Company admins page SHALL call `GET /v1/staff/company-admins` and list each Company Admin's name, email, company and whether a temporary password is waiting to be changed, with search. It MUST show no other role, employee, device or activity data.

#### Scenario: Finding a customer's admin
- **WHEN** staff search "nagorik"
- **THEN** the Company Admins of Nagorik Technologies are listed with their emails

### Requirement: Staff reissue a temporary password
<!-- source: product owner 17 Nov 2026 · backend round 5 `POST /v1/staff/users/:id/temporary-password` · A6 · A7 -->
"Reset password" SHALL confirm that the person is signed out everywhere and gets a temporary password by email, then call `POST /v1/staff/users/:id/temporary-password` and show the returned password once with Copy, saying it was also emailed, works for 72 hours and must be changed at sign-in. The password MUST NOT be logged, stored or put in a URL, and MUST be cleared when the dialog closes.

#### Scenario: A locked-out admin
- **WHEN** staff confirm Reset password for `ceo@nagorik.tech`
- **THEN** the dialog shows the temporary password with Copy and says it was emailed to `ceo@nagorik.tech`

#### Scenario: Closing the dialog
- **WHEN** staff close the dialog
- **THEN** the temporary password is gone and can't be shown again
