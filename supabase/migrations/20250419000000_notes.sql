-- ============================================================================
-- Notebooks
-- ============================================================================
create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cover_color text not null default 'coral' check (cover_color in ('coral', 'cream', 'ink', 'sage', 'sky', 'plum', 'butter')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notebooks_user_id on public.notebooks(user_id);

-- ============================================================================
-- Notes (pages within a notebook)
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled page',
  paper_style text not null default 'ruled' check (paper_style in ('blank', 'ruled', 'grid', 'dotted', 'cornell')),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  strokes jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_notebook_id on public.notes(notebook_id);
create index idx_notes_user_id on public.notes(user_id);

-- ============================================================================
-- Triggers
-- ============================================================================
create trigger trg_notebooks_updated before update on public.notebooks
  for each row execute function public.set_updated_at();
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.notebooks enable row level security;
alter table public.notes enable row level security;

create policy "Users manage own notebooks" on public.notebooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
