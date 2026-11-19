## Purpose

Company Admins make roles and give them to people; the console shows each person what their role allows.

## ADDED Requirements

### Requirement: Company Admins make roles on Team & roles
<!-- source: product owner 19 Nov 2026 -->
Team & roles SHALL list Company Admin (fixed) and each role with what it may do in plain words and how many people have it, and SHALL let a Company Admin create, edit and delete a role: a name, one checkbox per permission and "Own team only". Ticking an edit right MUST tick its view right. Deleting MUST say what happens first.

#### Scenario: Making an auditor role
- **WHEN** a company admin creates "Auditor" with "Reports, activity and screenshots"
- **THEN** the Roles card lists Auditor with that right and 0 people

### Requirement: The console follows the signed-in user's permissions
<!-- source: product owner 19 Nov 2026 -->
Navigation, employee tabs and edit buttons SHALL follow `permissions` and `team_only` from `GET /v1/me`; the API's `403` stays the control.

#### Scenario: A role without devices
- **WHEN** a member whose role lacks `devices.view` signs in
- **THEN** Devices is not in the navigation and opening `/devices` goes to Overview
