## Purpose

Private sites: banking, health and personal sites WorkBeat never records, where screenshots pause,
shown on the Block list page to the roles that may read them.

## ADDED Requirements

### Requirement: Private sites are listed with their defaults
<!-- source: D4 · backend `sensitive-domains` · Prototype "Block list" -->
For `company_admin` and `manager` the Block list page SHALL show a "Private sites (never recorded)" section from `GET /v1/sensitive-domains`, each `pattern` as a chip, marking `is_default` entries as "Default", with search and pager, and saying that visits are never recorded and screenshots pause while they are open.

#### Scenario: Seeded defaults
- **WHEN** a new company opens Block list
- **THEN** the seeded banking, health and personal-email sites show, marked Default

### Requirement: Only a Company Admin changes private sites
<!-- source: backend `sensitive-domains` · backend `role-access` -->
Add and remove SHALL be shown to `company_admin` only, through `POST /v1/sensitive-domains` and `DELETE /v1/sensitive-domains/:id`. A `manager` MUST see the section read-only. For an `it_admin` the section MUST NOT be shown or requested.

#### Scenario: An IT admin opens Block list
- **WHEN** an `it_admin` opens Block list
- **THEN** the block rules show and no private-sites section or call is made

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
