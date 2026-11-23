## Purpose

The conventions every page follows so the platform reads as one product: lists, confirmations,
plain-language labels, the company's time zone and accessibility.

## ADDED Requirements

### Requirement: Lists search, filter and page the same way
<!-- source: A8 · Prototype lists -->
Every list SHALL have a search box that matches the visible columns as the user types, the page's filters, and a pager with 10 rows by default and a choice of 10, 25 or 50. A filter with more than four options MUST be a dropdown showing each option's count. Changing the search or a filter MUST return to page 1.

#### Scenario: Searching a long list
- **WHEN** a user on page 3 types in the search box
- **THEN** the list shows matching rows from page 1

#### Scenario: Many alert types
- **WHEN** a filter has seven options
- **THEN** it is a dropdown, each option followed by its count

### Requirement: Empty and loading states say what is happening
<!-- source: A12 · Prototype lists -->
A list with no rows SHALL say why in one line ("No alerts match", "No device yet"), and a page waiting for data MUST show a loading placeholder of its layout, not an empty table.

#### Scenario: A filter with no match
- **WHEN** a filter leaves no rows
- **THEN** the table shows one line saying nothing matches

### Requirement: Destructive actions confirm and name the consequence
<!-- source: A7 · Prototype "confirmBox" -->
Release, remove, cancel, delete, suspend and reissue SHALL ask for confirmation in place, naming what will happen ("Release NG-LT-0141? Its seat is freed and it stops being monitored"), with the destructive button styled as such and Cancel as the default focus. Nothing destructive MUST happen on a single click.

#### Scenario: Deleting a block rule
- **WHEN** a user clicks Delete on a block rule
- **THEN** an inline confirmation asks "Delete rule?" and nothing is deleted until they confirm

### Requirement: People read labels, never system values
<!-- source: A4 · Prototype "Alerts" -->
Every API enum shown to a person SHALL come from one label map: tamper event types (for example `hosts_modified` as "Website blocking changed", `process_restart` as "WorkBeat was closed"), device status and badges, pause reasons and states, roles and company status. A value missing from the map MUST show as "Other", never the raw value.

#### Scenario: A new event type from the API
- **WHEN** the feed returns an `event_type` the map does not know
- **THEN** the row shows "Other"

### Requirement: Times are the company's times
<!-- source: A9 · B19 -->
Every date and time SHALL be shown in `companies.timezone`, as "09:42 today", "Yesterday 16:03" or a date with time for older ones, and day pickers MUST mean the company's day. A tooltip MUST give the full date and time with the zone.

#### Scenario: A manager in another zone
- **WHEN** the company zone is `Asia/Dhaka` and the manager's browser is in `Europe/London`
- **THEN** an event at 09:00 Dhaka time shows as "09:00 today"

### Requirement: Every page is accessible
<!-- source: A11 · Prototype -->
Every control SHALL have a visible or programmatic label, be reachable and operable by keyboard with visible focus; dialogs MUST trap focus and return it on close; status pills MUST carry text, never colour alone; charts MUST have a text alternative; and contrast MUST meet WCAG 2.2 AA in light and dark themes.

#### Scenario: Closing a dialog
- **WHEN** a keyboard user closes the Add employee dialog with Escape
- **THEN** focus returns to the Add employee button
