## Context

Prototype "Deployment" step 2 offers "We use an MDM" with Intune, Jamf, Mosyle, Kandji, Group
Policy and Fleet guides and downloadable `.intunewin`, `.admx` and `.mobileconfig` files, beside
"No MDM: install by hand". Its rollout card has four rows.

## Decisions

### No MDM path
Amends Prototype "Deployment" step 2. Plan v3.1 dropped MDM (D40, Plan-v3.5 §4.7, §5.1): WorkBeat
ships no profiles, ADMX templates or guides and the agent reads no MDM settings. The plan wins over
the prototype (A1). Step 2 becomes the Downloader steps only, keeping the prototype's wording for
"No MDM: install by hand" and its scripted-install disclosure, without the method chooser.

### Installers come from `GET /v1/downloads`
The prototype's file list (`WorkBeat.msi`, `WorkBeat.pkg`) is replaced by what the API returns:
WorkBeat Setup per platform, plus the agent MSI per architecture and the universal pkg (W31,
backend `installer-downloads`). Links are signed and short-lived, so they are fetched on click,
never rendered into the page ahead of time (A6).

### The rollout card follows Plan §5.9
Amends the prototype's four rows. Plan-v3.5 §5.9 adds Browser access pending, Tamper, Paused and
Released; backend `device-status` returns them as statuses and badges, so the card shows each.

### Uninstall token is on this page
The prototype has none. Plan-v3.5 §5.3 and D40 make the token necessary for every uninstall, and
backend `license-key` lets Admin and IT reveal it, so it sits under the licence key.

## Risks / Trade-offs

- [No silent install, local admins can remove the agent] → the page warns to make employees
  standard users (Plan-v3.5 §5.1); offline and tamper alerts are the backstop.
