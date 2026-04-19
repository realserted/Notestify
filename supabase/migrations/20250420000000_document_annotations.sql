-- ============================================================================
-- Document annotations (PDF highlight / stroke / sticky note)
-- ============================================================================
create table public.document_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  page integer not null check (page >= 1),
  kind text not null check (kind in ('highlight', 'note', 'stroke')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_document_annotations_doc on public.document_annotations(document_id, page);
create index idx_document_annotations_user on public.document_annotations(user_id);

create trigger trg_document_annotations_updated before update on public.document_annotations
  for each row execute function public.set_updated_at();

alter table public.document_annotations enable row level security;

create policy "Users manage own document annotations" on public.document_annotations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
