# Isha Banaswadi Programs Calendar

## Enable shared calendar data

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Enable Email authentication and add your GitHub Pages URL under **Authentication → URL Configuration → Redirect URLs**.
3. Replace the two placeholder values in [`supabase-config.js`](supabase-config.js) with your project URL and publishable key from the Supabase **Connect** dialog.
4. Push this repository to GitHub Pages. Anyone with the calendar link can view the shared events; team members sign in with their email address to edit them. Changes appear in real time on every open device.

`supabase-config.js` only contains a browser-safe publishable key. Never add a Supabase `service_role` or secret key to this repository.
