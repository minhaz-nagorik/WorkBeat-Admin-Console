# BUILD-ORDER.md — the plan

**Everything to be built, in the order it gets built.** Work the changes in order; within a change,
work `tasks.md` top to bottom. Open backend gaps: [decisions/open-questions.md](decisions/open-questions.md).

```
Phase 0   Foundation            docs + 11 OpenSpec changes, --strict clean
Phase 1   The eleven changes    106 of 157 tasks: every page built; automated tests and error reporting open
```

## Phase 0

| # | Step | Status |
|---|---|---|
| 0.1 | `docs/`: rules, decisions A1–A14, design reference and deviations | ✅ |
| 0.2 | Ten OpenSpec changes: 33 capability deltas, 156 requirements, `--strict` clean | ✅ |
| 0.3 | `git init`, API base URL per environment (`API_BASE_URL`, see `.env.example`); Vercel project ⬜ | 🟡 |
| 0.4 | Backend answers to the gaps in [open-questions.md](decisions/open-questions.md) marked **blocks** (rounds 1 and 2, 16 Nov 2026) | ✅ |

## Phase 1 — the eleven changes

| # | Change | Deltas | Reqs | Depends on | Parallel-safe with |
|---|---|---|---|---|---|
| 1 | [establish-admin-foundation](openspec/changes/establish-admin-foundation/) | 3 | 16 | Phase 0 | — |
| 2 | [sign-in-and-team](openspec/changes/sign-in-and-team/) | 2 | 19 | 1 | — |
| 3 | [onboard-and-deploy](openspec/changes/onboard-and-deploy/) | 3 | 13 | 2 | 4 |
| 4 | [manage-devices](openspec/changes/manage-devices/) | 3 | 15 | 2 | 3 |
| 5 | [manage-employees](openspec/changes/manage-employees/) | 4 | 16 | 2 | 7, 8 |
| 6 | [view-reports](openspec/changes/view-reports/) | 4 | 19 | 4, 5 | 9 |
| 7 | [handle-alerts](openspec/changes/handle-alerts/) | 2 | 10 | 2 | 5, 8 |
| 8 | [edit-policies](openspec/changes/edit-policies/) | 4 | 17 | 2 | 5, 7 |
| 9 | [configure-company](openspec/changes/configure-company/) | 3 | 12 | 2 | 6 |
| 10 | [administer-platform](openspec/changes/administer-platform/) | 5 | 19 | 2 | any company change |
| 11 | [approve-it-admin-changes](openspec/changes/approve-it-admin-changes/) | 2 | 11 | 2 | — |

**Gate to pilot** (Plan-v3.5 §7 phase 3): end-to-end purchase → licence key → (simulated) device
appears; a staff account reads no employee data.
