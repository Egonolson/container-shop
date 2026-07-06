-- Admin-managed SMTP configuration, editable from the backoffice instead of
-- baked into .env. Single row (id = 1). The password is stored encrypted at
-- the application layer (AES-256-GCM) in password_cipher; the DB never sees
-- the plaintext. Access is staff/service_role only — never anon/authenticated
-- customers. Used for the app's own transactional mail (inquiry notifications,
-- customer confirmations); a separate ops step syncs it into GoTrue for
-- registration mails (sync-smtp-to-gotrue.sh).

create table public.app_smtp_settings (
  id smallint primary key default 1 check (id = 1),
  host text,
  port integer not null default 587,
  secure boolean not null default false,
  username text,
  password_cipher text,
  from_email text,
  from_name text not null default 'Containerdienst Seyfarth',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.app_smtp_settings is
  'Admin-gepflegte SMTP-Konfiguration (Einzelzeile id=1). password_cipher ist app-seitig AES-256-GCM-verschluesselt; DB sieht nie Klartext. Nur staff/service_role.';

create trigger app_smtp_settings_set_updated_at
  before update on public.app_smtp_settings
  for each row
  execute function public.set_updated_at();

alter table public.app_smtp_settings enable row level security;

-- Staff/admin manage the settings from the backoffice UI (their own session).
create policy "staff manage smtp settings"
  on public.app_smtp_settings for all
  using (public.is_staff())
  with check (public.is_staff());

revoke all on public.app_smtp_settings from anon, authenticated;
grant select, insert, update on public.app_smtp_settings to authenticated;

-- Seed the single row so the app can always UPDATE it (values filled via UI).
insert into public.app_smtp_settings (id) values (1) on conflict (id) do nothing;
