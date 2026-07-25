-- Run this in the Supabase SQL Editor if saving an event fails with:
-- "violates check constraint events_category_check".
--
-- This updates an existing events table to match the categories currently used
-- by the Isha Banaswadi Programs Calendar app.

update public.events
set category = 'Advanced Isha Programs'
where category = 'Guru Pooja';

update public.events
set category = 'Isha Official Program'
where category in ('Sadhguru Special', 'Volunteer', 'Community');

delete from public.events
where category = 'Lunar Observance';

alter table public.events
drop constraint if exists events_category_check;

alter table public.events
add constraint events_category_check
check (
  category in (
    'Inner Engineering',
    'Hatha Yoga',
    'Advanced Isha Programs',
    'Isha Official Program',
    'Others'
  )
);
