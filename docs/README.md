# WorkBeat Admin

The one web platform of WorkBeat (D41): company pages for Company Admins, Managers and IT Admins,
and the staff area for WorkBeat staff, behind one sign-in. The UI follows the role; the API enforces
it.

**Next.js 14+** (App Router) · TypeScript · Tailwind · shadcn/ui · sign-in through the API · Vercel

> **Web only.** The NestJS API, database and jobs (WorkBeat-Backend), the agents and the Downloader
> live in their own repositories. Their behaviour is a consumed contract: this app calls the API
> with the signed-in user's token and nothing else (A2).

---

## Start here

| Read | For |
|---|---|
| **[../CLAUDE.md](../CLAUDE.md)** | The ten rules. **Read it first** |
| [decisions/admin-decisions.md](decisions/admin-decisions.md) | **A1–A12**, this repository's rulings |
| [design/README.md](design/README.md) | The prototype, and where the plan overrides it |
| [BUILD-ORDER.md](BUILD-ORDER.md) | What to build next |
| [decisions/open-questions.md](decisions/open-questions.md) | What the pages need that the API does not give yet |
| WorkBeat Plan v3.5 (`../../WorkBeat Plan v3.5.docx`) | The source of truth. §4.5 company pages, §4.6 staff area, §5.9 rollout |
| WorkBeat-Backend `docs/openspec/` | The API each page calls: routes, fields, roles, codes |

## Requirements

```bash
cd docs                                  # the CLI resolves openspec/ from here
openspec list --changes
openspec show establish-admin-foundation
openspec validate --all --strict         # the merge gate
```
