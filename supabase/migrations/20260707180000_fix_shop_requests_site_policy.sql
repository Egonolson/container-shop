-- Fix: the shop_requests insert policy referenced construction_sites directly
-- in an EXISTS subquery. Postgres needs SELECT privilege on that table to
-- evaluate the policy even when construction_site_id is null (the branch that
-- would short-circuit), so an anonymous guest — who has no grant on
-- construction_sites — got "permission denied for table construction_sites"
-- on every insert, including plain guest requests.
--
-- Move the ownership check into a SECURITY DEFINER helper (owned by a
-- superuser) so the calling role never needs direct access to the table.

create function public.owns_construction_site(p_site_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_site_id is null or exists (
    select 1 from public.construction_sites s
    where s.id = p_site_id and s.customer_id = auth.uid()
  );
$$;

grant execute on function public.owns_construction_site(uuid) to anon, authenticated;

drop policy "submit a request for yourself or as a guest" on public.shop_requests;
create policy "submit a request for yourself or as a guest"
  on public.shop_requests for insert
  with check (
    (customer_id is null or customer_id = auth.uid())
    and public.owns_construction_site(construction_site_id)
  );
