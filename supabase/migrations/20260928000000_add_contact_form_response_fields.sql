-- Support associating contact forms with registered users and admin replies.
-- Existing contact-form rows remain valid and are kept as unassigned records.
alter table public.contact_forms
    add column if not exists user_id uuid references public.register(id) on delete set null,
    add column if not exists admin_response text,
    add column if not exists response_status text not null default 'pending',
    add column if not exists response_read boolean not null default false,
    add column if not exists responded_at timestamptz;

alter table public.contact_forms
    drop constraint if exists contact_forms_response_status_check;

alter table public.contact_forms
    add constraint contact_forms_response_status_check
    check (response_status in ('pending', 'answered'));

create index if not exists contact_forms_user_id_idx
    on public.contact_forms (user_id);

create index if not exists contact_forms_user_response_idx
    on public.contact_forms (user_id, response_status, response_read);
