-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Profiles (extends auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Decks
-- ============================================================================
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_decks_user_id on public.decks(user_id);

-- ============================================================================
-- Flashcards (with SM-2 spaced repetition fields)
-- ============================================================================
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  -- SM-2 algorithm fields
  ease_factor numeric(4,2) not null default 2.50,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_date timestamptz not null default now(),
  last_reviewed_at timestamptz,
  -- Metadata
  source text default 'manual' check (source in ('manual', 'ai', 'pdf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_flashcards_deck_id on public.flashcards(deck_id);
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_due_date on public.flashcards(user_id, due_date);

-- ============================================================================
-- Quizzes
-- ============================================================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid references public.decks(id) on delete set null,
  title text not null,
  description text,
  source text default 'manual' check (source in ('manual', 'ai', 'deck', 'pdf')),
  created_at timestamptz not null default now()
);

create index idx_quizzes_user_id on public.quizzes(user_id);

-- ============================================================================
-- Quiz Questions
-- ============================================================================
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'short_answer')),
  options jsonb,
  correct_answer text not null,
  explanation text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_quiz_questions_quiz_id on public.quiz_questions(quiz_id);

-- ============================================================================
-- Quiz Attempts
-- ============================================================================
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score numeric(5,2) not null default 0,
  total_questions integer not null,
  correct_count integer not null default 0,
  time_taken_seconds integer,
  completed_at timestamptz not null default now()
);

create index idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index idx_quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);

-- ============================================================================
-- Quiz Answers
-- ============================================================================
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_answer text,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_quiz_answers_attempt_id on public.quiz_answers(attempt_id);

-- ============================================================================
-- Documents (PDFs)
-- ============================================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  storage_path text not null,
  file_size bigint,
  mime_type text,
  extracted_text text,
  summary text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_user_id on public.documents(user_id);

-- ============================================================================
-- Review Logs
-- ============================================================================
create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  quality integer not null check (quality between 0 and 5),
  reviewed_at timestamptz not null default now()
);

create index idx_review_logs_user_date on public.review_logs(user_id, reviewed_at desc);

-- ============================================================================
-- Tutor Conversations
-- ============================================================================
create table public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tutor_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_tutor_messages_conversation_id on public.tutor_messages(conversation_id);

-- ============================================================================
-- Triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_decks_updated before update on public.decks
  for each row execute function public.set_updated_at();
create trigger trg_flashcards_updated before update on public.flashcards
  for each row execute function public.set_updated_at();
create trigger trg_documents_updated before update on public.documents
  for each row execute function public.set_updated_at();
create trigger trg_tutor_conversations_updated before update on public.tutor_conversations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-create profile on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
