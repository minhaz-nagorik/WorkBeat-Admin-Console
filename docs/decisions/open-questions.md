# Open questions — what the pages need that the API does not give

Found while writing the specs (16 Nov 2026). Each needs a backend answer: add the route or field, or
confirm the page goes without. The specs never invent a route; where a gap exists the page leaves
the feature out or builds it from routes that exist, as noted. **Blocks** = a spec has a hole until
answered.

| # | Need | Page | Today in the spec | State |
|---|---|---|---|---|
| Q1 | Company `timezone` for Managers and IT Admins (only `GET /v1/company/settings` returns it, Company Admin only). Suggest adding it to `GET /v1/me` | All (A9) | Not resolved | ✅ answered, in API 16 Nov |
| Q2 | Live status per employee (active, idle, offline, paused, tamper) for the Employees list and employee header | Employees, employee page | Company Admin: derived from `GET /v1/devices`; Manager: no status | ✅ answered, in API 16 Nov |
| Q3 | Device list for a Manager's own team (`GET /v1/devices` refuses Managers) | Employee page | Managers see no device rows | ✅ answered, in API 16 Nov |
| Q4 | Status timeline (active, idle, offline, paused stretches in a day) and the "Right now" card | Employee page | Left out | dropped, not asked |
| Q5 | Per-employee summary for the Overview table (tracked, activity, split per person) in one call | Overview | Left out | dropped, not asked |
| Q6 | Per-day series from `usage-reports` for any range | Employee report | Built from up to 13 calendar calls | ✅ answered, in API 16 Nov |
| Q7 | Today's idle total and first activity for "today" stats | Employee page | Only timesheet first and last activity | dropped, not asked |
| Q8 | `released_at` and `deactivated_at` on `GET /v1/devices` | Devices | Status only, no date | ✅ answered, in API 16 Nov |
| Q9 | Definition of `health` on `GET /v1/devices/:id` | Device detail | Shown as returned | ✅ answered, in API 16 Nov |
| Q10 | List of live agent versions for company roles (min-version picker) | Deployment | Free `x.y.z` entry | ✅ answered, in API 16 Nov |
| Q11 | macOS uninstall command (Plan §5.4 gives Windows only) | Deployment | Windows only | Mac agent owner |
| Q12 | `manager_user_id` filter on `GET /v1/employees` | Team & roles | Filtered in the browser | ✅ answered, in API 16 Nov |
| Q13 | Seats on `GET /v1/rollout` | Deployment | Second call to `GET /v1/license` | dropped, not asked |
| Q14 | `created_by` name on `GET /v1/block-rules` | Block list | "Added by" column dropped | ✅ answered, in API 16 Nov |
| Q15 | Counts per type on `GET /v1/alerts` | Alerts | Dropdown without counts | ✅ answered, in API 16 Nov |
| Q16 | `employee_id` filter on `GET /v1/alerts` | Employee page | No alerts section | ✅ answered, in API 16 Nov |
| Q17 | Who gets alert emails, readable by Managers and IT Admins | Alerts subtitle | Line left out for them | dropped, not asked |
| Q18 | Staff "Check DNS now" route and `custom_domain_checked_at` on staff companies | Staff custom domains | Dropped | agreed, staff API not built |
| Q19 | Installer upload route for staff releases | Agent releases | Publish by `storage_path` of a file already in the bucket | agreed, staff API not built |
| Q20 | Staff set the global minimum version directly | Agent releases | Derived from `min_supported` only | ✅ answered: derived, read-only |
| Q21 | Resend a staff invitation | Staff team | Revoke and invite again | agreed, staff API not built |
| Q22 | Whether screenshots are on, for the notice template (now per employee) | Monitoring notice | Template says screenshots may be taken if turned on for the employee | dropped, not asked |
| Q23 | Staff MFA routes (enrol, challenge). Staff API and MFA are not built; the API owns sign-in now, so the MFA mechanism is undecided | Sign-in (staff) | Requirement written against "the API's staff MFA routes" | ✅ answered: TOTP built (B23); then removed 16 Nov 2026, staff sign in with password only |
| Q24 | Password reset ("Forgot password") route. The API has login, logout and change password only | Sign-in | No Forgot password link | ✅ answered: reset built (B24) |
| Q25 | The backend's own openspec still describes Supabase auth and lacks the 16 Nov additions (`POST /v1/auth/*`, `presence`, `health`, `group_by`, `counts`, `GET /v1/agent-versions`, …); they live only in code, `apps/api/README.md` and `docs/integration/admin-requests-response.md` | All | Specs cite "backend reply 16 Nov 2026" | ✅ answered: backend openspec updated, 14/14 valid |
| Q26 | `key_last4` on `GET /v1/staff/companies` | Staff licences | Last-four column and search left out until present | ✅ answered round 3 |
| Q27 | `expired_blocking_grace_days` on `GET /v1/staff/companies[/:id]` | Staff companies | Grace field not prefilled ("Default 30") | ✅ answered round 3 |
| Q28 | `resolved_by_name` on `GET /v1/alerts`, `created_by_name` on `GET /v1/employees/:id/pauses` | Alerts, pauses | Time shown, no name | ✅ answered round 3 |
| Q29 | State that `POST /v1/invitations/accept` returns no session for a `super_admin` | Sign-in (staff invitation) | App ignores any session and sends staff to sign-in | ✅ answered round 3 |
| Q30 | `q` search on `GET /v1/alerts` (cursor-paged, can't search in the browser) | Alerts | Search box hidden | ✅ answered round 3 |
| Q31 | Portal writes while `suspended` or `expired`: refused? status and code? | All forms | Forms enabled; generic message on refusal | ✅ answered round 3 |
| Q32 | Whole-list `GET /v1/employees` and `/v1/devices` at the largest company, or paging | Employees, Devices | Paged in the browser | ✅ answered round 3 |
| Q33 | `409` for staff invitation to an existing email or open invitation | Staff team | Company-invitation message | ✅ answered round 3 |
| Q34 | Staff licence PATCH: Starter/Growth → Enterprise allowed? | Staff companies | Enterprise only on Enterprise | ✅ answered round 3 |
| Q35 | Windows release `signature`: required, empty or null | Agent releases | Optional for Windows | ✅ answered round 3 |
| Q36 | Every "not specified" name in the backend's portal-api, staff-api and README (field names, request encodings, write responses) | All (typed client) | Names taken from `packages/shared` when published | ✅ answered round 3 |

Backend replies: `WorkBeat-Backend/docs/integration/admin-requests-response.md`, `admin-requests-2-response.md` and `admin-requests-3-response.md` (rounds 1–3). Still open: Q11 (macOS uninstall command, Mac agent owner). Agreed and specified but waiting for the staff API to be built: Q18, Q19, Q21, Q26, Q27. Every other question is answered (rounds 1–3).
