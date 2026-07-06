-- Shop requests: every inquiry/order submitted through the public
-- configurator, now persisted in Postgres instead of JSONL so registered
-- customers can see their own history and a request can be linked to an
-- account. Design: docs/plans/2026-07-07-anfrage-kontoerstellung-design.md

create table public.shop_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references auth.users (id) on delete set null,
  mode text not null check (mode in ('entsorgung', 'baustoffe', 'transport')),
  request_form_version text not null,
  payload jsonb not null,
  status text not null default 'neu',
  created_at timestamptz not null default now()
);

comment on table public.shop_requests is
  'Anfragen/Bestellungen aus dem oeffentlichen Konfigurator. customer_id ist null bei Gast-Anfragen. payload enthaelt den vollstaendigen, je nach mode unterschiedlich geformten Antrag (location, selection, contact, pricing, dates, placement, confirmations).';

create index shop_requests_customer_id_idx on public.shop_requests (customer_id);
create index shop_requests_created_at_idx on public.shop_requests (created_at desc);

alter table public.shop_requests enable row level security;

create policy "customers can view their own requests"
  on public.shop_requests for select
  using (customer_id = auth.uid());

create policy "staff can view all requests"
  on public.shop_requests for select
  using (public.is_staff());

-- Anonymous guests may only insert requests with customer_id = null;
-- authenticated customers may only attribute a request to themselves. This
-- is the security boundary that stops anyone from claiming another
-- customer's account for a request via a crafted REST call.
create policy "submit a request for yourself or as a guest"
  on public.shop_requests for insert
  with check (customer_id is null or customer_id = auth.uid());

revoke all on public.shop_requests from anon, authenticated;
grant insert on public.shop_requests to anon, authenticated;
grant select on public.shop_requests to authenticated;

-- Lets the public configurator check (rate-limited at the nginx layer, see
-- nginx.seyfarth.conf) whether an email already has an account, so it can
-- switch from registration to a login prompt instead of failing at signup.
create function public.email_has_account(check_email text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.email_has_account(text) to anon, authenticated;
