## Context

The prototype's staff pages cover companies, licences, custom domains and agent releases. Plan
v3.5 and the backend add a staff team, the expired grace period and release withdrawal, and
leave out two prototype controls.

## Decisions

- **No "Check DNS now".** Prototype "Custom domains" offers it; the backend will not add one
  (backend reply 16 Nov 2026): `/cron/domain-verify` runs every 5 minutes. The page shows
  `custom_domain_checked_at` instead.
- **Global minimum is read-only.** Prototype "Agent releases" has a dropdown to set it; the backend
  confirmed the derived rule is final (backend reply 16 Nov 2026).
- **Seat limit is changed only for Enterprise.** Prototype "Change plan" edits plan, seat limit and
  screenshot tier for any company. Backend `staff-companies` allows `PATCH .../license` with plan
  `enterprise` and a seat limit only; Starter and Growth follow Stripe. The dialog offers only that.
- **Releases upload through a signed URL.** Prototype "Publish release" uploads a file. The backend
  agreed `POST /v1/staff/agent-releases/upload-url` (backend reply 16 Nov 2026, staff API not built
  yet); the form uploads the file there, then publishes with the returned `storage_path`.
- **Staff team and grace period are added**, from backend `staff-accounts` and `staff-companies`.

## Risks

- The staff API, including upload URL, staff resend and `custom_domain_checked_at`, is agreed but
  not built (backend reply 16 Nov 2026). These pages wait for it.
