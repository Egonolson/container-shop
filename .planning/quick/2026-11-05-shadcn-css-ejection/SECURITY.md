# Sicherheitsnachweis: CSS-Ejection

Basis cff7f06. Nur ungenutzte CLI samt ausschließlich darüber erreichbarer Entwicklungspakete entfernt; keine Produktkomponente gestrichen und keine unsicheren Versions-Overrides gesetzt. Die vollständigen gemeinsamen CSS-Definitionen bleiben unverändert aus der tatsächlich installierten Version3.8.5 erhalten, einschließlich Varianten, Accordion-Keyframes und no-scrollbar. MIT-Lizenz und Ursprung bleiben in THIRD_PARTY_NOTICES.md dokumentiert.

Full-Audit und Produktionsaudit nach ausdrücklicher npm-Metadatenfreigabe beide ohne Befund (je Exit0). Die sechs zuvor dokumentierten Entwicklungsabhängigkeitsfunde sind damit geschlossen. Keine externen Dienste außer der freigegebenen npm-Registry für Audits verwendet; Tests/Build ohne SMTP, DB, Server und echte Daten.

Secret-Scan über neun geprüfte gestagte Dateien: 0 typisierte Funde und 8 Wortmuster-Treffer. Sämtliche Treffer sind Dokumentation, Begriffe für nicht gelesene sensible Dateien und der öffentliche Git-Basis-SHA; keine echten Zugangswerte. Der Scanner liefert wegen Wortmustern Exit1, daher ausdrücklich triagiert und nicht als sauberer Exit0 dargestellt. Unabhängiges Review offen; keine Eigenabnahme behauptet.
