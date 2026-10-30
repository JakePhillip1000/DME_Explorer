create sequence if not exists public.room_player_number minvalue 0 start 0;
create or replace function public.next_room_player_number()
returns bigint language sql security definer set search_path = ''
as $$ select nextval('public.room_player_number'); $$;
revoke all on function public.next_room_player_number() from public, anon, authenticated;
grant execute on function public.next_room_player_number() to service_role;
revoke all on sequence public.room_player_number from public, anon, authenticated;
