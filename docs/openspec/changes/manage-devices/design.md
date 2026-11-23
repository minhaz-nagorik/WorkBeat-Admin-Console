## Context

Prototype "Devices" has a Reassign button that moves a device to another employee in place, and its
release confirmation says "Its unsent data is deleted". It has no deactivate, no browser access,
no device detail, and its filter is chips.

## Decisions

### No reassign
Amends Prototype "Devices" Reassign and the Reassign dialog. Plan-v3.5 D48 and backend B20 fix a
binding's employee for its life; no API route moves a device. To give a device to someone else IT
releases it and runs WorkBeat Setup for the new employee. The plan wins (A1); the page explains
that path where Reassign was.

### Release wording follows D45
Amends the prototype's release text. The device stops collecting and blocking at once, uploads
what it already holds for up to 24 hours, then wipes and goes dormant (D38, D45). Saying "deleted"
would mislead admins about data that will still arrive.

### Release is the only device action
Backend B35 removed deactivate (product owner, 23 Nov 2026). Release is for a device leaving
monitoring, changing hands, or already uninstalled: uninstalling frees no seat, so the page says so.

### Filters become dropdowns
The prototype's status chips become status, issue (badge), OS and employee dropdowns (A8): the
plan adds statuses and badges, and four filters as chips would not fit.

## Risks / Trade-offs

- [An admin releases the wrong device] → inline confirmation names the hostname and employee;
  release cannot be undone from the portal, only by a new WorkBeat Setup.
