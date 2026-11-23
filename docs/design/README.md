# Design reference

[reference/workbeat-prototype.html](reference/workbeat-prototype.html) is the design reference:
layout, components, wording and the role switcher. Open it in a browser; the "Viewing as" menu
switches role. It runs on example data with a frozen clock.

**The prototype fixes how a page looks and reads, not what it does.** Where it contradicts Plan v3.5
or the backend specs, build the plan (A1). Known deviations:

| Prototype | Build instead | Source |
|---|---|---|
| Deployment step 2 offers "We use an MDM" with Intune, Jamf, Mosyle, Kandji, Group Policy and Fleet guides and files | Downloader only: download WorkBeat Setup, licence key, pick the employee, scripted install. No MDM guide or file | D40, Plan-v3.5 §5.1 |
| Devices page "Reassign" moves a device to another employee | No reassign. Release, then run WorkBeat Setup for the new employee | D48, B20 |
| Release text: "the device deletes its unsent data" | The device uploads what it holds for up to 24 hours, then wipes and goes dormant | D45 |
| Pause notice: "website blocking stays on" | Blocking is lifted during a pause; tamper detection stays on | D32, D33 |
| Pause "Until I resume" (no end) | Every pause has an end; "End now" cancels or shortens it | backend `monitoring-pauses` |
| Screenshots are one company-wide switch and any interval 10–480 min | Interval per employee: off, 10, 30 or 60 minutes, never faster than the tier. The tier is changed through billing | D37, B11, backend `monitoring-settings`, `subscription-sync` |
| No per-employee monitoring settings | Each employee: activity, app usage, window titles, website visits on/off and the screenshot interval | D37, Plan-v3.5 §4.5 |
| Devices table has no browser access, released or paused | Show browser access, paused and released; release is the only action (B35) | Plan-v3.5 §4.5, §5.9 |
| IT Admin edits private (sensitive) sites | Company Admin edits; Manager reads; IT Admin has no access | backend `sensitive-domains` |
| Managers don't see the block list | Managers read the block list, private sites and productivity rules | backend `role-access` |
| Employee "No device" status says "Assign one on the Devices page" | Install WorkBeat Setup on a computer for this person | D47 |
| Remove employee with devices: "Reassign or release" | Release them first | D48 |
| No onboarding checklist | Setup checklist for Admin and IT | Plan-v3.5 §4.5 |
| Alerts can't be resolved | Admin and IT mark an alert resolved | backend `alerts-feed` |
| No monitoring notice editor | Company Admin edits the notice text | Plan-v3.5 §4.5, backend `collection-notice` |
| Staff area has no staff team, grace period or release withdraw | Add them | D41, D36, backend `staff-accounts`, `agent-releases` |
| Edit employee hint: "Devices installed through an MDM link to employees by this email" | Devices are bound when IT picks the employee in WorkBeat Setup | D40, D47 |
