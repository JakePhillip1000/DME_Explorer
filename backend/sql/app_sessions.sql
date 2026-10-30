create table if not exists public.app_sessions (
    id text primary key,
    data jsonb not null,
    expires_at timestamptz not null
);
create index if not exists app_sessions_expires_at_idx on public.app_sessions (expires_at);
alter table public.app_sessions enable row level security;
revoke all on public.app_sessions from anon, authenticated;
grant all on public.app_sessions to service_role;

-- Periodically run this in Supabase to remove expired records:
-- delete from public.app_sessions where expires_at < now();
