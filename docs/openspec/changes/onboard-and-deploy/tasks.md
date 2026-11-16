> **Read first — this task list is not the requirement.**
> Capabilities: `setup-checklist · deployment-page · rollout-status`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show onboard-and-deploy`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. setup-checklist

- [ ] 1.1 Checklist card on Overview and Deployment from `GET /v1/company/setup`, hidden when done
- [ ] 1.2 Mark `download_downloader` and `copy_license_key` with `POST /v1/company/setup/steps`, non-blocking
- [ ] 1.3 Tests: new company shows four open steps; download and copy tick their steps; first heartbeat ticks the last step by polling; manager never sees the card

## 2. deployment-page

- [ ] 2.1 Licence key box: masked, Show, Copy, Hide, memory-only; seats box
- [ ] 2.2 Downloads from `GET /v1/downloads`, refetched on click; "Not available yet"
- [ ] 2.3 WorkBeat Setup steps, scripted form, standard-user warning; no MDM content
- [ ] 2.4 Uninstall section with token reveal and commands
- [ ] 2.5 Minimum agent version picker listing `GET /v1/agent-versions`, saved with `PUT /v1/deployment/min-agent-version`
- [ ] 2.6 Tests: only `company_admin` and `it_admin` reach the page; key and token never in storage, URL or logs; expired download link refetched; full seats warning; `422` on version

## 3. rollout-status

- [ ] 3.1 Rollout card from `GET /v1/rollout` with the eight rows and actions
- [ ] 3.2 Row click-through to filtered Devices; compact variant for IT Overview
- [ ] 3.3 Tests: counts per status and badge; click-through filter; manager gets no card and no call
