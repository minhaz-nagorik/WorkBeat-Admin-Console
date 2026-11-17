## Purpose

Private sites: banking, health and personal sites WorkBeat never records, where screenshots pause,
shown on the Block list page to the roles that may read them.

## ADDED Requirements

### Requirement: Private sites are listed with their defaults
<!-- source: D4 · backend `sensitive-domains` · Prototype "Block list" -->
For `company_admin`, `it_admin` and `manager` the Block list page SHALL show a "Private sites (never recorded)" section from `GET /v1/sensitive-domains`, each `pattern` as a chip, marking `is_default` entries as "Default", with search and pager, and saying that visits are never recorded and screenshots pause while they are open.

#### Scenario: Seeded defaults
- **WHEN** a new company opens Block list
- **THEN** the seeded banking, health and personal-email sites show, marked Default

### Requirement: Admins change private sites; IT requests changes
<!-- source: backend `sensitive-domains` · backend `role-access` · A14 -->
Add and remove SHALL be shown to `company_admin` and `it_admin`, through `POST /v1/sensitive-domains` and `DELETE /v1/sensitive-domains/:id`. An `it_admin`'s change answers `202 { change }` and MUST leave the section unchanged and show "Waiting for approval" per `change-approvals`. A `manager` MUST see the section read-only.

#### Scenario: IT removes a private site
- **WHEN** an `it_admin` confirms removing `citybank.com` and the API answers `202`
- **THEN** the chip stays and the page says the removal waits for approval

#### Scenario: A manager opens Block list
- **WHEN** a `manager` opens Block list
- **THEN** the private sites show with no add or remove control

### Requirement: A private site is a website name
<!-- source: backend `sensitive-domains` · A12 -->
The Add private site dialog SHALL accept a website name such as `citybank.com`, say that it also covers its subdomains, and show `422 VALIDATION_FAILED` as "Type just the website, like citybank.com" and `409 CONFLICT` as "That site is already on the list".

#### Scenario: A wildcard
- **WHEN** an admin types `*.bank`
- **THEN** the dialog shows the website-name message and adds nothing

### Requirement: Removing a default warns once
<!-- source: backend `sensitive-domains` · A7 -->
Removing an entry SHALL confirm inline; for an `is_default` entry the confirmation MUST say that WorkBeat will start recording visits to that site and will not add it back.

#### Scenario: Removing a default bank
- **WHEN** an admin removes a default entry
- **THEN** the confirmation says visits will be recorded and the default will not return
