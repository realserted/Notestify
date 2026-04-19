-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.documents enable row level security;
alter table public.review_logs enable row level security;
alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

-- ============================================================================
-- Profiles
-- ============================================================================
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================================
-- Decks
-- ============================================================================
create policy "Users manage own decks" on public.decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Flashcards
-- ============================================================================
create policy "Users manage own flashcards" on public.flashcards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Quizzes
-- ============================================================================
create policy "Users manage own quizzes" on public.quizzes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users view questions of own quizzes" on public.quiz_questions
  for select using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );
create policy "Users manage questions of own quizzes" on public.quiz_questions
  for all using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );

-- ============================================================================
-- Quiz Attempts & Answers
-- ============================================================================
create policy "Users manage own quiz attempts" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own quiz answers" on public.quiz_answers
  for all using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );

-- ============================================================================
-- Documents, Review Logs, Tutor
-- ============================================================================
create policy "Users manage own documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own review logs" on public.review_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own tutor conversations" on public.tutor_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own tutor messages" on public.tutor_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Storage bucket for PDFs
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users upload own documents" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users read own documents" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users delete own documents" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
