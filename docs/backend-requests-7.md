# Backend requests from WorkBeat Admin — round 7: a download link for each screenshot

**From:** WorkBeat Admin (the web console) · **To:** WorkBeat-Backend · **Date:** 17 November 2026
**Follows:** round 6, answered.

## The problem

Screenshots now live in Cloudflare R2, so `view_url` on `GET /v1/employees/:id/screenshots` items
is an R2 presigned link on R2's host. A browser shows it in `<img>`, but it **won't save it as a
file**: a cross-host link ignores the `download` file name, and fetching it to save from memory
needs CORS on the bucket for the console's origin. The product owner wants every screenshot
downloadable, always.

## Ask

Add `download_url` to every screenshot item, next to `view_url`:

| field | type | notes |
|---|---|---|
| download_url | string | same object and expiry as `view_url` (5 minutes), signed with `response-content-disposition=attachment; filename="<hostname>-<YYYY-MM-DD>-<HHMM>.jpg"` (company time zone) and `response-content-type=image/jpeg` |

- **R2:** both `response-*` parameters are part of the SigV4 presigned query, so R2 serves the file
  as a download with that name. No CORS change needed.
- **Local disk** (no R2 configured): `/v1/storage/screenshots/…?exp&sig&download=1`, with `download`
  covered by the signature, answers with `Content-Disposition: attachment; filename="…"`.
- Same access rules as `view_url` (`screenshot-access`); never logged.

The console already uses `download_url` when present; until then it fetches `view_url` (works for
local disk and for a bucket with CORS) or opens the image in a new tab.

**Optional, instead or as well:** allow `GET` from the console's origins in the R2 bucket's CORS
policy, so the console can fetch and save the file itself.

**Reply with:** the commit, and whether `download_url` is on every item.
