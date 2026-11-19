## Purpose

One employee's screenshots for a range of company days: who may see them, how they are shown and
paged, and how their short-lived links are handled.

## ADDED Requirements

### Requirement: Only the admin and the employee's manager see screenshots
<!-- source: Plan-v3.5 §4.5 · backend `screenshot-access` · Prototype "Employee → Screenshots" -->
The Screenshots tab SHALL be shown to `company_admin` and to the employee's own `manager` and call `GET /v1/employees/:id/screenshots?from=&to=` for the chosen company days. The tab MUST say screenshots are kept for the retention period and only Company Admins and this person's manager can see them.

#### Scenario: A manager of another team
- **WHEN** the call returns `404 NOT_FOUND`
- **THEN** the tab shows the not-found message and no image

### Requirement: Screenshots off shows why
<!-- source: backend `screenshot-access` · backend `monitoring-settings` -->
When the response has `screenshots_enabled` false the tab SHALL say the company's plan doesn't include screenshots, with a Billing link for a Company Admin; when the employee's interval is Off it MUST say screenshots are off for this person, with a link to What is collected for a Company Admin.

#### Scenario: Tier off
- **WHEN** `screenshots_enabled` is false
- **THEN** the tab shows the plan message and no grid

### Requirement: A range of screenshots shows as a grid with a viewer
<!-- source: D23 · Prototype "Employee → Screenshots" · backend `screenshot-access` -->
The tab SHALL offer the Report tab's range picker limited to retained days, defaulting to Today or to `from`/`to` or `date` in the address, and show the range's items newest first as thumbnails with time and hostname, under a heading per company day when the range spans days, with the range's `total`. A range with no items MUST say no screenshots were taken in it.

#### Scenario: A week
- **WHEN** the reader picks Last 7 days
- **THEN** the newest day's screenshots come first, each day under its own heading

#### Scenario: An empty range
- **WHEN** the range has no screenshots
- **THEN** the tab says none were taken in that range and shows no grid

### Requirement: The range can be narrowed to hours of each day
<!-- source: product owner 19 Nov 2026 · backend `screenshot-access` "The range can be limited to hours of each day" -->
Beside the range picker the tab SHALL offer From and To times in company time, blank by default (the whole day). When either is set it MUST send `start` and `end` (a blank From as `00:00`, a blank To as `24:00`), show the hours beside the range heading and offer an All day control that clears them. A To not after From MUST show an error beside the times and make no request.

#### Scenario: Mornings of a week
- **WHEN** the reader picks Last 7 days and 09:00 to 12:00
- **THEN** only screenshots taken from 09:00 up to 12:00 on each of those days are shown, and the count and viewer position count only them

#### Scenario: Times in the wrong order
- **WHEN** the reader sets From 14:00 and To 09:00
- **THEN** the tab says the end time must be after the start time and makes no new request

### Requirement: Grid tiles use the small image
<!-- source: backend `screenshot-access` "A tile can load a thumbnail" · concern #13 -->
Each grid tile SHALL show the item's `thumb_url` when it is not `null` and its `view_url` otherwise; the viewer MUST always show `view_url`, the full image.

#### Scenario: A screenshot with a thumbnail
- **WHEN** an item has a `thumb_url`
- **THEN** its tile loads `thumb_url` and the viewer loads `view_url`

#### Scenario: A screenshot without one
- **WHEN** an item's `thumb_url` is `null`
- **THEN** its tile loads `view_url`

### Requirement: Screenshots load a page at a time
<!-- source: backend `screenshot-access` · Plan-v3.5 §4.5 -->
The tab SHALL request one page and show a Load more control while `next_cursor` is not null, appending the next page below. The viewer SHALL open one image large with previous and next, its time, hostname and position against `total` ("3 of 240"); Next on the last loaded image MUST load the next page first and MUST be disabled on the range's last image.

#### Scenario: Stepping past a page
- **WHEN** the reader presses Next in the viewer on the last loaded image and more remain
- **THEN** the next page is loaded and the viewer shows its first image

#### Scenario: The range's last image
- **WHEN** the viewer shows the last image of the range
- **THEN** the Next control is disabled

### Requirement: The viewer opens an image full screen
<!-- source: A11 · Prototype "Employee → Screenshots" -->
The viewer SHALL offer a labelled Full screen control that shows the current `view_url` image filling the screen, scaled to fit without cropping. In full screen the left and right arrow keys MUST step to the previous and next image as the viewer's controls do, and Escape or the control MUST return to the viewer.

#### Scenario: Viewing full screen
- **WHEN** the reader presses Full screen in the viewer
- **THEN** the image fills the screen, uncropped
- **AND** the right arrow key shows the next image

#### Scenario: Leaving full screen
- **WHEN** the reader presses Escape in full screen
- **THEN** the viewer shows the same image at its normal size

### Requirement: Signed links are short-lived and never kept
<!-- source: A6 · backend `screenshot-access` -->
The app SHALL use each `view_url` and `thumb_url` only to display or download that image before its `expires_at`, MUST NOT cache, log or put it in the page address, and MUST refetch the loaded pages when a link has expired or an image fails to load.

#### Scenario: Viewer left open
- **WHEN** the viewer stays open for 6 minutes and the reader presses Next
- **THEN** the list is refetched and the next image loads with a fresh link
