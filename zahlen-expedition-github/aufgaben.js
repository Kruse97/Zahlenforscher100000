/* Zufalls-Aufgaben in drei Stufen (1 leicht, 2 mittel, 3 schwer). Reine Daten, ohne Oberfläche. */
(function (global) {
  'use strict';
  const Z = global.Zahlen;
  const F = Z.format;
  const A = {};

  /* ---------- Hilfen ---------- */
  function fuenfstellig(r, ohneNull) {
    if (!ohneNull) return r.int(10000, 99999);
    return Z.ausZiffern([r.int(1, 9), r.int(1, 9), r.int(1, 9), r.int(1, 9), r.int(1, 9)]);
  }

  /** Zahl mit 1–2 Nullen in T/H/Z/E */
  function mitNullen(r) {
    const d = [r.int(1, 9), r.int(1, 9), r.int(1, 9), r.int(1, 9), r.int(1, 9)];
    const orte = r.mische([1, 2, 3, 4]).slice(0, r.int(1, 2));
    orte.forEach((i) => { d[i] = 0; });
    return Z.ausZiffern(d);
  }

  function zahlNachStufe(r, stufe) {
    if (stufe === 1) {
      // übersichtliche Zahlen: volle Hunderter
      return r.int(11, 999) * 100;
    }
    if (stufe === 2) return fuenfstellig(r, true);
    return mitNullen(r);
  }

  /** Verwechslungs-Zahlen: Zifferndreher und verrutschte Nullen */
  function aehnliche(r, n, anzahl) {
    const menge = new Set();
    const s = String(n).split('');
    let versuche = 0;
    while (menge.size < anzahl && versuche++ < 200) {
      const k = s.slice();
      const i = r.int(0, k.length - 1);
      const j = r.int(0, k.length - 1);
      if (r.wahr(0.7)) [k[i], k[j]] = [k[j], k[i]];
      else k[i] = String(r.int(i === 0 ? 1 : 0, 9));
      if (k[0] === '0') continue;
      const m = Number(k.join(''));
      if (m !== n && m <= 100000) menge.add(m);
    }
    let plus = 1;
    while (menge.size < anzahl) {
      const m = n + plus * 10 <= 100000 ? n + plus * 10 : n - plus * 10;
      menge.add(m);
      plus++;
    }
    return Array.from(menge);
  }

  /* ---------- Stellenwerte ---------- */
  A.buendeln = function (stufe, r) {
    const reihe = ['HT', 'ZT', 'T', 'H', 'Z', 'E'];
    let von, nach, anzahl;
    const abstand = stufe === 3 ? r.int(2, 3) : 1;
    const i = r.int(0, reihe.length - 1 - abstand);
    const gross = reihe[i];
    const klein = reihe[i + abstand];
    const faktor = Z.WERT[gross] / Z.WERT[klein];
    const rueckwaerts = stufe > 1 ? r.wahr() : r.wahr(0.3);
    let k = gross === 'HT' ? 1 : r.int(1, stufe === 1 ? 6 : 9);
    if (stufe > 1 && gross !== 'HT' && faktor === 10 && r.wahr(0.4)) k = r.int(11, 40);
    // nie mehr als 100 000
    while (k * Z.WERT[gross] > 100000) k = Math.max(1, Math.floor(k / 2));
    if (rueckwaerts) {
      von = klein; nach = gross; anzahl = k * faktor;
      return { von, nach, anzahl, loesung: k };
    }
    return { von: gross, nach: klein, anzahl: k, loesung: k * faktor };
  };

  A.material = function (stufe, r, i) {
    // zum Abschluss der mittleren Stufe: der Hunderttausender als Platte aus 10 Stangen
    if (stufe === 2 && i === 4) return { art: 'ht', anzahlen: [10, 0, 0, 0, 0], loesung: 100000 };
    let d;
    if (stufe === 1) {
      d = [r.int(0, 2), r.int(1, 5), r.int(1, 5), r.int(0, 6), r.int(0, 9)];
    } else if (stufe === 2) {
      d = [r.int(1, 4), r.int(0, 9), r.int(0, 9), r.int(0, 9), r.int(0, 9)];
      d[r.int(1, 4)] = 0;
    } else {
      d = [r.int(1, 3), r.int(0, 8), r.int(0, 8), r.int(0, 8), r.int(0, 8)];
      d[r.int(1, 4)] = r.int(10, 13);
    }
    return { anzahlen: d, loesung: Z.ausZiffern(d) };
  };

  A.legen = function (stufe, r) {
    let d, teile;
    do {
      d = [r.int(1, stufe === 1 ? 4 : 7), r.int(0, 9), r.int(0, 9), r.int(0, 9), r.int(0, 9)];
      if (stufe === 3) d[r.int(1, 3)] = 0;
    } while (d.reduce((a, b) => a + b, 0) > (stufe === 1 ? 18 : 24));
    const ziel = Z.ausZiffern(d);
    if (stufe === 3) {
      // 1 Einheit entbündeln: z. B. 4 T 2 H wird zu 3 T 12 H
      const roh = d.slice();
      const kandidaten = [0, 1, 2, 3].filter((i) => roh[i] > 0 && !(i === 0 && roh[0] < 2));
      const i = r.aus(kandidaten.length ? kandidaten : [0]);
      roh[i] -= 1;
      roh[i + 1] += 10;
      teile = r.mische(roh.map((anz, j) => [Z.STELLEN[j].k, anz]).filter((t) => t[1] > 0));
    }
    return { ziel, loesung: ziel, art: stufe === 1 ? 'zahl' : stufe === 2 ? 'wort' : 'teile', teile };
  };

  A.zerlegen = function (stufe, r) {
    const n = stufe === 1 ? fuenfstellig(r, true) : mitNullen(r);
    const d = Z.ziffern(n);
    const summanden = d.map((x, i) => x * Z.STELLEN[i].wert);
    if (stufe === 3) {
      const durcheinander = r.mische(summanden.filter((s) => s > 0));
      return { zahl: n, richtung: 'zusammen', summanden: durcheinander, loesung: n };
    }
    return { zahl: n, richtung: 'zerlegen', loesung: summanden };
  };

  A.steckbrief = function (stufe, r) {
    const n = stufe === 1 ? fuenfstellig(r, true) : mitNullen(r);
    const optionen = r.mische([n].concat(aehnliche(r, n, 2)));
    const art = stufe === 1 ? 'zahl' : stufe === 2 ? 'wort' : 'karten';
    const karten = r.mische(Z.ziffern(n).map((x, i) => [Z.STELLEN[i].k, x]));
    return { zahl: n, art, karten, optionen, loesung: n };
  };

  A.kartensalat = function (stufe, r) {
    let karten, d;
    if (stufe === 1) {
      d = [0, r.int(1, 9), r.int(1, 9), r.int(1, 9), r.int(1, 9)];
      karten = d.map((x, i) => [Z.STELLEN[i].k, x]).slice(1);
    } else if (stufe === 2) {
      d = [r.int(1, 9), r.int(0, 9), r.int(0, 9), r.int(0, 9), r.int(0, 9)];
      d[r.int(1, 4)] = 0;
      karten = d.map((x, i) => [Z.STELLEN[i].k, x]);
    } else {
      d = [r.int(1, 6), r.int(0, 8), r.int(0, 8), r.int(0, 8), r.int(0, 8)];
      const voll = r.int(1, 3);
      let leer;
      do { leer = r.int(1, 4); } while (leer === voll);
      d[voll] = r.int(10, 25);
      d[leer] = 0;
      karten = d.map((x, i) => [Z.STELLEN[i].k, x]).filter((_, i) => i !== leer);
    }
    return { karten: r.mische(karten), loesung: Z.ausZiffern(d) };
  };

  /* ---------- Zahlwörter ---------- */
  A.diktat = function (stufe, r) {
    const n = zahlNachStufe(r, stufe);
    return { zahl: n, loesung: n };
  };

  A.wortzahl = function (stufe, r) {
    const n = zahlNachStufe(r, stufe);
    return { zahl: n, wort: Z.wortDe(n), loesung: n };
  };

  A.zahlwort = function (stufe, r) {
    const n = zahlNachStufe(r, stufe);
    const optionen = r.mische([n].concat(aehnliche(r, n, stufe === 1 ? 2 : 3)));
    return { zahl: n, optionen, loesung: n };
  };

  A.sprachen = function (stufe, r) {
    const n = stufe === 1 ? r.int(11, 99) * 1000 + r.int(0, 9) * 100 : fuenfstellig(r, false);
    const sprache = stufe === 3 ? 'fr' : 'en';
    return { zahl: n, sprache, wort: sprache === 'fr' ? Z.wortFr(n) : Z.wortEn(n), hilfe: stufe !== 2, loesung: n };
  };

  /* ---------- Zahlenstrahl ---------- */
  function strahl(stufe, r) {
    let start, ende, schritt, beschriftet;
    if (stufe === 1) {
      start = 0; ende = 100000; schritt = 1000;
      beschriftet = [0, 10000, 20000, 50000, 100000];
    } else if (stufe === 2) {
      start = r.int(1, 17) * 5000; ende = start + 10000; schritt = 100;
      beschriftet = [start, start + 1000, start + 5000, start + 7000, ende];
    } else {
      if (r.wahr()) {
        start = r.int(10, 98) * 1000 + r.int(0, 9) * 100; ende = start + 1000; schritt = 10;
        beschriftet = [start, start + 100, start + 500, start + 700, ende];
      } else {
        start = r.int(100, 998) * 100; ende = start + 100; schritt = 1;
        beschriftet = [start, start + 10, start + 50, start + 70, ende];
      }
    }
    let wert;
    do { wert = start + r.int(1, 99) * schritt; } while (beschriftet.indexOf(wert) >= 0);
    return { start, ende, schritt, beschriftet, wert };
  }

  A.pfeil = function (stufe, r, i) {
    const s = strahl(stufe, r);
    // Die erste Aufgabe einer Runde klärt die Schrittweite
    if (i === 0) return Object.assign(s, { art: 'schritt', loesung: s.schritt });
    return Object.assign(s, { art: 'zahl', loesung: s.wert });
  };

  A.setzen = function (stufe, r) {
    const s = strahl(stufe, r);
    return Object.assign(s, { loesung: s.wert });
  };

  /* ---------- Nachbarn, Folgen, Runden ---------- */
  const NACHBAR_NAMEN = {
    1: ['Vorgänger', 'Nachfolger'],
    10: ['Nachbarzehner', 'Nachbarzehner'],
    100: ['Nachbarhunderter', 'Nachbarhunderter'],
    1000: ['Nachbartausender', 'Nachbartausender'],
    10000: ['Nachbarzehntausender', 'Nachbarzehntausender'],
  };
  A.NACHBAR_NAMEN = NACHBAR_NAMEN;

  A.nachbarn = function (stufe, r) {
    const einheiten = stufe === 1 ? [1, 10] : stufe === 2 ? [100, 1000] : r.mische([10, 100, 1000, 10000]).slice(0, 3).sort((a, b) => a - b);
    let n = r.int(10001, 99989);
    if (stufe === 3 && r.wahr(0.45)) {
      // Knackfälle: die Zahl ist selbst ein voller Zehner/Hunderter/Tausender
      const u = r.aus([10, 100, 1000]);
      n = r.int(Math.ceil(10001 / u), Math.floor(99989 / u)) * u;
    }
    const reihen = einheiten.map((s) => ({ einheit: s, unten: Z.nachbarn(n, s).unten, oben: Z.nachbarn(n, s).oben }));
    return { zahl: n, reihen, loesung: reihen };
  };

  A.detektiv = function (stufe, r) {
    const art = r.aus(stufe === 1 ? ['vn', 'nz'] : stufe === 2 ? ['nh', 'nt', 'nz'] : ['groesste', 'kleinste', 'offenT', 'gleich']);
    const n = r.int(11000, 98000);
    let zeilen, pruefe, beispiel;
    if (art === 'vn') {
      zeilen = ['Mein Vorgänger ist ' + F(n - 1) + '.', 'Mein Nachfolger ist ' + F(n + 1) + '.'];
      pruefe = (x) => x - 1 === n - 1 && x + 1 === n + 1;
      beispiel = n;
    } else if (art === 'nz' || art === 'nh' || art === 'nt') {
      const s = art === 'nz' ? 10 : art === 'nh' ? 100 : 1000;
      const u = Math.floor(n / s) * s;
      zeilen = ['Meine ' + NACHBAR_NAMEN[s][0] + ' sind ' + F(u) + ' und ' + F(u + s) + '.'];
      pruefe = (x) => x > u && x < u + s;
      beispiel = u + Math.floor(s / 2);
    } else if (art === 'groesste' || art === 'kleinste') {
      const s = r.aus([10, 100, 1000]);
      const g = Z.runden(n, s);
      const gross = art === 'groesste';
      const ziel = gross ? g + s / 2 - 1 : g - s / 2;
      const name = s === 10 ? 'Zehner' : s === 100 ? 'Hunderter' : 'Tausender';
      zeilen = ['Rundet man mich auf ' + name + ', erhält man ' + F(g) + '.',
        'Ich bin die ' + (gross ? 'größte' : 'kleinste') + ' Zahl, für die das stimmt.'];
      pruefe = (x) => x === ziel;
      beispiel = ziel;
    } else if (art === 'offenT') {
      const oben = r.int(10, 99) * 1000;
      zeilen = ['Mein größerer Nachbartausender ist ' + F(oben) + '.', 'Welche Zahl könnte ich sein?'];
      pruefe = (x) => Z.nachbarn(x, 1000).oben === oben;
      beispiel = oben - 500;
    } else {
      const k = r.int(1, 8);
      const u = k * 10000;
      const ziel = (k) * 11111;
      zeilen = ['Meine Nachbarzehntausender sind ' + F(u) + ' und ' + F(u + 10000) + '.', 'Alle meine Ziffern sind gleich.'];
      pruefe = (x) => x > u && x < u + 10000 && new Set(String(x)).size === 1;
      beispiel = ziel;
    }
    return { art, zeilen, pruefe, beispiel, loesung: beispiel };
  };

  A.folgen = function (stufe, r) {
    const schritte = stufe === 1 ? [100, 1000, 10000] : stufe === 2 ? [10, 100, 1000, 5000] : [1, 50, 250, 500, 2500];
    const schritt = r.aus(schritte);
    const runter = stufe === 1 ? false : r.wahr();
    const laenge = 6;
    const weite = schritt * (laenge - 1);
    let start;
    if (stufe === 1) {
      start = r.int(0, Math.floor((100000 - weite) / schritt)) * schritt;
    } else {
      // so wählen, dass die Folge über eine „große Stufe“ geht
      const stufeGross = schritt <= 1 ? 100 : schritt <= 50 ? 1000 : schritt <= 500 ? 10000 : 20000;
      const maxK = Math.floor((100000 - weite) / stufeGross);
      const grenze = r.int(1, Math.max(1, maxK)) * stufeGross;
      start = grenze - schritt * r.int(2, 3);
      if (start < 0) start = 0;
      if (start + weite > 100000) start = 100000 - weite;
    }
    let glieder = Array.from({ length: laenge }, (_, i) => start + i * schritt);
    if (runter) glieder = glieder.reverse();
    const luecken = stufe === 1 ? [4, 5] : stufe === 2 ? [3, 4, 5] : r.mische([2, 3, 4, 5]).slice(0, 3).sort((a, b) => a - b);
    return { glieder, luecken, schritt: runter ? -schritt : schritt, loesung: luecken.map((i) => glieder[i]) };
  };

  const RUNDEN_NAMEN = { 10: 'Zehner', 100: 'Hunderter', 1000: 'Tausender', 10000: 'Zehntausender' };
  A.RUNDEN_NAMEN = RUNDEN_NAMEN;

  A.runden = function (stufe, r) {
    const s = r.aus(stufe === 1 ? [10, 100] : stufe === 2 ? [1000, 10000] : [10, 100, 1000, 10000]);
    let n = r.int(s === 10000 ? 5001 : 10001, 99400);
    if (stufe === 3 && r.wahr(0.5)) {
      // Knackfälle: genau in der Mitte oder Übertrag über die Neun
      if (r.wahr()) n = Math.floor(n / s) * s + s / 2;
      else n = (Math.floor(n / (s * 10)) * 10 + 9) * s + r.int(s / 2, s - 1);
      if (n > 99999) n = 99999;
    }
    return { zahl: n, stelle: s, loesung: Z.runden(n, s) };
  };

  /* ---------- Vergleichen und Ordnen ---------- */
  function zeichen(a, b) { return a < b ? '<' : a > b ? '>' : '='; }

  A.vergleichen = function (stufe, r) {
    let a, b;
    if (stufe === 1) {
      a = r.int(10, 999) * 100;
      b = r.wahr(0.15) ? a : r.int(10, 999) * 100;
    } else {
      a = fuenfstellig(r, false);
      b = r.wahr(0.15) ? a : r.aus(aehnliche(r, a, 3));
    }
    let links = { wert: a, text: F(a), art: 'zahl' };
    let rechts = { wert: b, text: F(b), art: 'zahl' };
    if (stufe === 3) {
      const seite = r.wahr() ? links : rechts;
      const d = Z.ziffern(seite.wert);
      if (seite.wert < 100000 && r.wahr()) {
        seite.art = 'wort';
        seite.text = Z.wortDeTrennbar(seite.wert);
      } else if (seite.wert < 100000) {
        seite.art = 'teile';
        seite.text = r.mische(d.map((x, i) => (x ? x + ' ' + Z.STELLEN[i].k : '')).filter(Boolean)).join(' + ');
      }
    }
    return { links, rechts, loesung: zeichen(a, b) };
  };

  A.ballons = function (stufe, r) {
    const anzahl = stufe === 1 ? 5 : stufe === 2 ? 6 : 7;
    const menge = new Set();
    if (stufe === 1) {
      while (menge.size < anzahl) menge.add(r.int(10, 999) * 100);
    } else {
      const basis = fuenfstellig(r, true);
      menge.add(basis);
      let schutz = 0;
      while (menge.size < anzahl && schutz++ < 300) aehnliche(r, basis, 2).forEach((m) => { if (menge.size < anzahl) menge.add(m); });
      while (menge.size < anzahl) menge.add(fuenfstellig(r, false));
    }
    const richtung = stufe === 1 ? 'auf' : r.aus(['auf', 'ab']);
    const zahlen = r.mische(Array.from(menge));
    const loesung = zahlen.slice().sort((a, b) => (richtung === 'auf' ? a - b : b - a));
    return { zahlen, richtung, loesung };
  };

  /* ---------- Zahlenrätsel (immer genau eine Lösung) ---------- */
  const gleicheZiffern = (n) => new Set(String(n)).size === 1;
  const lauterVerschiedene = (n) => new Set(String(n)).size === String(n).length;
  const stellig = (n, k) => String(n).length === k;

  A.raetsel = function (stufe, r) {
    const arten = stufe === 1 ? ['kleinste', 'groesste', 'mitte', 'mehr'] : stufe === 2 ? ['mitteVor', 'ziffern', 'gleich', 'ergaenze', 'doppelt'] : ['verschieden', 'ziffern2', 'gleichNah', 'mitteVor', 'rueckwaerts'];
    const art = r.aus(arten);
    let text, pruefe, loesung;
    if (art === 'kleinste' || art === 'groesste') {
      const k = r.int(3, 5);
      const wort = { 3: 'dreistellige', 4: 'vierstellige', 5: 'fünfstellige' }[k];
      loesung = art === 'kleinste' ? Math.pow(10, k - 1) : Math.pow(10, k) - 1;
      text = 'Meine Zahl ist die ' + (art === 'kleinste' ? 'kleinste' : 'größte') + ' ' + wort + ' Zahl.';
      pruefe = art === 'kleinste' ? (x) => stellig(x, k) && !stellig(x - 1, k) : (x) => stellig(x, k) && !stellig(x + 1, k);
    } else if (art === 'mitte' || art === 'mitteVor') {
      const m = r.int(2, 18) * 5000;
      const h = r.int(1, Math.min(m, 100000 - m) / 1000) * 1000;
      const a = m - h;
      const b = m + h;
      const nachher = r.wahr();
      if (art === 'mitte') {
        text = 'Meine Zahl liegt genau in der Mitte zwischen ' + F(a) + ' und ' + F(b) + '.';
        loesung = m;
        pruefe = (x) => x - a === b - x;
      } else {
        loesung = nachher ? m + 1 : m - 1;
        text = 'Meine Zahl ist der ' + (nachher ? 'Nachfolger' : 'Vorgänger') + ' der Zahl, die genau in der Mitte zwischen ' + F(a) + ' und ' + F(b) + ' liegt.';
        pruefe = (x) => { const y = nachher ? x - 1 : x + 1; return y - a === b - y; };
      }
    } else if (art === 'mehr') {
      const basis = r.int(11, 88) * 1000;
      const plus = r.aus([10, 100, 1000, 10000]);
      const mehr = r.wahr();
      loesung = mehr ? basis + plus : basis - plus;
      text = 'Meine Zahl ist um ' + F(plus) + (mehr ? ' größer' : ' kleiner') + ' als ' + F(basis) + '.';
      pruefe = mehr ? (x) => x - plus === basis : (x) => x + plus === basis;
    } else if (art === 'ergaenze') {
      const s = r.int(21, 99) * 1000;
      const plus = r.aus([100, 500, 1000, 5000, 10000]);
      loesung = s - plus;
      text = 'Wenn du zu meiner Zahl ' + F(plus) + ' addierst, erhältst du ' + F(s) + '.';
      pruefe = (x) => x + plus === s;
    } else if (art === 'doppelt') {
      const basis = r.int(6, 49) * 1000;
      const halb = r.wahr();
      loesung = halb ? basis / 2 : basis * 2;
      text = 'Meine Zahl ist ' + (halb ? 'die Hälfte' : 'das Doppelte') + ' von ' + F(basis) + '.';
      pruefe = halb ? (x) => x * 2 === basis : (x) => x === basis * 2;
    } else if (art === 'gleich') {
      const k = r.int(1, 9);
      loesung = k * 11111;
      const u = k * 10000;
      text = 'Meine fünf Ziffern sind alle gleich. Ich liege zwischen ' + F(u) + ' und ' + F(u + 10000) + '.';
      pruefe = (x) => stellig(x, 5) && gleicheZiffern(x) && x > u && x < u + 10000;
    } else if (art === 'gleichNah') {
      const t = r.aus([20000, 30000, 40000, 50000, 60000, 70000, 80000]);
      const kandidaten = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => k * 11111);
      loesung = kandidaten.reduce((best, k) => (Math.abs(k - t) < Math.abs(best - t) ? k : best), kandidaten[0]);
      text = 'Meine fünf Ziffern sind alle gleich. Von allen solchen Zahlen liege ich am nächsten bei ' + F(t) + '.';
      pruefe = (x) => stellig(x, 5) && gleicheZiffern(x) && kandidaten.every((k) => k === x || Math.abs(k - t) > Math.abs(x - t));
    } else if (art === 'ziffern') {
      const zt = r.int(1, 4);
      const t = zt * 2;
      const h = r.int(0, 9);
      const e = r.int(1, 4);
      const zz = r.int(0, 9);
      loesung = Z.ausZiffern([zt, t, h, zz, e]);
      text = 'Ich habe ' + zt + ' Zehntausender und doppelt so viele Tausender. Dazu kommen ' + h + ' Hunderter, ' + zz + ' Zehner und ' + e + ' Einer.';
      pruefe = (x) => x === zt * 10000 + t * 1000 + h * 100 + zz * 10 + e;
    } else if (art === 'ziffern2') {
      const e = r.int(1, 3);
      const zz = e * 3;
      const h = 0;
      const t = zz - 1;
      const zt = r.int(1, 9);
      loesung = Z.ausZiffern([zt, t, h, zz, e]);
      text = 'Meine Zahl hat fünf Stellen. Vorne steht eine ' + zt + ', ganz hinten eine ' + e + '. Die Zehnerziffer ist dreimal so groß wie die Einerziffer. Die Tausenderziffer ist um 1 kleiner als die Zehnerziffer. Hunderter habe ich keine.';
      pruefe = (x) => {
        if (!stellig(x, 5)) return false;
        const d = Z.ziffern(x);
        return d[0] === zt && d[4] === e && d[3] === 3 * d[4] && d[1] === d[3] - 1 && d[2] === 0;
      };
    } else if (art === 'verschieden') {
      const k = r.int(4, 5);
      const gross = r.wahr();
      const gerade = r.wahr(0.4);
      const wort = k === 5 ? 'fünfstellige' : 'vierstellige';
      text = 'Meine Zahl ist die ' + (gross ? 'größte' : 'kleinste') + ' ' + (gerade ? 'gerade ' : '') + wort + ' Zahl mit lauter verschiedenen Ziffern.';
      const gilt = (x) => stellig(x, k) && lauterVerschiedene(x) && (!gerade || x % 2 === 0);
      loesung = gross ? Math.pow(10, k) - 1 : Math.pow(10, k - 1);
      while (!gilt(loesung)) loesung += gross ? -1 : 1;
      pruefe = (x) => {
        if (!gilt(x)) return false;
        if (gross) { for (let y = x + 1; y < Math.pow(10, k); y++) if (gilt(y)) return false; } else {
          for (let y = x - 1; y >= Math.pow(10, k - 1); y--) if (gilt(y)) return false;
        }
        return true;
      };
    } else {
      const start = r.int(20, 80) * 1000;
      const a = r.aus([100, 1000, 10000]);
      const b = r.aus([10, 500, 5000]);
      loesung = start;
      const ende = start + a - b;
      text = 'Ich denke mir eine Zahl. Ich addiere ' + F(a) + ' und ziehe dann ' + F(b) + ' ab. Jetzt habe ich ' + F(ende) + '.';
      pruefe = (x) => x + a - b === ende;
    }
    return { art, text, pruefe, loesung };
  };

  /* ---------- Forschen ---------- */
  A.plaettchen = function (stufe, r) {
    const d = [r.int(1, 6), r.int(1, 6), r.int(1, 7), r.int(1, 5), r.int(1, 6)];
    const zahl = Z.ausZiffern(d);
    if (stufe === 3) {
      const art = r.aus(['dazu', 'weg', 'schieben']);
      const moeglich = [];
      for (let i = 0; i < 5; i++) {
        if (art === 'dazu') moeglich.push(zahl + Z.STELLEN[i].wert);
        if (art === 'weg') moeglich.push(zahl - Z.STELLEN[i].wert);
        if (art === 'schieben') {
          for (let j = 0; j < 5; j++) if (i !== j) moeglich.push(zahl - Z.STELLEN[i].wert + Z.STELLEN[j].wert);
        }
      }
      return { ziffern: d, zahl, art, anzahl: 3, moeglich: Array.from(new Set(moeglich)), loesung: moeglich.slice(0, 3) };
    }
    const i = r.int(0, 4);
    if (stufe === 1) {
      const art = r.aus(['dazu', 'weg']);
      return { ziffern: d, zahl, art, von: i, loesung: zahl + (art === 'dazu' ? 1 : -1) * Z.STELLEN[i].wert };
    }
    let j;
    do { j = r.int(0, 4); } while (j === i);
    return { ziffern: d, zahl, art: 'schieben', von: i, nach: j, loesung: zahl - Z.STELLEN[i].wert + Z.STELLEN[j].wert };
  };

  A.wuerfelbauer = function (stufe, r) {
    const anzahl = stufe === 1 ? 4 : 5;
    let wuerfel, alle;
    const art = r.aus(stufe === 1 ? ['groesste', 'kleinste', 'drei'] : stufe === 2 ? ['groesste', 'kleinste', 'drei'] : ['zweitgroesste', 'zweitkleinste', 'groessteGerade']);
    do {
      wuerfel = Array.from({ length: anzahl }, () => r.int(1, 6));
      alle = Z.alleAnordnungen(wuerfel);
    } while (alle.length < 4 || (art === 'groessteGerade' && !alle.some((x) => x % 2 === 0)));
    let loesung;
    if (art === 'groesste') loesung = alle[alle.length - 1];
    if (art === 'kleinste') loesung = alle[0];
    if (art === 'zweitgroesste') loesung = alle[alle.length - 2];
    if (art === 'zweitkleinste') loesung = alle[1];
    if (art === 'groessteGerade') loesung = alle.filter((x) => x % 2 === 0).pop();
    if (art === 'drei') loesung = alle.slice(0, 3);
    return { wuerfel, art, alle, loesung };
  };

  A.knobel = function (stufe, r, i) {
    // Wie viele verschiedene Zahlen entstehen aus 4 Würfeln? 1, 4, 6, 12 oder 24
    const folge = stufe === 1 ? [4, 1, 6, 24] : stufe === 2 ? [6, 4, 12, 24] : [12, 4, 24, 6];
    const ziel = folge[(i || 0) % folge.length];
    const beispiele = { 1: [3, 3, 3, 3], 4: [2, 2, 2, 5], 6: [1, 1, 6, 6], 12: [4, 4, 2, 5], 24: [2, 3, 5, 6] };
    return { ziel, anzahl: 4, loesung: beispiele[ziel] };
  };

  // viel: Gegenstände, behaelter: Mehrzahl, datPl: „in 5 …“, einer: „In … passen“, einem: „in …“
  const DINGE = [
    { viel: 'Murmeln', behaelter: 'Gläser', datPl: 'Gläsern', einer: 'ein Glas', einem: 'einem Glas', bild: '🫙' },
    { viel: 'Büroklammern', behaelter: 'Schachteln', datPl: 'Schachteln', einer: 'eine Schachtel', einem: 'einer Schachtel', bild: '📎' },
    { viel: 'Perlen', behaelter: 'Dosen', datPl: 'Dosen', einer: 'eine Dose', einem: 'einer Dose', bild: '🥫' },
    { viel: 'Sticker', behaelter: 'Hefte', datPl: 'Heften', einer: 'ein Heft', einem: 'einem Heft', bild: '📒' },
    { viel: 'Nudeln', behaelter: 'Packungen', datPl: 'Packungen', einer: 'eine Packung', einem: 'einer Packung', bild: '🍝' },
    { viel: 'Schrauben', behaelter: 'Kisten', datPl: 'Kisten', einer: 'eine Kiste', einem: 'einer Kiste', bild: '🧰' },
    { viel: 'Samen', behaelter: 'Tüten', datPl: 'Tüten', einer: 'eine Tüte', einem: 'einer Tüte', bild: '🌱' },
  ];

  A.packungen = function (stufe, r) {
    const ding = r.aus(DINGE);
    if (stufe === 1) {
      const gesamt = r.aus([1000, 10000, 100000]);
      const moeglich = gesamt === 1000 ? [10, 100] : gesamt === 10000 ? [100, 1000] : [1000, 10000];
      const je = r.aus(moeglich);
      return { ding, art: 'behaelter', gesamt, je, loesung: gesamt / je };
    }
    if (stufe === 2) {
      const gesamt = r.aus([10000, 100000, 100000]);
      const je = r.aus([50, 200, 500, 2000, 5000].filter((x) => gesamt / x >= 2));
      return { ding, art: 'behaelter', gesamt, je, loesung: gesamt / je };
    }
    const art = r.aus(['behaelter', 'je', 'gesamt']);
    const je = r.aus([250, 400, 500, 800, 2500, 4000]);
    const gesamt = 100000;
    if (art === 'behaelter') return { ding, art, gesamt, je, loesung: gesamt / je };
    if (art === 'je') return { ding, art, gesamt, kisten: gesamt / je, loesung: je };
    // gut rechenbare Anzahlen, keine „157 · 400“
    const kisten = r.aus([3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 20, 25, 30, 40, 50, 100].filter((k) => k * je <= 100000));
    return { ding, art, kisten, je, loesung: kisten * je };
  };

  A.mmpapier = function (stufe, r, i) {
    if (stufe === 1) {
      const zahl = r.int(11, 50) * 1000;
      return { art: 'malen', zahl, schritt: 1000, loesung: zahl };
    }
    if (stufe === 2) {
      const zahl = r.int(101, 999) * 100;
      return { art: 'malen', zahl, schritt: 100, loesung: zahl };
    }
    if (i === 3) return { art: 'streifen', loesung: 100 };
    const zahl = r.int(101, 999) * 100;
    return { art: 'lesen', zahl, schritt: 100, loesung: zahl };
  };

  A.ergaenzen = function (stufe, r) {
    let zahl;
    if (stufe === 1) zahl = r.int(1, 19) * 5000;
    else if (stufe === 2) zahl = r.int(11, 199) * 500;
    else zahl = r.int(101, 9899) * 10;
    return { zahl, ziel: 100000, loesung: 100000 - zahl };
  };

  /* ---------- Spiele ---------- */
  A.memory = function (stufe, r) {
    const zahlen = new Set();
    const paare = [];
    while (paare.length < 6) {
      let n, a, b;
      if (stufe === 1) {
        n = r.int(1, 9) * 10000 + r.int(1, 9) * 1000;
        if (r.wahr(0.5)) n = r.int(1, 9) * 10000 + r.int(1, 9) * 100;
      } else n = fuenfstellig(r, false);
      if (zahlen.has(n)) continue;
      zahlen.add(n);
      const d = Z.ziffern(n);
      a = F(n);
      const teile = d.map((x, i) => (x ? x + ' ' + Z.STELLEN[i].k : '')).filter(Boolean);
      if (stufe === 1) b = teile.join(' + ');
      else if (stufe === 2) b = Z.wortDeTrennbar(n);
      else b = r.mische(teile).join(' + ');
      paare.push({ zahl: n, a, b });
    }
    return paare;
  };

  A.blitz = function (stufe, r) {
    const art = r.aus(['groesser', 'vor', 'nach', 'runden', 'wort', 'stelle']);
    const basis = stufe === 1 ? r.int(11, 999) * 100 : fuenfstellig(r, stufe === 2);
    let frage, richtig, falsche;
    if (art === 'groesser') {
      const andere = aehnliche(r, basis, 2);
      const alle = [basis].concat(andere);
      richtig = Math.max.apply(null, alle);
      falsche = alle.filter((x) => x !== richtig);
      frage = 'Welche Zahl ist am größten?';
    } else if (art === 'vor' || art === 'nach') {
      const n = r.wahr(0.6) ? r.int(2, 9) * 10000 + (art === 'vor' ? 0 : 999) : basis;
      richtig = art === 'vor' ? n - 1 : n + 1;
      falsche = [art === 'vor' ? n + 1 : n - 1, art === 'vor' ? n - 10 : n + 10];
      frage = (art === 'vor' ? 'Vorgänger' : 'Nachfolger') + ' von ' + F(n) + '?';
    } else if (art === 'runden') {
      const s = r.aus([100, 1000]);
      const n = r.int(10001, 99000);
      richtig = Z.runden(n, s);
      falsche = [richtig + s, richtig - s];
      frage = 'Runde ' + F(n) + ' auf ' + RUNDEN_NAMEN[s] + '.';
    } else if (art === 'wort') {
      richtig = basis;
      falsche = aehnliche(r, basis, 2);
      frage = 'Welche Zahl ist „' + Z.wortDeTrennbar(basis) + '“?';
    } else {
      const d = Z.ziffern(basis);
      const i = r.int(0, 3);
      richtig = d[i];
      const menge = new Set();
      while (menge.size < 2) { const x = r.int(0, 9); if (x !== richtig) menge.add(x); }
      falsche = Array.from(menge);
      frage = 'Welche Ziffer steht bei ' + F(basis) + ' an der ' + Z.STELLEN[i].name + 'stelle?';
    }
    const optionen = r.mische([richtig].concat(falsche.slice(0, 2)));
    return { art, frage, optionen, richtig, loesung: richtig };
  };

  global.Aufgaben = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
