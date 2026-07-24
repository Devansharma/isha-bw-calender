create table if not exists public.events (
  id text primary key,
  title text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  category text not null check (category in ('Inner Engineering', 'Hatha Yoga', 'Advanced Isha Programs', 'Isha Official Program', 'Lunar Observance')),
  created_by text not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

create policy "Anyone can read calendar events" on public.events for select to anon, authenticated using (true);
create policy "Team members can add events" on public.events for insert to authenticated with check (true);
create policy "Team members can update events" on public.events for update to authenticated using (true) with check (true);
create policy "Team members can delete events" on public.events for delete to authenticated using (true);

alter publication supabase_realtime add table public.events;
