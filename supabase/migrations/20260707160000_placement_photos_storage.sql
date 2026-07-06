-- Private storage bucket for placement photos a customer uploads to show
-- exactly where the container should go. Objects live under a path prefixed
-- by the owner's user id: "{auth.uid}/{reference}/{filename}", which is what
-- the RLS policies below key on.
--
-- Retention (release plan F5): photos are to be deleted on order completion
-- + 3 months. That deletion job is a separate, scheduled follow-up (needs a
-- completed_at on shop_requests first); this migration only sets up the
-- bucket + access rules. Until then photos persist and are removable by the
-- customer and via a manual Art.-17 deletion in the backoffice.

insert into storage.buckets (id, name, public)
values ('placement-photos', 'placement-photos', false)
on conflict (id) do nothing;

-- Only authenticated users, and only within their own uid-prefixed folder.
-- Guest (anonymous) photo upload is intentionally out of scope for now — it
-- needs a request-scoped token to be safe (release plan) and is a follow-up.
create policy "owners read their placement photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'placement-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners upload their placement photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'placement-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners delete their placement photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'placement-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Staff/admin may view all placement photos (support, dispatch).
create policy "staff read all placement photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'placement-photos' and public.is_staff());
