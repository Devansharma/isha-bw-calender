-- Optional one-time cleanup for databases that already contain imported lunar events.
delete from public.events where category = 'Lunar Observance';
