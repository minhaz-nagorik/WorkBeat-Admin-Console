> **Read first — this task list is not the requirement.**
> Capabilities: `block-list · sensitive-sites · productivity-rules · monitoring-notice`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show edit-policies`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. block-list

- [ ] 1.1 Block list table from `GET /v1/block-rules` with "Blocks" wording per type
- [ ] 1.1a Added by column from `created_by_name` ("—" when null)
- [ ] 1.2 Add rule dialog: whole website / one part, address, reason; browser-gap note; regex sent as `regex` and created rules listed
- [ ] 1.3 Edit (`PATCH`) and inline-confirmed Delete; "computers update within 30 minutes"
- [ ] 1.4 Tests: `409` and `422` messages; regex confirmation lists rules; `404` on delete removes row; role test — admin and IT edit, manager read-only, super admin no page

## 2. sensitive-sites

- [ ] 2.1 Private sites section with Default marker, search, pager
- [ ] 2.2 Add dialog and inline remove, with the default warning
- [ ] 2.3 Tests: wildcard refused by `422` message; duplicate `409`; role test — admin edits, manager reads, IT sees no section and makes no call

## 3. productivity-rules

- [ ] 3.1 Rules table with category filter and counts
- [ ] 3.2 Add dialog, row category dropdown (`PATCH`), inline delete
- [ ] 3.3 Tests: `409` message; "reports recalculated" text; role test — admin edits, manager read-only, IT no page

## 4. monitoring-notice

- [ ] 4.1 Notice editor with version, `GET/PUT /v1/settings/notice`
- [ ] 4.2 Ask-again confirmation; unchanged text message
- [ ] 4.3 Template download built in the browser
- [ ] 4.4 Tests: empty text refused; version shown after save; template has signature lines; role test — only company admin sees it or calls the route
