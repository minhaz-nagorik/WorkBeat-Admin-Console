## Purpose

The monitoring notice: the text employees see and acknowledge on their computers, edited by the
Company Admin, plus a template for signed copies before install.

## ADDED Requirements

### Requirement: A Company Admin edits the notice text
<!-- source: D25 · Plan-v3.5 §4.5 · backend `collection-notice` -->
A Monitoring notice section, shown to `company_admin` only, SHALL load `GET /v1/settings/notice`, show `notice_text` in an editor with its `notice_version`, and save with `PUT /v1/settings/notice`. An empty or over-long text MUST be refused beside the editor from `422 VALIDATION_FAILED`.

#### Scenario: Saving a new text
- **WHEN** an admin edits the text and saves
- **THEN** the page sends the `PUT` and shows the new version number

### Requirement: The editor warns that employees are asked again
<!-- source: D25 · backend `collection-notice` -->
Before saving a changed text the page SHALL confirm that every employee will be shown the new notice on their computer and asked to acknowledge it again. Saving the same text MUST say nothing changed.

#### Scenario: Confirming a change
- **WHEN** an admin saves a changed text
- **THEN** a confirmation says every employee will be asked to acknowledge it again

### Requirement: A template is offered for signed copies
<!-- source: Plan-v3.5 §5.10 · Prototype "Company settings" -->
The section SHALL offer "Download template": a plain-text notice built from the current text, the company name, the retention period and the line "Screenshots may be taken if your company has turned them on for you", with name, signature and date lines, generated in the browser without any API call beyond those already made.

#### Scenario: Downloading the template
- **WHEN** an admin clicks Download template
- **THEN** a text file with the notice and signature lines is saved

### Requirement: Other roles do not see the notice editor
<!-- source: backend `collection-notice` · backend `role-access` -->
The notice section and its `GET /v1/settings/notice` call SHALL be limited to `company_admin`; `manager`, `it_admin` and `super_admin` MUST NOT see it or make the call.

#### Scenario: An IT admin
- **WHEN** an `it_admin` opens any page
- **THEN** no call to `/v1/settings/notice` is made
