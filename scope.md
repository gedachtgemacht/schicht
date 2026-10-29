# schicht.

Dein Wechselschicht-Muster einmal eintragen, der Kalender zeigt Früh, Spät, Nacht und frei.

## Problem

Wer in Wechselschicht arbeitet (Pflege, Industrie, Rettungsdienst, Logistik), will schnell wissen: Was habe ich am 14. März, wann ist das nächste freie Wochenende, wie viele Nächte kommen diesen Monat? Dafür nutzen Leute heute Schichtkalender-Apps, die Werbung zeigen, ein Konto wollen oder Muster, Export in den Gerätekalender und Statistik hinter einem Pro-Kauf oder Abo verstecken. Offene Alternativen gibt es nur für Android, ohne Muster-Rechnung und ohne ICS-Export, oder sie brauchen einen eigenen Server.

## Zielgruppe

Privatleute mit festem, sich wiederholendem Schichtrhythmus, vor allem auf dem Handy. Dazu Angehörige, die den Plan als Termine im eigenen Kalender sehen wollen (über die ICS-Datei).

## Bezahltes Vorbild

**Shift Work Calendar** (iOS) und ähnliche Schichtkalender-Apps: kostenlos mit Werbung, Pro-Version als Einmalkauf oder Abo, je nach App etwa 3 bis 10 Euro. Können: Schichtarten mit Farbe und Zeiten, Wiederholmuster, Monatskalender, Stundenübersicht, teils Export in den Gerätekalender, teils Cloud-Sync mit Konto.

## Funktionen v1

- **Schichtarten**: Kürzel (1 bis 2 Zeichen), Name, Farbe aus fester Palette, Beginn, Ende, Pause in Minuten. Vorbelegt: Früh `F` 06:00 bis 14:00, Spät `S` 14:00 bis 22:00, Nacht `N` 22:00 bis 06:00, je 30 min Pause. Fest und nicht löschbar: `frei` (`-`) und `urlaub` (`U`).
- **Muster**: eine Folge von Schichtarten (1 bis 56 Tage) und ein Startdatum für Tag 1. Eingabe durch Antippen der Kürzel, Vorschau als Leiste.
- **Monatskalender**: Kürzel auf Farbfläche je Tag, heute markiert, Monat vor und zurück, Sprung zu heute.
- **Ausnahmen**: Tag antippen, andere Schichtart, `frei` oder `urlaub` setzen. Einzeln zurücksetzbar, im Kalender mit Punkt markiert.
- **Monatsübersicht**: Anzahl je Schichtart, Urlaubs- und freie Tage, Arbeitsstunden als Spanne (netto mit Pause bis brutto ohne Pause).
- **ICS-Export**: Zeitraum wählbar (Standard heute plus 3 Monate, höchstens 24 Monate), ein Termin je Arbeitstag, Urlaub als Ganztag, freie Tage ohne Termin.
- **Sicherung**: alle Daten als JSON-Datei exportieren und importieren.
- **Beispiel** beim ersten Start: Muster `F F S S N N - - - -` ab Montag der laufenden Woche, dazu im Team die erfundenen Personen Alex (Muster ab Montag plus 4 Tage) und Sam (plus 7 Tage), alles als `Beispiel` markiert, mit einem Klick entfernbar.
- Installierbare PWA, voll offline, hell und dunkel nach Systemeinstellung.

## Funktionen v3: Team direkt in der App

Wunsch aus dem zweiten Betreibertest: Die Oberfläche war zu umständlich, und man soll nicht für jeden Schritt Links verschicken müssen, sondern alles in der App erledigen. Umgesetzt **ohne Server**: Das Team liegt komplett auf diesem Gerät. Wer den Plan für sich und andere führt (zum Beispiel die Person, die im Team die Tausche koordiniert, oder jede für sich), braucht keinen einzigen Link.

- **Personen anlegen** im Team-Screen: Name (1 bis 40 Zeichen), Startdatum und Folge, mit Knopf `wie mein muster` und Vorschau der nächsten 14 Tage. Bearbeiten und entfernen jederzeit. Kein Name und kein Teamname für dich nötig.
- **Wochenplan des Teams**: Zeile `du` plus alle Personen. Jede Zelle antippen öffnet das Tagesblatt dieser Person: Schicht ändern (Ausnahme), `zurücksetzen`, `tauschen`, `an … abgeben`, `person bearbeiten`.
- **Tauschen mit zwei Fingertipps**: `tauschen` markiert die Schicht, im Raster sind alle Schichten anderer Personen ab heute als Ziel markiert (auch andere Tage und Wochen). Ziel antippen, Rückfrage mit beiden Schichten und Warnungen, `tauschen`. Beide Pläne ändern sich sofort. Tausch auch zwischen zwei anderen Personen.
- **Abgeben** ohne Gegenschicht direkt aus dem Tagesblatt.
- **Liste `getauscht`** mit `rückgängig`, solange an den beiden Tagen seither nichts geändert wurde.
- **Kalender**: Karte `heute` mit Schicht und Zeiten, die nächsten 7 Tage, nächstes freies Wochenende, nächster freier Tag und wer aus dem Team heute Dienst hat. Kalendertage vollflächig in der Farbe der Schicht, vergangene Tage blasser.
- **Links bleiben optional** unter `mit anderen geräten abgleichen`: Nutzt jemand schicht. auf dem eigenen Handy, geht der eigene Plan weiter als Link (v2 unten). Personen von anderen Geräten tragen den Stand, ein Tausch mit ihnen steht sofort hier und bei Bedarf als Anfrage-Link dort.

## Robustheit v4: Anlegen in jedem Browser

Wunsch aus dem dritten Betreibertest: In Brave ließ sich nichts anlegen. Ursachen, die die App jetzt abfängt:

- **Browser ohne `showModal`** (ältere WebKit-Versionen, also auch Brave und andere Browser auf älteren iPhones): Ohne Dialog öffnet sich weder `person hinzufügen` noch `schichtart anlegen` noch das Tagesblatt. Die App rüstet dann einen einfachen Ersatz nach (Dialog fest am Rand, abgedunkelter Hintergrund, Escape schließt).
- **Speicher blockiert** (etwa Brave Shields mit blockierten Cookies und Websitedaten): Anlegen klappt, ist nach dem Neuladen aber weg. `speicherTesten` prüft beim Start mit Schreiben, Lesen und Löschen eines Probeschlüssels. Scheitert das, steht oben dauerhaft ein Hinweis, was zu tun ist.
- **Alte `logik.js` aus dem HTTP-Cache** neben einer neuen Seite: Der Service Worker holt Seite und Logik mit `cache: 'no-cache'` aus dem Netz.

## Oberfläche v5: komplett neu aufgebaut

Wunsch aus dem vierten Betreibertest: die Oberfläche komplett neu aufbauen. Funktionen und Daten bleiben gleich, alte Speicherstände und Sicherungen laufen weiter.

- **Vier Bereiche** statt vorher kalender, muster, team, export: `heute`, `monat`, `team`, `einrichten`. Navigation unten mit Linien-Icons.
- **heute** ist der Start: große Karte in der Farbe der heutigen Schicht (antippen öffnet das Tagesblatt), Kacheln für nächsten Dienst, nächsten freien Tag, freies Wochenende, Stunden im Monat und wer aus dem Team heute Dienst hat, dazu die nächsten 14 Tage als Liste mit Zeiten und Wochentrennern.
- **Erster Start ohne Rhythmus**: Startkarte mit Datum für Tag 1 und fünf Vorlagen (`VORLAGEN`), ein Tipp trägt den Rhythmus ein. Oder `selbst eintragen`.
- **Rhythmus-Editor** (in `einrichten` und im Personendialog gleich): Schicht wählen, dann Tage antippen. Jeder Tag der Folge ist ein Feld mit Nummer und lässt sich einzeln ändern, `+` hängt an, `letzten tag entfernen`, `leeren`. Vorlagen auch später unter `vorlage übernehmen`.
- **Bearbeiten ohne Extraknöpfe**: Schichtart oder Person antippen öffnet den Dialog, `löschen` bzw. `entfernen` steht im Dialog.
- **Dialoge als Blatt von unten** mit Griff und Schließen-Knopf, am Rechner mittig. Der Ersatz für Browser ohne `showModal` bleibt.
- `einrichten` enthält Rhythmus, Vorschau, Schichtarten, ICS-Datei, Sicherung und `alles löschen`.

## Funktionen v2: Team und Schichttausch per Link (jetzt optional)

Mehrere Geräte gleichen sich **ohne Server und ohne Konto** ab: Jeder Link trägt seine Daten selbst im Fragment (`#t=...`), das der Browser nie an den Webserver schickt. Die Links reisen über den Weg, den die Leute ohnehin nutzen (Gruppenchat, Messenger, Mail).

- **Team**: eigener Name und Teamname (je 1 bis 40 Zeichen), dazu zufällige IDs für Person und Team. Ein Team pro Gerät. Ein Link aus einem anderen Team fragt nach, ob gewechselt werden soll, dabei fallen Personen und Tausche des alten Teams weg.
- **Plan teilen** (Einladungslink): Link vom Typ `plan` mit Team, Person, Stand (Datum) und Plan-Ausschnitt. Wer ihn öffnet, hat die Person im Team. Ein älterer Stand überschreibt nie einen neueren. Den eigenen Link öffnen ändert nichts.
- **Wochenansicht Team**: Zeilen du plus alle Personen, Spalten Mo bis So, Kürzel in den Farben der jeweiligen Person, Ausnahmen mit Punkt, Woche vor und zurück. Antippen der eigenen Schicht oder einer fremden öffnet die Tauschanfrage vorbelegt. Auch aus dem Tagesblatt im Kalender.
- **Tausch anfragen**: Person, Tag zum Abgeben, dafür eine Schicht der Person übernehmen (gleicher oder anderer Tag) oder nur abgeben. Link vom Typ `tausch` mit Anfrage und eigenem Plan.
- **Annehmen oder ablehnen**: Öffnen zeigt die Anfrage. Vorher Prüfung, ob der eigene Plan noch passt. Annehmen trägt den Tausch als Ausnahmen ein und erzeugt den Link vom Typ `antwort`, ablehnen ebenso, nur ohne Änderung.
- **Antwort eintragen**: Öffnen bei der fragenden Person zeigt die Antwort, nach Bestätigung stehen die Ausnahmen auch dort. Jede Antwort wird höchstens einmal eingetragen.
- **Tauschliste** mit Status `gesendet`, `eingegangen`, `angenommen`, `abgelehnt`, Link erneut teilen, Eintrag löschen.
- Teilen über `navigator.share`, sonst Kopieren.

## Nicht-Ziele

- Kein Konto, kein Server, keine automatische Synchronisation, keine Cloud. Pläne von anderen Geräten sind Momentaufnahmen. Ein Tausch in der App ändert nur die Pläne auf diesem Gerät.
- Keine Dienstplanung durch Arbeitgeber, keine Freigabe durch eine Leitung, keine Rollen, keine Signatur der Links.
- Keine Prüfung von Ruhezeiten oder Arbeitsrecht, keine Lohn-, Zuschlags- oder Überstundenrechnung.
- Keine mehreren Muster nacheinander (Musterwechsel ab Datum), keine Feiertage.
- Kein ICS-Import, kein Abo-Link, keine Erinnerungen oder Push-Nachrichten.

## Datenmodell

Speicher: `localStorage`, Schlüssel `schicht.daten`, ein JSON-Objekt:

```json
{
  "version": 1,
  "beispiel": true,
  "schichtarten": [
    { "id": "F", "name": "früh", "farbe": "gelb", "beginn": "06:00", "ende": "14:00", "pauseMin": 30 },
    { "id": "S", "name": "spät", "farbe": "orange", "beginn": "14:00", "ende": "22:00", "pauseMin": 30 },
    { "id": "N", "name": "nacht", "farbe": "blau", "beginn": "22:00", "ende": "06:00", "pauseMin": 30 }
  ],
  "muster": { "start": "2026-01-05", "folge": ["F","F","S","S","N","N","-","-","-","-"] },
  "ausnahmen": { "2026-02-10": "U" }
}
```

- `-` (frei) und `U` (urlaub) sind feste IDs ohne Zeiten und stehen nicht in `schichtarten`.
- Datum als `YYYY-MM-DD`, Zeit als `HH:MM`. Ende kleiner oder gleich Beginn heißt: Ende am Folgetag. Eine Schicht gehört zu dem Tag, an dem sie beginnt.
- Wird eine Schichtart gelöscht, die in Muster oder Ausnahmen vorkommt: Rückfrage, dann werden diese Stellen zu `-`.
- Sicherungsdatei `schicht-sicherung-YYYY-MM-DD.json` mit dem ganzen Objekt plus `"typ": "sicherung"`.
- Import prüft `typ`, Pflichtfelder, Datumsformat, Zeitformat und dass alle IDs in Muster und Ausnahmen existieren. Bei Fehler bleibt alles unverändert, die App nennt den Fehler. Überschreiben nur nach Rückfrage.
- `migriere(daten)` hebt ältere Versionen an. Unbekannte höhere Version: Import ablehnen mit Hinweis.
- Team unter Schlüssel `schicht.team`: `{ "version": 1, "ich": {id,name}|null, "team": {id,name,lokal?}|null, "mitglieder": [{id,name,stand,plan,lokal?,beispiel?}], "tausch": [{tid,von,an,gib,nimm,status,vorher?,nachher?}] }`. IDs `[a-z0-9]{8,32}`. `plan` = `{schichtarten, muster, ausnahmen}`. `gib` und `nimm` = `{datum, art}` mit der vollen Schichtart, `nimm` ist `null` bei nur abgeben. Höchstens 50 Tausche.
- `lokal: true` bei Personen, die in der App angelegt wurden. Ein Team mit `lokal: true` entsteht beim ersten Anlegen einer Person ohne echtes Team. Es behält seine Personen, wenn ein Teamname gespeichert wird oder der erste Plan-Link eines echten Teams kommt.
- Status `getauscht` (direkt in der App) und `zurueck` (rückgängig gemacht) neben `gesendet`, `eingegangen`, `angenommen`, `abgelehnt`. Bei `getauscht` stehen in `vorher` und `nachher` je Person (`a` gibt ab, `b` übernimmt) die Ausnahmen an den betroffenen Tagen, `null` heißt keine Ausnahme. Du selbst trägst ohne Namen die feste ID `ichselbst0`.
- Die Sicherung enthält das Team (ohne Beispiel) im Feld `team`. Fehlt es, bleibt das Team beim Import unverändert. Ist es kaputt, wird der ganze Import abgelehnt.
- Link: `adresse#t=` plus base64url (ohne `=`) von JSON in UTF-8, höchstens 16000 Zeichen. Gemeinsame Felder `typ` (`plan`, `tausch`, `antwort`), `v` (1), `team`, `person`, `stand`, `plan`. Dazu `tausch` (mit `tausch.von` gleich `person`) oder `tid` und `annahme`. Plan-Ausschnitt: Ausnahmen von heute minus 62 bis heute plus 400 Tage. Höhere `v`: ablehnen mit Hinweis.

## Rechenlogik

Reine Funktionen in `logik.js`, ohne DOM. Kalendertage nur über `Date.UTC`, damit Zeitumstellungen keinen Tag verschieben. Zeiten als Minuten ab Mitternacht.

- `tagesDiff(a, b)`: ganze Tage von a bis b, negativ wenn b vor a liegt.
- `musterIndex(datum, start, laenge)` = `((tagesDiff(start, datum) % laenge) + laenge) % laenge`.
- `schichtAm(datum, daten)`: Ausnahme, sonst `folge[musterIndex]`.
- `dauerMin(art)` = `(ende - beginn + 1440) % 1440`, bei 0 gilt 1440. Netto = Dauer minus Pause.
- `monatsSumme(jahr, monat, daten)`: Anzahl je ID, Stunden `{ netto, brutto }`.
- `icsText(von, bis, daten, jetzt)`: `VCALENDAR` mit `VERSION:2.0` und `PRODID`, ein `VEVENT` je Arbeitstag mit lokaler Zeit ohne Zeitzone (`DTSTART:20260105T060000`), `DTEND` am Folgetag bei Nacht, `UID:<datum>-<id>@schicht`, `DTSTAMP` aus `jetzt` in UTC, `SUMMARY` = Name. Urlaub als `DTSTART;VALUE=DATE` mit `DTEND` am Folgetag. Zeilenende CRLF, Faltung bei 75 Oktetten.

Handrechnungen mit dem Muster aus dem Datenmodell, Start 2026-01-05, ohne Ausnahmen:

1. **Einzeltage.** 2026-01-05: Diff 0, Index 0, `F`. 2026-01-09: Diff 4, `N`. 2026-03-01: Diff 55, Index 5, `N`. 2026-03-29 (Zeitumstellung): Diff 83, Index 3, `S`. 2026-01-01: Diff -4, Index 6, `-`.
2. **Januar 2026.** 1. bis 4. frei (Index 6 bis 9), 5. bis 14. und 15. bis 24. je ein voller Zyklus, 25. bis 31. Index 0 bis 6. Ergibt `F` 6, `S` 6, `N` 6, frei 13. Brutto 18 mal 8 h = 144 h, netto 18 mal 7,5 h = 135 h. Anzeige `135 bis 144 h`.
3. **Mit Ausnahme.** Ausnahme 2026-01-15 = `U` (sonst `F`). Januar: `F` 5, `S` 6, `N` 6, `U` 1, frei 13, Stunden `127,5 bis 136 h`.
4. **ICS 2026-01-09 bis 2026-01-10.** Zwei `VEVENT` mit `SUMMARY:nacht`: `20260109T220000` bis `20260110T060000` und `20260110T220000` bis `20260111T060000`, UIDs `2026-01-09-N@schicht` und `2026-01-10-N@schicht`.

Team und Tausch, reine Funktionen ebenfalls in `logik.js`:

- `zuB64url`, `ausB64url`, `linkErzeugen(basis, nutzlast)`, `linkLesen(text)` mit `pruefeNutzlast`.
- `planUebernehmen(zustand, nutzlast)`: Ergebnis `neu`, `aktualisiert`, `aelter`, `eigener` oder `anderesTeam`.
- `pruefeTauschAnfrage(meine, ihr, gibDatum, nimmDatum, heute)`: Fehler, wenn ein Tag in der Vergangenheit liegt, am Abgabetag keine Arbeitsschicht ist, die Person am Übernahmetag keine hat, oder am gleichen Tag gleiche Zeiten getauscht würden. Warnung, wenn ein Zieltag schon belegt ist.
- `pruefeTauschStand(daten, tausch, rolle)`: passt der eigene Plan noch (Zeiten der Schicht gleich, Zieltag frei)?
- `wendeTauschAn(daten, tausch, rolle)`. Rolle `von` (fragt): Abgabetag wird frei, außer bei gleichem Tag, Übernahmetag bekommt die fremde Schicht. Rolle `an` (nimmt an): eigener Tag wird frei, außer bei gleichem Tag oder nur abgeben, Abgabetag bekommt die fremde Schicht.
- `uebernimmArt(daten, art)`: gleiches Kürzel mit gleichen Zeiten, sonst gleiche Zeiten und Name, sonst gleiche Zeiten, sonst neu anlegen. Kürzel belegt: erster Buchstabe plus 2 bis 9.

Team in der App, ebenfalls in `logik.js`:

- `planVersetzt(daten, tage)`: eigenes Muster als Plan, Start um `tage` versetzt, ohne Ausnahmen.
- `mitgliedSpeichern(zustand, {id,name,plan}, heute)`: anlegen oder ersetzen, legt bei Bedarf das lokale Team an.
- `tauschDirekt(planA, planB, gibDatum, nimmDatum, heute, von, an, tid)`: gleiche Prüfung wie `pruefeTauschAnfrage`, dann `wendeTauschAn` mit Rolle `von` auf A und `an` auf B. Ergebnis beide neuen Pläne und der Eintrag mit `vorher` und `nachher`.
- `tauschZurueck(planA, planB, eintrag)`: setzt `vorher` zurück, nur wenn beide Pläne an den Tagen noch `nachher` zeigen.
- `speicherTesten(holeSpeicher)`: `true`, wenn ein Probeschlüssel geschrieben, gleich gelesen und gelöscht werden kann, sonst `false` (auch wenn schon der Zugriff wirft).
- `naechstesFreiesWochenende(heute, daten)`: erster Samstag ab heute (am Sonntag ab dem nächsten Samstag), an dem Samstag und Sonntag frei oder Urlaub sind, höchstens 53 Wochen, sonst `null`.

Neue Oberfläche, ebenfalls in `logik.js`:

- `VORLAGEN`: fünf Rhythmen nur aus `F`, `S`, `N` und frei: `2 früh, 2 spät, 2 nacht, 4 frei` (10 Tage), `3 früh, 3 spät, 3 nacht, 3 frei` (12), `woche früh, woche spät` (14), `woche früh, spät, nacht` (21), `montag bis freitag früh` (7).
- `vorlageAnwenden(daten, id, start)`: neue Folge und Start, gelöschte Standardarten aus der Vorlage werden wieder angelegt, Ausnahmen bleiben. Unbekannte Vorlage oder ungültiges Datum: `null`.
- `folgeSetzen(folge, index, id)`: Stelle setzen, `index` gleich Länge hängt an, höchstens 56, sonst Folge unverändert.
- `naechsterTag(heute, daten, arbeit, maxTage)`: erster Tag nach heute mit Arbeit (`true`) oder frei bzw. Urlaub (`false`), höchstens `maxTage` (Standard 60), sonst `null`.
- `agenda(heute, n, daten)`: die n Tage ab heute mit `{datum, id, ausnahme}`.

5. **base64url.** `{"typ":"plan","name":"Jörg"}` ergibt `eyJ0eXAiOiJwbGFuIiwibmFtZSI6IkrDtnJnIn0` (das `ö` als zwei Oktette `C3 B6`).
6. **Tausch an verschiedenen Tagen.** Max wie oben ab 2026-01-05, Erika gleiches Muster ab 2026-01-10. Erika am 06.01.: Diff -4, Index 6, frei. Am 12.01.: Diff 2, `S`. Max am 12.01.: Diff 7, frei. Max gibt 06.01. `F`, übernimmt 12.01. `S`. Danach Max: Ausnahmen `06.01. = -`, `12.01. = S`, Januar `F` 5, `S` 7, `N` 6, frei 13, `135 bis 144 h`. Erika vorher Januar `F` 7, `S` 6, `N` 6, frei 12 (01.01. hat Index 1). Danach `06.01. = F`, `12.01. = -`, Januar `F` 8, `S` 5, `N` 6, frei 12, `142,5 bis 152 h`.
7. **Gleicher Tag und nur abgeben.** 05.01.: Max `F`, Erika `N` (Index 5). Tausch am gleichen Tag: Max `N`, Erika `F`. Nur abgeben 06.01.: Max frei, Erika `F`.
8. **Tausch direkt und rückgängig.** Wie Rechnung 6, aber mit `tauschDirekt` auf beiden Plänen gleichzeitig: Max `06.01. = -`, `12.01. = S`, `135 bis 144 h`; Erika `06.01. = F`, `12.01. = -`, `142,5 bis 152 h`. `vorher` ist für beide an beiden Tagen `null`. `tauschZurueck` ergibt wieder leere Ausnahmen. Setzt Max danach den 12.01. auf `U`, lehnt `tauschZurueck` ab.
9. **Freies Wochenende.** Muster ab 2026-01-05, heute 05.01.: Samstage haben Index 5 (`N`, 10.01.), 2 (`S`, 17.01.), 9 (frei, 24.01., aber Sonntag 25.01. Index 0 `F`), 6 (31.01., Sonntag Index 7, beide frei). Ergebnis `2026-01-31`. Mit Urlaub am 10.01. (Sonntag 11.01. Index 6 frei): `2026-01-10`. Heute Sonntag 01.02.: nächste Samstage 07.02. Index 3, 14.02. Index 0, 21.02. Index 7 mit Sonntag Index 8, Ergebnis `2026-02-21`. Muster `F` allein: `null`.
10. **Nächster Tag.** Muster ab 2026-01-05, heute 05.01. (`F`): nächster freier Tag 11.01. (Index 6). Heute 11.01. (frei): nächster Dienst 15.01. (Index 0). Mit Urlaub am 06.01.: nächster freier Tag 06.01. Muster `F` allein: `null`.
11. **Vorlage 3 früh, 3 spät, 3 nacht, 3 frei** ab 2026-01-05. 01. bis 04.01. Index 8 bis 11 (`N`, frei, frei, frei), 05. bis 16. und 17. bis 28. je ein Zyklus, 29. bis 31. Index 0 bis 2 (`F`). Januar: `F` 9, `S` 6, `N` 7, frei 9. 22 Arbeitstage, `165 bis 176 h`.

## Screens

Handy zuerst: 390 px, eine Spalte, Navigation unten mit vier Icons und Beschriftung (heute, monat, team, einrichten). Ab 900 px zwei Spalten. Banner `Beispiel` mit `entfernen` oben über allen Bereichen.

1. **heute** (Start): große Karte der heutigen Schicht, Kacheln (nächster Dienst, nächster freier Tag, freies Wochenende, Stunden im Monat, heute im Dienst aus dem Team), Liste der nächsten 14 Tage. Ohne Rhythmus stattdessen die Startkarte mit Vorlagen.
2. **monat**: Monat und Jahr, Pfeile, `heute`. Raster Mo bis So, ganze Zelle in der Farbe der Schicht, frei ohne Kürzel, Ausnahmen mit Punkt, Vergangenes blasser. Daneben bzw. darunter Zähler je Schichtart, Urlaub, frei und Arbeitsstunden als Spanne.
3. **Tagesblatt** (aus heute, monat und team): Datum, Schicht als Farbfläche mit Zeiten und Hinweis auf Ausnahme, `tauschen` und `an … abgeben` (wenn es ein Team gibt), Auswahl der Schichtart, `zurück zum rhythmus`, bei Personen `person bearbeiten`.
4. **team**: Wochenansicht aller Personen mit Tauschmodus (Leiste oben fest mit Erklärung und `abbrechen`, Quelle markiert, Ziele gestrichelt, Rest blass). `personen` als Liste zum Antippen mit Mini-Leiste des Rhythmus, `person hinzufügen`, darunter `getauscht` mit `rückgängig`. Zugeklappt `mit anderen geräten abgleichen`: Name, Teamname, `meinen plan als link`, Hinweis, was Links verraten. Dialoge für Person (mit Rhythmus-Editor und `entfernen`), Rückfrage zum Tausch, Link teilen und eingehende Links.
5. **einrichten**: Rhythmus mit Startdatum und Editor, Vorschau, `vorlage übernehmen`, Schichtarten zum Antippen und `schichtart anlegen`, ICS-Datei mit Zeitraum und Anzahl der Termine, Sicherung exportieren und importieren, `alles löschen` mit Rückfrage.

## Testplan

- **Funktionstests** (Node, ohne Browser) für `logik.js`: alle vier Handrechnungen exakt. Dazu: Muster der Länge 1, Ausnahme schlägt Muster, Dauer bei Beginn gleich Ende ergibt 24 h, Tage über 29.03. und 25.10.2026 ohne verschobenen Tag, ICS mit CRLF und keiner Zeile über 75 Oktette, Urlaub als Ganztag, freie Tage ohne Termin, Migration, Import kaputter Dateien wird abgelehnt und ändert nichts.
- **Playwright** bei 390 und 1280 px: Erststart zeigt Beispiel, Beispiel entfernen, Muster `F F S S N N - - - -` ab 2026-01-05 eintragen, Januar 2026 zeigt die Summen aus Rechnung 2. Ausnahme am 15. setzen, Summen aus Rechnung 3. ICS-Download für 09. bis 10.01. enthält die Termine aus Rechnung 4. Sicherung exportieren, alles löschen, importieren ergibt gleiche Daten. Kein horizontales Scrollen, Screenshots hell und dunkel.
- **Team**: Rechnungen 5 bis 7 exakt, Link hin und zurück, kaputte, fremde, zu lange und zu neue Links abgelehnt, Stand-Logik, Schichtart übernehmen mit Kollision, Sicherung mit Team. Im Browser mit zwei getrennten Profilen: A teilt Plan, B öffnet und teilt zurück, A fragt Tausch an, B nimmt an, A trägt ein, zweites Öffnen der Antwort trägt nicht doppelt ein.
- **Team in der App**: Rechnungen 8 und 9 exakt, Person anlegen und ändern, lokales Team bleibt bei Teamname und erstem Link erhalten, Beispielpersonen bleiben bis `entfernen`. Im Browser bei 390 und 1280 px: Person anlegen, eigene Schicht antippen, `tauschen`, Ziel antippen, bestätigen, Eintrag `getauscht`, `rückgängig` ergibt `zurück`, kein waagerechtes Scrollen, keine Fehler in der Konsole.
- **Oberfläche v5**: Rechnungen 10 und 11 exakt, `folgeSetzen` an Rändern, alle Vorlagen ergeben gültige Daten. Im Browser bei 390 (hell und dunkel) und 1280 px: alle vier Bereiche ohne waagerechtes Scrollen, Rhythmus mit dem Editor eintragen und eine Stelle mitten in der Folge ändern, Januar 2026 zeigt Rechnung 2 und 3, Person anlegen, Tausch über die Wochengrenze, `rückgängig`, keine Fehler in der Konsole.
- **Robustheit**: `speicherTesten` mit funktionierendem, werfendem, vollem und stummem Speicher. Im Browser einmal ohne `showModal` und einmal mit werfendem `localStorage`: Person und Schichtart anlegen, Tagesblatt öffnen und schließen, Hinweis nur im zweiten Fall sichtbar, keine Fehler in der Konsole.
- **Offline**: nach dem ersten Laden Netz aus, neu laden, alle Funktionen inklusive ICS-Download laufen.
- **Keine externen Requests**: jeder Request außerhalb des eigenen Ursprungs lässt den Test scheitern.

## Risiken

- **Zeitzonen und Sommerzeit**: Datum um einen Tag verschoben. Gegenmittel: nur UTC-Kalendertage, Tests über beide Umstellungstage. Nachtschichten in der Umstellungsnacht dauern real 7 oder 9 h, die Übersicht rechnet mit Planzeiten und sagt das in einem Satz.
- **Musterwechsel**: Ändert jemand Muster oder Startdatum, ändert sich auch die Vergangenheit. Hinweis im Muster-Screen, vorher Sicherung anbieten. Musterwechsel ab Datum bleibt für später.
- **ICS-Kompatibilität**: Kalender-Apps führen erneute Importe unterschiedlich zusammen. Feste UIDs, strikt RFC 5545, Hinweis zum Löschen alter Termine vor neuem Import.
- **Datenverlust**: localStorage kann geleert werden. Gegenmittel: `navigator.storage.persist()` und Hinweis auf die Sicherung.
- **Team auf einem Gerät**: Wer Personen in der App führt, sieht nur, was dort eingetragen ist. Tauscht eine Person auf eigenem Weg, merkt die App das nicht. Gegenmittel: Tagesblatt für jede Person, Ausnahmen mit Punkt, Liste `getauscht` mit `rückgängig`.
- **Team über Geräte**: Pläne veralten, wenn niemand neu teilt. Eine Antwort, die nie ankommt, lässt den Tausch einseitig stehen. Gegenmittel: Stand je Person sichtbar, Tauschliste mit Status, Link erneut teilen, Prüfung des eigenen Plans vor jedem Eintrag.
- **Links verraten den Plan**: wer den Link hat, liest Name und Schichten. Fragment geht nicht an den Webserver, wohl aber durch den Messenger. Hinweis im Team-Screen und im README. Keine Signatur: gefälschte Links sind möglich, schicht. prüft nur Aufbau und Zusammenhang.
- **Scope-Druck**: Wünsche nach Leitungsfreigabe, Ruhezeitprüfung, Lohn, Feiertagen. Bleiben Nicht-Ziele.
