---
status: umgesetzt-review-offen
basis: 841496ad115f83179a26c9cb40cb7baea4b6e897
branch: chore/node26-framework-main-20261105
---
# Nodemailer-Sicherheitsfix und CI mit Ziel-Node

Ziel: Nodemailer 6.10.1 durch die offiziell aktuelle, mit Node 26.13.0 kompatible Version ersetzen und CI auf genau diese Node-Version setzen.
Dateien: storefront/package.json, Lockfile, Mailer und kleine reine Hilfsfunktionen samt lokalen Tests; .github/workflows/storefront-ci.yml.
Test zuerst: bestehende zehn Tests als Baseline; Stream-/JSON-Transport ohne Netzwerk, Adressabbildung und unveränderte SMTP-/TLS-Optionen mit fiktiven Daten prüfen.
Risiko: keine Auth-, Schema-, Rechte- oder Betriebsänderungen. Keine SMTP-/DB-/Serververbindung und keine echten Daten.
Außerhalb: Push, PR-Aktualisierung, Merge, Deploy, Docker, echte Mailzustellung und Secrets. Versions-/CI-Konfiguration erhält eine begründete TDD-Ausnahme; tatsächliche Tests und Typprüfung sind maßgeblich.

## Regeln und Kontext

- Bestehender zugewiesener Featurecheckout wird verwendet; Basis sauber bestätigt.
- CLAUDE.md und vxd-aufgabe samt Paketregeln gelesen. Notion-Kontext „Containerdienst Seyfarth“ vom 2026-09-04 gelesen (unverified); Architektur Mailer mit verschlüsselten Admin-SMTP-Einstellungen bestätigt. Keine operativen Aktualitätsbehauptungen.
- GitHub-Remote festgestellt; keine Migration oder Remoteänderung im Auftrag. core.hooksPath ist nicht gesetzt.
- Unabhängiges Review folgt durch die auftraggebende Hauptsession; dieses Protokoll behauptet keine Eigenabnahme.

## Belege

- Node 26.13.0: vorhandene Suite 10/10 grün.
- Offizielle npm-Registry: Nodemailer latest 10.3.1, engines.node >=20.0.0. Das installierte Paket enthält eigene Deklarationen unter dist/esm/nodemailer.d.ts und dist/esm/smtp-transport/index.d.ts. @types/nodemailer wurde vollständig entfernt; keine fremden Typen für eine frühere Hauptversion.
- Nodemailer 6.10.1 → exakt 10.3.1; Lockfile nur für Nodemailer und Entfernung des separaten Typpakets geändert. Installationen ohne Lifecycle-Skripte und ohne Auditübertragung.
- SMTP-/Nachrichtenabbildung in kleine reine Hilfsfunktionen extrahiert. Ein roter JSON-Transporttest zeigte, dass der bisher interpolierte Absendername mit Quotes und Komma verändert wurde (3/4 Tests grün, 1 erwarteter Fehler). Strukturierte Absenderadresse erhält den vollständigen Namen; danach 4/4 neue Tests grün.
- Finale Suite unter Node 26.13.0: 14/14 Tests grün (zehn bestehende + vier neue), keine übersprungen. Stream und JSON erzeugen nur lokale Daten, kein SMTP, keine Testkonten, keine DB.
- TypeScript --noEmit --incremental false nach Entfernung von @types: Exit 0. Verwendete SMTPTransport.Options stammen aus den nativen Typen von Nodemailer 10.3.1.
- next build --webpack unter Node 26.13.0 mit leerer Umgebung und deaktivierter Telemetrie: Exit 0, Next 16.4.5, 18 Seiten generiert. Keine lokalen Build-Umgebungsdateien vorhanden; keine Server-/SMTP-/DB-Zugänge verwendet.
- CI setup-node von 22 auf exakt 26.13.0 geändert; bestehende Test-/Typecheck-/Buildschritte erhalten. Workflow wurde nicht ausgelöst.
- npm audit wurde zunächst vor Ausführung wegen fehlender Freigabe für private Paketmetadaten abgelehnt. Nach neuer ausdrücklicher Nutzerfreigabe für genau diese Übertragung wurde genau ein Neuversuch zugelassen und ausgeführt. Kein Baseline-Audit ausgeführt.
- Finales npm audit: Nodemailer nicht mehr betroffen; 6 verbleibende Funde (2 high, 3 moderate, 1 low), sämtlich dev-only laut Lockfile: shadcn/zod, @ts-morph/common/ts-morph/minimatch, deepmerge. npm schlägt shadcn 1.0.0 als Major-Downgrade vor; nicht ungeprüft umgesetzt. Audit ist deshalb nicht grün.
- git diff --check: grün. Secret-Scan und Wortmuster-Triage siehe SECURITY.md. Unabhängiges Review folgt.

## Offizielle Quellen

- https://github.com/nodemailer/nodemailer/releases/tag/v10.3.1
- https://registry.npmjs.org/nodemailer (latest/engines lesend per npm view verifiziert)
- https://nodemailer.com/transports/stream (Stream-/JSON-Transport ohne Zustellung)
- https://nodemailer.com/message/addresses (strukturierte Adresse übernimmt Escaping)
- https://nodemailer.com/smtp (secure true = implizites TLS; secure false = STARTTLS wenn angeboten; keine Zertifikatsprüfung deaktiviert)

## Protokolle

Private lokale Belege: outputs/rollout/remediation/Container-Seyfarth/ unter der Taskwurzel: baseline-tests.log, mailer-red.log, tests-green.log, typecheck.log, build.log, audit-after.json und secret-scan.log. Keine Inventar- oder Protokolldateien hochgeladen.

## Offen

Die sechs verbleibenden shadcn-Entwicklungsabhängigkeitsfunde benötigen einen gesondert geprüften Updateweg. Kein automatischer Downgrade/Override. Unabhängiges Review, QA-Rollout und echte SMTP-/TLS-Handshakes offen. Keine Push-/PR-/Merge-/Deploymentaktion. Node meldet bestehende Modulformat-/register-Abkündigungswarnungen; Tests und Build sind dennoch grün.

Nachtrag: Die sechs oben historisch erfassten Entwicklungsfunde wurden im getrennten Folgeauftrag `../2026-11-05-shadcn-css-ejection/AUFGABE.md` geschlossen. Finaler vollständiger und Produktionsaudit jeweils 0 Befunde; aktuelle Suite26/26, Typecheck und Build grün. Der Nodemailer-Commit cff7f06 bleibt als separater Fix erhalten.
