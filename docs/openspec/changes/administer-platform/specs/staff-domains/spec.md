## Purpose

The Custom domains page: every company's custom domain and its state, where staff check a domain's
TXT record by hand and approve, reject or deactivate it (A17, backend B33).

## ADDED Requirements

### Requirement: Custom domains are listed with their state
<!-- source: backend `staff-companies` · backend `custom-domains` · Prototype "Custom domains" -->
The Custom domains page SHALL list the companies from `GET /v1/staff/companies` that have a `custom_domain`, with the domain, company name and `custom_domain_status` as "Waiting for WorkBeat approval" (`pending`), "Active" (`active`) or "Not approved" (`failed`), and when it was reviewed (`custom_domain_checked_at`, "Not reviewed yet" when null), searchable by domain or company.

#### Scenario: A pending domain
- **WHEN** a company's domain is `pending`
- **THEN** its row shows "Waiting for WorkBeat approval" and a "Check and approve" button

### Requirement: Staff check the TXT record before approving
<!-- source: A17 · backend `custom-domains` (B33) -->
"Check and approve" on a `pending` or `failed` domain SHALL open a dialog that loads `GET /v1/staff/companies/:id/custom-domain` and shows `txt_name`, `txt_value` and a `dig +short TXT <txt_name>` command, with Approve and Reject. The page MUST say that staff approve only after the lookup shows that value.

#### Scenario: Staff open a pending domain
- **WHEN** staff click "Check and approve" for `monitor.acme.com`
- **THEN** the dialog shows `_workbeat.monitor.acme.com`, its expected value and the `dig` command

### Requirement: Approve and reject send the reviewed domain
<!-- source: A17 · backend `custom-domains` -->
Approve SHALL send `PATCH /v1/staff/companies/:id/custom-domain` with the domain shown and `status` `active`; Reject MUST send `status` `failed`. On success the dialog MUST close, the list reload and a note name the result. A `409` MUST say the company changed or removed the domain.

#### Scenario: The company changed its domain meanwhile
- **WHEN** staff approve and the API answers `409`
- **THEN** the dialog says the company changed or removed this domain

### Requirement: Deactivating an active domain asks first
<!-- source: A7 · A17 · backend `custom-domains` -->
An `active` domain's row SHALL offer Deactivate, which first asks, naming that the company's team can no longer open the dashboard at that address, then sends `status` `failed` for that domain.

#### Scenario: Staff deactivate
- **WHEN** staff confirm Deactivate for an active `monitor.acme.com`
- **THEN** the row shows "Not approved" after the list reloads
