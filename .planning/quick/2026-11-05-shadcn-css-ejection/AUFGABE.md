---
status: umgesetzt-review-offen
basis: cff7f06
branch: chore/node26-framework-main-20261105
---
# shadcn-Entwicklungstoolkette ohne CSS-Verlust entfernen

Ziel: Die sechs nach dem Nodemailer-Fix verbliebenen Entwicklungstool-Funde gezielt schließen, ohne Produktfunktion oder gemeinsame UI-Stile zu entfernen.
Dateien: storefront/package.json/Lockfile, globals.css, versionstreue CSS-Paritätsproben und THIRD_PARTY_NOTICES.md.
Test zuerst: zwölf echte Tailwind-CSS-Ausgaben vor der Ejection erfassen, gegen denselben Compiler nachher vergleichen; Suite/Typecheck/Build und Full-/Production-Audits.
Risiko: keine Auth-/DB-/Rechte-/Serveränderung; keine zusätzlichen Bibliotheken, Overrides oder Major-Downgrades.
Außerhalb: Push, PR, Merge, Docker, Deployment und echte Dienste. TDD-Ausnahme: reine Abhängigkeits-/CSS-Konfiguration; beobachteter roter Ausgangsaudit und positive CSS-Baseline vor Änderung, danach echte Ausgabegleichheit und grüne Audits.

## Befund und Umsetzung

- Basis-Nodemailer-/CI-Fix cff7f06 bleibt erhalten. Aktiver Featurecheckout, keine Remoteaktion.
- Nutzung gezielt geprüft: shadcn ist ausschließlich als CSS-Import in globals.css verwendet; components.json enthält nur das Schema-/Generator-Konfigurationsformat. Keine npm-Script-, App- oder CI-Laufzeitnutzung der CLI. Komponenten und components.json bleiben bestehen.
- Offizieller Eject-Weg: https://ui.shadcn.com/docs/changelog/2026-05-shadcn-eject. Versionstreu die tatsächlich installierte Datei shadcn@3.8.5/dist/tailwind.css unverändert in globals.css eingefügt; nicht aus einer anderen Projektversion übernommen. Tatsächliche MIT-Lizenz aus diesem installierten Paket samt Quellenvermerk in THIRD_PARTY_NOTICES.md erhalten.
- shadcn offline und ohne Lifecycle-/Audit-Installationsschritte entfernt. Lockfile: 343 Paketpfade entfernt, keine neuen Pfade, kein Versions- oder Metadatenwechsel bei verbleibenden Paketen; nur der root-devDependencies-Verweis entfällt.
- Künftige gemeinsame CSS-Aktualisierungen müssen bewusst synchronisiert werden; der versionierte Quellenhash und zwölf Paritätsproben dokumentieren die Ausgangsversion.

## Verifikation unter Node 26.13.0

- Vorher: npm audit nach ausdrücklicher Freigabe mit 6 dev-only-Funden rot (2 high, 3 moderate, 1 low). Zwölf CSS-Paritätsproben vor Ejection grün.
- Nachher: 26/26 Tests grün, 0 übersprungen (zehn bestehende, vier lokale Nodemailer-Tests, zwölf CSS-Proben). Jede CSS-Probe prüft, dass eine echte CSS-Regel erzeugt wird, und vergleicht den vollständigen kompilierten CSS-AST ohne Formatierungs-/Kommentarunterschiede mit der vorher erfassten Ausgabe. Varianten, no-scrollbar und beide Accordion-Animationen enthalten.
- TypeScript --noEmit --incremental false: Exit 0.
- Next 16.4.5 build --webpack mit leerer Umgebung, ohne Umgebungsdateien und deaktivierter Telemetrie: Exit 0.
- Full npm audit --json: Exit 0, 0 info/low/moderate/high/critical. Separater npm audit --omit=dev --json: ebenfalls Exit 0, überall 0. Beide vom ausdrücklich freigegebenen Metadatentransfer gedeckt; keine Umgehung einer Ablehnung.
- CI-YAML mit echtem YAML-Parser geprüft: Ziel exakt Node 26.13.0, vorhandene ci/typecheck/test/build-Schritte erhalten. Kein CI-Lauf ausgelöst.
- git diff --check: grün. Secret-Scan-Triage siehe SECURITY.md.

## Belege und offene Grenzen

Private Logs unter Taskwurzel outputs/rollout/remediation/Container-Seyfarth/: css-parity-before.log, toolchain-tests.log, toolchain-typecheck.log, toolchain-build.log, audit-toolchain-full.json, audit-toolchain-production.json. Keine Protokolle/Inventare hochgeladen.

Unabhängiges Review folgt durch die Hauptsession. Kein QA-/Browser-Smoke, keine echte SMTP-/TLS-Verbindung, kein Push/Merge/Deployment; für die spätere Einführung gesondert nachweisen. Bestehende Node-Modulformat-/register-Abkündigungswarnungen sind keine fehlgeschlagenen Tests.
