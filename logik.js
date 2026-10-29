/* schicht. Rechenlogik, reine Funktionen ohne DOM. Läuft in Node und im Browser.
   Kalendertage nur über Date.UTC, Zeiten als Minuten ab Mitternacht. */
(function (root) {
  'use strict';

  var TAG_MS = 86400000;
  var FREI = '-';
  var URLAUB = 'U';
  var VERSION = 1;
  var PALETTE = ['gelb', 'orange', 'rot', 'rosa', 'lila', 'blau', 'tuerkis', 'gruen', 'grau'];
  var FEST = {
    '-': { id: '-', name: 'frei', farbe: null, fest: true },
    'U': { id: 'U', name: 'urlaub', farbe: 'gruen', fest: true }
  };

  var DATUM_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var ZEIT_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  function istDatum(s) {
    if (typeof s !== 'string') return false;
    var m = DATUM_RE.exec(s);
    if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }

  function istZeit(s) { return typeof s === 'string' && ZEIT_RE.test(s); }

  function utc(s) {
    var m = DATUM_RE.exec(s);
    if (!m) throw new Error('ungültiges Datum: ' + s);
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }

  function datumAusUtc(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + '-' + zwei(d.getUTCMonth() + 1) + '-' + zwei(d.getUTCDate());
  }

  /* Kalendertag aus einem lokalen Date, z. B. "heute" im Browser */
  function datumLokal(d) {
    return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate());
  }

  function datumAus(jahr, monat, tag) { return datumAusUtc(Date.UTC(jahr, monat - 1, tag)); }

  function tagesDiff(a, b) { return Math.round((utc(b) - utc(a)) / TAG_MS); }

  function plusTage(datum, n) { return datumAusUtc(utc(datum) + n * TAG_MS); }

  /* Monate addieren, Tag wird auf das Monatsende gekappt (31.01. plus 1 = 28.02.) */
  function plusMonate(datum, n) {
    var m = DATUM_RE.exec(datum);
    var j = +m[1], mo = +m[2] - 1 + n, t = +m[3];
    var zj = j + Math.floor(mo / 12), zm = ((mo % 12) + 12) % 12;
    var letzter = new Date(Date.UTC(zj, zm + 1, 0)).getUTCDate();
    return datumAusUtc(Date.UTC(zj, zm, Math.min(t, letzter)));
  }

  /* 0 = Montag bis 6 = Sonntag */
  function wochentag(datum) { return (new Date(utc(datum)).getUTCDay() + 6) % 7; }

  function montagDerWoche(datum) { return plusTage(datum, -wochentag(datum)); }

  function tageImMonat(jahr, monat) { return new Date(Date.UTC(jahr, monat, 0)).getUTCDate(); }

  function zeitMin(s) {
    var m = ZEIT_RE.exec(s);
    if (!m) throw new Error('ungültige Zeit: ' + s);
    return +m[1] * 60 + +m[2];
  }

  function minZeit(min) { return zwei(Math.floor(min / 60) % 24) + ':' + zwei(min % 60); }

  function musterIndex(datum, start, laenge) {
    return ((tagesDiff(start, datum) % laenge) + laenge) % laenge;
  }

  function schichtAm(datum, daten) {
    var aus = daten.ausnahmen || {};
    if (Object.prototype.hasOwnProperty.call(aus, datum)) return aus[datum];
    return musterAm(datum, daten);
  }

  /* leeres Muster (nach "beispiel entfernen") heißt: alles frei */
  function musterAm(datum, daten) {
    var f = daten.muster.folge;
    if (!f.length) return FREI;
    return f[musterIndex(datum, daten.muster.start, f.length)];
  }

  function istAusnahme(datum, daten) {
    return Object.prototype.hasOwnProperty.call(daten.ausnahmen || {}, datum);
  }

  function art(id, daten) {
    if (FEST[id]) return FEST[id];
    for (var i = 0; i < daten.schichtarten.length; i++) {
      if (daten.schichtarten[i].id === id) return daten.schichtarten[i];
    }
    return null;
  }

  function istArbeit(id) { return id !== FREI && id !== URLAUB; }

  function dauerMin(a) {
    var d = (zeitMin(a.ende) - zeitMin(a.beginn) + 1440) % 1440;
    return d === 0 ? 1440 : d;
  }

  function nettoMin(a) { return Math.max(0, dauerMin(a) - (a.pauseMin || 0)); }

  /* monat 1 bis 12. anzahl je ID inklusive "-" und "U", stunden in h */
  function monatsSumme(jahr, monat, daten) {
    var anzahl = {};
    daten.schichtarten.forEach(function (a) { anzahl[a.id] = 0; });
    anzahl[FREI] = 0;
    anzahl[URLAUB] = 0;
    var netto = 0, brutto = 0;
    var n = tageImMonat(jahr, monat);
    for (var t = 1; t <= n; t++) {
      var id = schichtAm(datumAus(jahr, monat, t), daten);
      anzahl[id] = (anzahl[id] || 0) + 1;
      if (istArbeit(id)) {
        var a = art(id, daten);
        if (a) { brutto += dauerMin(a); netto += nettoMin(a); }
      }
    }
    return { anzahl: anzahl, tage: n, stunden: { netto: netto / 60, brutto: brutto / 60 } };
  }

  function zahlText(h) {
    var r = Math.round(h * 100) / 100;
    return String(r).replace('.', ',');
  }

  function stundenText(st) {
    if (st.netto === st.brutto) return zahlText(st.brutto) + ' h';
    return zahlText(st.netto) + ' bis ' + zahlText(st.brutto) + ' h';
  }

  /* ICS nach RFC 5545 */
  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function oktette(ch) {
    var c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  /* Zeilen über 75 Oktette falten, ohne UTF-8-Zeichen zu zerteilen */
  function falte(zeile) {
    var teile = [], akt = '', len = 0, max = 75;
    for (var ch of zeile) {
      var o = oktette(ch);
      if (len + o > max) {
        teile.push(akt);
        akt = ' ';
        len = 1;
      }
      akt += ch;
      len += o;
    }
    teile.push(akt);
    return teile.join('\r\n');
  }

  function icsDatum(datum) { return datum.replace(/-/g, ''); }

  function icsStempel(jetzt) {
    return jetzt.getUTCFullYear() + zwei(jetzt.getUTCMonth() + 1) + zwei(jetzt.getUTCDate()) + 'T' +
      zwei(jetzt.getUTCHours()) + zwei(jetzt.getUTCMinutes()) + zwei(jetzt.getUTCSeconds()) + 'Z';
  }

  function icsTermine(von, bis, daten) {
    var liste = [];
    var n = tagesDiff(von, bis);
    for (var i = 0; i <= n; i++) {
      var d = plusTage(von, i);
      var id = schichtAm(d, daten);
      if (id === FREI) continue;
      var a = art(id, daten);
      if (!a) continue;
      liste.push({ datum: d, id: id, art: a });
    }
    return liste;
  }

  function icsAnzahl(von, bis, daten) { return icsTermine(von, bis, daten).length; }

  function icsText(von, bis, daten, jetzt) {
    var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//gedacht.gemacht//schicht.//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    var stempel = icsStempel(jetzt);
    icsTermine(von, bis, daten).forEach(function (t) {
      z.push('BEGIN:VEVENT');
      z.push('UID:' + t.datum + '-' + t.id + '@schicht');
      z.push('DTSTAMP:' + stempel);
      if (t.id === URLAUB) {
        z.push('DTSTART;VALUE=DATE:' + icsDatum(t.datum));
        z.push('DTEND;VALUE=DATE:' + icsDatum(plusTage(t.datum, 1)));
        z.push('TRANSP:TRANSPARENT');
      } else {
        var b = zeitMin(t.art.beginn);
        var e = b + dauerMin(t.art);
        var endTag = plusTage(t.datum, Math.floor(e / 1440));
        z.push('DTSTART:' + icsDatum(t.datum) + 'T' + minZeit(b).replace(':', '') + '00');
        z.push('DTEND:' + icsDatum(endTag) + 'T' + minZeit(e % 1440).replace(':', '') + '00');
      }
      z.push('SUMMARY:' + icsEscape(t.art.name));
      z.push('END:VEVENT');
    });
    z.push('END:VCALENDAR');
    return z.map(falte).join('\r\n') + '\r\n';
  }

  /* Zeitraum für den Export: bis nicht vor von, höchstens 24 Monate */
  function pruefeZeitraum(von, bis) {
    if (!istDatum(von) || !istDatum(bis)) return 'Bitte zwei gültige Daten wählen.';
    if (tagesDiff(von, bis) < 0) return 'Das Ende liegt vor dem Anfang.';
    if (tagesDiff(plusMonate(von, 24), bis) > 0) return 'Höchstens 24 Monate auf einmal.';
    return null;
  }

  function standardArten() {
    return [
      { id: 'F', name: 'früh', farbe: 'gelb', beginn: '06:00', ende: '14:00', pauseMin: 30 },
      { id: 'S', name: 'spät', farbe: 'orange', beginn: '14:00', ende: '22:00', pauseMin: 30 },
      { id: 'N', name: 'nacht', farbe: 'blau', beginn: '22:00', ende: '06:00', pauseMin: 30 }
    ];
  }

  function beispielDaten(heute) {
    return {
      version: VERSION,
      beispiel: true,
      schichtarten: standardArten(),
      muster: { start: montagDerWoche(heute), folge: ['F', 'F', 'S', 'S', 'N', 'N', '-', '-', '-', '-'] },
      ausnahmen: {}
    };
  }

  function leereDaten(heute) {
    return {
      version: VERSION,
      beispiel: false,
      schichtarten: standardArten(),
      muster: { start: montagDerWoche(heute), folge: [] },
      ausnahmen: {}
    };
  }

  function kopie(o) { return JSON.parse(JSON.stringify(o)); }

  /* Ausnahme setzen. Gleicht sie dem Muster, wird sie entfernt. */
  function setzeAusnahme(daten, datum, id) {
    var d = kopie(daten);
    if (id === null || id === undefined || musterAm(datum, d) === id) delete d.ausnahmen[datum];
    else d.ausnahmen[datum] = id;
    return d;
  }

  function artVerwendet(daten, id) {
    var n = daten.muster.folge.filter(function (x) { return x === id; }).length;
    Object.keys(daten.ausnahmen).forEach(function (k) { if (daten.ausnahmen[k] === id) n++; });
    return n;
  }

  function loescheArt(daten, id) {
    if (FEST[id]) throw new Error('feste Schichtart');
    var d = kopie(daten);
    d.schichtarten = d.schichtarten.filter(function (a) { return a.id !== id; });
    d.muster.folge = d.muster.folge.map(function (x) { return x === id ? FREI : x; });
    Object.keys(d.ausnahmen).forEach(function (k) { if (d.ausnahmen[k] === id) d.ausnahmen[k] = FREI; });
    Object.keys(d.ausnahmen).forEach(function (k) { if (d.ausnahmen[k] === musterAm(k, d)) delete d.ausnahmen[k]; });
    return d;
  }

  /* Schichtart ersetzen oder neu anlegen (altId null). Neues Kürzel wird in Muster und Ausnahmen übernommen. */
  function speichereArt(daten, altId, neu) {
    var d = kopie(daten);
    var a = { id: neu.id, name: neu.name, farbe: neu.farbe, beginn: neu.beginn, ende: neu.ende, pauseMin: neu.pauseMin };
    var i = altId === null ? -1 : d.schichtarten.findIndex(function (x) { return x.id === altId; });
    if (i < 0) d.schichtarten.push(a);
    else d.schichtarten[i] = a;
    if (altId !== null && altId !== a.id) {
      d.muster.folge = d.muster.folge.map(function (x) { return x === altId ? a.id : x; });
      Object.keys(d.ausnahmen).forEach(function (k) { if (d.ausnahmen[k] === altId) d.ausnahmen[k] = a.id; });
    }
    return d;
  }

  /* Prüft eine Schichtart, gibt Fehlertext oder null */
  function pruefeArt(a, andere) {
    if (!a || typeof a !== 'object') return 'Schichtart fehlt.';
    if (typeof a.id !== 'string' || !/^\S{1,2}$/.test(a.id)) return 'Kürzel muss 1 bis 2 Zeichen haben.';
    if (FEST[a.id]) return 'Kürzel ' + a.id + ' ist fest vergeben.';
    if ((andere || []).some(function (x) { return x.id === a.id; })) return 'Kürzel ' + a.id + ' gibt es schon.';
    if (typeof a.name !== 'string' || !a.name.trim()) return 'Name fehlt bei ' + a.id + '.';
    if (PALETTE.indexOf(a.farbe) < 0) return 'Unbekannte Farbe bei ' + a.id + '.';
    if (!istZeit(a.beginn) || !istZeit(a.ende)) return 'Zeit bei ' + a.id + ' braucht das Format HH:MM.';
    if (typeof a.pauseMin !== 'number' || !isFinite(a.pauseMin) || a.pauseMin < 0 || Math.floor(a.pauseMin) !== a.pauseMin) return 'Pause bei ' + a.id + ' muss eine ganze Zahl ab 0 sein.';
    if (a.pauseMin >= dauerMin(a)) return 'Pause bei ' + a.id + ' ist länger als die Schicht.';
    return null;
  }

  /* hebt ältere Versionen an, wirft bei unbekannter höherer Version */
  function migriere(daten) {
    var d = kopie(daten);
    var v = d.version === undefined ? 0 : d.version;
    if (typeof v !== 'number') throw new Error('Unbekanntes Versionsfeld.');
    if (v > VERSION) throw new Error('Die Datei stammt aus einer neueren Version (' + v + '). Bitte schicht. aktualisieren.');
    if (v < 1) {
      if (!d.ausnahmen) d.ausnahmen = {};
      if (d.beispiel === undefined) d.beispiel = false;
      d.version = 1;
    }
    return d;
  }

  /* prüft vollständige Daten, gibt Fehlertext oder null */
  function pruefeDaten(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return 'Kein gültiges Datenobjekt.';
    if (!Array.isArray(d.schichtarten)) return 'Feld schichtarten fehlt.';
    var gesehen = [];
    for (var i = 0; i < d.schichtarten.length; i++) {
      var f = pruefeArt(d.schichtarten[i], gesehen);
      if (f) return f;
      gesehen.push(d.schichtarten[i]);
    }
    if (!d.muster || typeof d.muster !== 'object') return 'Feld muster fehlt.';
    if (!istDatum(d.muster.start)) return 'Startdatum braucht das Format YYYY-MM-DD.';
    if (!Array.isArray(d.muster.folge) || d.muster.folge.length > 56) return 'Das Muster darf höchstens 56 Tage haben.';
    var ids = gesehen.map(function (a) { return a.id; }).concat([FREI, URLAUB]);
    for (var j = 0; j < d.muster.folge.length; j++) {
      if (ids.indexOf(d.muster.folge[j]) < 0) return 'Unbekannte Schichtart im Muster: ' + d.muster.folge[j];
    }
    if (!d.ausnahmen || typeof d.ausnahmen !== 'object' || Array.isArray(d.ausnahmen)) return 'Feld ausnahmen fehlt.';
    var keys = Object.keys(d.ausnahmen);
    for (var k = 0; k < keys.length; k++) {
      if (!istDatum(keys[k])) return 'Ausnahme mit ungültigem Datum: ' + keys[k];
      if (ids.indexOf(d.ausnahmen[keys[k]]) < 0) return 'Unbekannte Schichtart in Ausnahme ' + keys[k];
    }
    return null;
  }

  /* team optional: Teamzustand ohne Beispiel kommt mit in die Sicherung */
  function sicherung(daten, team) {
    var d = kopie(daten);
    d.typ = 'sicherung';
    if (team) d.team = kopie(team);
    return d;
  }

  function sicherungName(heute) { return 'schicht-sicherung-' + heute + '.json'; }

  /* Import aus Text. Bei Fehler bleibt `aktuell` unverändert zurück. */
  function importiere(text, aktuell) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return { ok: false, fehler: 'Die Datei ist kein gültiges JSON.', daten: aktuell }; }
    if (!o || typeof o !== 'object' || o.typ !== 'sicherung') return { ok: false, fehler: 'Das ist keine Sicherung von schicht.', daten: aktuell };
    var d;
    try { d = migriere(o); } catch (e) { return { ok: false, fehler: e.message, daten: aktuell }; }
    var f = pruefeDaten(d);
    if (f) return { ok: false, fehler: f, daten: aktuell };
    var team = null;
    if (d.team !== undefined) {
      f = pruefeTeamZustand(d.team);
      if (f) return { ok: false, fehler: f, daten: aktuell };
      team = d.team;
    }
    delete d.typ;
    delete d.team;
    d.beispiel = !!d.beispiel;
    return { ok: true, daten: d, team: team };
  }

  /* gespeicherte Daten laden, bei Unsinn null */
  function ladeText(text) {
    if (!text) return null;
    try {
      var d = migriere(JSON.parse(text));
      return pruefeDaten(d) ? null : d;
    } catch (e) { return null; }
  }

  /* Kalenderraster: führende Leerstellen bis Montag, dann alle Tage */
  function monatsRaster(jahr, monat) {
    var erster = datumAus(jahr, monat, 1);
    var zellen = [];
    for (var i = 0; i < wochentag(erster); i++) zellen.push(null);
    for (var t = 1; t <= tageImMonat(jahr, monat); t++) zellen.push(datumAus(jahr, monat, t));
    return zellen;
  }

  /* ---------- Team und Tausch per Link, ohne Server ----------
     Alles reist im Fragment der Adresse (#t=...), das der Browser nie an einen Server schickt.
     Nutzlast: JSON, UTF-8, base64url ohne Auffüllzeichen. */

  var LINK_V = 1;
  var LINK_MAX = 16000;
  var ID_RE = /^[a-z0-9]{8,32}$/;
  var TAUSCH_STATUS = ['gesendet', 'eingegangen', 'angenommen', 'abgelehnt', 'getauscht', 'zurueck'];
  var AUSSCHNITT_VOR = 62;
  var AUSSCHNITT_NACH = 400;

  function zuB64url(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function ausB64url(s) {
    if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) throw new Error('kaputte Kodierung');
    var b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var bin = atob(b);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function istName(n) { return typeof n === 'string' && n.trim().length >= 1 && n.trim().length <= 40; }
  function istPerson(p) { return !!p && typeof p === 'object' && typeof p.id === 'string' && ID_RE.test(p.id) && istName(p.name); }

  /* Plan einer Person für den Link: Ausnahmen nur von heute minus 62 bis plus 400 Tage */
  function planAusschnitt(daten, heute) {
    var von = plusTage(heute, -AUSSCHNITT_VOR), bis = plusTage(heute, AUSSCHNITT_NACH);
    var aus = {};
    Object.keys(daten.ausnahmen).sort().forEach(function (k) {
      if (tagesDiff(von, k) >= 0 && tagesDiff(k, bis) >= 0) aus[k] = daten.ausnahmen[k];
    });
    return { schichtarten: kopie(daten.schichtarten), muster: kopie(daten.muster), ausnahmen: aus };
  }

  function pruefePlan(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return 'Plan fehlt.';
    return pruefeDaten({ schichtarten: p.schichtarten, muster: p.muster, ausnahmen: p.ausnahmen });
  }

  function istArbeitsArt(a) { return !!a && typeof a === 'object' && !FEST[a.id] && pruefeArt(a, []) === null; }

  function pruefeTausch(t) {
    if (!t || typeof t !== 'object') return 'Tausch fehlt.';
    if (typeof t.tid !== 'string' || !ID_RE.test(t.tid)) return 'Tausch ohne gültige Kennung.';
    if (!istPerson(t.von) || !istPerson(t.an)) return 'Tausch ohne gültige Personen.';
    if (t.von.id === t.an.id) return 'Tausch mit sich selbst.';
    if (!t.gib || !istDatum(t.gib.datum) || !istArbeitsArt(t.gib.art)) return 'Abgegebene Schicht ist ungültig.';
    if (t.nimm !== null && (!t.nimm || !istDatum(t.nimm.datum) || !istArbeitsArt(t.nimm.art))) return 'Übernommene Schicht ist ungültig.';
    return null;
  }

  /* prüft eine Nutzlast aus einem Link, gibt Fehlertext oder null */
  function pruefeNutzlast(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return 'Der Link enthält keine Daten von schicht.';
    if (['plan', 'tausch', 'antwort'].indexOf(o.typ) < 0) return 'Unbekannter Link-Typ.';
    if (typeof o.v !== 'number') return 'Link ohne Version.';
    if (o.v > LINK_V) return 'Der Link stammt aus einer neueren Version. Bitte schicht. aktualisieren.';
    if (!istPerson(o.team)) return 'Link ohne gültiges Team.';
    if (!istPerson(o.person)) return 'Link ohne gültige Person.';
    if (!istDatum(o.stand)) return 'Link ohne Datum.';
    var f = pruefePlan(o.plan);
    if (f) return 'Plan im Link: ' + f;
    if (o.typ === 'tausch') {
      f = pruefeTausch(o.tausch);
      if (f) return f;
      if (o.tausch.von.id !== o.person.id) return 'Tausch passt nicht zur Person.';
    }
    if (o.typ === 'antwort') {
      if (typeof o.tid !== 'string' || !ID_RE.test(o.tid)) return 'Antwort ohne gültige Kennung.';
      if (typeof o.annahme !== 'boolean') return 'Antwort ohne Entscheidung.';
    }
    return null;
  }

  function linkErzeugen(basis, nutzlast) { return basis + '#t=' + zuB64url(JSON.stringify(nutzlast)); }

  /* liest "#t=..." oder eine ganze Adresse. leer: kein Team-Link */
  function linkLesen(text) {
    var s = String(text || '');
    var i = s.indexOf('#');
    var frag = i >= 0 ? s.slice(i + 1) : s;
    var m = /(?:^|&)t=([^&]*)/.exec(frag);
    if (!m) return { ok: false, leer: true, fehler: 'Kein Team-Link.' };
    if (m[1].length > LINK_MAX) return { ok: false, fehler: 'Der Link ist zu lang.' };
    var o;
    try { o = JSON.parse(ausB64url(m[1])); } catch (e) { return { ok: false, fehler: 'Der Link ist unvollständig oder beschädigt.' }; }
    var f = pruefeNutzlast(o);
    if (f) return { ok: false, fehler: f };
    return { ok: true, nutzlast: o };
  }

  function nutzlast(typ, zustand, daten, heute, extra) {
    var o = { typ: typ, v: LINK_V, team: kopie(zustand.team), person: kopie(zustand.ich), stand: heute, plan: planAusschnitt(daten, heute) };
    Object.keys(extra || {}).forEach(function (k) { o[k] = kopie(extra[k]); });
    return o;
  }

  /* Teamzustand, gespeichert unter schicht.team */
  function leeresTeam() { return { version: 1, ich: null, team: null, mitglieder: [], tausch: [] }; }

  function pruefeTeamZustand(z) {
    if (!z || typeof z !== 'object' || Array.isArray(z)) return 'Kein gültiger Teamzustand.';
    if (z.version !== 1) return 'Unbekannte Version des Teams.';
    if (z.ich !== null && !istPerson(z.ich)) return 'Dein Name im Team ist ungültig.';
    if (z.team !== null && !istPerson(z.team)) return 'Team ist ungültig.';
    if (!Array.isArray(z.mitglieder) || !Array.isArray(z.tausch)) return 'Team ohne Listen.';
    for (var i = 0; i < z.mitglieder.length; i++) {
      var m = z.mitglieder[i];
      if (!istPerson(m) || !istDatum(m.stand) || pruefePlan(m.plan)) return 'Mitglied ' + (i + 1) + ' ist ungültig.';
    }
    for (var j = 0; j < z.tausch.length; j++) {
      if (pruefeTausch(z.tausch[j]) || TAUSCH_STATUS.indexOf(z.tausch[j].status) < 0) return 'Tausch ' + (j + 1) + ' ist ungültig.';
    }
    return null;
  }

  function ladeTeamText(text) {
    if (!text) return null;
    try { var z = JSON.parse(text); return pruefeTeamZustand(z) ? null : z; } catch (e) { return null; }
  }

  /* Team anlegen oder wechseln: Mitglieder und Tausche des alten Teams fallen weg */
  function teamSetzen(zustand, team, ich) {
    var z = kopie(zustand);
    var neu = !z.team || (z.team.id !== team.id && !z.team.lokal);
    z.team = { id: team.id, name: team.name.trim() };
    if (ich) z.ich = { id: ich.id, name: ich.name.trim() };
    if (neu) { z.mitglieder = []; z.tausch = []; }
    return z;
  }

  function ohneBeispiel(zustand) {
    var z = kopie(zustand);
    z.mitglieder = z.mitglieder.filter(function (m) { return !m.beispiel; });
    if (z.team && z.team.beispiel) { z.team = null; z.mitglieder = []; z.tausch = []; }
    return z;
  }

  function hatBeispiel(zustand) {
    return !!(zustand.team && zustand.team.beispiel) || zustand.mitglieder.some(function (m) { return m.beispiel; });
  }

  /* Plan aus einem Link ins Team übernehmen. Ältere Stände überschreiben neuere nicht. */
  function planUebernehmen(zustand, o) {
    var z = kopie(zustand);
    if (z.ich && o.person.id === z.ich.id) return { zustand: z, ergebnis: 'eigener' };
    if (!z.team || z.team.beispiel) {
      z = ohneBeispiel(z);
      z.team = kopie(o.team);
    } else if (z.team.lokal) {
      z.team = kopie(o.team);
    } else if (z.team.id !== o.team.id) return { zustand: z, ergebnis: 'anderesTeam' };
    var m = { id: o.person.id, name: o.person.name.trim(), stand: o.stand, plan: kopie(o.plan) };
    var i = z.mitglieder.findIndex(function (x) { return x.id === m.id; });
    if (i < 0) { z.mitglieder.push(m); return { zustand: z, ergebnis: 'neu' }; }
    if (tagesDiff(z.mitglieder[i].stand, m.stand) < 0) return { zustand: z, ergebnis: 'aelter' };
    z.mitglieder[i] = m;
    return { zustand: z, ergebnis: 'aktualisiert' };
  }

  function mitgliedEntfernen(zustand, id) {
    var z = kopie(zustand);
    z.mitglieder = z.mitglieder.filter(function (m) { return m.id !== id; });
    return z;
  }

  function tauschMerken(zustand, t, status) {
    var z = kopie(zustand);
    var e = kopie(t);
    e.status = status;
    var i = z.tausch.findIndex(function (x) { return x.tid === t.tid; });
    if (i < 0) z.tausch.unshift(e); else z.tausch[i] = e;
    z.tausch = z.tausch.slice(0, 50);
    return z;
  }

  function tauschEntfernen(zustand, tid) {
    var z = kopie(zustand);
    z.tausch = z.tausch.filter(function (x) { return x.tid !== tid; });
    return z;
  }

  function tauschFinden(zustand, tid) {
    for (var i = 0; i < zustand.tausch.length; i++) if (zustand.tausch[i].tid === tid) return zustand.tausch[i];
    return null;
  }

  function gleicheZeiten(a, b) { return a.beginn === b.beginn && a.ende === b.ende && a.pauseMin === b.pauseMin; }

  /* fremde Schichtart in den eigenen Plan holen: gleiches Kürzel und gleiche Zeiten,
     sonst gleiche Zeiten, sonst neu anlegen (Kürzel bei Kollision mit Ziffer 2 bis 9) */
  function uebernimmArt(daten, a) {
    var eigen = daten.schichtarten;
    var t = eigen.filter(function (x) { return x.id === a.id && gleicheZeiten(x, a); })[0] ||
      eigen.filter(function (x) { return gleicheZeiten(x, a) && x.name === a.name; })[0] ||
      eigen.filter(function (x) { return gleicheZeiten(x, a); })[0];
    if (t) return { daten: daten, id: t.id };
    var frei = function (id) { return !FEST[id] && !eigen.some(function (x) { return x.id === id; }); };
    var id = a.id;
    for (var n = 2; !frei(id) && n <= 9; n++) id = a.id.slice(0, 1) + n;
    if (!frei(id)) throw new Error('Kein freies Kürzel für ' + a.name + '.');
    var d = kopie(daten);
    d.schichtarten.push({ id: id, name: a.name, farbe: a.farbe, beginn: a.beginn, ende: a.ende, pauseMin: a.pauseMin });
    return { daten: d, id: id };
  }

  function artText(a) { return a.name + ' ' + a.beginn + ' bis ' + a.ende; }

  /* Anfrage prüfen, bevor sie rausgeht. meine: eigene Daten, ihr: Plan der anderen Person.
     nimmDatum null heißt: nur abgeben. */
  function pruefeTauschAnfrage(meine, ihr, gibDatum, nimmDatum, heute) {
    var warnungen = [];
    if (!istDatum(gibDatum)) return { fehler: 'Bitte den Tag wählen, den du abgibst.', warnungen: warnungen };
    if (nimmDatum !== null && !istDatum(nimmDatum)) return { fehler: 'Bitte den Tag wählen, den du übernimmst.', warnungen: warnungen };
    if (tagesDiff(heute, gibDatum) < 0 || (nimmDatum && tagesDiff(heute, nimmDatum) < 0)) return { fehler: 'Vergangene Tage lassen sich nicht tauschen.', warnungen: warnungen };
    var gibId = schichtAm(gibDatum, meine);
    if (!istArbeit(gibId) || !art(gibId, meine)) return { fehler: 'Am ' + gibDatum + ' hast du keine Schicht zum Abgeben.', warnungen: warnungen };
    var gib = { datum: gibDatum, art: kopie(art(gibId, meine)) };
    var nimm = null;
    if (nimmDatum) {
      var nimmId = schichtAm(nimmDatum, ihr);
      if (!istArbeit(nimmId) || !art(nimmId, ihr)) return { fehler: 'Am ' + nimmDatum + ' hat die andere Person keine Schicht.', warnungen: warnungen };
      nimm = { datum: nimmDatum, art: kopie(art(nimmId, ihr)) };
      if (nimmDatum === gibDatum && gleicheZeiten(gib.art, nimm.art)) return { fehler: 'Gleiche Schicht am gleichen Tag, da gibt es nichts zu tauschen.', warnungen: warnungen };
      if (nimmDatum !== gibDatum && schichtAm(nimmDatum, meine) !== FREI) warnungen.push('Du hast am ' + nimmDatum + ' schon ' + art(schichtAm(nimmDatum, meine), meine).name + ', das würde überschrieben.');
    }
    if (nimmDatum !== gibDatum && schichtAm(gibDatum, ihr) !== FREI) warnungen.push('Die andere Person hat am ' + gibDatum + ' schon ' + art(schichtAm(gibDatum, ihr), ihr).name + ', das würde überschrieben.');
    return { fehler: null, warnungen: warnungen, gib: gib, nimm: nimm };
  }

  /* Vor dem Annehmen (rolle "an") oder Eintragen (rolle "von"): stimmt der eigene Plan noch mit der Anfrage? */
  function pruefeTauschStand(daten, t, rolle) {
    var probleme = [];
    var eigen = rolle === 'von' ? t.gib : t.nimm;
    if (eigen) {
      var id = schichtAm(eigen.datum, daten), a = art(id, daten);
      if (!a || !a.beginn || !gleicheZeiten(a, eigen.art)) probleme.push('Dein Plan am ' + eigen.datum + ' zeigt ' + (a ? a.name : id) + ' statt ' + eigen.art.name + '.');
    }
    var ziel = rolle === 'von' ? (t.nimm && t.nimm.datum !== t.gib.datum ? t.nimm.datum : null) : (!t.nimm || t.nimm.datum !== t.gib.datum ? t.gib.datum : null);
    if (ziel && schichtAm(ziel, daten) !== FREI) probleme.push('Du hast am ' + ziel + ' schon ' + art(schichtAm(ziel, daten), daten).name + ', das wird überschrieben.');
    return probleme;
  }

  /* Tausch in den eigenen Plan eintragen. rolle "von": wer gefragt hat, "an": wer annimmt. */
  function wendeTauschAn(daten, t, rolle) {
    var d = kopie(daten), r;
    var gleicherTag = t.nimm && t.nimm.datum === t.gib.datum;
    if (rolle === 'von') {
      if (!gleicherTag) d = setzeAusnahme(d, t.gib.datum, FREI);
      if (t.nimm) { r = uebernimmArt(d, t.nimm.art); d = setzeAusnahme(r.daten, t.nimm.datum, r.id); }
    } else if (rolle === 'an') {
      if (t.nimm && !gleicherTag) d = setzeAusnahme(d, t.nimm.datum, FREI);
      r = uebernimmArt(d, t.gib.art);
      d = setzeAusnahme(r.daten, t.gib.datum, r.id);
    } else throw new Error('unbekannte Rolle');
    d.beispiel = false;
    return d;
  }

  /* ---------- Team in der App, ohne Link ----------
     Alle Pläne liegen auf diesem Gerät. Ein Tausch ändert beide Pläne sofort. */

  /* eigenes Muster als Plan für eine andere Person, Start um `tage` versetzt, ohne Ausnahmen */
  function planVersetzt(daten, tage) {
    return { schichtarten: kopie(daten.schichtarten), muster: { start: plusTage(daten.muster.start, tage), folge: daten.muster.folge.slice() }, ausnahmen: {} };
  }

  function nurPlan(p) { return { schichtarten: kopie(p.schichtarten), muster: kopie(p.muster), ausnahmen: kopie(p.ausnahmen) }; }

  /* Person in der App anlegen oder ändern (gleiche id ersetzt). Ohne echtes Team entsteht ein lokales Team,
     das beim ersten Link oder beim Speichern eines Teamnamens seine Personen behält. */
  function mitgliedSpeichern(zustand, m, heute) {
    if (!istPerson(m)) throw new Error('Bitte einen Namen mit 1 bis 40 Zeichen.');
    var f = pruefePlan(m.plan);
    if (f) throw new Error(f);
    var z = kopie(zustand);
    if (!z.team || z.team.beispiel) z.team = { id: m.id, name: 'mein team', lokal: true };
    var neu = { id: m.id, name: m.name.trim(), stand: heute, plan: nurPlan(m.plan), lokal: true };
    var i = z.mitglieder.findIndex(function (x) { return x.id === m.id; });
    if (i < 0) z.mitglieder.push(neu);
    else { if (z.mitglieder[i].beispiel) neu.beispiel = true; z.mitglieder[i] = neu; }
    return z;
  }

  function wertAm(plan, datum) { return Object.prototype.hasOwnProperty.call(plan.ausnahmen, datum) ? plan.ausnahmen[datum] : null; }

  function stelle(plan, tage) {
    var o = {};
    tage.forEach(function (d) { o[d] = wertAm(plan, d); });
    return o;
  }

  /* Tausch direkt zwischen zwei Plänen auf diesem Gerät.
     planA gibt gibDatum ab und übernimmt dafür nimmDatum von planB (nimmDatum null: nur abgeben).
     Ergebnis: { fehler } oder { a, b, tausch, warnungen }. tausch trägt vorher und nachher zum Rückgängigmachen. */
  function tauschDirekt(planA, planB, gibDatum, nimmDatum, heute, von, an, tid) {
    var r = pruefeTauschAnfrage(planA, planB, gibDatum, nimmDatum, heute);
    if (r.fehler) return { fehler: r.fehler, warnungen: r.warnungen };
    var t = { tid: tid, von: kopie(von), an: kopie(an), gib: r.gib, nimm: r.nimm };
    var f = pruefeTausch(t);
    if (f) return { fehler: f, warnungen: r.warnungen };
    var tage = [gibDatum];
    if (nimmDatum && nimmDatum !== gibDatum) tage.push(nimmDatum);
    var a = wendeTauschAn(planA, t, 'von');
    var b = wendeTauschAn(planB, t, 'an');
    if (planA.beispiel === undefined) delete a.beispiel;
    if (planB.beispiel === undefined) delete b.beispiel;
    t.status = 'getauscht';
    t.vorher = { a: stelle(planA, tage), b: stelle(planB, tage) };
    t.nachher = { a: stelle(a, tage), b: stelle(b, tage) };
    return { fehler: null, warnungen: r.warnungen, a: a, b: b, tausch: t };
  }

  /* Direkten Tausch zurücknehmen. Geht nur, solange beide Pläne an den Tagen noch so stehen wie nach dem Tausch. */
  function tauschZurueck(planA, planB, t) {
    if (!t || t.status !== 'getauscht' || !t.vorher || !t.nachher) return { fehler: 'Dieser Tausch lässt sich nicht zurücknehmen.' };
    var passt = function (plan, soll) {
      return Object.keys(soll).every(function (d) { return wertAm(plan, d) === soll[d]; });
    };
    if (!passt(planA, t.nachher.a) || !passt(planB, t.nachher.b)) return { fehler: 'Seit dem Tausch wurde an diesen Tagen etwas geändert. Setz die Tage einzeln zurück.' };
    var setze = function (plan, vorher) {
      var d = kopie(plan);
      Object.keys(vorher).forEach(function (k) {
        if (vorher[k] === null) delete d.ausnahmen[k]; else d.ausnahmen[k] = vorher[k];
      });
      return d;
    };
    return { fehler: null, a: setze(planA, t.vorher.a), b: setze(planB, t.vorher.b) };
  }

  /* erster Samstag ab heute, an dem Samstag und Sonntag frei oder Urlaub sind, innerhalb eines Jahres, sonst null */
  function naechstesFreiesWochenende(heute, daten) {
    var sa = plusTage(heute, (5 - wochentag(heute) + 7) % 7);
    for (var i = 0; i < 53; i++) {
      var d = plusTage(sa, i * 7);
      if (!istArbeit(schichtAm(d, daten)) && !istArbeit(schichtAm(plusTage(d, 1), daten))) return d;
    }
    return null;
  }

  /* Beispiel-Team: zwei erfundene Personen mit versetztem Muster */
  function beispielTeam(heute) {
    var mo = montagDerWoche(heute);
    var folge = ['F', 'F', 'S', 'S', 'N', 'N', '-', '-', '-', '-'];
    var person = function (id, name, versatz) {
      return { id: id, name: name, stand: heute, beispiel: true, lokal: true,
        plan: { schichtarten: standardArten(), muster: { start: plusTage(mo, versatz), folge: folge.slice() }, ausnahmen: {} } };
    };
    return { version: 1, ich: null, team: { id: 'beispielteam', name: 'team beispiel', beispiel: true },
      mitglieder: [person('beispielalex', 'Alex', 4), person('beispielsam1', 'Sam', 7)], tausch: [] };
  }

  /* Kann dieser Browser dauerhaft speichern? holeSpeicher liefert localStorage (oder einen Ersatz zum Testen).
     Blockiert der Browser Websitedaten (etwa Brave Shields mit Cookies blockiert), wirft schon der Zugriff. */
  function speicherTesten(holeSpeicher) {
    var k = 'schicht.probe';
    try {
      var s = holeSpeicher();
      if (!s) return false;
      s.setItem(k, '1');
      var ok = s.getItem(k) === '1';
      s.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }

  /* Vorlagen für häufige Rhythmen, nur mit den vorbelegten Schichtarten F, S, N */
  var VORLAGEN = [
    { id: 'w10', name: '2 früh, 2 spät, 2 nacht, 4 frei', folge: ['F', 'F', 'S', 'S', 'N', 'N', '-', '-', '-', '-'] },
    { id: 'w12', name: '3 früh, 3 spät, 3 nacht, 3 frei', folge: ['F', 'F', 'F', 'S', 'S', 'S', 'N', 'N', 'N', '-', '-', '-'] },
    { id: 'wo2', name: 'woche früh, woche spät', folge: ['F', 'F', 'F', 'F', 'F', '-', '-', 'S', 'S', 'S', 'S', 'S', '-', '-'] },
    { id: 'wo3', name: 'woche früh, spät, nacht', folge: ['F', 'F', 'F', 'F', 'F', '-', '-', 'S', 'S', 'S', 'S', 'S', '-', '-', 'N', 'N', 'N', 'N', 'N', '-', '-'] },
    { id: 'mofr', name: 'montag bis freitag früh', folge: ['F', 'F', 'F', 'F', 'F', '-', '-'] }
  ];

  /* Vorlage übernehmen: neue Folge und Startdatum, fehlende Standardarten werden wieder angelegt.
     Ausnahmen bleiben. Unbekannte Vorlage: null. */
  function vorlageAnwenden(daten, vorlageId, start) {
    var v = null;
    for (var i = 0; i < VORLAGEN.length; i++) if (VORLAGEN[i].id === vorlageId) v = VORLAGEN[i];
    if (!v || !istDatum(start)) return null;
    var d = kopie(daten);
    standardArten().forEach(function (a) {
      if (v.folge.indexOf(a.id) >= 0 && !d.schichtarten.some(function (x) { return x.id === a.id; })) d.schichtarten.push(a);
    });
    d.muster = { start: start, folge: v.folge.slice() };
    d.beispiel = false;
    return d;
  }

  /* Eine Stelle der Folge setzen. index gleich Länge hängt an, höchstens 56 Tage. Ungültig: Folge unverändert. */
  function folgeSetzen(folge, index, id) {
    var f = folge.slice();
    if (index < 0 || index > f.length || (index === f.length && f.length >= 56)) return f;
    f[index] = id;
    return f;
  }

  /* erster Tag nach heute, der Arbeit (arbeit true) oder frei bzw. Urlaub (arbeit false) ist, höchstens maxTage weit */
  function naechsterTag(heute, daten, arbeit, maxTage) {
    for (var i = 1; i <= (maxTage || 60); i++) {
      var d = plusTage(heute, i);
      if (istArbeit(schichtAm(d, daten)) === arbeit) return d;
    }
    return null;
  }

  /* Liste der nächsten n Tage ab heute (heute eingeschlossen) */
  function agenda(heute, n, daten) {
    var r = [];
    for (var i = 0; i < n; i++) {
      var d = plusTage(heute, i);
      r.push({ datum: d, id: schichtAm(d, daten), ausnahme: istAusnahme(d, daten) });
    }
    return r;
  }

  var L = {
    VORLAGEN: VORLAGEN, vorlageAnwenden: vorlageAnwenden, folgeSetzen: folgeSetzen,
    naechsterTag: naechsterTag, agenda: agenda,
    speicherTesten: speicherTesten,
    FREI: FREI, URLAUB: URLAUB, VERSION: VERSION, PALETTE: PALETTE, FEST: FEST,
    istDatum: istDatum, istZeit: istZeit, datumLokal: datumLokal, datumAus: datumAus,
    tagesDiff: tagesDiff, plusTage: plusTage, plusMonate: plusMonate, wochentag: wochentag,
    montagDerWoche: montagDerWoche, tageImMonat: tageImMonat, zeitMin: zeitMin, minZeit: minZeit,
    musterIndex: musterIndex, schichtAm: schichtAm, musterAm: musterAm, istAusnahme: istAusnahme,
    art: art, istArbeit: istArbeit, dauerMin: dauerMin, nettoMin: nettoMin,
    monatsSumme: monatsSumme, zahlText: zahlText, stundenText: stundenText,
    icsText: icsText, icsAnzahl: icsAnzahl, falte: falte, pruefeZeitraum: pruefeZeitraum,
    standardArten: standardArten, beispielDaten: beispielDaten, leereDaten: leereDaten,
    setzeAusnahme: setzeAusnahme, artVerwendet: artVerwendet, loescheArt: loescheArt, speichereArt: speichereArt,
    pruefeArt: pruefeArt, migriere: migriere, pruefeDaten: pruefeDaten,
    sicherung: sicherung, sicherungName: sicherungName, importiere: importiere,
    ladeText: ladeText, monatsRaster: monatsRaster,
    LINK_V: LINK_V, zuB64url: zuB64url, ausB64url: ausB64url, istName: istName, istPerson: istPerson,
    planAusschnitt: planAusschnitt, pruefePlan: pruefePlan, pruefeTausch: pruefeTausch, pruefeNutzlast: pruefeNutzlast,
    linkErzeugen: linkErzeugen, linkLesen: linkLesen, nutzlast: nutzlast,
    leeresTeam: leeresTeam, pruefeTeamZustand: pruefeTeamZustand, ladeTeamText: ladeTeamText, teamSetzen: teamSetzen,
    ohneBeispiel: ohneBeispiel, hatBeispiel: hatBeispiel, planUebernehmen: planUebernehmen, mitgliedEntfernen: mitgliedEntfernen,
    tauschMerken: tauschMerken, tauschFinden: tauschFinden, tauschEntfernen: tauschEntfernen, uebernimmArt: uebernimmArt, artText: artText,
    pruefeTauschAnfrage: pruefeTauschAnfrage, pruefeTauschStand: pruefeTauschStand, wendeTauschAn: wendeTauschAn,
    beispielTeam: beispielTeam,
    planVersetzt: planVersetzt, mitgliedSpeichern: mitgliedSpeichern, tauschDirekt: tauschDirekt, tauschZurueck: tauschZurueck,
    naechstesFreiesWochenende: naechstesFreiesWochenende
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.Logik = L;
})(typeof self !== 'undefined' ? self : this);
