## Purpose

Showing the Company Admin which of an employee's devices acknowledged which version of the
monitoring notice, as evidence the employee was told.

## ADDED Requirements

### Requirement: The admin sees an employee's notice acknowledgements
<!-- source: D25 · backend `notice-acknowledgement` -->
For a `company_admin` the employee page SHALL show, from `GET /v1/employees/:id/notice-acknowledgements`, each acknowledgement newest first with the device hostname, notice version, when the employee acknowledged and when WorkBeat received it. A `manager` MUST NOT see this section.

#### Scenario: Two versions
- **WHEN** the employee acknowledged versions 1 and 2 on NG-LT-0141
- **THEN** both rows are listed with version 2 first

### Requirement: A missing acknowledgement of the current notice is flagged
<!-- source: D25 · backend `collection-notice` -->
When no acknowledgement matches the current `notice_version` from `GET /v1/settings/notice`, the section SHALL say the employee has not yet acknowledged the current notice.

#### Scenario: Notice changed yesterday
- **WHEN** the notice is at version 3 and the latest acknowledgement is version 2
- **THEN** the section says the current notice is not acknowledged yet
