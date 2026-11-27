/* Spiele: Memory, Tresor, Würfelspiel, Blitzrunde, Partner-Diktat.
 * c: { el, stufe, melde, spaeter, takt, antwort, punkte, ende, flitzSieg, blitzErgebnis }
 */
(function (global) {
  'use strict';
  const Z = global.Zahlen;
  const A = global.Aufgaben;
  const B = global.Bausteine;
  const K = global.Katalog;
  const h = B.h;
  const F = Z.format;
  const S = {};

  /* ---------- Memory ---------- */
  S.memory = function (c) {
    const paare = A.memory(c.stufe, c.zufall);
    const karten = c.zufall.mische(paare.flatMap((p, i) => [{ paar: i, text: p.a }, { paar: i, text: p.b }]));
    let offen = [];
    let versuche = 0;
    let gefunden = 0;
    let wartet = false;
    const stand = h('p', { class: 'spielstand', 'aria-live': 'polite' });
    const zeigeStand = () => { stand.textContent = 'Paare: ' + gefunden + ' von 6   |   Versuche: ' + versuche; };
    const feld = h('div', { class: 'memory' + (c.stufe === 2 ? ' woerter' : '') }, karten.map((k) => {
      const el = h('button', { class: 'memokarte', 'data-paar': k.paar, 'aria-label': 'Verdeckte Karte' }, h('span', { class: 'vorne' }, k.text), h('span', { class: 'hinten', 'aria-hidden': 'true' }, '?'));
      el.addEventListener('click', () => {
        if (wartet || el.classList.contains('auf')) return;
        el.classList.add('auf');
        el.setAttribute('aria-label', k.text.replace(/\u00ad/g, ''));
        B.ton('klick');
        offen.push({ el, k });
        if (offen.length < 2) return;
        versuche++;
        const [x, y] = offen;
        offen = [];
        if (x.k.paar === y.k.paar) {
          gefunden++;
          B.ton('gut');
          x.el.classList.add('fertig');
          y.el.classList.add('fertig');
          c.antwort(1);
          if (gefunden === 6) {
            c.spaeter(() => c.ende({
              sterne: versuche <= 10 ? 3 : versuche <= 15 ? 2 : 1,
              text: 'Alle 6 Paare in ' + versuche + ' Versuchen gefunden.',
            }), 900);
          }
        } else {
          wartet = true;
          c.spaeter(() => {
            [x, y].forEach((o) => { o.el.classList.remove('auf'); o.el.setAttribute('aria-label', 'Verdeckte Karte'); });
            wartet = false;
          }, 1500);
        }
        zeigeStand();
      });
      return el;
    }));
    zeigeStand();
    c.el.append(h('p', { class: 'auftrag' }, 'Finde immer zwei Karten, die dieselbe Zahl zeigen.'), stand, feld);
  };

  /* ---------- Tresor ---------- */
  S.tresor = function (c) {
    const r = c.zufall;
    let min, max, schritt, art;
    if (c.stufe === 1) { min = 0; max = 100000; schritt = 1000; art = 'ein voller Tausender'; } else if (c.stufe === 2) {
      min = r.int(0, 9) * 10000; max = min + 10000; schritt = 100; art = 'ein voller Hunderter';
    } else { min = r.int(0, 9) * 10000; max = min + 10000; schritt = 1; art = 'eine beliebige Zahl'; }
    const geheim = min + r.int(1, (max - min) / schritt - 1) * schritt;
    const ideal = Math.ceil(Math.log2((max - min) / schritt));
    let unten = min;
    let oben = max;
    let versuche = 0;
    let offen = true;

    const tuer = h('div', { class: 'tresor', 'data-geheim': geheim }, h('span', { 'aria-hidden': 'true' }, '🔐'));
    const bereich = h('i', {});
    const leiste = h('div', { class: 'suchleiste', 'aria-hidden': 'true' }, bereich);
    const info = h('p', { class: 'spielstand', 'aria-live': 'polite' });
    const verlauf = h('ol', { class: 'verlauf' });
    const E = B.Eingabe();
    c.eingabe(E, raten);
    const f = E.feld({ label: 'Dein Tipp' });
    function zeige() {
      bereich.style.left = ((unten - min) / (max - min)) * 100 + '%';
      bereich.style.width = ((oben - unten) / (max - min)) * 100 + '%';
      info.textContent = 'Die Geheimzahl liegt zwischen ' + F(unten) + ' und ' + F(oben) + '. Versuche: ' + versuche;
    }
    function raten() {
      if (!offen) return;
      const v = f.wert();
      if (v === null) { c.melde('Tippe zuerst eine Zahl ein.', 'fast'); return; }
      if (v <= unten || v >= oben) { c.melde('Dein Tipp muss zwischen ' + F(unten) + ' und ' + F(oben) + ' liegen.', 'fast'); f.setze(''); return; }
      versuche++;
      f.setze('');
      if (v === geheim) {
        offen = false;
        E.sperre();
        tuer.firstChild.textContent = '💎';
        tuer.classList.add('offen');
        B.ton('stern');
        c.melde('Der Tresor ist offen! Die Geheimzahl war ' + F(geheim) + '.', 'gut');
        const sterne = versuche <= ideal + 1 ? 3 : versuche <= ideal + 5 ? 2 : 1;
        c.antwort(1);
        c.punkte(K.BASIS[c.stufe - 1] * 2);
        c.spaeter(() => c.ende({ sterne, text: 'Geheimzahl ' + F(geheim) + ' in ' + versuche + ' Versuchen geknackt.' }), 1600);
        return;
      }
      const groesser = geheim > v;
      if (groesser) unten = v; else oben = v;
      verlauf.prepend(h('li', {}, F(v) + (groesser ? ': zu klein ⬆️' : ': zu groß ⬇️')));
      c.melde(F(v) + (groesser ? ' ist zu klein. Die Geheimzahl ist größer.' : ' ist zu groß. Die Geheimzahl ist kleiner.'), 'info');
      zeige();
    }
    c.el.append(
      h('p', { class: 'auftrag' }, 'Knacke den Tresor! Die Geheimzahl ist ' + art + '. Tipp: Rate immer ungefähr in der Mitte.'),
      tuer, leiste, info, h('div', { class: 'rechenzeile' }, f.el, h('button', { class: 'knopf', 'data-aktion': 'raten', onclick: raten }, 'Raten')),
      E.tastatur(), verlauf);
    zeige();
  };

  /* ---------- Würfelspiel ---------- */
  /** Beste Platzwahl: Erwartungswert über alle noch folgenden Würfe. */
  const wertMerker = new Map();
  function erwartung(frei, richtung) {
    if (!frei) return 0;
    const key = frei + ':' + richtung;
    if (wertMerker.has(key)) return wertMerker.get(key);
    let summe = 0;
    for (let w = 1; w <= 6; w++) summe += besteWahl(frei, w, richtung).wert;
    wertMerker.set(key, summe / 6);
    return summe / 6;
  }
  function besteWahl(frei, w, richtung) {
    let best = null;
    for (let i = 0; i < 5; i++) {
      if (!(frei & (1 << i))) continue;
      const wert = w * Z.STELLEN[i].wert + erwartung(frei & ~(1 << i), richtung);
      if (!best || (richtung > 0 ? wert > best.wert : wert < best.wert)) best = { platz: i, wert };
    }
    return best;
  }
  S.besteWahl = besteWahl;

  S.wuerfelspiel = function (c) {
    const start = h('div', { class: 'spielwahl' });
    let gegner = 'flitz';
    let richtung = 1;
    const gruppe = (titel, optionen, setzeWert) => {
      const knoepfe = optionen.map(([wert, text], i) => h('button', {
        class: 'wahl' + (i === 0 ? ' gewaehlt' : ''), 'data-wert': String(wert), 'aria-pressed': String(i === 0),
        onclick: (ev) => {
          setzeWert(wert);
          knoepfe.forEach((k) => { k.classList.toggle('gewaehlt', k === ev.currentTarget); k.setAttribute('aria-pressed', String(k === ev.currentTarget)); });
        },
      }, text));
      return h('div', {}, h('h3', {}, titel), h('div', { class: 'wahlliste' }, knoepfe));
    };
    start.append(
      h('p', { class: 'auftrag' }, 'Würfelt 5-mal abwechselnd. Nach jedem Wurf entscheidest du, an welche Stelle die Ziffer kommt.'),
      gruppe('Wer spielt?', [['flitz', '🦊 Gegen Fuchs Flitz'], ['zwei', '👫 Zu zweit']], (v) => { gegner = v; }),
      gruppe('Wer gewinnt?', [[1, 'Die größte Zahl'], [-1, 'Die kleinste Zahl']], (v) => { richtung = v; }),
      h('button', { class: 'knopf riesig', 'data-aktion': 'start', onclick: () => spiele() }, 'Spiel starten'));
    c.el.appendChild(start);

    function spiele() {
      c.el.innerHTML = '';
      const namen = gegner === 'flitz' ? [c.name, 'Fuchs Flitz'] : [c.name, 'Spielpartner'];
      const tafeln = [[null, null, null, null, null], [null, null, null, null, null]];
      let dran = 0;
      let wurf = null;
      let vorbei = false;
      const knoepfe = [[], []];
      const brett = h('div', { class: 'brett' }, [0, 1].map((p) => {
        const zellen = Z.STELLEN.map((st, i) => {
          const k = h('button', { class: 'platz', 'data-spieler': p, 'data-platz': i, disabled: true, 'aria-label': namen[p] + ', ' + st.name, onclick: () => setze(p, i) });
          knoepfe[p].push(k);
          return k;
        });
        return h('section', { class: 'spieler' }, h('h3', {}, (p === 1 && gegner === 'flitz' ? '🦊 ' : '') + namen[p]), B.tafel(zellen, { klasse: 'spiel' }));
      }));
      const wuerfelFeld = h('div', { class: 'wurffeld', 'aria-live': 'polite' }, B.wuerfel(1));
      const ansage = h('p', { class: 'spielstand', 'aria-live': 'polite' });
      const wurfKnopf = h('button', { class: 'knopf riesig', 'data-aktion': 'wuerfeln', onclick: () => wuerfle() }, '🎲 Würfeln');
      c.el.append(ansage, wuerfelFeld, wurfKnopf, brett);

      const menschlich = () => dran === 0 || gegner === 'zwei';
      function zug() {
        wurf = null;
        ansage.textContent = namen[dran] + ' ist dran.';
        brett.children[0].classList.toggle('dran', dran === 0);
        brett.children[1].classList.toggle('dran', dran === 1);
        wurfKnopf.disabled = !menschlich();
        if (!menschlich()) c.spaeter(wuerfle, 700);
      }
      function wuerfle() {
        if (wurf !== null || vorbei) return;
        wurf = c.zufall.int(1, 6);
        wurfKnopf.disabled = true;
        B.ton('klick');
        wuerfelFeld.innerHTML = '';
        wuerfelFeld.appendChild(B.wuerfel(wurf));
        wuerfelFeld.classList.remove('rollt');
        void wuerfelFeld.offsetWidth;
        wuerfelFeld.classList.add('rollt');
        if (menschlich()) {
          ansage.textContent = namen[dran] + ' hat eine ' + wurf + ' gewürfelt. Tippe auf eine freie Stelle.';
          knoepfe[dran].forEach((k, i) => { k.disabled = tafeln[dran][i] !== null; });
        } else {
          const frei = tafeln[1].reduce((m, v, i) => (v === null ? m | (1 << i) : m), 0);
          const klug = c.stufe === 3 || (c.stufe === 2 && c.zufall.wahr(0.65));
          const platz = klug ? besteWahl(frei, wurf, richtung).platz : c.zufall.aus([0, 1, 2, 3, 4].filter((i) => frei & (1 << i)));
          ansage.textContent = 'Fuchs Flitz hat eine ' + wurf + ' gewürfelt.';
          c.spaeter(() => setze(1, platz), 800);
        }
      }
      function setze(p, i) {
        if (p !== dran || wurf === null || tafeln[p][i] !== null || vorbei) return;
        tafeln[p][i] = wurf;
        knoepfe[p][i].textContent = String(wurf);
        knoepfe[p].forEach((k) => { k.disabled = true; });
        wurf = null;
        if (tafeln[0].every((v) => v !== null) && tafeln[1].every((v) => v !== null)) { schluss(); return; }
        dran = 1 - dran;
        wurf = 0; // kurz gesperrt, bis der nächste Zug beginnt
        c.spaeter(zug, 450);
      }
      function schluss() {
        vorbei = true;
        wurfKnopf.disabled = true;
        const z = tafeln.map((t) => Z.ausZiffern(t));
        const unterschied = (z[0] - z[1]) * richtung;
        const sieger = unterschied > 0 ? 0 : unterschied < 0 ? 1 : -1;
        const zeichen = z[0] > z[1] ? ' > ' : z[0] < z[1] ? ' < ' : ' = ';
        const text = F(z[0]) + zeichen + F(z[1]) + '. ' + (sieger < 0 ? 'Unentschieden!' : namen[sieger] + ' gewinnt!');
        ansage.textContent = text;
        c.melde(text, sieger === 0 || gegner === 'zwei' ? 'gut' : 'info');
        if (gegner === 'flitz') {
          if (sieger === 0) { c.flitzSieg(); c.punkte(500); }
          c.punkte(100);
        } else c.punkte(200);
        c.spaeter(() => c.ende({ sterne: gegner === 'flitz' ? (sieger === 0 ? 3 : sieger < 0 ? 2 : 1) : null, text }), 2600);
      }
      zug();
    }
  };

  /* ---------- Blitzrunde ---------- */
  S.blitz = function (c) {
    const DAUER = 60;
    let punkte = 0;
    let fehler = 0;
    let rest = DAUER;
    let wartet = false;
    let vorbei = false;
    const uhr = h('div', { class: 'uhr' }, h('i', {}));
    const stand = h('p', { class: 'spielstand' });
    const frage = h('p', { class: 'blitzfrage', 'aria-live': 'polite' });
    const antworten = h('div', { class: 'wahlliste blitz' });
    const wertung = () => Math.max(0, punkte - Math.floor(fehler / 2));
    const zeigeStand = () => { stand.textContent = '⏱️ ' + rest + ' Sekunden   |   ⚡ ' + wertung() + ' Punkte'; };
    function naechste() {
      if (vorbei) return;
      const a = A.blitz(c.stufe, c.zufall);
      wartet = false;
      frage.textContent = a.frage;
      antworten.innerHTML = '';
      a.optionen.forEach((o) => antworten.appendChild(h('button', {
        class: 'wahl', 'data-richtig': o === a.richtig ? '1' : '0',
        onclick: (ev) => {
          if (wartet || vorbei) return;
          wartet = true;
          const ok = o === a.richtig;
          ev.currentTarget.classList.add(ok ? 'richtig' : 'falsch');
          if (ok) { punkte++; B.ton('gut'); c.antwortKurz(); } else {
            fehler++;
            B.ton('fast');
            antworten.querySelector('[data-richtig="1"]').classList.add('richtig');
          }
          zeigeStand();
          c.spaeter(naechste, ok ? 300 : 1500);
        },
      }, F(o))));
    }
    function los() {
      c.el.innerHTML = '';
      c.el.append(stand, uhr, frage, antworten);
      zeigeStand();
      naechste();
      const ende = Date.now() + DAUER * 1000;
      const stopp = c.takt(() => {
        const ms = Math.max(0, ende - Date.now());
        rest = Math.ceil(ms / 1000);
        uhr.firstChild.style.width = (ms / (DAUER * 1000)) * 100 + '%';
        zeigeStand();
        if (ms <= 0) {
          stopp();
          vorbei = true;
          const w = wertung();
          c.blitzErgebnis(w);
          c.ende({ sterne: w >= 12 ? 3 : w >= 8 ? 2 : w >= 4 ? 1 : 0, text: w + ' Punkte (' + punkte + ' richtig, ' + fehler + ' falsch).' });
        }
      }, 200);
    }
    c.el.append(
      h('p', { class: 'auftrag' }, 'Du hast 60 Sekunden. Jede richtige Antwort gibt einen Punkt, nach 2 Fehlern geht ein Punkt verloren.'),
      h('button', { class: 'knopf riesig', 'data-aktion': 'start', onclick: los }, '⚡ Los geht’s'));
  };

  /* ---------- Partner-Diktat ---------- */
  S.partner = function (c) {
    const RUNDEN = 6;
    let nr = 0;
    let richtig = 0;
    function lesen() {
      const a = A.diktat(c.stufe, c.zufall);
      const leser = nr % 2 === 0 ? 'Kind A' : 'Kind B';
      const schreiber = nr % 2 === 0 ? 'Kind B' : 'Kind A';
      c.eingabe(null);
      c.melde('', '');
      c.el.innerHTML = '';
      c.el.append(
        h('p', { class: 'spielstand' }, 'Zahl ' + (nr + 1) + ' von ' + RUNDEN),
        h('p', { class: 'auftrag' }, leser + ' liest vor. ' + schreiber + ' darf nicht auf den Bildschirm schauen!'),
        h('div', { class: 'gross zahl geheim', 'data-zahl': a.zahl }, F(a.zahl)),
        h('button', { class: 'knopf riesig', 'data-aktion': 'verstecken', onclick: () => schreiben(a.zahl, schreiber) }, 'Vorgelesen! Zahl verstecken'));
    }
    function schreiben(zahl, schreiber) {
      const E = B.Eingabe();
      let fertig = false;
      c.el.innerHTML = '';
      c.eingabe(E, pruefe);
      const f = E.feld({ label: 'Gehörte Zahl' });
      const knopf = h('button', { class: 'knopf', 'data-aktion': 'pruefen', onclick: pruefe }, 'Prüfen');
      const unten = h('div', { class: 'aktionen' }, knopf);
      c.el.append(
        h('p', { class: 'spielstand' }, 'Zahl ' + (nr + 1) + ' von ' + RUNDEN),
        h('p', { class: 'auftrag' }, schreiber + ': Schreibe die Zahl, die du gehört hast.'),
        h('div', { class: 'rechenzeile' }, f.el), E.tastatur(), unten);
      function pruefe() {
        if (fertig) return;
        const v = f.wert();
        if (v === null) { c.melde('Tippe zuerst die Zahl ein.', 'fast'); return; }
        fertig = true;
        E.sperre();
        const ok = v === zahl;
        f.markiere(ok);
        if (ok) { richtig++; B.ton('gut'); c.antwort(1); c.melde('Richtig! Ihr seid ein starkes Team.', 'gut'); } else {
          B.ton('fast');
          c.antwort(0);
          c.melde('Vorgelesen wurde ' + F(zahl) + ' (' + Z.wortDe(zahl) + '). Vergleicht gemeinsam.', 'fast');
        }
        knopf.remove();
        unten.appendChild(h('button', {
          class: 'knopf', 'data-aktion': 'weiter',
          onclick: () => {
            nr++;
            if (nr < RUNDEN) lesen();
            else c.ende({ sterne: K.sterneFuer(richtig / RUNDEN), text: richtig + ' von ' + RUNDEN + ' Zahlen richtig.' });
          },
        }, 'Weiter'));
      }
    }
    lesen();
  };

  global.Spiele = S;
})(window);
