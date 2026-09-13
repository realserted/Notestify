# Google Drive as an upload source

**Status:** design, not yet implemented
**Date:** 2026-09-13

Let a user pick a document from their Google Drive instead of downloading it
and re-uploading it. The picked file is fetched server-side, text is extracted
with the existing pipeline, and only the text is kept.

---

## Decisions

**Path A — Drive imports create a `documents` row.** A Drive import lands in
`/uploads` beside uploaded files, with `extracted_text` already populated and
`storage_path` null. The alternative (transient extraction feeding only deck
and quiz creation) was rejected because `documents.title` and
`documents.extracted_text` are both read by `/search`, so transient imports
would be permanently invisible there.

**Google Docs and Slides export is in v1.** Native Google formats cannot be
downloaded and must be exported. Without this the feature fails for the most
common file a student would pick.

**Deferred:** Google Sheets (exports to XLSX, which no parser here reads, and
spreadsheets make poor study material). Re-import to refresh stale text —
`drive_file_id` is stored so this stays possible, but nothing reads it in v1.

---

## Non-negotiable constraints

- `drive.file` scope only. Never `drive`, `drive.readonly`, or any restricted
  scope. This keeps the project out of restricted-scope verification and CASA
  entirely.
- Selection happens in the Google Picker. The app never browses or lists Drive.
- The file itself is never persisted. Bytes are fetched, extracted, discarded.
- Refresh tokens are encrypted at rest and scoped per user via RLS.
- No raw file content or Drive metadata reaches any log.

---

## What Drive forces on the design

These are properties of the Drive API, not choices.

**Native Google formats have no bytes.** `files.get?alt=media` returns 403 for
`application/vnd.google-apps.*`. They must go through `files.export`:

| Picked | Method | Export MIME | Parser |
|---|---|---|---|
| Google Doc | `files.export` | `...wordprocessingml.document` | mammoth |
| Google Slides | `files.export` | `...presentationml.presentation` | officeparser |
| Uploaded PDF/DOCX/PPTX | `files.get?alt=media` | — | existing |
| Google Sheet, anything else | rejected pre-flight | — | — |

`files.export` caps at 10 MB of exported content, below the existing 15 MB
limit, so it needs its own error message.

**Refresh tokens expire after 7 days while the OAuth consent screen is in
"Testing".** `drive.file` is non-sensitive so publishing needs no verification
review, but the screen must be moved to "In production" or every user silently
loses Drive access weekly. This does not reproduce in development.

**The refresh token is returned only on first consent**, and only with
`access_type=offline` AND `prompt=consent`. Omit either and the access token
dies in an hour with no way to renew.

**Supabase's `provider_token` cannot be used.** Supabase surfaces provider
tokens only in the session at sign-in, never persists or refreshes them.
Reusing the existing Google sign-in would force a Drive consent prompt on every
login, exclude email/password users entirely, and lose the token after the
first redirect. Drive gets its own OAuth flow, independent of Supabase Auth.

---

## Format dispatch

`extractTextFromFile` regexes the extension off the filename. Drive supplies an
authoritative `mimeType` and a `name` that frequently has no extension at all —
a Google Doc is just "Biology Notes".

Synthesizing a filename (`` `${name}.${ext}` ``) would work, but it fabricates
a filename to smuggle a format through a parameter that means something else,
and leaves `documents.title` either storing the fake name or diverging from
what was passed. Instead, split the format decision out of filename parsing:

```ts
export const extractText = async (buffer: Buffer, format: SupportedExtension) => { ... };

// Unchanged signature — existing filename-based callers keep working.
export const extractTextFromFile = async (buffer: Buffer, filename: string) => {
  const ext = getExtension(filename);
  if (!ext) throw new Error('Unsupported file type. Use .pdf, .docx, or .pptx');
  return extractText(buffer, ext);
};
```

One table then drives the whole Drive branch:

```ts
const DRIVE_FORMATS = {
  'application/vnd.google-apps.document':
    { exportAs: '...wordprocessingml.document', format: 'docx' },
  'application/vnd.google-apps.presentation':
    { exportAs: '...presentationml.presentation', format: 'pptx' },
  'application/pdf':                  { exportAs: null, format: 'pdf'  },
  '...wordprocessingml.document':     { exportAs: null, format: 'docx' },
  '...presentationml.presentation':   { exportAs: null, format: 'pptx' },
} as const;
```

It answers all three questions at once: supported or not (present in the map),
export or download (`exportAs`), and which parser (`format`). The property that
earns it: unsupported-MIME rejection stops being a separate check that can be
forgotten. Anything absent is rejected before a single Drive call — Sheets,
images, video, and legacy `.doc`/`.ppt` which the parsers cannot read anyway.

Trust `mimeType` from the Picker over anything in the filename.

Store the **original** Drive MIME in `documents.mime_type`, not the exported
type. It is truthful, records that the source was a Google Doc, and means a
Google Doc can never accidentally satisfy a PDF check.

---

## Flow

Connect, once, from Settings:

```
Settings --"Connect Google Drive"--> GET /api/drive/connect
                                       302 to Google
                                       scope=drive.file
                                       access_type=offline, prompt=consent
                                       state=<signed, session-bound>
                                          |
                                     GET /api/drive/callback
                                       verify state, exchange code,
                                       encrypt refresh_token, upsert row,
                                       redirect to /settings
```

Import, each time, from Uploads:

```
Uploads --"Pick from Drive"--> gapi picker (client)
                                 needs API key + App ID +
                                 access token from /api/drive/picker-token
                                          |
                            returns { id, name, mimeType }
                                          |
                               POST /api/drive/import
                                 auth -> rate limit -> decrypt refresh token
                                 -> access token -> export|download
                                 -> extractTextFromFile -> insert documents row
                                          |
                                 { id, title, text }
```

All three of `id`, `name` and `mimeType` must reach the server: `mimeType`
chooses export vs download, `name` feeds the extension-based parser.

---

## Schema

Two changes. Neither is written as a migration yet.

### New table

```sql
create table public.drive_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token_ciphertext bytea not null,
  iv       bytea not null,
  auth_tag bytea not null,
  scope      text not null,
  google_sub text,
  connected_at    timestamptz not null default now(),
  last_refresh_at timestamptz,
  last_refresh_error text
);

alter table public.drive_connections enable row level security;

create policy "Users manage own drive connection" on public.drive_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

`user_id` as primary key gives one connection per user and makes reconnect an
upsert. The policy matches the convention in `20250101000001_rls_policies.sql`.

Encryption is app-level AES-256-GCM via `node:crypto`, key in
`DRIVE_TOKEN_KEY`. Not pgcrypto: `pgp_sym_encrypt` takes the key as a SQL
literal, which puts it in Postgres query logs.

Accepted trade-off: Postgres RLS is row-level, not column-level, so a user can
read their own ciphertext from the browser with the anon key. It is useless
without `DRIVE_TOKEN_KEY`, which exists only in the Vercel environment. The
tighter alternative — no policies, service-role access only — was rejected
because it would create a second exception to the "use the caller's client"
invariant in CLAUDE.md for no meaningful gain.

### Altered table

```sql
alter table public.documents
  alter column storage_path drop not null,
  add column source text not null default 'upload'
    check (source in ('upload', 'drive')),
  add column drive_file_id text;
```

`storage_path` becomes null for Drive rows, and `types/database.ts` changes to
`storage_path: string | null`.

**The compiler will not help here.** The Supabase clients are created without a
`Database` generic, so `.select()` returns `any` and `doc.storage_path` is
untyped at every call site. Changing the interface produces zero errors. Every
null guard has to be written and tested by hand.

Wiring a generated `Database` type into `createServerClient<Database>` would
fix that class of bug permanently, but it is a separate change with a much
wider blast radius than this feature.

---

## Routes

| Route | Does |
|---|---|
| `GET /api/drive/connect` | Redirect to Google; random state in an httpOnly cookie |
| `GET /api/drive/callback` | Verify state, exchange code, encrypt + store |
| `GET /api/drive/connection` | Connection status for settings and the Picker button |
| `POST /api/drive/connection` | Mint a short-lived access token for the Picker |
| `DELETE /api/drive/connection` | Disconnect: delete the row |
| `POST /api/drive/import` | `{ fileId, name, mimeType }` to row + extracted text |

The Picker token is `POST` on the connection resource rather than a separate
`GET /api/drive/picker-token`. It mints a credential, and a `GET` that mints
credentials is reachable by a cross-site image tag or a prefetch.

CSRF on the consent flow is handled with a random value in an httpOnly,
SameSite=Lax cookie compared against `state` on return, cleared before use so a
replayed callback cannot reuse it. Without it, an attacker can have a victim
complete the callback carrying the *attacker's* authorization code, silently
linking the attacker's Drive to the victim's account.

Every route opens with `createClient()` + `getUser()` and returns 401 on null,
matching every existing route. `/api/*` sits outside the middleware matcher, so
routes authenticate themselves.

`/api/drive/import` adds a `drive` entry to `LIMITS` in `lib/rate-limit.ts`.
Drive quota is a shared, exhaustible resource like Gemini spend.

Use `fetch` against the three REST endpoints rather than adding `googleapis`,
which is a very large dependency for three calls.

---

## Token refresh and failure

Refresh on every import. Do not cache access tokens.

When refresh returns `invalid_grant` — revoked access, password change, or the
7-day Testing expiry — delete the row and return a distinct status the UI
renders as "Reconnect Google Drive". A dead token that lingers produces a
confusing error on every subsequent attempt.

Record `last_refresh_error` for diagnosis. Never record the token.

| Failure | Handling |
|---|---|
| Access revoked | `invalid_grant` then delete row, 409 "reconnect" |
| File deleted between pick and fetch | Drive 404, "That file is no longer available" |
| Unsupported MIME | Reject before any Drive call |
| Too large | Check `Content-Length` before buffering; separate message for the 10 MB export cap |
| Drive 403 rate limit / 429 | One retry with backoff, then surface plainly |
| Picker token expired mid-session | Re-fetch and retry once |

---

## Logging

Drive routes need a sanitiser. Existing routes do `console.error('[extract]',
error)`; Google API error objects carry the request URL containing the file ID,
and often a response body with file metadata. Log `err.code` and a static
message only.

---

## Testing

- Unauthenticated `POST /api/drive/import` returns 401, matching the pattern in
  `e2e/access-control.spec.ts`
- **Authenticated user A posts a `fileId` they never picked.** Google enforces
  this — `drive.file` grants are per (user, app, file) — but that is the second
  layer, not the first. Record picked file IDs in a short-lived server-side
  session at Picker time and reject unknown IDs, so Google's enforcement is not
  the only control.
- MIME routing: Google Doc exports, uploaded PDF downloads, Sheet rejected
  pre-flight
- `invalid_grant` deletes the row, returns 409, and leaks no token in any log
- Oversized file rejected without buffering
- A Drive-sourced PDF does not render "Annotate" in `/uploads`
- No file ID, filename, or token appears in any log line

---

## Conflicts with existing code

**`storage_path` has three consumers**, two of which break on null. None are
caught by tsc — see the note under the schema section:

- `api/documents/[id]/url/route.ts` — `createSignedUrl(doc.storage_path)`
- `api/pdf/extract/route.ts` — `.download(doc.storage_path)`
- `types/database.ts` — the type itself

**One trap tsc will not catch.** `UploadManager.tsx:167` shows "Annotate" for
any document whose `mime_type` includes `pdf`. A Drive-sourced PDF matches,
links to `/documents/[id]`, and fails signing a null path.

The predicate is wrong rather than merely incomplete: the question is not "is
this a PDF" but "do we still have the original file to render", and
`storage_path` *is* that question. MIME type was a proxy that worked only while
every document had a file. The condition becomes
`doc.storage_path && includes('pdf')`.

Fix the route as well as the button. `/api/documents/[id]/url` must return 404
when `storage_path` is null, so forgetting the UI guard degrades to a dead link
rather than a 500 from inside the Supabase client. 404 rather than 400 or 409,
matching how that route already answers for a document you do not own, so it
reveals nothing about which documents exist.

The trap exists for exactly one case: a PDF stored in Drive. Its MIME genuinely
is `application/pdf` and it genuinely has no `storage_path`.

**Three disagreeing size limits.** `UploadManager` says 25 MB, `/api/extract`
enforces 15 MB, Drive export caps at 10 MB. Unify into one shared constant
rather than adding a fourth.

**`extractTextFromFile` keys off the filename extension, not MIME type.** Drive
supplies a MIME type and a name that may lack a usable extension. Map MIME to
extension at import, or add a variant taking an explicit format.

**Client-side inserts.** `/uploads` inserts `documents` rows from the browser;
Drive import must insert server-side. Two conventions in one table, worth a
comment explaining why.

**`maxDuration = 60` on extraction routes.** Drive import adds a network fetch
before extraction. A large PPTX over a slow Drive fetch could approach it.

---

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | server | Separate OAuth client from Supabase Auth |
| `GOOGLE_DRIVE_CLIENT_SECRET` | server | Never exposed |
| `DRIVE_TOKEN_KEY` | server | 32 bytes, AES-256-GCM |
| `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` | client | Picker requires it client-side |
| `NEXT_PUBLIC_GOOGLE_APP_ID` | client | GCP project number |

The two `NEXT_PUBLIC_` values are safe to expose — the Picker API key is
restricted by HTTP referrer, and the App ID is not a secret. The client secret
and token key must never gain that prefix.

---

## Out of scope

- Google Sheets
- Re-import / refresh of stale text
- Browsing or listing Drive
- Persisting the original file
- Exporting back to Drive
