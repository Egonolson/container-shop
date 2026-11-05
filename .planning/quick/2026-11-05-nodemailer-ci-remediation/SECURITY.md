# Sicherheitsnachweis: Nodemailer und CI

Basis: 841496ad115f83179a26c9cb40cb7baea4b6e897. Prüfung der ausdrücklich geänderten Dateien mit dem Secret-Scan aus VXD 2.0.0; keine Umgebungsdateien oder AgentVault gelesen.

Erster Scan: 0 typisierte Krypto-/Secret-Funde, 13 Wortmuster-Treffer. Staged Abschluss-Scan über sieben geprüfte Dateien: 0 typisierte Funde, 17 Wortmuster-Treffer. Alle Treffer wurden triagiert: bestehende Import-/Feld-/Parameternamen wie decryptSecret und password_cipher, synthetischer fixture-password-Wert in Offline-Tests, Git-Basis-SHA sowie Dokumentationswörter. Kein echter Zugangswert. Beispieladressen verwenden ausschließlich example.test. Der Scan meldet wegen Wortmustern Exit 1; dies wird ausdrücklich triagiert und nicht als fehlerfreier Scanner-Exit dargestellt.

Mailer: Transporthost/Port/secure/auth unverändert aus konfigurierten Daten abgebildet. Kein rejectUnauthorized:false, kein ignoreTLS und kein veränderter requireTLS-Default. secure:false nutzt weiterhin den Nodemailer-Standard (STARTTLS wenn angeboten), erzwingt also kein TLS. Handshake und Zustellbarkeit sind ohne echte Verbindung nicht bewiesen. Strukturierte Absenderadresse erhält Quotes/Komma korrekt; Empfänger und Envelope wurden mit lokalem JSON-/Stream-Transport geprüft.

Finaler npm audit erst nach ausdrücklich erteilter Freigabe für Paketnamen, Versionen und Abhängigkeitsmetadaten an npm ausgeführt. Nodemailer ist nicht mehr betroffen. Audit bleibt mit sechs dev-only-Funden rot: high shadcn/zod; moderate @ts-morph/common, minimatch, ts-morph; low deepmerge. Kein ungeprüfter npm-Downgrade auf shadcn1.0.0. Kein zweiter Auditlauf oder indirekter Ausweichweg.

Keine Server, Datenbank, echten Maildienste, Secrets, Docker, Pushes oder Deployments verwendet. Unabhängiges Sicherheits-/Änderungsreview bleibt bei der auftraggebenden Hauptsession.

Nachtrag: Die sechs historisch oben genannten Entwicklungsfunde sind durch die separat dokumentierte CSS-Ejection geschlossen; danach vollständiger und Produktionsaudit jeweils 0 Befunde. Siehe `../2026-11-05-shadcn-css-ejection/SECURITY.md`.
