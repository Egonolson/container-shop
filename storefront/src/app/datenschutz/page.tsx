import { Metadata } from "next"
import { PublicShell } from "@/components/public/public-shell"

export const metadata: Metadata = {
  title: "Datenschutzerklaerung | Seyfarth Container-Dienst",
}

export default function DatenschutzPage() {
  return (
    <PublicShell>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-zinc max-w-none">
          <h1>Datenschutzerklaerung</h1>

          {/* 1. Verantwortlicher */}
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO)
            und anderer nationaler Datenschutzgesetze sowie sonstiger
            datenschutzrechtlicher Bestimmungen ist:
          </p>
          <p>
            <strong>Seyfarth Container-Dienst</strong>
            <br />
            Inhaber: [Name]
            <br />
            [Strasse + Hausnummer]
            <br />
            [PLZ] Ponitz
            <br />
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [E-Mail-Adresse]
          </p>

          {/* 2. Hosting */}
          <h2>2. Hosting</h2>
          <p>
            Unsere Website wird bei der Hetzner Online GmbH, Industriestr. 25,
            91710 Gunzenhausen, Deutschland, gehostet. Die Server befinden sich
            ausschliesslich in deutschen Rechenzentren. Wenn Sie unsere Website
            besuchen, erhebt der Hostinganbieter automatisch Informationen in
            sogenannten Server-Log-Files, die Ihr Browser automatisch
            uebermittelt (siehe Abschnitt 3).
          </p>
          <p>
            Die Nutzung von Hetzner erfolgt auf Grundlage von Art. 6 Abs. 1
            lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer
            zuverlaessigen und sicheren Darstellung unserer Website. Wir haben
            einen Auftragsverarbeitungsvertrag (AVV) mit Hetzner geschlossen,
            um den datenschutzkonformen Umgang mit personenbezogenen Daten
            sicherzustellen.
          </p>

          {/* 3. Server-Log-Files */}
          <h2>3. Server-Log-Files</h2>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch
            Informationen in sogenannten Server-Log-Files, die Ihr Browser
            automatisch an uns uebermittelt. Dies sind:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer-URL (die zuvor besuchte Seite)</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>IP-Adresse des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
          </ul>
          <p>
            Eine Zusammenfuehrung dieser Daten mit anderen Datenquellen wird
            nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage
            von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein
            berechtigtes Interesse an der technisch fehlerfreien Darstellung
            und der Optimierung seiner Website — hierzu muessen die
            Server-Log-Files erfasst werden.
          </p>
          <p>
            Die Server-Log-Files werden nach 14 Tagen automatisch geloescht,
            sofern keine laengere Speicherung aus Beweissicherungsgruenden
            erforderlich ist.
          </p>

          {/* 4. Cookies */}
          <h2>4. Cookies</h2>
          <p>
            Unsere Website verwendet ausschliesslich technisch notwendige
            Cookies. Diese Cookies sind erforderlich, damit Sie durch die
            Seiten navigieren und wesentliche Funktionen nutzen koennen. Sie
            dienen insbesondere der Aufrechterhaltung Ihrer Sitzung (Session)
            waehrend der Nutzung unseres Online-Shops.
          </p>
          <p>
            Technisch notwendige Cookies werden auf Grundlage von Art. 6
            Abs. 1 lit. f DSGVO gesetzt. Wir haben ein berechtigtes Interesse
            an der Speicherung technisch notwendiger Cookies zur technisch
            fehlerfreien und optimierten Bereitstellung unserer Dienste. Eine
            Einwilligung ist hierzu nach SS 25 Abs. 2 Nr. 2 TDDDG nicht
            erforderlich.
          </p>
          <p>
            Wir setzen keine Analyse-, Tracking- oder Marketing-Cookies ein.
            Es werden keine Daten an Dritte zu Werbezwecken weitergegeben.
          </p>
          <table>
            <thead>
              <tr>
                <th>Cookie-Name</th>
                <th>Zweck</th>
                <th>Speicherdauer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>connect.sid</td>
                <td>Session-Cookie fuer den Shop-Betrieb</td>
                <td>Sitzungsende</td>
              </tr>
              <tr>
                <td>cookie-consent</td>
                <td>Speicherung der Cookie-Hinweis-Bestaetigung</td>
                <td>1 Jahr (localStorage)</td>
              </tr>
            </tbody>
          </table>

          {/* 5. Kundenkonto & Bestellabwicklung */}
          <h2>5. Kundenkonto und Bestellabwicklung</h2>
          <p>
            Bei der Registrierung eines Kundenkontos und der Bestellabwicklung
            erheben wir folgende personenbezogene Daten:
          </p>
          <ul>
            <li>Firma / Unternehmensname</li>
            <li>Vor- und Nachname des Ansprechpartners</li>
            <li>E-Mail-Adresse</li>
            <li>Telefonnummer</li>
            <li>Lieferadresse(n)</li>
            <li>Rechnungsadresse</li>
            <li>Bestellhistorie und Auftragsdaten</li>
          </ul>
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6
            Abs. 1 lit. b DSGVO zur Erfuellung des Vertrages bzw. zur
            Durchfuehrung vorvertraglicher Massnahmen. Die im Rahmen der
            Bestellung erhobenen Daten werden bis zum Ablauf der gesetzlichen
            Aufbewahrungsfristen (in der Regel 6 bzw. 10 Jahre gemaess HGB und
            AO) gespeichert und danach geloescht, sofern keine laengere
            Speicherung erforderlich ist.
          </p>
          <p>
            Da es sich um einen B2B-Shop handelt, richten sich unsere
            Leistungen ausschliesslich an Gewerbetreibende. Die Verarbeitung
            der Daten Ihrer Mitarbeiter, die als Ansprechpartner fungieren,
            erfolgt im Rahmen des berechtigten Interesses gemaess Art. 6 Abs. 1
            lit. f DSGVO.
          </p>

          {/* 6. E-Mail-Kontakt */}
          <h2>6. Kontaktaufnahme per E-Mail</h2>
          <p>
            Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben
            einschliesslich der von Ihnen angegebenen Kontaktdaten zwecks
            Bearbeitung der Anfrage und fuer den Fall von Anschlussfragen bei
            uns gespeichert. Diese Daten geben wir nicht ohne Ihre
            Einwilligung weiter.
          </p>
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6
            Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfuellung eines
            Vertrags zusammenhaengt oder zur Durchfuehrung vorvertraglicher
            Massnahmen erforderlich ist. In allen uebrigen Faellen beruht die
            Verarbeitung auf Ihrem berechtigten Interesse an der effektiven
            Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f
            DSGVO).
          </p>
          <p>
            Die von Ihnen bei der Kontaktaufnahme uebermittelten Daten
            verbleiben bei uns, bis Sie uns zur Loeschung auffordern, Ihre
            Einwilligung zur Speicherung widerrufen oder der Zweck fuer die
            Datenspeicherung entfaellt. Zwingende gesetzliche Bestimmungen —
            insbesondere Aufbewahrungsfristen — bleiben unberuehrt.
          </p>

          {/* 7. Rechte der Betroffenen */}
          <h2>7. Rechte der betroffenen Personen</h2>
          <p>
            Ihnen stehen nach der DSGVO folgende Rechte in Bezug auf Ihre
            personenbezogenen Daten zu:
          </p>

          <h3>7.1 Recht auf Auskunft (Art. 15 DSGVO)</h3>
          <p>
            Sie haben das Recht, eine Bestaetigung darueber zu verlangen, ob
            personenbezogene Daten, die Sie betreffen, verarbeitet werden. Ist
            dies der Fall, haben Sie ein Recht auf Auskunft ueber diese
            personenbezogenen Daten und auf die in Art. 15 DSGVO genannten
            Informationen.
          </p>

          <h3>7.2 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
          <p>
            Sie haben das Recht, unverzueglich die Berichtigung unrichtiger
            personenbezogener Daten zu verlangen. Unter Beruecksichtigung der
            Zwecke der Verarbeitung haben Sie das Recht, die Vervollstaendigung
            unvollstaendiger personenbezogener Daten zu verlangen.
          </p>

          <h3>7.3 Recht auf Loeschung (Art. 17 DSGVO)</h3>
          <p>
            Sie haben das Recht, zu verlangen, dass personenbezogene Daten, die
            Sie betreffen, unverzueglich geloescht werden, sofern einer der in
            Art. 17 DSGVO genannten Gruende zutrifft und die Verarbeitung nicht
            zur Erfuellung einer rechtlichen Verpflichtung erforderlich ist.
          </p>

          <h3>7.4 Recht auf Einschraenkung der Verarbeitung (Art. 18 DSGVO)</h3>
          <p>
            Sie haben das Recht, die Einschraenkung der Verarbeitung zu
            verlangen, wenn eine der in Art. 18 DSGVO genannten
            Voraussetzungen gegeben ist, z.{"\u00A0"}B. wenn Sie die Richtigkeit
            der Daten bestreiten.
          </p>

          <h3>7.5 Recht auf Datenportabilitaet (Art. 20 DSGVO)</h3>
          <p>
            Sie haben das Recht, die Sie betreffenden personenbezogenen Daten,
            die Sie uns bereitgestellt haben, in einem strukturierten,
            gaengigen und maschinenlesbaren Format zu erhalten. Sie haben
            ausserdem das Recht, diese Daten einem anderen Verantwortlichen
            ohne Behinderung zu uebermitteln.
          </p>

          <h3>7.6 Recht auf Widerspruch (Art. 21 DSGVO)</h3>
          <p>
            Sie haben das Recht, aus Gruenden, die sich aus Ihrer besonderen
            Situation ergeben, jederzeit gegen die Verarbeitung der Sie
            betreffenden personenbezogenen Daten, die auf Grundlage von Art. 6
            Abs. 1 lit. f DSGVO erfolgt, Widerspruch einzulegen. Der
            Verantwortliche verarbeitet die personenbezogenen Daten dann nicht
            mehr, es sei denn, er kann zwingende schutzwuerdige Gruende fuer
            die Verarbeitung nachweisen, die die Interessen, Rechte und
            Freiheiten der betroffenen Person ueberwiegen.
          </p>

          {/* 8. Beschwerderecht */}
          <h2>8. Beschwerderecht bei einer Aufsichtsbehoerde</h2>
          <p>
            Unbeschadet eines anderweitigen verwaltungsrechtlichen oder
            gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde
            bei einer Aufsichtsbehoerde zu, wenn Sie der Ansicht sind, dass
            die Verarbeitung der Sie betreffenden personenbezogenen Daten
            gegen die DSGVO verstoesst.
          </p>
          <p>
            Die fuer uns zustaendige Aufsichtsbehoerde ist:
          </p>
          <p>
            Thueringer Landesbeauftragter fuer den Datenschutz und die
            Informationsfreiheit
            <br />
            Haeusserstrasse 8
            <br />
            99096 Erfurt
            <br />
            Telefon: 0361 57-3112900
            <br />
            E-Mail: poststelle@datenschutz.thueringen.de
            <br />
            Website:{" "}
            <a
              href="https://www.tlfdi.de"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.tlfdi.de
            </a>
          </p>

          {/* 9. Aktualitaet */}
          <h2>9. Aktualitaet und Aenderung dieser Datenschutzerklaerung</h2>
          <p>
            Diese Datenschutzerklaerung ist aktuell gueltig und hat den Stand
            [Datum]. Durch die Weiterentwicklung unserer Website oder aufgrund
            geaenderter gesetzlicher bzw. behoerdlicher Vorgaben kann es
            notwendig werden, diese Datenschutzerklaerung zu aendern.
          </p>
        </div>
      </div>
    </PublicShell>
  )
}
