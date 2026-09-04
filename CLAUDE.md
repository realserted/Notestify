# Notestify

AI study platform. Upload a PDF/DOCX/PPTX, get flashcards, quizzes and a tutor
that answers from your own material, with SM-2 spaced repetition.

Live at **notestify.com** (canonical host is `www.notestify.com`; the apex
308-redirects). A React Native companion app lives in a separate repo and talks
to the same Supabase project.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 3 ·
Supabase (Postgres + Auth + Storage) · Google Gemini · Resend · Cloudflare
Turnstile · Vercel.

## Commands

```bash
npm run dev          # next dev --turbo
npm run build        # next build
npm run typecheck    # tsc --noEmit
npx supabase db push # apply migrations (10 in supabase/migrations/)
```

Always run `typecheck` and `build` before committing. The build catches
Tailwind and metadata problems that `tsc` does not.

---

## Security invariants

These are the rules that matter. Breaking one is worse than any style issue.

**RLS is the security boundary, not application code.** Every table has
row-level security scoping rows to `auth.uid()`. Application checks are
defence in depth on top of it, never a replacement.

**Admin role lives in `app_metadata`, never `user_metadata`.** Users can write
to `user_metadata` themselves via `supabase.auth.updateUser()` — the register
page does exactly that for `full_name`. A role stored there is self-grantable.
See `src/lib/auth/admin.ts`.

**Use the caller's Supabase client, not the service role.** The only legitimate
use of `createAdminClient()` is `/api/account/delete`, which must remove an
`auth.users` row and storage objects. Everywhere else, going through the user's
own client means Postgres enforces ownership even if the route's logic is
wrong. Do not reach for the service role to "simplify" a query.

**Never expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client.**
No `NEXT_PUBLIC_` prefix, no passing them to components. All Gemini calls stay
in `src/lib/ai/`, reached only through `/api/ai/*`.

**Rate limiting is a single atomic statement.** `check_rate_limit` does
`INSERT … ON CONFLICT DO UPDATE … RETURNING` because serverless invocations run
concurrently and a read-then-write from JS races. It reads `auth.uid()`
internally so a caller cannot spend another user's budget. It fails closed.

**The middleware matcher and `PROTECTED_PREFIXES` must agree.** They live in
`src/middleware.ts` and `src/lib/supabase/middleware.ts`. A route in one but not
the other is either ungated or gated inconsistently. Add to both.

---

## Non-obvious constraints

**Middleware bails out after 3s and fails closed.** An unbounded
`supabase.auth.getUser()` in middleware once caused a production 504
(`MIDDLEWARE_INVOCATION_TIMEOUT`) on every route. Keep the timeout, and keep
the matcher narrow — do not add `/` to it.

**SM-2 lives in `src/lib/srs/sm2.ts` and is ported by the mobile app.** Two
implementations that disagree silently corrupt scheduling across devices. If it
changes, it changes in both places at once.

**Overlays opened from the sidebar need `createPortal`.** `DashboardShell` puts
a `transform` on the sidebar wrapper for the mobile drawer, which makes it the
containing block for `position: fixed` descendants. A fixed overlay rendered
inside it is laid out against the 244px sidebar, not the viewport. See
`FeedbackDialog`. `absolute` dropdowns are unaffected.

**Turnstile tokens are single-use.** Supabase consumes the token on submit, so
a failed sign-in must reset the widget — otherwise the retry fails on the
captcha rather than on the credentials, which looks like a broken login.

**Migrations must be applied before the code that needs them deploys.** The
rate limiter fails closed: without `check_rate_limit`, every AI route returns
429. Search and tutor context fail open. Know which you are shipping.

**`NEXT_PUBLIC_SITE_URL` feeds `sitemap.xml` and `robots.txt`.** A local build
produces a sitemap advertising `localhost`, which fails silently in production.
Verify after deploying.

**Dates must use local time, not UTC.** `dayKey()` in
`dashboard.service.ts` exists because `toISOString().slice(0,10)` mis-dated
late-night reviews and broke streaks for users away from UTC.

---

## Conventions

**Design system — "cold brew".** Espresso `#2E1A0E`, citrus `#F2A61E`, paper
`#FFFBF4`. 2px borders, hard offset shadows with zero blur (`shadow-pop*`),
pill buttons that press into their shadow on `:active`, `rounded-pop` (16px)
cards. No gradients, no blurred shadows — both break the direction.

**Legacy Tailwind aliases (`cream`, `coral`, `ink`) still exist** and point at
cold-brew values so un-migrated components keep rendering. **Do not use them in
new code.** They are pending removal once the remaining files migrate.

**Comments explain why, not what.** Prefer a sentence about the constraint or
the failure it prevents over restating the code.

**Legal pages state facts about behaviour.** `/privacy` and `/terms` name
specific subprocessors and describe what data goes where. If you change what
the app sends to a third party, update them in the same commit.

---

## Deliberately not built

Do not "helpfully" add these:

- **XP, levels, badges** — appeared in the design mockups as illustrative and
  were cut. Nothing in the schema backs them.
- **Impersonation or user management in `/admin`** — the admin panel reads
  feedback and nothing else, by design. The privacy policy tells users nobody
  but them can read their content.
- **Public sign-up pages in the sitemap** — `/login` and `/register` are
  excluded on purpose; they are dead ends in a search result.

## Known debt

- `cream`/`coral`/`ink` aliases still referenced by ~18 files
- Due badge in the sidebar refreshes on navigation, not after a session
- Tutor conversation titles are the raw first 50 characters of the first message
- Account export includes document rows but not the uploaded files
- `/api/*` routes authenticate by cookie only; the mobile app needs
  `Authorization: Bearer` support added before it can call them
