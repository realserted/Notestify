# Notestify

AI-powered study companion with flashcards, quizzes, PDF/DOCX/PPTX processing, and a conversational AI tutor.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage) + Next.js Route Handlers
- **AI:** Google Gemini (`gemini-2.5-flash` / `gemini-2.5-flash-lite`)
- **Spaced Repetition:** SM-2 algorithm
- **File extraction:** `pdf-parse`, `mammoth` (DOCX), `officeparser` (PPTX)

## Features

- **Flashcards** — create/edit/delete, organize into decks, AI generation from text or uploaded files, SM-2 spaced repetition
- **Quizzes** — multiple choice, true/false, short answer, auto-grading, performance analytics, AI generation from files
- **Uploads** — PDF text extraction, AI summaries, document library
- **AI Tutor** — conversational chat powered by Gemini with persistent conversation history
- **Auth** — Supabase Auth (email/password + Google OAuth) with Row Level Security
- **Dashboard** — study streaks, weak topics, recent activity
- **Dark mode** — class-based theme toggle with FOUC prevention

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because of React 19 / Next 15 peer dep resolution.

### 2. Configure Supabase

Create a project at [supabase.com](https://supabase.com), then run the SQL migrations in order via the Supabase SQL editor:

- `supabase/migrations/20250101000000_init_schema.sql`
- `supabase/migrations/20250101000001_rls_policies.sql`

Create a Storage bucket named `documents` (private).

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

### 4. (Optional) Enable Google OAuth

Supabase dashboard → Authentication → Providers → enable Google and configure OAuth credentials.

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
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # login, register
│   ├── (dashboard)/         # protected routes + loading.tsx skeletons
│   └── api/                 # route handlers (AI, extract, quiz submit)
├── components/
│   ├── ui/                  # Button, Card, Input, Textarea, ProgressBar, Skeleton
│   ├── layout/              # Sidebar
│   ├── theme/               # ThemeProvider, ThemeToggle
│   ├── flashcards/          # deck & card components
│   ├── quizzes/             # quiz runner
│   ├── uploads/             # upload manager
│   └── tutor/               # chat UI
├── lib/
│   ├── supabase/            # client / server / admin / middleware
│   ├── ai/                  # Gemini integration + prompts
│   ├── srs/                 # SM-2 algorithm
│   └── extract/             # PDF/DOCX/PPTX extraction
├── services/                # business logic (deck, flashcard, quiz, dashboard)
├── types/                   # shared TypeScript types
└── utils/                   # cn helper
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in **Project Settings → Environment Variables**.
4. Set the install command to `npm install --legacy-peer-deps`.
5. Deploy.

After deploy, add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

## License

Private project — all rights reserved.
