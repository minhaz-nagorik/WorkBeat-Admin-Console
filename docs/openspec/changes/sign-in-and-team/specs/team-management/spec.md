## Purpose

The Team & roles page where a Company Admin decides who can sign in to the dashboard, in which
role, and which employees each manager sees.

## ADDED Requirements

### Requirement: Only the company admin manages the team
<!-- source: backend `role-access` · Plan-v3.5 §4.5 "Settings" -->
Team & roles SHALL be shown to `company_admin` only. It MUST list `GET /v1/team` users (name, email, role, Active) and open invitations (email, role, "Invite sent" with the date, expiry) in one list with search, and say that monitored employees are managed on the Employees page.

#### Scenario: The team list
- **WHEN** a Company Admin opens Team & roles
- **THEN** users and open invitations are listed together, each with role and status

### Requirement: A company admin invites a colleague
<!-- source: backend `team-invitations` · A12 · Prototype "Team & roles" -->
"Invite someone" SHALL ask for a work email and one role (Manager, IT Admin, Company Admin, each with a one-line description) and call `POST /v1/team/invitations`. `409 CONFLICT` MUST show "This person already has an account or an open invitation". On success the invitation MUST appear in the list.

#### Scenario: A duplicate invite
- **WHEN** the admin invites an email that already has an open invitation
- **THEN** the dialog shows the already-invited message and nothing is added

### Requirement: Open invitations are resent or cancelled
<!-- source: backend `team-invitations` · A7 -->
Each open invitation SHALL offer Resend (`POST /v1/team/invitations/:id/resend`) and Cancel invite (`DELETE /v1/team/invitations/:id`) after an inline confirmation. A `409` because it was accepted meanwhile MUST refresh the list and say "This invitation was already accepted".

#### Scenario: Cancelling an accepted invitation
- **WHEN** the admin cancels an invitation that was accepted a moment ago
- **THEN** the list refreshes and shows the person as a user, with the already-accepted message

### Requirement: Roles change and users are removed
<!-- source: backend `team-invitations` · A7 · A12 -->
Each user other than the signed-in admin SHALL have a role dropdown (`PATCH /v1/team/users/:id`) and Remove after confirmation (`DELETE /v1/team/users/:id`). The admin's own row MUST show "You" and no controls. `409 CONFLICT` MUST show "A company needs at least one Company Admin". Changing a manager to another role MUST warn how many employees will have no manager, counted from `GET /v1/employees?manager_user_id=`.

#### Scenario: Demoting a manager
- **WHEN** the admin changes a Manager with five employees to IT Admin
- **THEN** a confirmation says those five employees will have no manager before it saves

#### Scenario: The last admin
- **WHEN** a change would leave no Company Admin and the API answers `409`
- **THEN** the role is not changed and the at-least-one-admin message is shown

### Requirement: Each employee has at most one manager
<!-- source: B12 · backend `manager-teams` · Prototype "Team & roles" -->
The Manager teams card SHALL pick one manager, load their team with `GET /v1/employees?manager_user_id=` and tick the employees on it; ticking or unticking MUST call `PATCH /v1/employees/:id` with `manager_user_id` set to that manager or null. An employee on another manager's team MUST show that manager's name, and ticking them MUST move them, not share them.

#### Scenario: Moving an employee
- **WHEN** an employee on Sadia's team is ticked for Rafiq
- **THEN** the employee's manager becomes Rafiq and they leave Sadia's team

### Requirement: The page explains who can do what
<!-- source: backend `role-access` · A14 · Prototype "Team & roles" -->
The page SHALL show a read-only table of actions against Company Admin, Manager and IT Admin that matches the permission matrix in `role-access`, including that IT Admins see no reports or screenshots, that their changes to employees, devices, alerts and policies read "Needs approval", that they have no Deployment, and Managers only their own team.

#### Scenario: Reading the table
- **WHEN** the admin reads the Screenshots row
- **THEN** it shows Company Admin Yes, Manager Own team, IT Admin No

#### Scenario: Reading the remove-employee row
- **WHEN** the admin reads the Remove employee row
- **THEN** it shows Company Admin Yes, Manager No, IT Admin Needs approval
