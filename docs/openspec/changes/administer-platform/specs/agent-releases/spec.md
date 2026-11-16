## Purpose

The Agent releases page: the signed installers and Downloaders customers receive, the minimum
version each platform requires, and the publish and withdraw actions.

## ADDED Requirements

### Requirement: Releases are listed newest first
<!-- source: Plan-v3.5 §4.6 · backend `agent-releases` · Prototype "Agent releases" -->
The page SHALL call `GET /v1/staff/agent-releases` and list each release with product (Agent or WorkBeat Setup), platform, architecture, `version`, `min_supported`, release date and state ("Current", "Supported" or "Withdrawn" from `withdrawn_at`), newest first, with search and pager.

#### Scenario: A withdrawn release
- **WHEN** a release has `withdrawn_at`
- **THEN** its row shows Withdrawn and no Withdraw control

### Requirement: Staff publish a release
<!-- source: W31 · D28 · backend `agent-releases` · upload URL (agreed, staff API not built) -->
Publish release SHALL take `product`, `platform`, `arch` (macOS `universal`; Windows `x64` or `arm64`), `version`, `min_supported` (`x.y.z`, not above `version`), the installer file and `release_notes`; get an upload URL and `storage_path` from `POST /v1/staff/agent-releases/upload-url`, upload the file to it, then send `POST /v1/staff/agent-releases` with `storage_path`, `sha256`, `size_bytes` and `signature` (required for macOS; left out for Windows, whose MSIs are unsigned, W35). `409 CONFLICT` MUST read "This version is already published for that platform".

#### Scenario: A macOS release with x64
- **WHEN** staff pick macOS
- **THEN** the architecture is fixed to Universal

#### Scenario: Minimum above version
- **WHEN** staff enter version 1.0.5 and minimum 1.0.6
- **THEN** the form refuses it beside the minimum field and sends nothing

#### Scenario: The upload fails
- **WHEN** the file upload to the signed URL fails
- **THEN** no publish call is sent and the form offers to retry the upload

### Requirement: Staff withdraw a release
<!-- source: backend `agent-releases` · A7 -->
Withdraw SHALL confirm that the release will no longer be offered for download or update, then call `POST /v1/staff/agent-releases/:id/withdraw`.

#### Scenario: Withdrawing a bad build
- **WHEN** staff confirm Withdraw on 1.0.5
- **THEN** its row shows Withdrawn

### Requirement: The page states the effective minimum per platform
<!-- source: D40 · backend `agent-releases` -->
Above the list the page SHALL show, read-only, per platform, the global minimum version derived as the backend defines it (the greatest `min_supported` of the newest live agent release), with no control to set it, and say that devices below it are flagged outdated and update themselves.

#### Scenario: Windows minimum
- **WHEN** the newest live Windows agent release has `min_supported` 1.0.3
- **THEN** the page shows Windows minimum 1.0.3
