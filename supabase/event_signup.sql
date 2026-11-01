-- Applied to the ichk-events Supabase project.
-- The schema is not exposed through the Data API.
-- The site connects as ichk_events_app, which can only use these tables.

create schema if not exists event_signup;

revoke all on schema event_signup from public;
revoke all on schema event_signup from anon, authenticated, service_role;
grant usage on schema event_signup to ichk_events_app;

create table event_signup.orders (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  email text not null,
  locale text not null check (locale in ('nl', 'en', 'ar')),
  access_token text not null unique,
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  total_cents integer not null check (total_cents >= 0),
  guests jsonb not null,
  ticket_numbers text[] not null default '{}',
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index orders_event_id_idx on event_signup.orders (event_id);

create table event_signup.tickets (
  number text primary key,
  order_id uuid not null references event_signup.orders (id) on delete cascade,
  slot smallint not null check (slot >= 0),
  event_id text not null,
  email text not null,
  age integer not null check (age between 0 and 120),
  entrance_cents integer not null check (entrance_cents >= 0),
  bingo_cents integer not null check (bingo_cents >= 0),
  bingo_card jsonb,
  prize_winner boolean not null default false,
  bingo_winner boolean not null default false,
  unique (order_id, slot)
);

create index tickets_event_id_idx on event_signup.tickets (event_id);
create index tickets_order_id_idx on event_signup.tickets (order_id);

create table event_signup.bingo_calls (
  event_id text not null,
  number integer not null check (number between 1 and 75),
  called_at timestamptz not null default now(),
  primary key (event_id, number)
);

create index bingo_calls_order_idx on event_signup.bingo_calls (event_id, called_at);

alter table event_signup.orders enable row level security;
alter table event_signup.tickets enable row level security;
alter table event_signup.bingo_calls enable row level security;
alter table event_signup.orders force row level security;
alter table event_signup.tickets force row level security;
alter table event_signup.bingo_calls force row level security;

create policy orders_app on event_signup.orders
  for all to ichk_events_app using (true) with check (true);
create policy tickets_app on event_signup.tickets
  for all to ichk_events_app using (true) with check (true);
create policy bingo_app on event_signup.bingo_calls
  for all to ichk_events_app using (true) with check (true);

grant select, insert, update, delete on all tables in schema event_signup to ichk_events_app;
revoke all on all tables in schema event_signup from public, anon, authenticated, service_role;
