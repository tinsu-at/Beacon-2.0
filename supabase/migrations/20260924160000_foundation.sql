-- Beacon 2.0 database foundation
-- Vector/RAG tables are intentionally deferred until the core data model is stable.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'en',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'paused', 'archived')),
  priority smallint not null default 3
    check (priority between 1 and 5),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  memory_type text not null default 'fact',
  source_type text not null default 'user',
  importance smallint not null default 3
    check (importance between 1 and 5),
  user_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_goal_id_idx on public.projects(goal_id);
create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversation_messages_conversation_id_idx
  on public.conversation_messages(conversation_id);
create index if not exists conversation_messages_user_id_idx
  on public.conversation_messages(user_id);
create index if not exists memories_user_id_idx on public.memories(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists preferences_set_updated_at on public.preferences;
create trigger preferences_set_updated_at before update on public.preferences
for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at before update on public.journal_entries
for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at before update on public.memories
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));

  insert into public.preferences (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.memories enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
using (auth.uid() is not null and auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated
with check (auth.uid() is not null and auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
using (auth.uid() is not null and auth.uid() = id)
with check (auth.uid() is not null and auth.uid() = id);

drop policy if exists preferences_select_own on public.preferences;
create policy preferences_select_own on public.preferences for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists preferences_insert_own on public.preferences;
create policy preferences_insert_own on public.preferences for insert to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists preferences_update_own on public.preferences;
create policy preferences_update_own on public.preferences for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists goals_select_own on public.goals;
create policy goals_select_own on public.goals for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists goals_insert_own on public.goals;
create policy goals_insert_own on public.goals for insert to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists goals_update_own on public.goals;
create policy goals_update_own on public.goals for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists goals_delete_own on public.goals;
create policy goals_delete_own on public.goals for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own on public.projects for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects for insert to authenticated
with check (
  auth.uid() is not null and auth.uid() = user_id
  and (goal_id is null or exists (
    select 1 from public.goals
    where goals.id = projects.goal_id and goals.user_id = auth.uid()
  ))
);

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (
  auth.uid() is not null and auth.uid() = user_id
  and (goal_id is null or exists (
    select 1 from public.goals
    where goals.id = projects.goal_id and goals.user_id = auth.uid()
  ))
);

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own on public.projects for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists journal_entries_select_own on public.journal_entries;
create policy journal_entries_select_own on public.journal_entries for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists journal_entries_insert_own on public.journal_entries;
create policy journal_entries_insert_own on public.journal_entries for insert to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists journal_entries_update_own on public.journal_entries;
create policy journal_entries_update_own on public.journal_entries for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists journal_entries_delete_own on public.journal_entries;
create policy journal_entries_delete_own on public.journal_entries for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversations_select_own on public.conversations;
create policy conversations_select_own on public.conversations for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversations_insert_own on public.conversations;
create policy conversations_insert_own on public.conversations for insert to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversations_update_own on public.conversations;
create policy conversations_update_own on public.conversations for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversations_delete_own on public.conversations;
create policy conversations_delete_own on public.conversations for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversation_messages_select_own on public.conversation_messages;
create policy conversation_messages_select_own on public.conversation_messages for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists conversation_messages_insert_own on public.conversation_messages;
create policy conversation_messages_insert_own on public.conversation_messages for insert to authenticated
with check (
  auth.uid() is not null and auth.uid() = user_id
  and exists (
    select 1 from public.conversations
    where conversations.id = conversation_messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

drop policy if exists conversation_messages_delete_own on public.conversation_messages;
create policy conversation_messages_delete_own on public.conversation_messages for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists memories_select_own on public.memories;
create policy memories_select_own on public.memories for select to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists memories_insert_own on public.memories;
create policy memories_insert_own on public.memories for insert to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists memories_update_own on public.memories;
create policy memories_update_own on public.memories for update to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists memories_delete_own on public.memories;
create policy memories_delete_own on public.memories for delete to authenticated
using (auth.uid() is not null and auth.uid() = user_id);
