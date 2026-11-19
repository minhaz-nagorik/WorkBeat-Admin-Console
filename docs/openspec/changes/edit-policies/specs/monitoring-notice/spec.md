## Purpose

The monitoring notice employees see and acknowledge on their computers is managed by WorkBeat staff
(A15, backend B29); the company area does not edit it.

## ADDED Requirements

### Requirement: No notice editor for company roles
<!-- source: A15 · backend `collection-notice` (B29) -->
The console SHALL NOT offer any company role a notice editor or template, and MUST NOT call `PUT /v1/settings/notice`. A Company Admin MAY still read `GET /v1/settings/notice` where acknowledgements need the current version.

#### Scenario: A company admin opens Company settings
- **WHEN** a `company_admin` opens Company settings
- **THEN** no notice editor or template is shown and no `PUT /v1/settings/notice` is sent
