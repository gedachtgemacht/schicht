# schicht.

**Welche Schicht habe ich am 14. März?** schicht. zeigt es dir, nachdem du dein Muster einmal eingetragen hast.

Wer in Wechselschicht arbeitet, will schnell wissen, was an einem Tag ansteht, wann das nächste freie Wochenende kommt und wie viele Nächte dieser Monat hat. Schichtkalender-Apps zeigen dafür oft Werbung, wollen ein Konto oder legen Muster, Kalender-Export und Statistik hinter einen Pro-Kauf oder ein Abo. schicht. ist ein Schichtkalender ohne das alles: Du trägst dein Wiederholmuster ein, der Kalender zeigt Früh, Spät, Nacht, frei und Urlaub, und eine Datei bringt den Plan in deinen Gerätekalender.

Reine Rechnung, keine KI, kein Server. Alles bleibt auf deinem Handy.

<p align="center">
  <img src="bilder/1-uebersicht.png" width="240" alt="">
  <img src="bilder/2-breit.png" width="480" alt="">
</p>

## Warum

Bezahlte Schichtkalender-Apps kosten je nach Anbieter etwa 3 bis 10 Euro oder ein Abo, zeigen Werbung oder verlangen ein Konto für Cloud-Sync. Offene Alternativen gibt es kaum, und wenn, dann nur für Android, ohne Muster-Rechnung und ohne Kalender-Export. schicht. macht nur das eine: deinen eigenen Schichtplan zeigen, zählen und exportieren.

## Funktionen

- **Schichtarten** mit Kürzel (1 bis 2 Zeichen), Name, Farbe, Beginn, Ende und Pause. Vorbelegt sind Früh, Spät und Nacht. `frei` und `urlaub` sind fest eingebaut
- **Rhythmus** (Muster): eine Folge von 1 bis 56 Tagen und ein Startdatum für Tag 1. Fünf Vorlagen für häufige Rhythmen zum Start, danach Schicht wählen und Tage antippen, auch mitten in der Folge. Dazu eine Vorschau der nächsten 14 Tage
- **Heute auf einen Blick**: deine Schicht groß in ihrer Farbe, nächster Dienst, nächster freier Tag, nächstes freies Wochenende, Stunden im Monat, wer aus dem Team heute Dienst hat und die nächsten 14 Tage als Liste
- **Monatskalender**: jeder Tag in der Farbe seiner Schicht, heute markiert, vergangene Tage blasser, Monat vor und zurück, Sprung zu heute
- **Ausnahmen**: Tag antippen und eine andere Schichtart, `frei` oder `urlaub` setzen. Im Kalender mit Punkt markiert, einzeln zurücksetzbar
- **Monatsübersicht**: Anzahl je Schichtart, Urlaubs- und freie Tage, Arbeitsstunden als Spanne (netto mit Pause bis brutto ohne Pause)
- **ICS-Export** für den Gerätekalender: Zeitraum wählbar, höchstens 24 Monate, ein Termin je Arbeitstag, Urlaub als ganzer Tag, freie Tage ohne Termin
- **Team in der App**: Kolleginnen und Kollegen mit Name und Rhythmus anlegen (`wie mein rhythmus`, dann Startdatum verschieben), alle Pläne nebeneinander in der Wochenansicht. Kein Link, kein Konto, kein Server
- **Schichttausch mit zwei Fingertipps**: Schicht antippen, `tauschen`, die Schicht der anderen Person antippen, bestätigen. Beide Pläne ändern sich sofort, auch an verschiedenen Tagen und zwischen zwei anderen Personen. Abgeben ohne Gegenschicht geht direkt aus dem Tagesblatt. Jeder Tausch lässt sich rückgängig machen, solange an den Tagen seither nichts geändert wurde
- **Optional über mehrere Geräte**: Nutzt jemand schicht. auf dem eigenen Handy, schickst du deinen Plan als Link. Wer ihn öffnet, hat dich im Team. Auch ein Tausch lässt sich als Anfrage-Link schicken, die Antwort kommt als Link zurück, und schicht. prüft vorher, ob der Plan noch passt
- **Sicherung** aller Daten als JSON-Datei inklusive Team, Import mit Prüfung, bei einer kaputten Datei bleibt alles unverändert
- **Beispiel** beim ersten Start mit zwei erfundenen Personen im Team, als `Beispiel` markiert und mit einem Klick entfernbar
- Hell und dunkel, funktioniert offline, installierbar als App

Bewusst nicht dabei: Konto, Server und automatische Synchronisation (das widerspricht dem Prinzip, dass alles auf deinem Gerät bleibt), Dienstplanung durch Arbeitgeber, Freigabe durch eine Leitung, Prüfung von Ruhezeiten oder Arbeitsrecht, Lohn- und Zuschlagsrechnung, Feiertage, Musterwechsel ab Datum, ICS-Import, Erinnerungen.

## Datenschutz

Nichts verlässt dein Gerät. schicht. hat keinen Server, kein Konto, keine Analyse, keine Werbung und lädt nichts aus dem Netz nach, auch keine Schriften. Muster, Ausnahmen, Schichtarten und die Personen im Team liegen nur im lokalen Speicher deines Browsers (`localStorage`). Exporte, Sicherungen und Team-Links entstehen nur, wenn du sie selbst auslöst, und gehen nur dorthin, wohin du sie schickst.

Weil die Daten nur im Browser liegen: Wer die Websitedaten löscht, löscht auch seinen Plan. Mach deshalb ab und zu eine Sicherung.

Team-Links enthalten deinen Namen, deine Schichtarten, dein Muster und deine Ausnahmen von etwa zwei Monaten zurück bis gut ein Jahr voraus. Die Daten stehen im Teil der Adresse hinter `#`, den der Browser nie an den Webserver schickt. Sie reisen aber über den Weg, den du wählst (Messenger, Mail), und wer den Link hat, kann den Plan lesen. Teil ihn nur mit deinem Team. Die Links sind nicht signiert: schicht. prüft Aufbau und Zusammenhang, kann aber nicht beweisen, wer einen Link erstellt hat.

## Installation

schicht. ist eine statische Web-App. Es gibt keinen Build-Schritt und keine Abhängigkeiten.

1. Den Ordner auf einen beliebigen statischen Host legen (eigener Webspace, GitHub Pages, Netlify, ein Raspberry Pi). Für die Installation als App ist HTTPS nötig.
2. Die Adresse im Handybrowser öffnen.
3. Im Browsermenü **Zum Startbildschirm hinzufügen** wählen. Danach startet schicht. wie eine App und funktioniert auch ohne Netz.

Lokal testen:

```
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

## Wie gerechnet wird

Die Rechenfunktionen stehen als reine Funktionen in `logik.js`, ohne DOM. Kalendertage werden nur über `Date.UTC` gerechnet, damit eine Zeitumstellung keinen Tag verschiebt.

**1. Welche Schicht an einem Tag?** Gibt es für den Tag eine Ausnahme, gilt sie. Sonst gilt `folge[index]` mit `index = ((Tage seit Start) mod Länge + Länge) mod Länge`. Dadurch funktioniert das Muster auch vor dem Startdatum.
Beispiel mit `F F S S N N - - - -` ab 5.1.2026: Der 9.1. liegt 4 Tage nach dem Start, Index 4, also `N`. Der 1.1. liegt 4 Tage davor, Index 6, also frei.

**2. Dauer.** Dauer = (Ende minus Beginn + 24 h) mod 24 h. Sind Beginn und Ende gleich, zählt die Schicht 24 h. Netto = Dauer minus Pause. Ende kleiner oder gleich Beginn heißt: Ende am Folgetag. Eine Schicht gehört zu dem Tag, an dem sie beginnt.

**3. Monatsübersicht.** Gezählt wird je Schichtart, dazu Urlaub und frei. Die Stunden sind eine Spanne: unten netto (mit Pause), oben brutto (ohne Pause). Urlaub und freie Tage zählen keine Stunden.
Beispiel Januar 2026 mit dem Muster oben: 18 Arbeitstage, brutto 18 mal 8 h = 144 h, netto 18 mal 7,5 h = 135 h. Angezeigt wird `135 bis 144 h`.

**4. ICS-Datei.** Ein `VEVENT` je Arbeitstag mit lokaler Zeit ohne Zeitzone, bei Nachtschichten mit Ende am Folgetag. Urlaub wird ein ganztägiger Termin. Die UID ist fest (`datum-kürzel@schicht`), Zeilenenden sind CRLF, lange Zeilen werden bei 75 Oktetten gefaltet.

**5. Team-Links.** Ein Link ist `adresse#t=` plus JSON in UTF-8, kodiert als base64url ohne `=`. Typen: `plan` (dein Plan), `tausch` (Anfrage plus dein Plan), `antwort` (angenommen oder abgelehnt plus Plan der antwortenden Person). Jeder Link wird vor der Übernahme vollständig geprüft. Ein älterer Plan überschreibt nie einen neueren.

**6. Tausch.** Max hat `F F S S N N - - - -` ab 5.1.2026, Erika das gleiche Muster ab 10.1.2026. Max gibt den 6.1. (früh) ab und übernimmt dafür Erikas 12.1. (spät). Danach: Max am 6.1. frei, am 12.1. spät, Januar `F` 5, `S` 7, `N` 6, weiter `135 bis 144 h`. Erika am 6.1. früh, am 12.1. frei, Januar `F` 8, `S` 5, `N` 6, weiter `142,5 bis 152 h`. Gibt es die fremde Schichtart im eigenen Plan nicht (gleiche Zeiten), wird sie angelegt.

**7. Tausch in der App.** Gleiche Rechnung wie 6, nur auf beiden Plänen gleichzeitig. schicht. merkt sich, welche Ausnahmen an den beiden Tagen vorher und nachher galten. `rückgängig` stellt den Zustand von vorher wieder her, aber nur, wenn beide Pläne an den Tagen noch genau so aussehen wie direkt nach dem Tausch.

**8. Freies Wochenende.** Gesucht wird ab dem nächsten Samstag (am Samstag selbst ab heute) der erste Samstag, an dem Samstag und Sonntag frei oder Urlaub sind, höchstens ein Jahr voraus. Mit dem Muster oben und heute 5.1.2026 ist das der 31.1.

**Grenzen.** Ein Team in der App kennt nur, was auf diesem Gerät eingetragen ist. Ein Tausch ändert die Pläne hier, nicht auf den Handys der anderen. Pläne von anderen Geräten sind Momentaufnahmen und werden nur aktuell, wenn jemand seinen Link neu schickt. Nimmt eine Person an, die Antwort kommt aber nie an, steht der Tausch nur bei ihr. Die Übersicht rechnet mit Planzeiten. Eine Nachtschicht über die Zeitumstellung dauert real eine Stunde mehr oder weniger. Ändert man Muster oder Startdatum, ändert sich auch die Vergangenheit. Wie sich Kalender-Apps beim erneuten Import gleicher Termine verhalten, ist unterschiedlich: Lösch vor einem neuen Import die alten Termine.

Getestet wird mit Node, ohne Browser und ohne Pakete:

```
node --test test-calc.js
```

## Lizenz

GNU Affero General Public License v3.0 (AGPL-3.0), siehe `LICENSE`.

---

**gedacht.gemacht.** Kleine, ehrliche Software. Alles bleibt auf deinem Gerät.
