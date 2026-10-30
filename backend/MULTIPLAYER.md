# Shared multiplayer room

Clients use WebSockets at `/api/socket`. Backend instances share presence,
movement and chat over the private Supabase Realtime channel `cdlc-room-v1`.
Login names are read from the existing server session. Only backend instances
have access to the private channel; database credentials never reach browsers.

Run `backend/sql/room_multiplayer.sql` once in Supabase to allocate unique guest
numbers across instances. Vercel needs Fluid Compute enabled and the existing
`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SESSION_SECRET` variables.

Clients reconnect after network failures or the function duration limit.
There is no application-level player cap; Vercel and Supabase quotas still apply.
Presence updates only on joining/leaving. Movement is batched every 100 ms
between server instances and interpolated by the frontend.
