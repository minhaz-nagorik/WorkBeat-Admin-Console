## Purpose

Productivity rules: which apps and websites count as productive, neutral or unproductive in
reports, edited by the Company Admin and read by managers.

## ADDED Requirements

### Requirement: Rules are listed with their category
<!-- source: backend `productivity-rules` · Prototype "Productivity rules" -->
The Productivity rules page SHALL call `GET /v1/productivity-rules` and show each rule's `pattern`, whether it is an app or a website (`match_type`) and its `category`, filterable by category with counts, with search and pager. The page MUST say that anything without a rule counts as neutral.

#### Scenario: Filtering unproductive rules
- **WHEN** a user picks the Unproductive filter
- **THEN** only rules with `category` `unproductive` show

### Requirement: Only a Company Admin edits; managers read
<!-- source: backend `productivity-rules` · backend `role-access` -->
Add, category change and delete SHALL be shown to `company_admin` only. A `manager` MUST see the list read-only with the subtitle "Read-only. Your Company Admin sets these rules". An `it_admin` MUST NOT see the page or its navigation item.

#### Scenario: A manager opens the page
- **WHEN** a `manager` opens Productivity rules
- **THEN** categories show as text and no control changes them

### Requirement: A rule is added and changed in place
<!-- source: backend `productivity-rules` · A7 · A12 -->
Add rule SHALL send `POST /v1/productivity-rules` with `match_type` (App or Website), `pattern` and `category`; a category dropdown in the row MUST send `PATCH /v1/productivity-rules/:id`; Delete MUST confirm inline. `409 CONFLICT` MUST read "A rule for this app or website already exists".

#### Scenario: Changing a category
- **WHEN** an admin changes YouTube from Neutral to Unproductive
- **THEN** the page sends the `PATCH` and confirms the rule was updated

### Requirement: The page says a change rewrites past reports
<!-- source: backend `productivity-rules` · backend `usage-reports` -->
The page and the Add rule dialog SHALL say that a change applies to every report, past ones included, and MUST NOT say devices need to update, since rules are not sent to devices.

#### Scenario: After a change
- **WHEN** a rule is saved
- **THEN** the confirmation says reports were recalculated
