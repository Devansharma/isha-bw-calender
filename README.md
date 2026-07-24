# Isha Banaswadi Programs Calendar

## Enable shared calendar data

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Replace the two placeholder values in [`supabase-config.js`](supabase-config.js) with your project URL and publishable key from the Supabase **Connect** dialog.
3. Push this repository to GitHub Pages. Anyone with the calendar link can view, add, edit, or delete shared events; changes appear in real time on every open device.

If saving is blocked by a row-level-security error, run [`supabase/repair-anonymous-policies.sql`](supabase/repair-anonymous-policies.sql) once in the Supabase SQL Editor.

`supabase-config.js` only contains a browser-safe publishable key. Never add a Supabase `service_role` or secret key to this repository. Because editing is anonymous, anyone with the calendar link can change its events.
