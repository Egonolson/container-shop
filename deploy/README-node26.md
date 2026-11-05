# Gezielter Storefront-Rollout

QA zuerst; Produktion erst nach erfolgreicher QA und grünem Projekt-CI.

1. Ein passendes amd64-Image je Ziel mit dessen bestehenden öffentlichen Buildwerten erzeugen. Registrierung, Site-URL und Supabase-Ziel bewahren; privilegierte Schlüssel sind keine Buildargumente.
2. Aktives Image unveränderlich als Rückweg sichern. Bestehende Runtime-Konfiguration geschützt sichern und ihre Auflösung mit dem laufenden Container vergleichen. Bei jeder Abweichung vor der ersten Laufzeitmutation abbrechen. Nur Gleichheit beziehungsweise abweichende Namen protokollieren, keine Werte.
3. Archivchecksumme, Image-ID, Architektur und Quellrevision prüfen. Das hier versionierte Image-Overlay zusätzlich zur bestehenden Konfiguration verwenden; Projekt und Projektwurzel ausdrücklich angeben.
4. Ausschließlich `seyfarth-storefront` mit `up -d --no-deps --no-build --pull never` erneuern. Keine Migration, kein vollständiger Stack-Neustart, keine Orphan-Entfernung.
5. Health, Image-ID und Version prüfen. Wegen des statischen Storefront-Upstreams anschließend bestehendes Nginx mit `nginx -t` prüfen und gezielt neu laden; Image, Konfiguration und Portbindung bleiben erhalten.
6. Öffentliche und geschützte HTTP-Routen sowie den Browserablauf prüfen. Keine echten Anfragen oder Mails ohne belegte QA-Isolation auslösen. Ergebnisse und Grenzen getrennt von Unit-Tests festhalten.
7. Für Rollout und Rollback ausschließlich die geprüfte, gesicherte Runtime-Konfiguration auflösen. Bei einem Fehler nach dem Wechsel dasselbe Overlay mit dem gesicherten vorherigen Image anwenden und Nginx erneut prüfen/neuladen. Datenbank- und Storage-Dienste bleiben unangetastet; dieser reine App-Rückweg führt keinen Datenbankrestore durch.

`deploy.sh` ist für diesen begrenzten Rollout ungeeignet: Es synchronisiert den Gesamtbaum, baut Images, bootstrapped die Datenbank und startet weitere Dienste.
