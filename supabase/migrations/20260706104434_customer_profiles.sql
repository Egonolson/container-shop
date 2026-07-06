-- Customer profiles: one row per auth.users account, private or business.
-- R1 foundation for the portal expansion (release plan F1). erp_customer_id
-- and address_verified are prepared anchors for the later ERP matching (F2)
-- and are intentionally not client-writable.

create type public.customer_kind as enum ('private', 'business');
create type public.account_role as enum ('customer', 'staff', 'admin');

create table public.customer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  customer_kind public.customer_kind not null default 'private',
  role public.account_role not null default 'customer',
  company_name text,
  first_name text,
  last_name text,
  phone text,
  vat_id text,
  street text,
  house_number text,
  postal_code text,
  city text,
  country text not null default 'DE',
  address_verified boolean not null default false,
  erp_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customer_profiles is
  'Portal-Profil je Konto (privat/gewerblich). erp_customer_id und address_verified sind Anker fuer das spaetere ERP-Matching (Release-Plan F2) und bewusst nicht kundenseitig schreibbar.';

-- keep updated_at current on every change
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customer_profiles_set_updated_at
  before update on public.customer_profiles
  for each row
  execute function public.set_updated_at();

-- auto-create a profile row on signup, reading metadata passed to
-- supabase.auth.signUp({ options: { data: { customer_kind, first_name, ... } } })
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.customer_profiles (id, customer_kind, first_name, last_name, company_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'customer_kind')::public.customer_kind, 'private'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- staff/admin check as SECURITY DEFINER to avoid recursive RLS evaluation
create function public.is_staff()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.customer_profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

-- RLS
alter table public.customer_profiles enable row level security;

create policy "customers can view their own profile"
  on public.customer_profiles for select
  using (auth.uid() = id);

create policy "customers can update their own profile"
  on public.customer_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "staff can view all profiles"
  on public.customer_profiles for select
  using (public.is_staff());

-- Column-level grants: the broad default GRANT ALL ON ALL TABLES to
-- `authenticated` would otherwise let a customer overwrite their own role,
-- erp_customer_id, or address_verified via a direct REST call. Only the
-- customer-editable master data columns are grantable; role/erp_customer_id/
-- address_verified stay service_role-only (admin backend, later ERP sync).
revoke all on public.customer_profiles from anon;
revoke insert, update, delete on public.customer_profiles from authenticated;
grant select on public.customer_profiles to authenticated;
grant update (
  customer_kind, company_name, first_name, last_name, phone, vat_id,
  street, house_number, postal_code, city, country
) on public.customer_profiles to authenticated;
