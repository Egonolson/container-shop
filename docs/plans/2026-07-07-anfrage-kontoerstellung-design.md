# Design: Kontoerstellung/Login im Anfrage-Konfigurator + verknüpfte Anfragen

Stand: 2026-07-07 · Branch: `feature/r1-portal-foundation`

## Ziel

Im öffentlichen Anfrage-Konfigurator (`seyfarth-configurator.tsx`) soll am bestehenden Kundentyp-Feld (Kontakt-Schritt) auch gleich eine Kontoerstellung möglich sein — für Privatkunden optional, für Gewerbekunden verpflichtend. Anfragen werden ab sofort mit `customer_id` verknüpft in einer Datenbanktabelle abgelegt statt in JSONL.

## 1. Datenmodell

Neue Migration: Tabelle `public.shop_requests`.

```sql
create table public.shop_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  mode text not null,
  request_form_version text not null,
  payload jsonb not null,
  status text not null default 'neu',
  created_at timestamptz not null default now()
);
```

RLS:
- `select`: `customer_id = auth.uid()` (eigene Anfragen) ODER `public.is_staff()` (Staff/Admin sieht alle).
- `insert`: `with check (customer_id is null or customer_id = auth.uid())` — anonyme Requests nur mit `customer_id = null`, eingeloggte Kunden nur mit ihrer eigenen ID. Kein Update/Delete für Kunden.

Neue Funktion `public.email_has_account(check_email text) returns boolean`, `security definer`, prüft `auth.users`, `grant execute` an `anon, authenticated` — Grundlage der automatischen Login-Erkennung, analog zum bestehenden `is_staff()`-Muster.

## 2. Konfigurator-UX

- Eingeloggter Nutzer: Konto-Abschnitt entfällt, `customer_id` aus Session.
- E-Mail-Feld verlassen (onBlur) → RPC `email_has_account`:
  - Existiert bereits: nur Passwortfeld, Login zwingend, Hinweistext.
  - Existiert nicht, Privat: optionale Checkbox „Konto anlegen“.
  - Existiert nicht, Gewerblich: Firma + Passwort verpflichtend (Neuregistrierung).
  - Prüfung offen/fehlgeschlagen: „Weiter“ deaktiviert bzw. konservativer Fallback auf Registrierungs-Pfad.
- „Name“-Feld wird in Vorname/Nachname aufgeteilt (Konsistenz mit `/registrieren`).
- Tatsächlicher `signUp()`/`signInWithPassword()`-Aufruf gebündelt mit dem Absenden im Zusammenfassungs-Schritt.

**Rate-Limit:** neue `limit_req_zone` in `nginx.seyfarth.conf` (analog zu `shop_requests`) auf einer eigenen, spezifischeren `location /rest/v1/rpc/email_has_account` — kein Kong-Plugin (würde `KONG_TRUSTED_IPS`/`KONG_REAL_IP_HEADER` brauchen, sonst sieht Kong nur die interne nginx-IP statt der echten Client-IP).

## 3. API-Route

`/api/shop-requests` liest künftig einen Server-seitigen Supabase-Client (Request-Cookies, RLS greift) statt `appendFile`, macht `insert` in `shop_requests`. Bestehende Validierung/Rate-Limit/Payload-Grenzen bleiben.

## 4. Konto-Seite

Platzhalter „Meine Anfragen“ auf `/konto` wird durch echte, rein lesende Liste ersetzt (`select * from shop_requests where customer_id = auth.uid() order by created_at desc`).

## 5. Admin-Ansicht

Neue Tabelle im Admin-Dashboard: alle `shop_requests` (Staff sieht alle via RLS), Spalten Referenz/Modus/Status/Kunde (oder „Gast“)/Datum — read-only, keine Status-Bearbeitung in dieser Iteration.

## Erweiterter Umfang (2026-07-07, alle im Branch umgesetzt)

Über die reine Kontoerstellung hinaus umgesetzt:

- **Prefill:** eingeloggte Kunden bekommen Kontakt-/Adressdaten aus dem Profil vorbefüllt.
- **„Nochmal anfragen":** frühere Anfrage aus `/konto` per localStorage in den Konfigurator übernehmen (ohne Datum).
- **Baustellen/Standorte:** neue Tabelle `construction_sites` (RLS: Kunde verwaltet eigene, Staff liest), Verwaltungs-UI in `/konto`, Auswahl im Ort-Schritt; `shop_requests.construction_site_id` mit eigentumsgeprüfter Insert-Policy.
- **Geo-Pin:** Leaflet/OpenStreetMap-Karte im Stellplatz-Schritt (Anbieterentscheidung: OSM statt Google), Koordinaten im Payload; nginx-CSP `img-src` nur für OSM-Kachel-Hosts geöffnet.
- **Stellplatzfoto:** privater Storage-Bucket `placement-photos` mit uid-gebundener RLS, Upload für eingeloggte Kunden.

## Bekannte Einschränkungen / offene Punkte

- **Deploy-Stand:** Alles ist im Branch und **lokal** verifiziert (Build/Typecheck grün, RLS-Grenzen direkt getestet, Karte im Browser geprüft), aber **noch nicht auf den DEV-Server (hetzner-claw) ausgerollt**. PROD unverändert.
- **WICHTIG vor dem nächsten DEV-Deploy:** `supabase/db/bootstrap.sh` wendet die App-Migrationen nur an, wenn `customer_profiles` noch nicht existiert. Auf dem DEV-Volume existiert sie bereits → die neuen Migrationen (`shop_requests`, `construction_sites`, `placement_photos_storage`) würden **nicht** automatisch angewendet. Vor/bei Deploy müssen sie manuell eingespielt oder die Bootstrap-Logik auf echte Migrations-Verfolgung umgestellt werden.
- Guest-Foto-Upload ist bewusst ausgeklammert (braucht anfrage-gebundenes Token).
- Foto-Löschung (Auftragsabschluss + 3 Monate) braucht zuerst ein `completed_at` an `shop_requests` und einen geplanten Job — Folge-Schritt.
- E-Mail-Enumeration über `email_has_account` ist möglich (rate-limitiert) — dieselbe Information, die GoTrue beim Registrieren ohnehin preisgibt.
- Status-Bearbeitung im Admin-Backend ist ein Folge-Schritt.
- Semantik bleibt „Anfrage" bis zur ERP-Preisanbindung (dann Festpreis-Baustoffe → echte Bestellung).
