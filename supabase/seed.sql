-- Local-only demo account for clicking through the admin backoffice while the
-- CoTraS API specification is pending. Never applied against DEV/PROD.
-- Login: admin@seyfarth-demo.local / admin12345

-- GoTrue's Go SQL scan expects these token columns as empty string, not NULL —
-- without them explicitly set, `signInWithPassword` fails with a 500
-- ("converting NULL to string is unsupported") even though the row looks fine.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@seyfarth-demo.local',
  crypt('admin12345', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"customer_kind":"business","company_name":"Seyfarth Backoffice"}',
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, created_at, updated_at
)
select gen_random_uuid(), id::text, id,
       jsonb_build_object('sub', id::text, 'email', email),
       'email', now(), now()
from auth.users where email = 'admin@seyfarth-demo.local';

update public.customer_profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@seyfarth-demo.local');
