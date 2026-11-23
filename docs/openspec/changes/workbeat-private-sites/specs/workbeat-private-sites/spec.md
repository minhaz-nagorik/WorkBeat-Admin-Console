## Purpose

WorkBeat private sites: one list of never-recorded sites that WorkBeat staff keep for every
company, shown read-only on each company's Block list.

## ADDED Requirements

### Requirement: Staff keep the WorkBeat private sites
<!-- source: A19 · product owner 23 Nov 2026 · backend round 9 -->
The staff page at `/staff/private-sites` SHALL be shown to `super_admin` only and list every site from `GET /v1/staff/sensitive-domains` with search and a pager. Staff MUST be able to add a site (`POST`, a bare website name such as `citybank.com`) and remove one (`DELETE`) after a confirmation that says every company will start recording visits to it. The page MUST say the list applies to every company.

#### Scenario: Staff add a site
- **WHEN** staff add `examplebank.com`
- **THEN** it appears on the list and the page says every company's computers update within 30 minutes

#### Scenario: A duplicate
- **WHEN** staff add a site already on the WorkBeat list
- **THEN** the field says the site is already on the list

#### Scenario: Removing a site
- **WHEN** staff press remove on a site
- **THEN** the page asks to confirm that WorkBeat will start recording visits to it at every company, and removes it only on Remove

### Requirement: Companies see WorkBeat sites read-only
<!-- source: A19 · backend round 9 `source` -->
The Block list's Private sites card SHALL show every item of `GET /v1/sensitive-domains` whose `source` is `workbeat` with a "Set by WorkBeat" tag and no remove control, for every role, and say these are set by WorkBeat for every company and cannot be changed. An item without `source` MUST be treated as the company's own.

#### Scenario: A Company Admin reads the card
- **WHEN** a `company_admin` opens Block list
- **THEN** WorkBeat sites show "Set by WorkBeat" and have no ×, while the company's own sites keep their ×

#### Scenario: Adding a site WorkBeat already covers
- **WHEN** a Company Admin adds a site that is on the WorkBeat list
- **THEN** the field says the site is already on the list
