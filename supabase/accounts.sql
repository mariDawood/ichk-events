-- Apply after supabase/event_signup.sql on the ichk-events Supabase project.
-- The schema stays closed. Only ichk_events_app can use these tables.

create table if not exists event_signup.accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 5 and 200),
  phone text not null check (char_length(phone) between 8 and 40),
  name text not null check (char_length(name) between 1 and 80),
  password_hash text not null,
  locale text not null check (locale in ('nl', 'en', 'ar')),
  created_at timestamptz not null default now()
);

create table if not exists event_signup.password_resets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references event_signup.accounts (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists password_resets_account_idx
  on event_signup.password_resets (account_id);

alter table event_signup.orders
  alter column email drop not null;

alter table event_signup.orders
  add column if not exists account_id uuid,
  add column if not exists reminder_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_account_id_fkey'
  ) then
    alter table event_signup.orders
      add constraint orders_account_id_fkey
      foreign key (account_id) references event_signup.accounts (id);
  end if;
end $$;

create index if not exists orders_account_id_idx
  on event_signup.orders (account_id);

alter table event_signup.tickets
  add column if not exists name text not null default '',
  add column if not exists checked_in_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists source text not null default 'signup';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tickets_source_check'
  ) then
    alter table event_signup.tickets
      add constraint tickets_source_check check (source in ('signup', 'door'));
  end if;
end $$;

alter table event_signup.accounts enable row level security;
alter table event_signup.password_resets enable row level security;
alter table event_signup.accounts force row level security;
alter table event_signup.password_resets force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'event_signup' and policyname = 'accounts_app'
  ) then
    create policy accounts_app on event_signup.accounts
      for all to ichk_events_app using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'event_signup' and policyname = 'password_resets_app'
  ) then
    create policy password_resets_app on event_signup.password_resets
      for all to ichk_events_app using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on event_signup.accounts to ichk_events_app;
grant select, insert, update, delete on event_signup.password_resets to ichk_events_app;
revoke all on event_signup.accounts from public, anon, authenticated, service_role;
revoke all on event_signup.password_resets from public, anon, authenticated, service_role;
