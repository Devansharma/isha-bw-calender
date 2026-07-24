-- Run this in Supabase SQL Editor if anonymous event saves are blocked.
alter table public.events enable row level security;
grant select, insert, update, delete on public.events to anon, authenticated;

drop policy if exists "Team members can read events" on public.events;
drop policy if exists "Team members can add events" on public.events;
drop policy if exists "Team members can update events" on public.events;
drop policy if exists "Team members can delete events" on public.events;
drop policy if exists "Anyone can read calendar events" on public.events;
drop policy if exists "Anyone can add events" on public.events;
drop policy if exists "Anyone can update events" on public.events;
drop policy if exists "Anyone can delete events" on public.events;

create policy "Anyone can read calendar events" on public.events
  for select to anon, authenticated using (true);
create policy "Anyone can add events" on public.events
  for insert to anon, authenticated with check (true);
create policy "Anyone can update events" on public.events
  for update to anon, authenticated using (true) with check (true);
create policy "Anyone can delete events" on public.events
  for delete to anon, authenticated using (true);
