-- ERP integration foundation (CoTraS). Everything here is ready to receive
-- data from the real ERP; only the concrete HTTP adapter + final field
-- mapping remain (see src/lib/erp/README.md). All tables are staff/service_role
-- only — never anon/authenticated.
--
-- Mirror tables follow one shape: a stable external_id, the full raw ERP
-- object as jsonb (source of truth, so the mapping can evolve without schema
-- churn), a content_hash for idempotent hash-diff upserts, an is_deleted
-- tombstone, synced_at, plus a few promoted columns the matching/UI query on.

-- ── Connection config (admin-managed, like SMTP) ─────────────────────────────
create table public.erp_connection (
  id smallint primary key default 1 check (id = 1),
  base_url text,
  api_key_cipher text,           -- app-encrypted (AES-256-GCM), never plaintext
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
insert into public.erp_connection (id) values (1) on conflict (id) do nothing;

-- ── Sync run/error tracking ──────────────────────────────────────────────────
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  source text not null default 'mock',   -- 'mock' | 'cotras'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running', -- running | ok | error
  inserted integer not null default 0,
  updated integer not null default 0,
  deleted integer not null default 0,
  errors integer not null default 0
);
create index sync_runs_entity_idx on public.sync_runs (entity, started_at desc);

create table public.sync_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.sync_runs (id) on delete cascade,
  entity text not null,
  external_id text,
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index sync_errors_run_idx on public.sync_errors (run_id);

-- ── Mirror tables ────────────────────────────────────────────────────────────
create table public.erp_customers (
  external_id text primary key,
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  -- promoted for matching (filled by the mapper from raw)
  customer_kind text,
  company_name text,
  first_name text,
  last_name text,
  emails text[],
  vat_id text,
  postal_code text,
  city text,
  status text
);
create index erp_customers_vat_idx on public.erp_customers (vat_id);
create index erp_customers_plz_idx on public.erp_customers (postal_code);

create table public.erp_articles (
  external_id text primary key,
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  type text,
  category text,
  bezeichnung text,
  avv_schluessel text,
  gefahrstoff boolean,
  preis_netto numeric,
  preiseinheit text,
  ust_satz numeric,
  gueltig_ab date
);

create table public.erp_container_types (
  external_id text primary key,
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  art text,
  volumen_m3 numeric,
  bezeichnung text,
  preisklasse text
);

create table public.erp_transport_zones (
  external_id text primary key,     -- e.g. "zone-1"
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  zone integer,
  ust_satz numeric
);

create table public.erp_zone_locations (
  external_id text primary key,     -- e.g. "04639-Ponitz"
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  plz text,
  ort text,
  zone integer
);
create index erp_zone_locations_plz_idx on public.erp_zone_locations (plz);

create table public.erp_construction_sites (
  external_id text primary key,
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  erp_customer_id text,
  name text,
  street text,
  house_number text,
  postal_code text,
  city text,
  status text
);
create index erp_construction_sites_customer_idx on public.erp_construction_sites (erp_customer_id);

create table public.erp_invoices (
  external_id text primary key,
  raw jsonb not null,
  content_hash text not null,
  is_deleted boolean not null default false,
  synced_at timestamptz not null default now(),
  erp_customer_id text,
  invoice_number text,
  invoice_date date,
  total_gross numeric,
  status text
);
create index erp_invoices_customer_idx on public.erp_invoices (erp_customer_id);

-- ── Customer ↔ ERP matching + review queue ───────────────────────────────────
create table public.customer_erp_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  erp_customer_id text,                          -- null while pending
  status text not null default 'pending',        -- pending | confirmed | rejected | auto
  score numeric,
  matched_fields jsonb,
  candidates jsonb,                               -- other near-matches for the reviewer
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  unique (customer_id)
);
create index customer_erp_links_status_idx on public.customer_erp_links (status);

-- ── RLS: staff/service_role only across the board ────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'erp_connection','sync_runs','sync_errors','erp_customers','erp_articles',
    'erp_container_types','erp_transport_zones','erp_zone_locations',
    'erp_construction_sites','erp_invoices','customer_erp_links'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format($f$create policy "staff read %1$s" on public.%1$I for select using (public.is_staff())$f$, t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- erp_connection is also staff-writable from the admin UI.
create policy "staff write erp_connection" on public.erp_connection for update using (public.is_staff()) with check (public.is_staff());
grant update on public.erp_connection to authenticated;

-- customer_erp_links is staff-writable: the reviewer confirms/rejects a match
-- from the admin queue (decideMatchAction). The matching engine itself writes
-- via service_role and bypasses RLS; this policy covers the staff decision path.
create policy "staff write customer_erp_links" on public.customer_erp_links for update using (public.is_staff()) with check (public.is_staff());
grant update on public.customer_erp_links to authenticated;
