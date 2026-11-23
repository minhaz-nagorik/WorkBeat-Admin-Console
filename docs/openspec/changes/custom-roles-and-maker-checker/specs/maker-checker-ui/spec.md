## Purpose

How the console shows changes that wait for approval.

## ADDED Requirements

### Requirement: Nobody decides their own change
<!-- source: product owner 19 Nov 2026 -->
On Approvals, a Company Admin SHALL see Approve and Reject on others' pending changes and, on their own, "Waiting for another Company Admin" with Cancel request only. A refused decision (`403`) MUST say another Company Admin must approve it.

#### Scenario: Two Company Admins
- **WHEN** admin A opens Approvals after adding a block rule
- **THEN** A's change shows "Waiting for another Company Admin" and no Approve button

### Requirement: Every write may be sent for approval
<!-- source: product owner 19 Nov 2026 -->
Each form whose route may answer `202` SHALL say the change was sent for approval and show it under "Waiting for approval", including team invitations, role changes, removals, roles, company settings, alert emails, the minimum agent version and employee restore.

#### Scenario: Inviting with a second Company Admin
- **WHEN** a company admin invites someone while another Company Admin exists
- **THEN** the page says the invitation was sent for approval

### Requirement: Staff may add a second Company Admin
<!-- source: product owner 19 Nov 2026 -->
Add company SHALL offer an optional second Company Admin email, checked locally to be valid and different from the first.

#### Scenario: Same email twice
- **WHEN** staff enter the same email in both fields
- **THEN** the second field says to use a different email
