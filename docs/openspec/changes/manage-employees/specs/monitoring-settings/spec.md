## Purpose

What WorkBeat collects for one employee: the four feature switches and the screenshot interval,
edited by the Company Admin within the company's screenshot tier.

## ADDED Requirements

### Requirement: The employee page has a monitoring settings tab
<!-- source: D37 · Plan-v3.5 §4.5 · backend `monitoring-settings` -->
The employee page SHALL have a "What is collected" tab showing, from `GET /v1/employees/:id/monitoring-settings`, switches for activity, app usage, window titles and website visits, and the screenshot interval. A `company_admin` MUST be able to change them and save with `PUT`; a `manager` MUST see them read only.

#### Scenario: A manager views settings
- **WHEN** a `manager` opens the tab for a team member
- **THEN** the switches and interval are shown disabled with no Save button

### Requirement: The screenshot interval stays within the tier
<!-- source: B11 · backend `monitoring-settings` · backend `subscription-sync` · Prototype "Company settings" -->
For a `company_admin` the interval SHALL offer Off, every 10, 30 or 60 minutes, limited to choices no faster than `screenshot_tier` from `GET /v1/billing` (light: 60; standard: 30, 60; intensive: 10, 30, 60); with tier `off`, Off only, "Your plan doesn't include screenshots" and a link to Billing. A `manager` MUST see only the stored interval and MUST NOT call `GET /v1/billing`.

#### Scenario: Standard tier
- **WHEN** the tier is `standard`
- **THEN** the interval offers Off, 30 minutes and 60 minutes

### Requirement: The page says when and how a change applies
<!-- source: D25 · D37 · backend `monitoring-settings` -->
After a save the tab SHALL say the change reaches the employee's computers within 30 minutes, and when a switch was turned on or the interval shortened, that the employee will be asked to acknowledge the monitoring notice again. Turning a feature off MUST say that collection of it stops.

#### Scenario: Turning on window titles
- **WHEN** the admin turns window titles on and saves
- **THEN** the confirmation mentions both the 30-minute delay and the new notice prompt

### Requirement: A refused value is explained
<!-- source: A12 · backend `monitoring-settings` -->
A `422 VALIDATION_FAILED` on save SHALL show "That interval isn't allowed on your plan" beside the interval and keep the stored values; a `409 CONFLICT` on an archived employee MUST say the employee was removed.

#### Scenario: Tier lowered in another tab
- **WHEN** the save returns `422` because the tier changed
- **THEN** the interval shows the message and the tab reloads the allowed choices
