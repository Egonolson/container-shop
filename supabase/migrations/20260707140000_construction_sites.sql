-- Construction sites / recurring delivery locations a customer manages in
-- their account and can pick in the configurator instead of retyping an
-- address. geo_lat/geo_lng hold the exact placement pin (set later via the
-- map feature). Design: docs/plans/2026-07-07-anfrage-kontoerstellung-design.md
-- (extended for Baustellen/Standorte + Abstellort).

create table public.construction_sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  street text,
  house_number text,
  postal_code text,
  city text,
  country text not null default 'DE',
  geo_lat double precision,
  geo_lng double precision,
  contact_name text,
  contact_phone text,
  notes text,
  is_archived boolean not null default false,
  -- Anchor for the later ERP baustellen sync (release plan F6); the ERP is
  -- the eventual system of record, this stays null for portal-created sites.
  erp_site_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.construction_sites is
  'Baustellen/Standorte eines Kunden als wiederverwendbare Lieferorte. geo_lat/geo_lng = exakter Abstellort-Pin. erp_site_id ist Anker fuer den spaeteren ERP-Sync (Release-Plan F6).';

create index construction_sites_customer_id_idx on public.construction_sites (customer_id);

create trigger construction_sites_set_updated_at
  before update on public.construction_sites
  for each row
  execute function public.set_updated_at();

alter table public.construction_sites enable row level security;

-- Customers fully manage their own sites; staff can view all (for support
-- and the later ERP reconciliation), but not edit through these policies.
create policy "customers manage their own sites"
  on public.construction_sites for all
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "staff can view all sites"
  on public.construction_sites for select
  using (public.is_staff());

revoke all on public.construction_sites from anon, authenticated;
grant select, insert, update, delete on public.construction_sites to authenticated;

-- Link a submitted request to the construction site it was placed for, so a
-- customer's history and the admin backoffice can group by site. Nullable:
-- guest requests and one-off addresses have no site.
alter table public.shop_requests
  add column construction_site_id uuid references public.construction_sites (id) on delete set null;

create index shop_requests_construction_site_id_idx on public.shop_requests (construction_site_id);

-- Tighten the insert policy: a request may only reference a construction
-- site the caller actually owns (otherwise a customer could tag their
-- request with a foreign site id). Guests keep construction_site_id null.
drop policy "submit a request for yourself or as a guest" on public.shop_requests;
create policy "submit a request for yourself or as a guest"
  on public.shop_requests for insert
  with check (
    (customer_id is null or customer_id = auth.uid())
    and (
      construction_site_id is null
      or exists (
        select 1 from public.construction_sites s
        where s.id = construction_site_id and s.customer_id = auth.uid()
      )
    )
  );
