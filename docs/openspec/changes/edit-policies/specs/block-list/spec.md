## Purpose

The Block list page: websites employees cannot open on company computers, as whole-site rules or
rules for one part of a site, with who may change them and where each kind works.

## ADDED Requirements

### Requirement: The block list shows every rule with what it blocks
<!-- source: D39 · backend `block-rules` · Prototype "Block list" -->
The Block list page SHALL call `GET /v1/block-rules` and show each rule's `pattern`, what it blocks ("Whole site and its subdomains, in every browser and app" for `domain`; "Only this part of the site, in most browsers" for `url`), `reason`, who added it (`created_by_name`, "—" when null) and when (`created_at`), with search and pager.

#### Scenario: Two kinds of rule
- **WHEN** the list has `facebook.com` (`domain`) and `youtube.com/shorts` (`url`)
- **THEN** each row says what it blocks in plain words

#### Scenario: The author left the company
- **WHEN** a rule's `created_by_name` is `null`
- **THEN** its Added by cell shows "—"

### Requirement: Admins and IT edit the block list; managers read it
<!-- source: backend `role-access` · backend `block-rules` · Plan-v3.5 §4.5 · A14 -->
Add, edit and delete SHALL be shown to `company_admin` and `it_admin`; an `it_admin`'s change answers `202 { change }` and MUST leave the list unchanged and show "Waiting for approval" per `change-approvals`. A `manager` MUST see the same list read-only with no Add, Edit or Delete control. A `super_admin` MUST NOT see the page.

#### Scenario: A manager opens the block list
- **WHEN** a `manager` opens Block list
- **THEN** the rules are listed and no control changes them

#### Scenario: IT adds a rule
- **WHEN** an `it_admin` adds `facebook.com` and the API answers `202`
- **THEN** the list does not show the rule and the page says it waits for approval

### Requirement: A rule is added as a whole website
<!-- source: D39 · A20 · Plan-v3.5 §4.3 · backend `block-rules` · Prototype "Block list" -->
The Add rule dialog SHALL ask only for a website address and a reason employees see, and send `POST /v1/block-rules` with `type` `domain`. It MUST offer no choice to block one part of a website and MUST NOT send `type` `url` or `regex`. The address field MUST say the rule blocks the whole website and its subdomains in every browser and app.

#### Scenario: Blocking Facebook
- **WHEN** an admin types `facebook.com` and a reason
- **THEN** the page sends `type` `domain` and the new rule appears at the top of the list

#### Scenario: A taken rule
- **WHEN** the API answers `409 CONFLICT`
- **THEN** the dialog says the rule already exists and stays open

#### Scenario: An older rule for one part of a website
- **WHEN** an admin edits an existing `url` rule such as `youtube.com/shorts`
- **THEN** the dialog keeps it a `url` rule and saves the changed address or reason

### Requirement: Rules are edited and deleted in place
<!-- source: backend `block-rules` · A7 -->
Edit SHALL change a rule's `pattern` or `reason` through `PATCH /v1/block-rules/:id`, and Delete MUST confirm inline before `DELETE /v1/block-rules/:id`. After any change the page MUST say computers update within 30 minutes. A `404 NOT_FOUND` MUST remove the row and say it was already deleted.

#### Scenario: Deleting a rule
- **WHEN** a Company Admin confirms Delete on `bet365.com`
- **THEN** the row disappears and a message says computers update within 30 minutes
