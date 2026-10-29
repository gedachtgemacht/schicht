/* Tests für logik.js gegen die Handrechnungen aus scope.md. Aufruf: node test-calc.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./logik.js');

function daten(ausnahmen) {
  return {
    version: 1,
    beispiel: false,
    schichtarten: L.standardArten(),
    muster: { start: '2026-01-05', folge: ['F', 'F', 'S', 'S', 'N', 'N', '-', '-', '-', '-'] },
    ausnahmen: ausnahmen || {}
  };
}

const JETZT = new Date(Date.UTC(2026, 0, 2, 8, 30, 0));

test('Rechnung 1: Einzeltage', () => {
  const d = daten();
  const fall = [
    ['2026-01-05', 0, 0, 'F'],
    ['2026-01-09', 4, 4, 'N'],
    ['2026-03-01', 55, 5, 'N'],
    ['2026-03-29', 83, 3, 'S'],
    ['2026-01-01', -4, 6, '-']
  ];
  for (const [tag, diff, idx, id] of fall) {
    assert.equal(L.tagesDiff('2026-01-05', tag), diff, tag);
    assert.equal(L.musterIndex(tag, '2026-01-05', 10), idx, tag);
    assert.equal(L.schichtAm(tag, d), id, tag);
  }
});

test('Rechnung 2: Januar 2026', () => {
  const s = L.monatsSumme(2026, 1, daten());
  assert.equal(s.anzahl.F, 6);
  assert.equal(s.anzahl.S, 6);
  assert.equal(s.anzahl.N, 6);
  assert.equal(s.anzahl['-'], 13);
  assert.equal(s.anzahl.U, 0);
  assert.equal(s.stunden.brutto, 144);
  assert.equal(s.stunden.netto, 135);
  assert.equal(L.stundenText(s.stunden), '135 bis 144 h');
  for (let t = 1; t <= 4; t++) assert.equal(L.schichtAm(L.datumAus(2026, 1, t), daten()), '-');
});

test('Rechnung 3: mit Ausnahme Urlaub am 15.01.', () => {
  const d = daten({ '2026-01-15': 'U' });
  assert.equal(L.musterAm('2026-01-15', d), 'F');
  const s = L.monatsSumme(2026, 1, d);
  assert.equal(s.anzahl.F, 5);
  assert.equal(s.anzahl.S, 6);
  assert.equal(s.anzahl.N, 6);
  assert.equal(s.anzahl.U, 1);
  assert.equal(s.anzahl['-'], 13);
  assert.equal(L.stundenText(s.stunden), '127,5 bis 136 h');
});

test('Rechnung 4: ICS 09. bis 10.01.2026', () => {
  const ics = L.icsText('2026-01-09', '2026-01-10', daten(), JETZT);
  const ev = ics.split('BEGIN:VEVENT').slice(1);
  assert.equal(ev.length, 2);
  assert.match(ev[0], /\r\nDTSTART:20260109T220000\r\n/);
  assert.match(ev[0], /\r\nDTEND:20260110T060000\r\n/);
  assert.match(ev[0], /\r\nUID:2026-01-09-N@schicht\r\n/);
  assert.match(ev[0], /\r\nSUMMARY:nacht\r\n/);
  assert.match(ev[1], /\r\nDTSTART:20260110T220000\r\n/);
  assert.match(ev[1], /\r\nDTEND:20260111T060000\r\n/);
  assert.match(ev[1], /\r\nUID:2026-01-10-N@schicht\r\n/);
  assert.match(ev[1], /\r\nSUMMARY:nacht\r\n/);
  assert.match(ics, /\r\nDTSTAMP:20260102T083000Z\r\n/);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(L.icsAnzahl('2026-01-09', '2026-01-10', daten()), 2);
});

test('Muster der Länge 1', () => {
  const d = daten();
  d.muster.folge = ['S'];
  assert.equal(L.schichtAm('2020-02-29', d), 'S');
  assert.equal(L.schichtAm('2031-12-31', d), 'S');
  assert.equal(L.monatsSumme(2026, 2, d).anzahl.S, 28);
});

test('Ausnahme schlägt Muster', () => {
  const d = daten({ '2026-01-05': 'N', '2026-01-06': '-' });
  assert.equal(L.schichtAm('2026-01-05', d), 'N');
  assert.equal(L.schichtAm('2026-01-06', d), '-');
  assert.equal(L.schichtAm('2026-01-07', d), 'S');
  assert.ok(L.istAusnahme('2026-01-05', d));
});

test('setzeAusnahme entfernt Ausnahme, die dem Muster gleicht', () => {
  let d = L.setzeAusnahme(daten(), '2026-01-15', 'U');
  assert.equal(d.ausnahmen['2026-01-15'], 'U');
  d = L.setzeAusnahme(d, '2026-01-15', 'F');
  assert.equal(L.istAusnahme('2026-01-15', d), false);
  d = L.setzeAusnahme(d, '2026-01-16', 'S');
  d = L.setzeAusnahme(d, '2026-01-16', null);
  assert.deepEqual(d.ausnahmen, {});
});

test('Dauer: Beginn gleich Ende ergibt 24 h, Nacht 8 h', () => {
  assert.equal(L.dauerMin({ beginn: '07:00', ende: '07:00', pauseMin: 0 }), 1440);
  assert.equal(L.dauerMin({ beginn: '22:00', ende: '06:00', pauseMin: 30 }), 480);
  assert.equal(L.nettoMin({ beginn: '22:00', ende: '06:00', pauseMin: 30 }), 450);
  const d = daten();
  d.schichtarten.push({ id: 'D', name: 'dienst 24', farbe: 'rot', beginn: '07:00', ende: '07:00', pauseMin: 60 });
  d.muster.folge = ['D'];
  const ics = L.icsText('2026-01-05', '2026-01-05', d, JETZT);
  assert.match(ics, /DTSTART:20260105T070000\r\nDTEND:20260106T070000/);
  const s = L.monatsSumme(2026, 1, d);
  assert.equal(s.stunden.brutto, 31 * 24);
  assert.equal(s.stunden.netto, 31 * 23);
});

test('Zeitumstellung 29.03. und 25.10.2026 verschiebt keinen Tag', () => {
  const d = daten();
  assert.equal(L.plusTage('2026-03-28', 1), '2026-03-29');
  assert.equal(L.plusTage('2026-03-29', 1), '2026-03-30');
  assert.equal(L.plusTage('2026-10-24', 1), '2026-10-25');
  assert.equal(L.plusTage('2026-10-25', 1), '2026-10-26');
  assert.equal(L.tagesDiff('2026-03-28', '2026-03-30'), 2);
  assert.equal(L.tagesDiff('2026-10-24', '2026-10-26'), 2);
  // 2026-10-25: Diff 293, Index 3
  assert.equal(L.tagesDiff('2026-01-05', '2026-10-25'), 293);
  assert.equal(L.schichtAm('2026-10-25', d), 'S');
  assert.equal(L.schichtAm('2026-10-26', d), 'N');
  assert.equal(L.monatsSumme(2026, 3, d).tage, 31);
  assert.equal(L.monatsSumme(2026, 10, d).tage, 31);
  // fortlaufend: jeder Tag genau einen weiter im Muster
  let tag = '2026-03-20';
  for (let i = 0; i < 230; i++) {
    const n = L.plusTage(tag, 1);
    assert.equal(L.musterIndex(n, '2026-01-05', 10), (L.musterIndex(tag, '2026-01-05', 10) + 1) % 10, n);
    tag = n;
  }
  assert.equal(tag, '2026-11-05');
});

test('ICS: CRLF, keine Zeile über 75 Oktette, Faltung', () => {
  const d = daten();
  d.schichtarten[0].name = 'frühdienst mit sehr langem namen, der über die grenze von fünfundsiebzig oktetten geht äöü';
  const ics = L.icsText('2026-01-01', '2026-03-31', d, JETZT);
  assert.ok(!/[^\r]\n/.test(ics), 'nur CRLF');
  const zeilen = ics.split('\r\n');
  assert.equal(zeilen.pop(), '');
  for (const z of zeilen) assert.ok(Buffer.byteLength(z, 'utf8') <= 75, z);
  assert.ok(zeilen.some((z) => z.startsWith(' ')), 'gefaltete Zeile vorhanden');
  // entfalten ergibt den Namen mit Escapes
  const ganz = ics.replace(/\r\n /g, '');
  assert.ok(ganz.includes('SUMMARY:frühdienst mit sehr langem namen\\, der über'));
});

test('ICS: Urlaub als Ganztag, freie Tage ohne Termin', () => {
  const d = daten({ '2026-01-15': 'U' });
  const ics = L.icsText('2026-01-15', '2026-01-18', d, JETZT);
  // 15. U, 16. F, 17. S, 18. S
  const ev = ics.split('BEGIN:VEVENT').slice(1);
  assert.equal(ev.length, 4);
  assert.match(ev[0], /DTSTART;VALUE=DATE:20260115\r\nDTEND;VALUE=DATE:20260116\r\n/);
  assert.match(ev[0], /UID:2026-01-15-U@schicht/);
  assert.match(ev[0], /SUMMARY:urlaub/);
  const frei = L.icsText('2026-01-01', '2026-01-04', d, JETZT);
  assert.ok(!frei.includes('BEGIN:VEVENT'));
  assert.equal(L.icsAnzahl('2026-01-01', '2026-01-31', daten()), 18);
});

test('Zeitraum: höchstens 24 Monate', () => {
  assert.equal(L.pruefeZeitraum('2026-01-01', '2028-01-01'), null);
  assert.ok(L.pruefeZeitraum('2026-01-01', '2028-01-02'));
  assert.ok(L.pruefeZeitraum('2026-01-02', '2026-01-01'));
  assert.equal(L.plusMonate('2026-01-31', 1), '2026-02-28');
  assert.equal(L.plusMonate('2026-11-15', 3), '2027-02-15');
});

test('Beispiel startet am Montag der laufenden Woche', () => {
  const b = L.beispielDaten('2026-10-28');
  assert.equal(b.muster.start, '2026-10-26');
  assert.equal(b.beispiel, true);
  assert.equal(L.beispielDaten('2026-11-01').muster.start, '2026-10-26');
  assert.equal(L.pruefeDaten(b), null);
});

test('Schichtart löschen setzt Stellen auf frei', () => {
  const d = daten({ '2026-01-07': 'N', '2026-01-08': 'F' });
  assert.equal(L.artVerwendet(d, 'N'), 3);
  const n = L.loescheArt(d, 'N');
  assert.deepEqual(n.muster.folge, ['F', 'F', 'S', 'S', '-', '-', '-', '-', '-', '-']);
  assert.equal(n.ausnahmen['2026-01-07'], '-');
  assert.equal(n.ausnahmen['2026-01-08'], 'F');
  assert.equal(L.art('N', n), null);
  assert.equal(L.pruefeDaten(n), null);
  assert.equal(d.muster.folge[4], 'N', 'Original unverändert');
  assert.throws(() => L.loescheArt(d, '-'));
});

test('Migration', () => {
  const alt = { schichtarten: L.standardArten(), muster: { start: '2026-01-05', folge: ['F'] } };
  const m = L.migriere(alt);
  assert.equal(m.version, 1);
  assert.deepEqual(m.ausnahmen, {});
  assert.equal(m.beispiel, false);
  assert.equal(alt.version, undefined, 'Eingabe unverändert');
  assert.throws(() => L.migriere({ version: 2 }), /neueren Version/);
  const r = L.importiere(JSON.stringify(Object.assign({ typ: 'sicherung' }, alt)), daten());
  assert.equal(r.ok, true);
  assert.equal(r.daten.version, 1);
});

test('Sicherung und Import ergeben gleiche Daten', () => {
  const d = daten({ '2026-01-15': 'U' });
  const text = JSON.stringify(L.sicherung(d));
  assert.equal(JSON.parse(text).typ, 'sicherung');
  const r = L.importiere(text, L.leereDaten('2026-10-28'));
  assert.equal(r.ok, true);
  assert.deepEqual(r.daten, d);
  assert.equal(L.sicherungName('2026-10-28'), 'schicht-sicherung-2026-10-28.json');
});

test('Import kaputter Dateien wird abgelehnt und ändert nichts', () => {
  const aktuell = daten({ '2026-01-15': 'U' });
  const vorher = JSON.stringify(aktuell);
  const gut = L.sicherung(daten());
  const kaputt = [
    'kein json',
    '[]',
    JSON.stringify(daten()),
    JSON.stringify(Object.assign({}, gut, { typ: 'etwas' })),
    JSON.stringify(Object.assign({}, gut, { version: 9 })),
    JSON.stringify(Object.assign({}, gut, { schichtarten: undefined })),
    JSON.stringify(Object.assign({}, gut, { muster: { start: '2026-13-01', folge: ['F'] } })),
    JSON.stringify(Object.assign({}, gut, { muster: { start: '5.1.2026', folge: ['F'] } })),
    JSON.stringify(Object.assign({}, gut, { muster: { start: '2026-01-05', folge: 'FFSS' } })),
    JSON.stringify(Object.assign({}, gut, { muster: { start: '2026-01-05', folge: new Array(57).fill('F') } })),
    JSON.stringify(Object.assign({}, gut, { muster: { start: '2026-01-05', folge: ['F', 'X'] } })),
    JSON.stringify(Object.assign({}, gut, { ausnahmen: { '2026-02-30': 'U' } })),
    JSON.stringify(Object.assign({}, gut, { ausnahmen: { '2026-02-10': 'Q' } })),
    JSON.stringify(Object.assign({}, gut, { schichtarten: [{ id: 'F', name: 'früh', farbe: 'gelb', beginn: '6:00', ende: '14:00', pauseMin: 30 }] })),
    JSON.stringify(Object.assign({}, gut, { schichtarten: [{ id: 'F', name: 'früh', farbe: 'gelb', beginn: '06:00', ende: '24:00', pauseMin: 30 }] })),
    JSON.stringify(Object.assign({}, gut, { schichtarten: [{ id: 'U', name: 'x', farbe: 'gelb', beginn: '06:00', ende: '14:00', pauseMin: 0 }] })),
    JSON.stringify(Object.assign({}, gut, { schichtarten: L.standardArten().concat([{ id: 'F', name: 'doppelt', farbe: 'rot', beginn: '06:00', ende: '14:00', pauseMin: 0 }]) }))
  ];
  for (const t of kaputt) {
    const r = L.importiere(t, aktuell);
    assert.equal(r.ok, false, t);
    assert.ok(typeof r.fehler === 'string' && r.fehler.length > 0, t);
    assert.equal(r.daten, aktuell);
  }
  assert.equal(JSON.stringify(aktuell), vorher);
});

test('Leeres Muster nach beispiel entfernen ist alles frei', () => {
  const d = L.leereDaten('2026-10-28');
  assert.equal(d.beispiel, false);
  assert.equal(L.pruefeDaten(d), null);
  assert.equal(L.schichtAm('2026-10-28', d), '-');
  const s = L.monatsSumme(2026, 10, d);
  assert.equal(s.anzahl['-'], 31);
  assert.equal(L.stundenText(s.stunden), '0 h');
  assert.equal(L.icsAnzahl('2026-10-01', '2026-10-31', d), 0);
});

test('Schichtart umbenennen übernimmt das Kürzel in Muster und Ausnahmen', () => {
  const d = daten({ '2026-01-07': 'N' });
  const neu = { id: 'NA', name: 'nacht', farbe: 'lila', beginn: '21:00', ende: '06:00', pauseMin: 45 };
  assert.equal(L.pruefeArt(neu, d.schichtarten.filter((a) => a.id !== 'N')), null);
  const n = L.speichereArt(d, 'N', neu);
  assert.deepEqual(n.muster.folge.slice(4, 6), ['NA', 'NA']);
  assert.equal(n.ausnahmen['2026-01-07'], 'NA');
  assert.equal(L.pruefeDaten(n), null);
  assert.equal(L.dauerMin(L.art('NA', n)), 540);
  const m = L.speichereArt(d, null, { id: 'T', name: 'tag', farbe: 'rot', beginn: '08:00', ende: '16:00', pauseMin: 30 });
  assert.equal(m.schichtarten.length, 4);
  assert.ok(L.pruefeArt({ id: 'F', name: 'x', farbe: 'rot', beginn: '08:00', ende: '16:00', pauseMin: 0 }, d.schichtarten));
});

/* ---------- Team und Tausch, Rechnung 5 bis 7 aus scope.md ---------- */

const MAX = { id: 'maxmuster01', name: 'Max Muster' };
const ERIKA = { id: 'erikamuster1', name: 'Erika Beispiel' };
const TEAM = { id: 'teampflege01', name: 'team a' };

function planB() {
  const d = daten();
  d.muster.start = '2026-01-10';
  return d;
}

test('Rechnung 5: base64url-Testvektor und Link hin und zurück', () => {
  assert.equal(L.zuB64url('{"typ":"plan","name":"Jörg"}'), 'eyJ0eXAiOiJwbGFuIiwibmFtZSI6IkrDtnJnIn0');
  assert.equal(L.ausB64url('eyJ0eXAiOiJwbGFuIiwibmFtZSI6IkrDtnJnIn0'), '{"typ":"plan","name":"Jörg"}');
  const zustand = { version: 1, ich: MAX, team: TEAM, mitglieder: [], tausch: [] };
  const o = L.nutzlast('plan', zustand, daten({ '2026-01-15': 'U', '2025-01-01': 'N' }), '2026-01-02');
  assert.deepEqual(Object.keys(o.plan.ausnahmen), ['2026-01-15'], 'alte Ausnahme fällt aus dem Ausschnitt');
  const link = L.linkErzeugen('https://example.org/schicht/', o);
  assert.ok(link.startsWith('https://example.org/schicht/#t=ey'));
  const r = L.linkLesen(link);
  assert.equal(r.ok, true);
  assert.deepEqual(r.nutzlast, o);
  assert.equal(L.linkLesen('#t=' + link.split('#t=')[1]).ok, true);
});

test('Kaputte oder fremde Links werden abgelehnt', () => {
  const zustand = { version: 1, ich: MAX, team: TEAM, mitglieder: [], tausch: [] };
  const gut = L.nutzlast('plan', zustand, daten(), '2026-01-02');
  const code = (o) => '#t=' + L.zuB64url(JSON.stringify(o));
  assert.equal(L.linkLesen('#x=1').leer, true);
  assert.equal(L.linkLesen('').leer, true);
  const kaputt = [
    '#t=abc!',
    '#t=a',
    code(gut).slice(0, 40),
    '#t=' + L.zuB64url('kein json'),
    code(Object.assign({}, gut, { typ: 'etwas' })),
    code(Object.assign({}, gut, { v: 2 })),
    code(Object.assign({}, gut, { person: { id: 'kurz', name: 'X' } })),
    code(Object.assign({}, gut, { person: { id: 'maxmuster01', name: '' } })),
    code(Object.assign({}, gut, { team: null })),
    code(Object.assign({}, gut, { stand: '2026-02-30' })),
    code(Object.assign({}, gut, { plan: { schichtarten: [], muster: { start: '2026-01-05', folge: ['F'] }, ausnahmen: {} } })),
    code(Object.assign({}, gut, { typ: 'antwort', tid: 'tausch0001' })),
    code(Object.assign({}, gut, { typ: 'tausch', tausch: { tid: 'tausch0001', von: ERIKA, an: MAX, gib: { datum: '2026-01-06', art: L.standardArten()[0] }, nimm: null } })),
    '#t=' + 'A'.repeat(20000)
  ];
  for (const k of kaputt) {
    const r = L.linkLesen(k);
    assert.equal(r.ok, false, k.slice(0, 60));
    assert.ok(r.fehler && !r.leer, k.slice(0, 60));
  }
  assert.match(L.linkLesen(code(Object.assign({}, gut, { v: 2 }))).fehler, /neueren Version/);
});

test('Rechnung 6: Tausch an verschiedenen Tagen', () => {
  const A = daten();
  const B = planB();
  // B ab 2026-01-10: am 06.01. Index 6 frei, am 12.01. Index 2 S
  assert.equal(L.schichtAm('2026-01-06', B), '-');
  assert.equal(L.schichtAm('2026-01-12', B), 'S');
  assert.equal(L.schichtAm('2026-01-12', A), '-');
  const r = L.pruefeTauschAnfrage(A, B, '2026-01-06', '2026-01-12', '2026-01-01');
  assert.equal(r.fehler, null);
  assert.deepEqual(r.warnungen, []);
  assert.equal(r.gib.art.id, 'F');
  assert.equal(r.nimm.art.id, 'S');
  const t = { tid: 'tausch0001', von: MAX, an: ERIKA, gib: r.gib, nimm: r.nimm };
  assert.equal(L.pruefeTausch(t), null);
  assert.deepEqual(L.pruefeTauschStand(B, t, 'an'), []);
  const B2 = L.wendeTauschAn(B, t, 'an');
  assert.deepEqual(B2.ausnahmen, { '2026-01-12': '-', '2026-01-06': 'F' });
  assert.deepEqual(L.pruefeTauschStand(A, t, 'von'), []);
  const A2 = L.wendeTauschAn(A, t, 'von');
  assert.deepEqual(A2.ausnahmen, { '2026-01-06': '-', '2026-01-12': 'S' });
  const sA = L.monatsSumme(2026, 1, A2);
  assert.deepEqual([sA.anzahl.F, sA.anzahl.S, sA.anzahl.N, sA.anzahl['-']], [5, 7, 6, 13]);
  assert.equal(L.stundenText(sA.stunden), '135 bis 144 h');
  const sB0 = L.monatsSumme(2026, 1, B);
  assert.deepEqual([sB0.anzahl.F, sB0.anzahl.S, sB0.anzahl.N, sB0.anzahl['-']], [7, 6, 6, 12]);
  const sB = L.monatsSumme(2026, 1, B2);
  assert.deepEqual([sB.anzahl.F, sB.anzahl.S, sB.anzahl.N, sB.anzahl['-']], [8, 5, 6, 12]);
  assert.equal(L.stundenText(sB.stunden), '142,5 bis 152 h');
  // nach dem Tausch passt der Stand nicht mehr (12.01. frei, 06.01. belegt), ein zweites Annehmen fällt auf
  assert.equal(L.pruefeTauschStand(B2, t, 'an').length, 2);
});

test('Rechnung 7: Tausch am gleichen Tag und nur abgeben', () => {
  const A = daten();
  const B = planB();
  // 05.01.: A hat F (Index 0), B hat N (Index 5)
  const r = L.pruefeTauschAnfrage(A, B, '2026-01-05', '2026-01-05', '2026-01-01');
  assert.equal(r.fehler, null);
  const t = { tid: 'tausch0002', von: MAX, an: ERIKA, gib: r.gib, nimm: r.nimm };
  assert.equal(L.schichtAm('2026-01-05', L.wendeTauschAn(A, t, 'von')), 'N');
  assert.equal(L.schichtAm('2026-01-05', L.wendeTauschAn(B, t, 'an')), 'F');
  // nur abgeben: A gibt 06.01. F ab, B übernimmt, A ist frei
  const n = L.pruefeTauschAnfrage(A, B, '2026-01-06', null, '2026-01-01');
  assert.equal(n.nimm, null);
  const t2 = { tid: 'tausch0003', von: MAX, an: ERIKA, gib: n.gib, nimm: null };
  assert.equal(L.schichtAm('2026-01-06', L.wendeTauschAn(A, t2, 'von')), '-');
  assert.equal(L.schichtAm('2026-01-06', L.wendeTauschAn(B, t2, 'an')), 'F');
});

test('Tauschanfrage: Fehler und Warnungen', () => {
  const A = daten();
  const B = planB();
  assert.match(L.pruefeTauschAnfrage(A, B, '2026-01-11', null, '2026-01-01').fehler, /keine Schicht zum Abgeben/);
  assert.match(L.pruefeTauschAnfrage(A, B, '2026-01-05', '2026-01-06', '2026-01-01').fehler, /keine Schicht/);
  assert.match(L.pruefeTauschAnfrage(A, B, '2026-01-05', null, '2026-01-06').fehler, /Vergangene/);
  // gleiche Schicht am gleichen Tag: 10.01. A Index 5 N, B Index 0 F; 07.01. A S, B frei
  const C = daten();
  assert.match(L.pruefeTauschAnfrage(A, C, '2026-01-05', '2026-01-05', '2026-01-01').fehler, /nichts zu tauschen/);
  // A gibt 05.01. F gegen B 10.01. F: B hat am 05.01. N, A hat am 10.01. N
  const w = L.pruefeTauschAnfrage(A, B, '2026-01-05', '2026-01-10', '2026-01-01');
  assert.equal(w.fehler, null);
  assert.equal(w.warnungen.length, 2);
});

test('Fremde Schichtart wird passend übernommen', () => {
  const B = planB();
  const frueh = { id: 'Fr', name: 'frühdienst', farbe: 'rot', beginn: '06:00', ende: '14:00', pauseMin: 30 };
  assert.equal(L.uebernimmArt(B, frueh).id, 'F', 'gleiche Zeiten');
  const tag = { id: 'T', name: 'tag', farbe: 'lila', beginn: '08:00', ende: '16:00', pauseMin: 30 };
  const r = L.uebernimmArt(B, tag);
  assert.equal(r.id, 'T');
  assert.equal(r.daten.schichtarten.length, 4);
  assert.equal(B.schichtarten.length, 3, 'Original unverändert');
  const kollision = { id: 'F', name: 'früh kurz', farbe: 'gelb', beginn: '06:00', ende: '12:00', pauseMin: 0 };
  assert.equal(L.uebernimmArt(B, kollision).id, 'F2');
  const t = { tid: 'tausch0004', von: MAX, an: ERIKA, gib: { datum: '2026-01-06', art: tag }, nimm: null };
  const B2 = L.wendeTauschAn(B, t, 'an');
  assert.equal(L.schichtAm('2026-01-06', B2), 'T');
  assert.equal(L.pruefeDaten(B2), null);
});

test('Team: Plan übernehmen, Stand, eigenes und fremdes Team', () => {
  let z = L.beispielTeam('2026-10-28');
  assert.equal(L.hatBeispiel(z), true);
  assert.equal(L.pruefeTeamZustand(z), null);
  assert.deepEqual(z.mitglieder.map((m) => m.plan.muster.start), ['2026-10-30', '2026-11-02']);
  const von = (person, stand, start) => {
    const d = daten();
    d.muster.start = start || '2026-01-05';
    return L.nutzlast('plan', { version: 1, ich: person, team: TEAM, mitglieder: [], tausch: [] }, d, stand);
  };
  let r = L.planUebernehmen(z, von(ERIKA, '2026-10-28'));
  assert.equal(r.ergebnis, 'neu');
  z = r.zustand;
  assert.equal(z.team.id, TEAM.id, 'Beispielteam wird ersetzt');
  assert.equal(z.mitglieder.length, 1);
  z = L.teamSetzen(z, TEAM, MAX);
  assert.equal(z.mitglieder.length, 1, 'gleiches Team behält Mitglieder');
  r = L.planUebernehmen(z, von(ERIKA, '2026-10-29', '2026-01-06'));
  assert.equal(r.ergebnis, 'aktualisiert');
  assert.equal(r.zustand.mitglieder[0].plan.muster.start, '2026-01-06');
  z = r.zustand;
  assert.equal(L.planUebernehmen(z, von(ERIKA, '2026-10-20')).ergebnis, 'aelter');
  assert.equal(L.planUebernehmen(z, von(MAX, '2026-10-30')).ergebnis, 'eigener');
  const fremd = von(ERIKA, '2026-10-30');
  fremd.team = { id: 'anderesteam1', name: 'team b' };
  assert.equal(L.planUebernehmen(z, fremd).ergebnis, 'anderesTeam');
  assert.equal(L.pruefeTeamZustand(z), null);
  assert.equal(L.mitgliedEntfernen(z, ERIKA.id).mitglieder.length, 0);
  assert.equal(L.teamSetzen(z, { id: 'anderesteam1', name: 'team b' }).mitglieder.length, 0);
});

test('Tauschliste und Sicherung mit Team', () => {
  const t = { tid: 'tausch0001', von: MAX, an: ERIKA, gib: { datum: '2026-01-06', art: L.standardArten()[0] }, nimm: null };
  let z = L.teamSetzen(L.leeresTeam(), TEAM, MAX);
  z = L.tauschMerken(z, t, 'gesendet');
  z = L.tauschMerken(z, t, 'angenommen');
  assert.equal(z.tausch.length, 1);
  assert.equal(L.tauschFinden(z, 'tausch0001').status, 'angenommen');
  assert.equal(L.tauschFinden(z, 'tausch0009'), null);
  assert.equal(L.tauschEntfernen(z, 'tausch0001').tausch.length, 0);
  assert.equal(L.pruefeTeamZustand(z), null);
  const text = JSON.stringify(L.sicherung(daten(), z));
  const r = L.importiere(text, daten());
  assert.equal(r.ok, true);
  assert.deepEqual(r.team, z);
  assert.deepEqual(r.daten, daten());
  const kaputt = JSON.parse(text);
  kaputt.team.tausch[0].status = 'vielleicht';
  assert.equal(L.importiere(JSON.stringify(kaputt), daten()).ok, false);
  assert.equal(L.importiere(JSON.stringify(L.sicherung(daten())), daten()).team, null);
});

test('Rechnung 8: Tausch direkt in der App und rückgängig', () => {
  const A = daten();
  const B = planB();
  const r = L.tauschDirekt(A, B, '2026-01-06', '2026-01-12', '2026-01-01', MAX, ERIKA, 'tausch0010');
  assert.equal(r.fehler, null);
  assert.deepEqual(r.a.ausnahmen, { '2026-01-06': '-', '2026-01-12': 'S' });
  assert.deepEqual(r.b.ausnahmen, { '2026-01-12': '-', '2026-01-06': 'F' });
  assert.equal(L.stundenText(L.monatsSumme(2026, 1, r.a).stunden), '135 bis 144 h');
  assert.equal(L.stundenText(L.monatsSumme(2026, 1, r.b).stunden), '142,5 bis 152 h');
  assert.equal(r.tausch.status, 'getauscht');
  assert.deepEqual(r.tausch.vorher, { a: { '2026-01-06': null, '2026-01-12': null }, b: { '2026-01-06': null, '2026-01-12': null } });
  assert.deepEqual(A.ausnahmen, {}, 'Original unverändert');
  // Team mit diesem Eintrag bleibt gültig, auch in der Sicherung
  let z = L.mitgliedSpeichern(L.leeresTeam(), { id: ERIKA.id, name: ERIKA.name, plan: r.b }, '2026-01-01');
  z = L.tauschMerken(z, r.tausch, 'getauscht');
  assert.equal(L.pruefeTeamZustand(z), null);
  // rückgängig
  const u = L.tauschZurueck(r.a, r.b, r.tausch);
  assert.equal(u.fehler, null);
  assert.deepEqual(u.a.ausnahmen, {});
  assert.deepEqual(u.b.ausnahmen, {});
  // nach einer weiteren Änderung an einem der Tage geht es nicht mehr
  const geaendert = L.setzeAusnahme(r.a, '2026-01-12', 'U');
  assert.match(L.tauschZurueck(geaendert, r.b, r.tausch).fehler, /geändert/);
  // nur abgeben am gleichen Ablauf, Fehler bleiben Fehler
  const n = L.tauschDirekt(A, B, '2026-01-06', null, '2026-01-01', MAX, ERIKA, 'tausch0011');
  assert.equal(L.schichtAm('2026-01-06', n.a), '-');
  assert.equal(L.schichtAm('2026-01-06', n.b), 'F');
  assert.deepEqual(n.tausch.vorher.a, { '2026-01-06': null });
  assert.match(L.tauschDirekt(A, B, '2026-01-11', null, '2026-01-01', MAX, ERIKA, 'tausch0012').fehler, /keine Schicht/);
  assert.match(L.tauschDirekt(A, B, '2026-01-06', null, '2026-01-01', MAX, MAX, 'tausch0013').fehler, /sich selbst/);
});

test('Personen in der App anlegen, lokales Team', () => {
  const p = L.planVersetzt(daten({ '2026-01-15': 'U' }), 4);
  assert.equal(p.muster.start, '2026-01-09');
  assert.deepEqual(p.ausnahmen, {});
  let z = L.mitgliedSpeichern(L.beispielTeam('2026-10-28'), { id: ERIKA.id, name: ' Erika Beispiel ', plan: p }, '2026-10-28');
  assert.equal(z.team.lokal, true);
  assert.equal(z.mitglieder.length, 3, 'Beispielpersonen bleiben, bis man sie entfernt');
  assert.equal(z.mitglieder[2].name, 'Erika Beispiel');
  assert.equal(L.pruefeTeamZustand(z), null);
  z = L.ohneBeispiel(z);
  assert.deepEqual(z.mitglieder.map((m) => m.id), [ERIKA.id]);
  // ändern ersetzt
  const p2 = L.planVersetzt(daten(), 7);
  z = L.mitgliedSpeichern(z, { id: ERIKA.id, name: 'Erika', plan: p2 }, '2026-10-29');
  assert.equal(z.mitglieder.length, 1);
  assert.equal(z.mitglieder[0].plan.muster.start, '2026-01-12');
  assert.throws(() => L.mitgliedSpeichern(z, { id: ERIKA.id, name: '', plan: p2 }, '2026-10-29'));
  // ein Link aus einem echten Team übernimmt das lokale Team samt Personen
  const o = L.nutzlast('plan', { version: 1, ich: MAX, team: TEAM, mitglieder: [], tausch: [] }, daten(), '2026-10-29');
  const r = L.planUebernehmen(z, o);
  assert.equal(r.ergebnis, 'neu');
  assert.equal(r.zustand.team.id, TEAM.id);
  assert.equal(r.zustand.mitglieder.length, 2);
  // Teamname speichern behält lokale Personen
  assert.equal(L.teamSetzen(z, { id: 'neuesteam01', name: 'team c' }, MAX).mitglieder.length, 1);
});

test('Rechnung 9: nächstes freies Wochenende', () => {
  // Sa 10.01. N, Sa 17.01. S, Sa 24.01. frei aber So 25.01. F, Sa 31.01. und So 01.02. frei
  assert.equal(L.naechstesFreiesWochenende('2026-01-05', daten()), '2026-01-31');
  assert.equal(L.naechstesFreiesWochenende('2026-01-05', daten({ '2026-01-10': 'U' })), '2026-01-10');
  assert.equal(L.naechstesFreiesWochenende('2026-01-31', daten()), '2026-01-31');
  assert.equal(L.naechstesFreiesWochenende('2026-02-01', daten()), '2026-02-21', 'Sonntag zählt das laufende Wochenende nicht');
  const voll = daten();
  voll.muster.folge = ['F'];
  assert.equal(L.naechstesFreiesWochenende('2026-01-05', voll), null);
});

test('Rechnung 10: nächster freier Tag und nächster Dienst', () => {
  assert.equal(L.naechsterTag('2026-01-05', daten(), false), '2026-01-11');
  assert.equal(L.naechsterTag('2026-01-11', daten(), true), '2026-01-15');
  assert.equal(L.naechsterTag('2026-01-05', daten({ '2026-01-06': 'U' }), false), '2026-01-06', 'Urlaub zählt als frei');
  const voll = daten();
  voll.muster.folge = ['F'];
  assert.equal(L.naechsterTag('2026-01-05', voll, false), null);
  assert.equal(L.naechsterTag('2026-01-05', daten(), false, 3), null, 'Grenze maxTage');
  const a = L.agenda('2026-01-05', 14, daten({ '2026-01-07': 'U' }));
  assert.equal(a.length, 14);
  assert.deepEqual(a.slice(0, 3).map((x) => x.id), ['F', 'F', 'U']);
  assert.equal(a[2].ausnahme, true);
  assert.equal(a[0].ausnahme, false);
  assert.equal(a[13].datum, '2026-01-18');
});

test('Rechnung 11: Vorlage 3 früh, 3 spät, 3 nacht, 3 frei', () => {
  const d = L.vorlageAnwenden(L.leereDaten('2026-01-05'), 'w12', '2026-01-05');
  assert.equal(d.muster.folge.length, 12);
  assert.equal(d.muster.start, '2026-01-05');
  assert.equal(L.schichtAm('2026-01-14', d), '-');
  assert.equal(L.schichtAm('2026-01-11', d), 'N');
  assert.equal(L.schichtAm('2026-01-01', d), 'N', 'Index 8');
  const s = L.monatsSumme(2026, 1, d);
  assert.equal(s.anzahl.F, 9);
  assert.equal(s.anzahl.S, 6);
  assert.equal(s.anzahl.N, 7);
  assert.equal(s.anzahl['-'], 9);
  assert.equal(L.stundenText(s.stunden), '165 bis 176 h');
  // gelöschte Nacht wird wieder angelegt, Ausnahmen bleiben
  const ohneN = L.loescheArt(daten({ '2026-01-20': 'U' }), 'N');
  const d2 = L.vorlageAnwenden(ohneN, 'w10', '2026-01-05');
  assert.ok(d2.schichtarten.some((x) => x.id === 'N'));
  assert.equal(d2.ausnahmen['2026-01-20'], 'U');
  assert.equal(L.pruefeDaten(d2), null);
  assert.equal(L.vorlageAnwenden(daten(), 'gibtsnicht', '2026-01-05'), null);
  assert.equal(L.vorlageAnwenden(daten(), 'w10', '05.01.2026'), null);
  for (const v of L.VORLAGEN) {
    assert.ok(v.folge.length >= 1 && v.folge.length <= 56, v.id);
    assert.equal(L.pruefeDaten(L.vorlageAnwenden(L.leereDaten('2026-01-05'), v.id, '2026-01-05')), null, v.id);
  }
});

test('Folge an einer Stelle setzen', () => {
  assert.deepEqual(L.folgeSetzen(['F', 'S'], 1, 'N'), ['F', 'N']);
  assert.deepEqual(L.folgeSetzen(['F', 'S'], 2, 'N'), ['F', 'S', 'N']);
  assert.deepEqual(L.folgeSetzen(['F', 'S'], 5, 'N'), ['F', 'S']);
  assert.deepEqual(L.folgeSetzen(['F', 'S'], -1, 'N'), ['F', 'S']);
  const voll = new Array(56).fill('F');
  assert.equal(L.folgeSetzen(voll, 56, 'N').length, 56);
  assert.equal(L.folgeSetzen(voll, 55, 'N')[55], 'N');
  const alt = ['F'];
  L.folgeSetzen(alt, 0, 'S');
  assert.deepEqual(alt, ['F'], 'Eingabe bleibt unverändert');
});

test('Speichertest erkennt blockierten Speicher', () => {
  const m = new Map();
  const gut = { setItem: (k, v) => m.set(k, String(v)), getItem: (k) => (m.has(k) ? m.get(k) : null), removeItem: (k) => m.delete(k) };
  assert.equal(L.speicherTesten(() => gut), true);
  assert.equal(m.size, 0, 'Probe wird wieder entfernt');
  // Brave Shields mit blockierten Cookies: schon der Zugriff auf localStorage wirft
  assert.equal(L.speicherTesten(() => { throw new Error('SecurityError'); }), false);
  // Speicher voll oder schreibgeschützt
  assert.equal(L.speicherTesten(() => ({ setItem: () => { throw new Error('QuotaExceededError'); }, getItem: () => null, removeItem: () => {} })), false);
  // schluckt Schreiben stillschweigend
  assert.equal(L.speicherTesten(() => ({ setItem: () => {}, getItem: () => null, removeItem: () => {} })), false);
  assert.equal(L.speicherTesten(() => null), false);
});

test('Kalenderraster beginnt am Montag', () => {
  const r = L.monatsRaster(2026, 1);
  // 01.01.2026 ist ein Donnerstag
  assert.deepEqual(r.slice(0, 4), [null, null, null, '2026-01-01']);
  assert.equal(r.length, 3 + 31);
  assert.equal(L.monatsRaster(2026, 6)[0], '2026-06-01');
});
