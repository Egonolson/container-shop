import { Metadata } from "next"
import { PublicShell } from "@/components/public/public-shell"

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Seyfarth Container-Dienst",
  description: "Datenschutzhinweise für die Website und das Anfrageformular von Seyfarth Container-Dienst.",
}

export default function DatenschutzPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="prose prose-zinc max-w-none">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-seyfarth-blue">Datenschutz</p>
          <h1>Datenschutzerklärung</h1>
          <p>
            Diese Hinweise informieren Sie darüber, welche personenbezogenen Daten wir beim Besuch der Website und bei der Nutzung des Anfrageformulars verarbeiten.
            Stand: 11. Mai 2026.
          </p>

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p>
            <strong>Seyfarth Container-Dienst</strong>
            <br />
            Am Schreiber 1
            <br />
            04639 Ponitz OT Grünberg
            <br />
            Telefon: <a href="tel:034491552020">034491 552020</a>
            <br />
            E-Mail: <a href="mailto:info@seyfarth-container.de">info@seyfarth-container.de</a>
          </p>

          <h2>2. Hosting und Server-Logfiles</h2>
          <p>
            Die Website wird auf Servern in Deutschland betrieben. Beim Aufruf der Website werden technisch notwendige Server-Logfiles verarbeitet. Dazu können insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene URL, Referrer-URL, Browsertyp, Betriebssystem und HTTP-Status gehören.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren, stabilen und fehlerfreien Bereitstellung der Website sowie in der Abwehr von Missbrauch. Server-Logfiles werden regelmäßig nach spätestens 14 Tagen gelöscht, sofern keine längere Speicherung zur Beweissicherung erforderlich ist.
          </p>

          <h2>3. Online-Anfrageformular</h2>
          <p>
            Wenn Sie über den Online-Konfigurator eine Anfrage senden, verarbeiten wir die von Ihnen eingegebenen Daten, um Ihre Anfrage zu prüfen und Sie zur Abstimmung von Preis, Termin, Verfügbarkeit und Rahmenbedingungen zu kontaktieren.
          </p>
          <p>Verarbeitet werden je nach Anfrage insbesondere:</p>
          <ul>
            <li>Name und optional Firmenname,</li>
            <li>E-Mail-Adresse und Telefonnummer,</li>
            <li>Liefer- oder Einsatzadresse mit Postleitzahl und Ort,</li>
            <li>gewählte Leistung, Abfallart, Baustoff oder Transportbeschreibung,</li>
            <li>Containergröße, Menge, Stellplatz- und Terminangaben,</li>
            <li>Ihre Nachricht und technische Anfrage-Referenz.</li>
          </ul>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Anfrage zur Durchführung vorvertraglicher Maßnahmen erfolgt. Für technische Sicherheitsmaßnahmen, Missbrauchsschutz und Nachvollziehbarkeit der Anfrageverarbeitung stützen wir uns zusätzlich auf Art. 6 Abs. 1 lit. f DSGVO.
          </p>
          <p>
            Die Anfrage wird serverseitig gespeichert und ausschließlich zur Bearbeitung der Anfrage genutzt. Eine Weitergabe erfolgt nur, soweit dies zur Bearbeitung erforderlich ist, gesetzlich vorgeschrieben ist oder Sie eingewilligt haben. Eine Weitergabe zu Werbezwecken findet nicht statt.
          </p>
          <p>
            Anfragedaten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Sofern aus einer Anfrage ein Auftrag entsteht, können handels- und steuerrechtliche Aufbewahrungsfristen von regelmäßig sechs bzw. zehn Jahren gelten.
          </p>

          <h2>4. Technisch notwendige Speicherung im Browser</h2>
          <p>
            Die Website nutzt keine Analyse-, Tracking- oder Marketing-Cookies. Technisch notwendige lokale Speicherungen können eingesetzt werden, damit die Website bedienbar bleibt oder damit Sie eine Bestätigung nicht erneut sehen müssen.
          </p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Zweck</th>
                <th>Speicherdauer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>cookie-consent</td>
                <td>Speichert, dass der Cookie-/Datenschutzhinweis bestätigt wurde.</td>
                <td>bis zu 1 Jahr im Browser</td>
              </tr>
              <tr>
                <td>seyfarth-last-request</td>
                <td>Speichert nach dem Absenden nur Referenznummer, Zeitpunkt, Bereich und Anfrageart. Vollständige Kontaktdaten werden nicht im Browser gespeichert.</td>
                <td>bis zur Löschung durch den Browser oder Nutzer</td>
              </tr>
            </tbody>
          </table>

          <h2>5. Kontaktaufnahme per Telefon oder E-Mail</h2>
          <p>
            Wenn Sie uns telefonisch oder per E-Mail kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Angaben zur Bearbeitung Ihres Anliegens und für Anschlussfragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn die Kontaktaufnahme mit einem Vertrag oder vorvertraglichen Maßnahmen zusammenhängt, andernfalls Art. 6 Abs. 1 lit. f DSGVO.
          </p>

          <h2>6. Empfänger und Auftragsverarbeiter</h2>
          <p>
            Personenbezogene Daten werden intern nur den Stellen zugänglich gemacht, die sie zur Bearbeitung benötigen. Technische Dienstleister, insbesondere Hosting- oder Wartungsdienstleister, können im Rahmen einer Auftragsverarbeitung Zugriff auf Daten erhalten. Mit Auftragsverarbeitern bestehen die erforderlichen Vereinbarungen nach Art. 28 DSGVO.
          </p>

          <h2>7. Pflicht zur Bereitstellung</h2>
          <p>
            Die Pflichtfelder im Anfrageformular sind erforderlich, damit wir Ihre Anfrage fachlich prüfen und Sie erreichen können. Ohne diese Angaben können wir die Online-Anfrage nicht bearbeiten.
          </p>

          <h2>8. Ihre Rechte</h2>
          <p>Ihnen stehen nach der DSGVO insbesondere folgende Rechte zu:</p>
          <ul>
            <li>Auskunft über Ihre gespeicherten personenbezogenen Daten (Art. 15 DSGVO),</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
            <li>Löschung (Art. 17 DSGVO),</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
            <li>Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO).</li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte können Sie sich über die oben genannten Kontaktdaten an uns wenden.
          </p>

          <h2>9. Beschwerderecht bei einer Aufsichtsbehörde</h2>
          <p>
            Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.
          </p>
          <p>
            Für Thüringen ist zuständig:
            <br />
            Thüringer Landesbeauftragter für den Datenschutz und die Informationsfreiheit
            <br />
            Häußlerstraße 8, 99096 Erfurt
            <br />
            Telefon: 0361 57-3112900
            <br />
            E-Mail: <a href="mailto:poststelle@datenschutz.thueringen.de">poststelle@datenschutz.thueringen.de</a>
            <br />
            Website: <a href="https://www.tlfdi.de" target="_blank" rel="noopener noreferrer">www.tlfdi.de</a>
          </p>
        </div>
      </div>
    </PublicShell>
  )
}
