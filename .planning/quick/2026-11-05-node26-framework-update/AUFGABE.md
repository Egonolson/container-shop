---
status: vorbereitet
basis: 609d9710995603664db8e51e570468e76b4fb2d4
branch: chore/node26-framework-main-20261105
---
# Node.js 26 und Framework-Aktualisierung

Ziel: Node.js 26.13.0 im Docker-Build und in der Laufzeit vorbereiten. Bestehende Next.js-16-Anwendungen auf Next.js 16.4.5 und React 19.3.1 anheben.
Dateien: storefront/Dockerfile, storefront/Dockerfile.dev, storefront/package.json sowie die zugehörigen npm-Lockdateien.
Verifikation: Installation mit Node 26, vorhandene Tests/Typecheck/Lint/Build soweit ohne reale Dienste ausführbar.
Risiko: Keine Auth-, Schema-, Rechte- oder Datenänderung. Keine Server-, Merge- oder Deployment-Aktion.
Testausnahme: Reine Versions-/Containerkonfiguration; kein zusätzlicher Test, der nur die gesetzte Versionsnummer nachbildet. Vorhandene Verhaltenstests und echte Builds sind maßgeblich.

## Offen
Linux-/musl-Containerbuild und QA-Laufzeitnachweis, unabhängiges Review, Merge und Deployment.
