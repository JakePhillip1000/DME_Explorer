-- Login sessions use public.register.id (UUID), not an integer user ID.
-- The previous ADD COLUMN IF NOT EXISTS did not fix an existing bigint column.
begin;

lock table public.contact_forms in access exclusive mode;

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'contact_forms'
          and column_name = 'user_id' and data_type <> 'uuid'
    ) then
        -- Refuse to discard legacy assignments if another database has them.
        if exists (select 1 from public.contact_forms where user_id is not null) then
            raise exception 'Map existing contact user IDs to register UUIDs before migrating';
        end if;

        alter table public.contact_forms
            alter column user_id type uuid using user_id::text::uuid;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.contact_forms'::regclass
          and conname = 'contact_forms_user_id_fkey'
    ) then
        alter table public.contact_forms
            add constraint contact_forms_user_id_fkey
            foreign key (user_id) references public.register(id) on delete set null;
    end if;
end $$;

notify pgrst, 'reload schema';
commit;
