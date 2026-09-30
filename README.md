# Notestify

**Live at [www.notestify.com](https://www.notestify.com)**

Notestify is a free AI study platform. Upload a PDF, DOCX or PPTX — or import a document
straight from Google Drive — and it turns the text into flashcards, quizzes and summaries,
then schedules reviews using SM-2 spaced repetition. An AI tutor answers questions from
your own material rather than from general knowledge.

Built solo by [Lester Lawrence Sanchez](https://github.com/realserted).

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage) + Next.js Route Handlers
- **AI:** Google Gemini (`gemini-2.5-flash`)
- **Spaced Repetition:** SM-2 algorithm
- **File extraction:** `pdf-parse`, `mammoth` (DOCX), `officeparser` (PPTX)
- **Google Drive:** Picker API with the `drive.file` scope only
- **Email:** Resend, on a Vercel Cron schedule
- **Bot protection:** Cloudflare Turnstile

## Features

- **Flashcards** — create/edit/delete, organize into decks, AI generation from text or uploaded files, SM-2 spaced repetition
- **Quizzes** — multiple choice, true/false, short answer, auto-grading, performance analytics, AI generation from files
- **Uploads** — PDF/DOCX/PPTX text extraction, AI summaries, document library, PDF annotation
- **Google Drive import** — pick a file in Google's own Picker. Uses the `drive.file` scope only, so access is limited to files the user explicitly selects; Notestify cannot browse or list a Drive. Google Docs and Slides are exported before extraction; the original file is never stored
- **AI Tutor** — conversational chat powered by Gemini, grounded in a deck, note or document you attach, with persistent history
- **Auth** — Supabase Auth (email/password + Google OAuth with PKCE) and Cloudflare Turnstile
- **Dashboard** — study streaks, due counts, recent activity
- **Search** — across decks, notes, documents and quizzes
- **Daily reminders** — optional email, sent only on days you have cards due
- **Account control** — self-service data export and account deletion
- **Dark mode** — class-based theme toggle with FOUC prevention

## Security

The guiding rule is that the database enforces ownership, not the application — so a
mistake in a route handler cannot become a data leak.

### Authorization

**Row-level security is the boundary, not application code.** All 17 tables scope rows to
`auth.uid()` in Postgres. Route handlers check ownership too, but as defence in depth
rather than as the mechanism: if a handler forgets, Postgres still refuses. The service
role key — which bypasses RLS — is used in exactly one place, account deletion, because
removing an `auth.users` row is the one thing a user's own client genuinely cannot do.
→ [`rls_policies.sql`](supabase/migrations/20250101000001_rls_policies.sql) ·
[`account/delete`](src/app/api/account/delete/route.ts)

**The admin role lives in `app_metadata`, never `user_metadata`.** Users can write their
own `user_metadata` through `supabase.auth.updateUser()` — the register page does exactly
that to set a display name. A role stored there would be self-grantable, so checking it
would be worse than having no check at all.
→ [`auth/admin.ts`](src/lib/auth/admin.ts)

### Failing safely under concurrency

**Rate limiting is a single atomic statement.** `INSERT … ON CONFLICT DO UPDATE …
RETURNING` inside a Postgres function, because serverless invocations run concurrently and
a read-then-write from JavaScript races — two requests both read "9 of 10 used" and both
proceed. The function reads `auth.uid()` itself, so a caller cannot spend another user's
budget by editing a request body. It fails closed: if the check errors, the request is
refused.
→ [`rate-limit.ts`](src/lib/rate-limit.ts) ·
[`rate_limits.sql`](supabase/migrations/20260829120000_rate_limits.sql)

**Auth in middleware is bounded and fails closed.** An unbounded `getUser()` in middleware
once returned `MIDDLEWARE_INVOCATION_TIMEOUT` on every route in production. It now races a
3-second timeout, and a timeout is treated as signed out rather than signed in — the safe
direction when you cannot tell.
→ [`supabase/middleware.ts`](src/lib/supabase/middleware.ts)

### Third-party access

**Google Drive uses the `drive.file` scope and nothing else.** Files are chosen in Google's
own Picker, and Google grants access to exactly those files — the app cannot browse, list
or search a Drive even if it tried. This was chosen for what it avoids as much as what it
allows: `drive` and `drive.readonly` are restricted scopes, which would pull the project
into Google's restricted-scope verification and an annual CASA security assessment. The
narrower scope removes that requirement entirely rather than satisfying it.
→ [`drive/connect`](src/app/api/drive/connect/route.ts) ·
[`drive/formats.ts`](src/lib/drive/formats.ts)

**A dead token and a forbidden file are different failures.** Google answers `403` both for
an expired grant and for a file the user never picked. Only the first deletes the stored
connection; the second returns `404` and leaves it alone. Collapsing the two would have let
anyone disconnect another user's Drive simply by submitting a file ID that was not theirs.
→ [`drive/api.ts`](src/lib/drive/api.ts) ·
[test](src/lib/drive/api.test.ts)

**Drive refresh tokens are encrypted before they reach Postgres.** AES-256-GCM rather than
CBC, because GCM is authenticated: a tampered row fails loudly on decrypt instead of
yielding rubbish that then gets sent to Google as a credential. RLS scopes the row to its
owner; the encryption makes the row useless to anyone who obtains it anyway.
→ [`drive/crypto.ts`](src/lib/drive/crypto.ts)

## What the tests caught

Two bugs that shipped past code review and were found by tests, both worth knowing about
because neither announced itself.

**A prototype-chain lookup reachable from a request body.** `resolveDriveFormat('constructor')`
returned `Object.prototype.constructor` — a truthy function — instead of `null`, because a
plain object index walks the prototype chain. Since the MIME type comes from the client,
that value passed the "is this supported?" gate and would have reached the extractor with
an undefined format. Fixed with `Object.hasOwn`. The happy-path tests passed before and
after; it surfaced only from deliberately testing what a client fully controls.
→ [`formats.ts`](src/lib/drive/formats.ts)

**A Gemini call that reported success while returning truncated output.** HTTP 200, no
error, valid JSON envelope — but `finishReason` was `MAX_TOKENS` and the answer stopped
mid-string. Gemini 2.5's thinking tokens had consumed 191 of a 200-token budget, leaving 5
tokens of actual output. The fix was disabling thinking for a classification task rather
than raising the ceiling, which would have hidden the cause and paid for reasoning
indefinitely to sort text into three buckets. The response parser now checks
`finishReason` before trusting the text.
→ [`ai/gemini.ts`](src/lib/ai/gemini.ts)

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because of React 19 / Next 16 peer dep resolution.

### 2. Configure Supabase

Create a project at [supabase.com](https://supabase.com), then apply every migration in `supabase/migrations/`:

```bash
npx supabase db push
```

Apply all of them rather than picking individually — the filenames encode order, and the rate limiter fails closed, so a missing `check_rate_limit` makes every AI route return 429.

Create a Storage bucket named `documents` (private).

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Required:

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_SITE_URL` | Your canonical origin — feeds `sitemap.xml` and OAuth redirects |

Optional — each feature hides itself when its variables are unset:

| Variable | For |
| --- | --- |
| `GOOGLE_DRIVE_CLIENT_ID` / `_SECRET` | Drive import. A separate OAuth client from Supabase's Google sign-in, requesting the `drive.file` scope only |
| `DRIVE_TOKEN_KEY` | Encrypts Drive refresh tokens. 32 bytes, base64 |
| `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` | The Picker. Restrict by HTTP referrer |
| `NEXT_PUBLIC_GOOGLE_APP_ID` | Your Google Cloud project **number** |
| `RESEND_API_KEY` / `REMINDER_FROM_EMAIL` | Daily reminder emails |
| `CRON_SECRET` | Bearer token for `/api/cron/reminders`. Fails closed — unset returns 503 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile. The secret key goes in Supabase, not here |

See `.env.local.example` for the full annotated list.

### 4. (Optional) Enable Google OAuth

Supabase dashboard → Authentication → Providers → enable Google and configure OAuth credentials.

This is sign-in only. Drive import uses its own OAuth client and its own consent flow — Supabase surfaces provider tokens only at sign-in and never refreshes them, so it cannot be reused for API access.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # development server (Turbopack)
npm run build     # production build
npm run start     # run production build
npm run lint      # ESLint
npm run typecheck # TypeScript check
npm test          # Vitest unit tests
npm run test:e2e  # Playwright — builds and serves the app first
npm run verify    # typecheck + unit + build + e2e, in that order
```

`verify` is what a commit should pass. The build catches Tailwind and metadata problems
`tsc` does not, and the e2e suite catches route-gating mistakes that neither does.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # login, register
│   ├── (dashboard)/         # protected routes + loading.tsx skeletons
│   ├── api/                 # route handlers (AI, extract, drive, cron, account)
│   ├── about/ faq/          # public pages — faq/ carries the FAQPage markup
│   ├── privacy/ terms/
│   └── sitemap.ts robots.ts # both read NEXT_PUBLIC_SITE_URL
├── components/
│   ├── ui/                  # Button, Card, Input, Textarea, ProgressBar, Skeleton
│   ├── layout/ theme/       # Sidebar, ThemeProvider, ThemeToggle
│   ├── flashcards/ quizzes/ # deck & card components, quiz runner
│   ├── uploads/ drive/      # upload manager, Drive picker + connection card
│   └── tutor/ feedback/     # chat UI, feedback dialog
├── lib/
│   ├── supabase/            # client / server / admin / middleware
│   ├── ai/                  # Gemini integration + prompts + safety settings
│   ├── srs/                 # SM-2 algorithm — also ported by the mobile app
│   ├── extract/             # PDF/DOCX/PPTX extraction
│   ├── drive/               # OAuth, token encryption, MIME routing
│   ├── email/               # Resend templates
│   └── rate-limit.ts        # wraps the atomic Postgres function
├── services/                # business logic (deck, flashcard, quiz, dashboard)
├── types/                   # shared TypeScript types
└── utils/                   # cn helper

e2e/                         # Playwright — access control and SEO
docs/specs/                  # design notes written before the code
supabase/migrations/         # apply with `npx supabase db push`
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in **Project Settings → Environment Variables**.
4. Set the install command to `npm install --legacy-peer-deps`.
5. Deploy.

After deploy, add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

Two things that only bite in production:

- **Apply migrations before the deploy that needs them.** The rate limiter fails closed, so shipping the code first makes every AI route return 429 until the migration lands.
- **Set `NEXT_PUBLIC_*` variables before the build, not after.** They are inlined at build time, so a deploy that predates them ships an app with them missing and no error to show for it.

## License

Private project — all rights reserved.
