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
<!-- source: backend `role-access` · backend `block-rules` · Plan-v3.5 §4.5 -->
Add, edit and delete SHALL be shown to `company_admin` and `it_admin`. A `manager` MUST see the same list read-only with no Add, Edit or Delete control. A `super_admin` MUST NOT see the page.

#### Scenario: A manager opens the block list
- **WHEN** a `manager` opens Block list
- **THEN** the rules are listed and no control changes them

### Requirement: A rule is added as a whole website or one part of a website
<!-- source: D39 · Plan-v3.5 §4.3 · backend `block-rules` · Prototype "Block list" -->
The Add rule dialog SHALL ask "What do you want to block?" with "A whole website" (`type` `domain`) and "One part of a website" (`type` `url`), an address and a reason employees see, and send `POST /v1/block-rules`. The url choice MUST say that in Firefox on Mac and in Brave, Opera and Vivaldi on Windows only whole-website rules work.

#### Scenario: Blocking YouTube Shorts
- **WHEN** an admin picks "One part of a website", types `youtube.com/shorts` and a reason
- **THEN** the page sends `type` `url` and the new rule appears at the top of the list

#### Scenario: A taken rule
- **WHEN** the API answers `409 CONFLICT`
- **THEN** the dialog says the rule already exists and stays open

### Requirement: A pattern typed as a regular expression shows what was created
<!-- source: D39 · backend `block-rules` -->
When the address is a regular expression, the dialog SHALL send `type` `regex` and, on success, list the url rules the API created in a confirmation; on `422 VALIDATION_FAILED` it MUST say the pattern cannot be turned into website rules and suggest typing the site and path instead.

#### Scenario: A prefix pattern
- **WHEN** an admin enters `^https?://(www\.)?reddit\.com/r/.*`
- **THEN** the confirmation lists the url rules created for `reddit.com/r/`

### Requirement: Rules are edited and deleted in place
<!-- source: backend `block-rules` · A7 -->
Edit SHALL change a rule's `pattern` or `reason` through `PATCH /v1/block-rules/:id`, and Delete MUST confirm inline before `DELETE /v1/block-rules/:id`. After any change the page MUST say computers update within 30 minutes. A `404 NOT_FOUND` MUST remove the row and say it was already deleted.

#### Scenario: Deleting a rule
- **WHEN** an IT admin confirms Delete on `bet365.com`
- **THEN** the row disappears and a message says computers update within 30 minutes
