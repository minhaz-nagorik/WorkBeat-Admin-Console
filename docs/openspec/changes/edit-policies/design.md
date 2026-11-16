## Context

The prototype's Block list and Productivity rules pages are the layout. Plan v3.5 and the backend
`role-access` matrix change who may do what, and the notice moves from a download-only card to an
editor.

## Decisions

- **Managers read the block list and private sites.** Prototype "navigation" hides Block list from
  managers. Backend `role-access` and Plan-v3.5 §4.5 ("Manager (read rules)") let them read it;
  the plan wins, read-only.
- **IT Admins have no private-sites access.** Prototype "Block list" lets IT edit private sites.
  Backend `sensitive-domains` refuses `it_admin` on every route; the section is hidden for IT and
  the page still works.
- **Private sites are bare host names.** Prototype accepts `*.bank`. Backend `sensitive-domains`
  stores host names that cover subdomains and refuses wildcards; the form says so.
- **Url rules stay.** On 16 Nov 2026 the prototype was briefly made domain-only; it was restored
  because both agents enforce url rules (Windows browser policy, macOS redirect) per D39 and their
  `browser-url-blocking` specs. The page names the browsers that get domain blocking only.
- **The notice is edited, not only downloaded.** Prototype "Company settings" offers a template
  download. Plan-v3.5 §4.5 lists the monitoring notice under Policies and backend
  `collection-notice` stores it; the editor is added and the template kept for signed copies.

## Risks

- A url rule silently does nothing in Firefox on Mac and in Brave, Opera and Vivaldi on Windows.
  Mitigation: the add dialog and the rule's "Blocks" column say so (D39, Plan-v3.5 §4.3 "Gaps").
