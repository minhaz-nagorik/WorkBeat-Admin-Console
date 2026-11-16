## Why

Every device is installed with WorkBeat Setup (the Downloader) and the company's licence key; there
is no MDM, no install token and no unassigned device (D40, D43, D47, Plan-v3.5 §5.1–5.3). IT needs
one page with the key, the installers, the steps and the uninstall token, a first-run checklist
(Plan-v3.5 §4.5 "Onboarding"), and the rollout dashboard that says which devices need attention
(Plan-v3.5 §5.9). The prototype still offers MDM guides and files; they are not built.

## What Changes

- **Setup checklist**: four steps from download to first device seen, for Admin and IT.
- **Deployment page**: licence key (masked, reveal, copy), seats, WorkBeat Setup and installer
  downloads, Downloader-only install steps and the scripted form, the standard-user warning, the
  uninstall token and the company's minimum agent version. No MDM option, guide or file.
- **Rollout status**: device counts per status and badge with what to do, each row opening the
  filtered device list.

## Capabilities

### New Capabilities

- `setup-checklist`: the onboarding checklist and how its steps are marked.
- `deployment-page`: key, seats, downloads, install steps, uninstall token, minimum version.
- `rollout-status`: the rollout dashboard of Plan-v3.5 §5.9.

### Modified Capabilities

None.

## Impact

- Consumes backend `configure-company` (`GET /v1/company/setup`, `POST /v1/company/setup/steps`),
  `license-key` (`GET /v1/license`, `POST /v1/license/reveal`,
  `POST /v1/license/uninstall-token/reveal`), `installer-downloads` (`GET /v1/downloads`),
  `agent-updates` (`PUT /v1/deployment/min-agent-version`), `agent-releases` (live versions through `GET /v1/agent-versions`) and
  `device-status` (`GET /v1/rollout`).
- Rollout rows link to `manage-devices` (`device-list` filters).
- Design reference: Prototype "Deployment", amended in `design.md`.
