/* Die Übungen: Jede zeichnet eine Aufgabe und sagt, ob die Antwort stimmt.
 *
 * zeige(aufgabe, c) liefert
 *   frage      Arbeitsauftrag (wird oben angezeigt und kann vorgelesen werden)
 *   tipp()     Hilfe als Element oder Text
 *   pruefen()  null = noch nicht fertig, true/false oder { ok, text }
 *   loesung()  Erklärung der Lösung
 *   ohnePruefen  true, wenn die Übung sich selbst auswertet
 */
(function (global) {
  'use strict';
  const Z = global.Zahlen;
  const A = global.Aufgaben;
  const B = global.Bausteine;
  const h = B.h;
  const F = Z.format;
  const U = {};

  /* ---------- kleine Helfer ---------- */
  const st = (k) => h('b', { class: 'stelle st-' + k }, k);
  const gross = (inhalt, klasse) => h('div', { class: 'gross ' + (klasse || '') }, inhalt);
  const zeile = (...k) => h('div', { class: 'rechenzeile' }, ...k);
  const absatz = (...k) => h('p', {}, ...k);
  const farbzahl = (n) => {
    const ziffern = String(n).split('');
    const stellen = ['HT', 'ZT', 'T', 'H', 'Z', 'E'].slice(6 - ziffern.length);
    return h('span', { class: 'farbzahl', 'aria-label': String(n) },
      ziffern.map((z, i) => h('span', { class: 'st-' + stellen[i] + (ziffern.length - i === 4 ? ' abstand' : '') }, z)));
  };

  function feld(c, opt) {
    return c.E.feld(opt);
  }

  /** Prüft Felder gegen Sollwerte und färbt sie. leerIstNull: leeres Feld zählt als 0. */
  function felderPruefen(paare, leerIstNull) {
    let alle = true;
    let erstesFalsche = null;
    paare.forEach(([f, soll]) => {
      const ist = f.wert() === null && leerIstNull ? 0 : f.wert();
      const richtig = ist === soll;
      f.markiere(richtig);
      f.loeschenBeimTippen = !richtig;
      if (!richtig) {
        alle = false;
        erstesFalsche = erstesFalsche || f;
      }
    });
    // das erste falsche Feld gleich zum Verbessern auswählen
    if (erstesFalsche && felderPruefen.E) felderPruefen.E.waehle(erstesFalsche);
    return alle;
  }

  function einFeld(c, soll, opt) {
    const f = feld(c, opt);
    return {
      f,
      pruefen: () => (f.wert() === null ? null : felderPruefen([[f, soll]])),
    };
  }

  /** Auswahlknöpfe. sofort = Antippen prüft direkt. */
  function wahl(c, optionen, richtig, opt) {
    const o = opt || {};
    let gewaehlt = null;
    const knoepfe = optionen.map((op) => h('button', {
      class: 'wahl', 'data-wert': String(op.wert), 'aria-pressed': 'false', 'aria-label': op.label,
      onclick: (ev) => {
        if (c.E.gesperrt || ev.currentTarget.disabled) return;
        gewaehlt = op.wert;
        knoepfe.forEach((k) => {
          k.classList.toggle('gewaehlt', k === ev.currentTarget);
          k.setAttribute('aria-pressed', String(k === ev.currentTarget));
        });
        if (o.sofort) c.pruefe();
      },
    }, op.text));
    return {
      el: h('div', { class: 'wahlliste ' + (o.klasse || '') }, knoepfe),
      wert: () => gewaehlt,
      pruefen() {
        if (gewaehlt === null) return null;
        const i = optionen.findIndex((op) => op.wert === gewaehlt);
        const ok = gewaehlt === richtig;
        knoepfe[i].classList.add(ok ? 'richtig' : 'falsch');
        if (!ok) {
          knoepfe[i].disabled = true;
          knoepfe[i].classList.remove('gewaehlt');
          gewaehlt = null;
        }
        return ok;
      },
      zeigeRichtig() {
        knoepfe[optionen.findIndex((op) => op.wert === richtig)].classList.add('richtig');
      },
    };
  }

  const buendelKette = () => h('ul', { class: 'kette' }, ['HT', 'ZT', 'T', 'H', 'Z'].map((k, i) => h('li', {}, '1 ', st(k), ' = 10 ', st(['ZT', 'T', 'H', 'Z', 'E'][i]))));

  /* ---------- Stellenwert-Strand ---------- */
  U.buendeln = {
    zeige(a, c) {
      const e = einFeld(c, a.loesung, { label: 'Anzahl' });
      c.el.appendChild(zeile(h('span', { class: 'zahl' }, F(a.anzahl)), st(a.von), h('span', {}, '='), e.f.el, st(a.nach)));
      const gr = Z.WERT[a.von] > Z.WERT[a.nach] ? a.von : a.nach;
      const kl = gr === a.von ? a.nach : a.von;
      return {
        frage: 'Bündle! Wie viele sind es?',
        pruefen: e.pruefen,
        tipp: () => h('div', {}, absatz('Immer 10 von einer Stelle werden zu 1 der nächsten größeren Stelle.'), buendelKette()),
        loesung: () => absatz('1 ', st(gr), ' = ' + F(Z.WERT[gr] / Z.WERT[kl]) + ' ', st(kl), ', deshalb: ' + F(a.anzahl) + ' ', st(a.von), ' = ' + F(a.loesung) + ' ', st(a.nach)),
      };
    },
  };

  U.material = {
    zeige(a, c) {
      const bild = B.material(a.anzahlen);
      if (a.art === 'ht') bild.classList.add('hunderttausender');
      c.el.appendChild(bild);
      const e = einFeld(c, a.loesung, { label: 'Zahl' });
      c.el.appendChild(zeile(h('span', {}, 'Zahl:'), e.f.el));
      const ht = a.art === 'ht';
      return {
        frage: ht ? 'Hier liegen die Stangen dicht an dicht zu einer riesigen Platte. Welche Zahl ist das?'
          : c.stufe === 3 ? 'Welche Zahl ist gebaut? Achtung: Manchmal musst du noch bündeln.' : 'Welche Zahl ist hier gebaut?',
        pruefen: e.pruefen,
        tipp: () => h('div', {}, absatz('Zähle zuerst die großen Teile, dann die kleinen.'), B.materialLegende()),
        loesung: () => (ht ? absatz('10 Stangen zu je 10\u202f000 sind 100\u202f000. So sieht ein Hunderttausender aus!')
          : h('div', {}, absatz(a.anzahlen.map((n, i) => n + ' ' + Z.STELLEN[i].k).join(', ') + ' ergibt ' + F(a.loesung) + '.'), B.tafelFuer(a.loesung))),
      };
    },
  };

  U.legen = {
    zeige(a, c) {
      let vorgabe;
      if (a.art === 'zahl') vorgabe = gross(F(a.ziel), 'zahl');
      else if (a.art === 'wort') vorgabe = gross(Z.wortDeTrennbar(a.ziel), 'wort');
      else vorgabe = gross(a.teile.map(([k, n], i) => [i ? ' + ' : null, n + ' ', st(k)]), 'teile');
      const T = B.plaettchenTafel([0, 0, 0, 0, 0], { bedienbar: true });
      c.el.append(vorgabe, T.el);
      c.beiSperre(() => { T.gesperrt = true; });
      return {
        frage: a.art === 'teile' ? 'Lege die Zahl mit Plättchen. In jede Spalte passen höchstens 9.' : 'Lege diese Zahl mit Plättchen.',
        vorlesen: a.art === 'wort' ? 'Lege diese Zahl mit Plättchen.' : undefined,
        pruefen: () => (T.werte().every((v) => v === 0) ? null : T.zahl() === a.ziel),
        tipp: () => (a.art === 'teile'
          ? absatz('Hast du 10 oder mehr von einer Stelle? Dann tausche 10 davon gegen 1 Plättchen links daneben.')
          : absatz('Beginne links bei den Zehntausendern. Mit + legst du ein Plättchen dazu, mit − nimmst du eines weg.')),
        loesung: () => h('div', {}, absatz('So sieht ' + F(a.ziel) + ' aus:'), B.tafelFuer(a.ziel)),
      };
    },
  };

  U.zerlegen = {
    zeige(a, c) {
      if (a.richtung === 'zusammen') {
        const e = einFeld(c, a.loesung, { label: 'Zahl' });
        const teile = a.summanden.map((s, i) => [i ? h('span', {}, '+') : null, h('span', { class: 'zahl st-' + Z.STELLEN.find((x) => s >= x.wert).k }, F(s))]);
        c.el.appendChild(zeile(teile, h('span', {}, '='), e.f.el));
        return {
          frage: 'Setze die Zahl wieder zusammen.',
          pruefen: e.pruefen,
          tipp: () => absatz('Ordne zuerst: Zehntausender, Tausender, Hunderter, Zehner, Einer. Fehlt eine Stelle, steht dort eine 0.'),
          loesung: () => h('div', {}, absatz('Die Zahl heißt ' + F(a.loesung) + '.'), B.tafelFuer(a.loesung)),
        };
      }
      const felder = a.loesung.map((_, i) => feld(c, { label: Z.STELLEN[i].name, klasse: 'rand-' + Z.STELLEN[i].k }));
      c.el.appendChild(gross(farbzahl(a.zahl), 'zahl'));
      c.el.appendChild(h('div', { class: 'rechenzeile zerlegung' }, h('span', {}, '='), felder.map((f, i) => [i ? h('span', {}, '+') : null, f.el])));
      return {
        frage: 'Zerlege die Zahl in ihre Stellenwerte.',
        pruefen: () => (felder.every((f) => f.wert() === null) ? null : felderPruefen(felder.map((f, i) => [f, a.loesung[i]]), true)),
        tipp: () => h('div', {}, absatz('Die erste Ziffer sind die Zehntausender. Ihr Kästchen bekommt also eine Zahl mit vier Nullen.'), B.tafelFuer(a.zahl)),
        loesung: () => absatz(F(a.zahl) + ' = ' + a.loesung.map(F).join(' + ')),
      };
    },
  };

  const karte = (k, n) => h('div', { class: 'stellenkarte st-' + k }, h('b', {}, k), h('span', {}, String(n)));

  U.kartensalat = {
    zeige(a, c) {
      c.el.appendChild(h('div', { class: 'karten' }, a.karten.map(([k, n]) => karte(k, n))));
      const e = einFeld(c, a.loesung, { label: 'Zahl' });
      c.el.appendChild(zeile(h('span', {}, 'Zahl:'), e.f.el));
      return {
        frage: 'Karten-Salat! Welche Zahl ergibt das?',
        pruefen: e.pruefen,
        tipp: () => absatz('Sortiere im Kopf: ZT, T, H, Z, E. Eine fehlende Stelle ist 0. Sind es mehr als 9, musst du bündeln.'),
        loesung: () => h('div', {}, absatz('Die Zahl heißt ' + F(a.loesung) + '.'), B.tafelFuer(a.loesung)),
      };
    },
  };

  U.steckbrief = {
    zeige(a, c) {
      const brief = h('div', { class: 'steckbrief' });
      if (a.art === 'zahl') brief.appendChild(gross(F(a.zahl), 'zahl'));
      if (a.art === 'wort') brief.appendChild(gross(Z.wortDeTrennbar(a.zahl), 'wort'));
      if (a.art === 'karten') brief.appendChild(h('div', { class: 'karten' }, a.karten.map(([k, n]) => karte(k, n))));
      const paare = [];
      let zahlFeld = null;
      if (a.art !== 'zahl') {
        zahlFeld = feld(c, { label: 'Zahl' });
        brief.append(h('h3', {}, 'Zahl'), zeile(zahlFeld.el));
        paare.push([zahlFeld, a.zahl]);
      }
      const ziffern = Z.ziffern(a.zahl);
      const tafelFelder = ziffern.map((_, i) => feld(c, { max: 1, label: 'Ziffer ' + Z.STELLEN[i].name }));
      brief.append(h('h3', {}, 'Stellenwerttafel'), B.tafel(tafelFelder.map((f) => f.el), { klasse: 'eingabe' }));
      const summen = ziffern.map((z, i) => z * Z.STELLEN[i].wert);
      const sumFelder = summen.map((_, i) => feld(c, { label: 'Summand ' + Z.STELLEN[i].name, klasse: 'rand-' + Z.STELLEN[i].k }));
      brief.append(h('h3', {}, 'Zerlegung'), h('div', { class: 'rechenzeile zerlegung' }, sumFelder.map((f, i) => [i ? h('span', {}, '+') : null, f.el])));
      let w = null;
      if (a.art !== 'wort') {
        w = wahl(c, a.optionen.map((n) => ({ wert: n, text: Z.wortDeTrennbar(n) })), a.zahl, { klasse: 'woerter' });
        brief.append(h('h3', {}, 'Zahlwort'), w.el);
      }
      c.el.appendChild(brief);
      return {
        frage: 'Fülle den Steckbrief vollständig aus.',
        pruefen() {
          if (tafelFelder.some((f) => f.wert() === null) || (zahlFeld && zahlFeld.wert() === null) || (w && w.wert() === null)) return null;
          if (sumFelder.every((f) => f.wert() === null)) return null;
          let ok = felderPruefen(paare.concat(tafelFelder.map((f, i) => [f, ziffern[i]])));
          ok = felderPruefen(sumFelder.map((f, i) => [f, summen[i]]), true) && ok;
          if (w) ok = w.pruefen() && ok;
          return ok;
        },
        tipp: () => absatz('Fange mit der Stellenwerttafel an. Jede Ziffer bekommt ihre eigene Spalte, auch die 0.'),
        loesung: () => {
          if (w) w.zeigeRichtig();
          return h('div', {}, absatz(F(a.zahl) + ' = ' + summen.filter(Boolean).map(F).join(' + ')), B.tafelFuer(a.zahl), absatz(Z.wortDeTrennbar(a.zahl)));
        },
      };
    },
  };

  /* ---------- Zahlenwort-Wald ---------- */
  const zahlMitWort = (n) => h('p', {}, h('strong', {}, F(n)), ' – ' + Z.wortDeTrennbar(n));

  U.diktat = {
    zeige(a, c) {
      const wort = h('div', { class: 'gross wort versteckt' }, Z.wortDeTrennbar(a.zahl));
      const zeigen = () => wort.classList.remove('versteckt');
      if (B.kannSprechen()) {
        c.el.appendChild(h('div', { class: 'hoeren' },
          h('button', { class: 'knopf riesig', 'data-aktion': 'anhoeren', onclick: () => { if (!B.sprich(Z.wortDe(a.zahl), 0.85)) zeigen(); } }, '🔊 Zahl anhören'),
          h('button', { class: 'knopf hell', onclick: () => B.sprich(Z.wortDe(a.zahl), 0.55) }, '🐢 Langsam'),
          h('button', { class: 'knopf hell', 'data-aktion': 'zeigen', onclick: zeigen }, 'Ich höre nichts')));
      } else {
        zeigen();
        c.el.appendChild(h('p', { class: 'hinweis' }, 'Dieses Gerät kann nicht vorlesen. Lies das Zahlwort.'));
      }
      c.el.appendChild(wort);
      const e = einFeld(c, a.loesung, { label: 'Zahl' });
      c.el.appendChild(zeile(e.f.el));
      return {
        frage: 'Hör genau zu und schreibe die Zahl mit Ziffern.',
        pruefen: e.pruefen,
        tipp: () => absatz('Achte auf das Wort „tausend“: Was davor gesagt wird, gehört zu ZT und T. Was danach kommt, gehört zu H, Z und E.'),
        loesung: () => zahlMitWort(a.zahl),
      };
    },
  };

  U.wortzahl = {
    zeige(a, c) {
      c.el.appendChild(gross(Z.wortDeTrennbar(a.zahl), 'wort'));
      const e = einFeld(c, a.loesung, { label: 'Zahl' });
      c.el.appendChild(zeile(e.f.el));
      return {
        frage: 'Lies das Zahlwort und schreibe die Zahl mit Ziffern.',
        pruefen: e.pruefen,
        tipp: () => absatz('Teile das Wort beim Wort „tausend“. Schreibe erst die Tausender, dann genau 3 Ziffern für den Rest.'),
        loesung: () => h('div', {}, zahlMitWort(a.zahl), B.tafelFuer(a.zahl)),
      };
    },
  };

  U.zahlwort = {
    zeige(a, c) {
      c.el.appendChild(gross(F(a.zahl), 'zahl'));
      const w = wahl(c, a.optionen.map((n) => ({ wert: n, text: Z.wortDeTrennbar(n) })), a.loesung, { sofort: true, klasse: 'woerter' });
      c.el.appendChild(w.el);
      return {
        frage: 'Welches Zahlwort passt? Tippe es an.',
        pruefen: w.pruefen,
        ohnePruefKnopf: true,
        tipp: () => h('div', {}, absatz('Schau auf die Stellen: Zuerst kommen die Tausender.'), B.tafelFuer(a.zahl)),
        loesung: () => { w.zeigeRichtig(); return zahlMitWort(a.zahl); },
      };
    },
  };

  const FR_LISTE = '1 un, 2 deux, 3 trois, 4 quatre, 5 cinq, 6 six, 7 sept, 8 huit, 9 neuf, 10 dix, 11 onze, 12 douze, 13 treize, 14 quatorze, 15 quinze, 16 seize, 20 vingt, 30 trente, 40 quarante, 50 cinquante, 60 soixante, 70 soixante-dix, 80 quatre-vingts, 90 quatre-vingt-dix, 100 cent, 1000 mille';
  const EN_LISTE = '1 one, 2 two, 3 three, 4 four, 5 five, 6 six, 7 seven, 8 eight, 9 nine, 10 ten, 11 eleven, 12 twelve, 13 thirteen, 14 fourteen, 15 fifteen, 20 twenty, 30 thirty, 40 forty, 50 fifty, 60 sixty, 70 seventy, 80 eighty, 90 ninety, 100 hundred, 1000 thousand';
  const wortliste = (liste) => h('ul', { class: 'wortliste' }, liste.split(', ').map((x) => {
    const i = x.indexOf(' ');
    return h('li', {}, h('b', {}, F(Number(x.slice(0, i)))), ' ' + x.slice(i + 1));
  }));

  U.sprachen = {
    zeige(a, c) {
      const fr = a.sprache === 'fr';
      const name = fr ? 'Französisch' : 'Englisch';
      c.el.appendChild(h('div', { class: 'sprachkarte' },
        h('span', { class: 'sprachname' }, (fr ? '🇫🇷 ' : '🇬🇧 ') + name),
        h('p', { class: 'fremdwort', lang: a.sprache }, a.wort),
        B.kannSprechen() ? h('button', { class: 'knopf hell', onclick: () => B.sprich(a.wort, 0.8, fr ? 'fr-FR' : 'en-GB') }, '🔊 Anhören') : null));
      if (a.hilfe) c.el.appendChild(h('details', { class: 'woerterhilfe' }, h('summary', {}, 'Wörterliste ' + name), wortliste(fr ? FR_LISTE : EN_LISTE)));
      const e = einFeld(c, a.loesung, { label: 'Zahl' });
      c.el.appendChild(zeile(e.f.el));
      return {
        frage: 'Welche Zahl ist das auf ' + name + '? Schreibe sie mit Ziffern.',
        pruefen: e.pruefen,
        tipp: () => h('div', {}, absatz(fr
          ? '„mille“ heißt tausend, „cent“ heißt hundert. „et“ heißt und.'
          : '„thousand“ heißt tausend, „hundred“ heißt hundert. Anders als im Deutschen sagt man zuerst die Zehner: „twenty-one“.'), wortliste(fr ? FR_LISTE : EN_LISTE)),
        loesung: () => h('div', {}, absatz(h('strong', {}, F(a.zahl))), absatz(name + ': ' + a.wort), absatz('Deutsch: ' + Z.wortDeTrennbar(a.zahl)),
          absatz('Vergleiche: In welcher Reihenfolge werden Zehner und Einer gesprochen?')),
      };
    },
  };

  /* ---------- Zahlenstrahl-Fluss ---------- */
  const strichTipp = (a) => absatz('Zwischen zwei langen Strichen liegen 10 kleine Schritte. Ein kleiner Schritt ist hier ' + F(a.schritt) + ', von langem Strich zu langem Strich sind es ' + F(a.schritt * 10) + '.');

  U.pfeil = {
    zeige(a, c) {
      if (a.art === 'schritt') {
        const e = einFeld(c, a.loesung, { label: 'Wert eines kleinen Schritts' });
        c.el.append(B.zahlenstrahl(a).el, zeile(h('span', {}, 'Ein kleiner Schritt ist'), e.f.el));
        return {
          frage: 'In welchen Schritten geht dieser Zahlenstrahl? Wie viel ist es von einem Strich zum nächsten?',
          pruefen: e.pruefen,
          tipp: () => absatz('Suche zwei beschriftete Zahlen. Wie groß ist der Unterschied? Zähle dann, in wie viele kleine Schritte er geteilt ist.'),
          loesung: () => absatz('Von einem Strich zum nächsten sind es ' + F(a.schritt) + '. 10 solche Schritte ergeben ' + F(a.schritt * 10) + '.'),
        };
      }
      const S = B.zahlenstrahl(a, { pfeil: a.wert });
      const e = einFeld(c, a.loesung, { label: 'Zahl am Pfeil' });
      c.el.append(S.el, zeile(h('span', {}, 'Der Pfeil zeigt auf'), e.f.el));
      return {
        frage: 'Auf welche Zahl zeigt der Pfeil?',
        pruefen: e.pruefen,
        tipp: () => strichTipp(a),
        loesung: () => absatz('Der Pfeil zeigt auf ' + F(a.wert) + '. Ein kleiner Strich ist ' + F(a.schritt) + '.'),
      };
    },
  };

  U.setzen = {
    zeige(a, c) {
      const S = B.zahlenstrahl(a, { setzbar: true });
      c.el.append(gross(F(a.wert), 'zahl'), S.el);
      c.beiSperre(() => { S.gesperrt = true; });
      return {
        frage: 'Setze das Fähnchen genau auf diese Zahl.',
        pruefen: () => (S.wert === null ? null : S.wert === a.loesung),
        tipp: () => strichTipp(a),
        loesung: () => { S.zeigeLoesung(a.wert); S.rolleZu(a.wert); return absatz('Der rote Pfeil zeigt, wo ' + F(a.wert) + ' liegt.'); },
      };
    },
  };

  U.nachbarn = {
    zeige(a, c) {
      const paare = [];
      const box = h('div', { class: 'nachbarn' });
      a.reihen.forEach((r) => {
        const n = A.NACHBAR_NAMEN[r.einheit];
        const u = feld(c, { label: r.einheit === 1 ? n[0] : 'kleinerer ' + n[0] });
        const o = feld(c, { label: r.einheit === 1 ? n[1] : 'größerer ' + n[1] });
        paare.push([u, r.unten], [o, r.oben]);
        box.appendChild(h('div', { class: 'nachbar-reihe' },
          h('h3', {}, r.einheit === 1 ? 'Vorgänger und Nachfolger' : n[0]),
          h('div', { class: 'haeuser' }, u.el, h('span', { class: 'mitte' }, F(a.zahl)), o.el)));
      });
      c.el.appendChild(box);
      return {
        frage: 'Finde die Nachbarzahlen von ' + F(a.zahl) + '.',
        pruefen: () => (paare.some(([f]) => f.wert() === null) ? null : felderPruefen(paare)),
        tipp: () => absatz('Vorgänger: 1 weniger. Nachfolger: 1 mehr. Nachbarzehner sind die vollen Zehner direkt davor und danach. Ist die Zahl selbst schon ein voller Zehner, nimmst du den Zehner davor und den danach. Bei Hundertern und Tausendern ist es genauso.'),
        loesung: () => h('ul', {}, a.reihen.map((r) => h('li', {}, (r.einheit === 1 ? 'Vorgänger und Nachfolger' : A.NACHBAR_NAMEN[r.einheit][0]) + ': ' + F(r.unten) + ' und ' + F(r.oben)))),
      };
    },
  };

  U.detektiv = {
    zeige(a, c) {
      c.el.appendChild(h('div', { class: 'notizzettel' }, h('span', { class: 'lupe-bild', 'aria-hidden': 'true' }, '🕵️'), a.zeilen.map((z) => h('p', {}, z))));
      const f = feld(c, { label: 'Gesuchte Zahl' });
      c.el.appendChild(zeile(h('span', {}, 'Meine Zahl:'), f.el));
      return {
        frage: 'Finde eine Zahl, die zu allen Hinweisen passt.',
        vorlesen: 'Finde eine Zahl, die zu allen Hinweisen passt. ' + a.zeilen.join(' '),
        pruefen() {
          if (f.wert() === null) return null;
          const ok = a.pruefe(f.wert());
          f.markiere(ok);
          f.loeschenBeimTippen = !ok;
          return ok;
        },
        tipp: () => absatz('Stell dir den Zahlenstrahl vor: Zwischen welchen beiden Zahlen muss deine Zahl liegen?'),
        loesung: () => absatz('Eine passende Zahl ist ' + F(a.beispiel) + '.'),
      };
    },
  };

  U.folgen = {
    zeige(a, c) {
      const felder = [];
      const steine = a.glieder.map((g, i) => {
        if (a.luecken.indexOf(i) < 0) return h('div', { class: 'stein' }, F(g));
        const f = feld(c, { label: 'Stein ' + (i + 1), klasse: 'stein' });
        felder.push([f, g]);
        return f.el;
      });
      c.el.appendChild(h('div', { class: 'steine' }, steine));
      return {
        frage: 'Springe über die Steine: Welche Zahlen fehlen?',
        pruefen: () => (felder.some(([f]) => f.wert() === null) ? null : felderPruefen(felder)),
        tipp: () => absatz('Vergleiche die ersten beiden Zahlen. Wird es mehr oder weniger? Und um wie viel?'),
        loesung: () => absatz('Immer ' + (a.schritt > 0 ? '+ ' : '− ') + F(Math.abs(a.schritt)) + ': ' + a.glieder.map(F).join(', ')),
      };
    },
  };

  function rundungsBild(n, s) {
    const u = Math.floor(n / s) * s;
    const x = (v) => 40 + ((v - u) / s) * 420;
    const svg = B.s('svg', { viewBox: '0 0 500 100', class: 'rundungsbild', role: 'img', 'aria-label': 'Zahlenstrahl zwischen ' + u + ' und ' + (u + s) });
    svg.appendChild(B.s('line', { x1: 30, y1: 55, x2: 470, y2: 55, class: 'achse' }));
    for (let i = 0; i <= 10; i++) svg.appendChild(B.s('line', { x1: 40 + i * 42, x2: 40 + i * 42, y1: i % 5 ? 49 : 40, y2: i % 5 ? 61 : 70, class: 'strich' }));
    [u, u + s / 2, u + s].forEach((v) => svg.appendChild(B.s('text', { x: x(v), y: 90, 'text-anchor': 'middle', class: 'marke' }, F(v))));
    svg.appendChild(B.s('path', { d: 'M' + (x(n) - 9) + ' 22L' + x(n) + ' 50L' + (x(n) + 9) + ' 22z', class: 'zeiger' }));
    svg.appendChild(B.s('text', { x: Math.max(45, Math.min(455, x(n))), y: 17, 'text-anchor': 'middle', class: 'marke' }, F(n)));
    return svg;
  }

  U.runden = {
    zeige(a, c) {
      const e = einFeld(c, a.loesung, { label: 'gerundete Zahl' });
      c.el.appendChild(zeile(h('span', { class: 'zahl' }, F(a.zahl)), h('span', {}, '≈'), e.f.el));
      const rechts = { 10: 'Einer', 100: 'Zehner', 1000: 'Hunderter', 10000: 'Tausender' }[a.stelle];
      return {
        frage: 'Runde auf ' + A.RUNDEN_NAMEN[a.stelle] + '.',
        pruefen: e.pruefen,
        tipp: () => h('div', {}, absatz('Schau auf die ' + rechts + '. Bei 0, 1, 2, 3, 4 rundest du ab. Bei 5, 6, 7, 8, 9 rundest du auf.'), B.tafelFuer(a.zahl)),
        loesung: () => h('div', {}, rundungsBild(a.zahl, a.stelle), absatz(F(a.zahl) + ' ≈ ' + F(a.loesung))),
      };
    },
  };

  /* ---------- Vergleichs-Berge ---------- */
  U.vergleichen = {
    zeige(a, c) {
      const mitte = h('span', { class: 'platzhalter' }, '?');
      const seite = (x) => h('div', { class: 'vergleichsseite ' + x.art }, x.text);
      c.el.appendChild(h('div', { class: 'vergleich' }, seite(a.links), mitte, seite(a.rechts)));
      const namen = { '<': 'ist kleiner als', '=': 'ist gleich', '>': 'ist größer als' };
      const w = wahl(c, ['<', '=', '>'].map((z) => ({ wert: z, text: z, label: namen[z] })), a.loesung, { sofort: true, klasse: 'zeichen' });
      c.el.appendChild(w.el);
      return {
        frage: 'Kleiner, gleich oder größer?',
        pruefen() {
          const ok = w.pruefen();
          if (ok) mitte.textContent = a.loesung;
          return ok;
        },
        ohnePruefKnopf: true,
        tipp: () => absatz('Das offene Maul zeigt immer zur größeren Zahl. Vergleiche Stelle für Stelle von links.'),
        loesung: () => {
          mitte.textContent = a.loesung;
          w.zeigeRichtig();
          return absatz(F(a.links.wert) + ' ' + a.loesung + ' ' + F(a.rechts.wert));
        },
      };
    },
  };

  U.ballons = {
    zeige(a, c) {
      let naechste = 0;
      let fehler = 0;
      const schnur = h('div', { class: 'schnur', 'aria-live': 'polite' }, h('span', { class: 'hinweis' }, 'Deine Reihe:'));
      const himmel = h('div', { class: 'himmel' }, a.zahlen.map((n, i) => h('button', {
        class: 'ballon farbe' + (i % 5), 'data-wert': n, style: 'animation-delay:' + (-i * 0.4) + 's',
        onclick: (ev) => {
          const k = ev.currentTarget;
          if (c.E.gesperrt || k.disabled) return;
          if (n !== a.loesung[naechste]) {
            fehler++;
            B.ton('fast');
            k.classList.remove('wackelt');
            void k.offsetWidth;
            k.classList.add('wackelt');
            c.melde('Noch nicht. Welche Zahl ist ' + (a.richtung === 'auf' ? 'die kleinste' : 'die größte') + ' von den übrigen?', 'fast');
            return;
          }
          B.ton('plopp');
          k.disabled = true;
          k.classList.add('geplatzt');
          schnur.appendChild(h('span', { class: 'gesammelt' }, (naechste ? (a.richtung === 'auf' ? '< ' : '> ') : '') + F(n)));
          naechste++;
          c.melde('', '');
          if (naechste === a.loesung.length) c.fertig(fehler === 0 ? 1 : fehler <= 2 ? 0.5 : 0);
        },
      }, F(n))));
      c.el.append(himmel, schnur);
      return {
        frage: 'Lass die Ballons platzen: ' + (a.richtung === 'auf' ? 'von der kleinsten zur größten Zahl.' : 'von der größten zur kleinsten Zahl.'),
        ohnePruefen: true,
        tipp: () => absatz('Vergleiche zuerst die Zehntausender. Sind sie gleich, schau auf die Tausender, dann auf die Hunderter.'),
        loesung: () => absatz(a.loesung.map(F).join(a.richtung === 'auf' ? ' < ' : ' > ')),
      };
    },
  };

  U.raetsel = {
    zeige(a, c) {
      c.el.appendChild(h('div', { class: 'notizzettel' }, h('span', { class: 'lupe-bild', 'aria-hidden': 'true' }, '❓'), h('p', {}, a.text)));
      const e = einFeld(c, a.loesung, { label: 'Gesuchte Zahl' });
      c.el.appendChild(zeile(h('span', {}, 'Die Zahl heißt'), e.f.el));
      return {
        frage: 'Löse das Zahlenrätsel.',
        vorlesen: 'Löse das Zahlenrätsel. ' + a.text,
        pruefen: e.pruefen,
        tipp: () => absatz('Lies Satz für Satz. Eine Stellenwerttafel oder ein Zahlenstrahl im Heft helfen dir.'),
        loesung: () => absatz('Die Zahl heißt ' + F(a.loesung) + '.'),
      };
    },
  };

  /* ---------- Forscher-Vulkan ---------- */
  U.plaettchen = {
    zeige(a, c) {
      const T = B.plaettchenTafel(a.ziffern);
      c.el.appendChild(T.el);
      const name = (i) => Z.STELLEN[i].name;
      const dativ = (i) => name(i) + 'n';
      const nachher = (z) => h('div', {}, B.tafelFuer(z));
      if (c.stufe === 3) {
        const felder = [0, 1, 2].map((i) => feld(c, { label: 'Zahl ' + (i + 1) }));
        const tun = { dazu: 'ein Plättchen dazulegst', weg: 'ein Plättchen wegnimmst', schieben: 'ein Plättchen in eine andere Spalte verschiebst' }[a.art];
        c.el.appendChild(zeile(felder.map((f) => f.el)));
        return {
          frage: 'Finde 3 verschiedene Zahlen, die entstehen können, wenn du ' + tun + '.',
          pruefen() {
            if (felder.some((f) => f.wert() === null)) return null;
            const gesehen = new Set();
            let ok = true;
            felder.forEach((f) => {
              const gut = a.moeglich.indexOf(f.wert()) >= 0 && !gesehen.has(f.wert());
              gesehen.add(f.wert());
              f.markiere(gut);
              f.loeschenBeimTippen = !gut;
              ok = ok && gut;
            });
            return ok;
          },
          tipp: () => absatz('Lies erst die Zahl aus der Tafel ab. Ändere dann in Gedanken immer nur ein Plättchen.'),
          loesung: () => absatz('Die Tafel zeigt ' + F(a.zahl) + '. Möglich sind zum Beispiel: ' + a.moeglich.slice(0, 5).map(F).join(', ') + '.'),
        };
      }
      let frage;
      if (a.art === 'dazu') frage = 'Du legst ein Plättchen bei den ' + dativ(a.von) + ' dazu. Welche Zahl entsteht?';
      else if (a.art === 'weg') frage = 'Du nimmst ein Plättchen bei den ' + dativ(a.von) + ' weg. Welche Zahl entsteht?';
      else frage = 'Du verschiebst ein Plättchen von den ' + dativ(a.von) + ' zu den ' + dativ(a.nach) + '. Welche Zahl entsteht?';
      const e = einFeld(c, a.loesung, { label: 'neue Zahl' });
      c.el.appendChild(zeile(h('span', {}, 'Neue Zahl:'), e.f.el));
      return {
        frage,
        pruefen: e.pruefen,
        tipp: () => absatz('Lies erst die Zahl aus der Tafel ab. Welche Stellen ändern sich, welche bleiben gleich?'),
        loesung: () => h('div', {}, absatz('Vorher ' + F(a.zahl) + ', nachher ' + F(a.loesung) + '.'), nachher(a.loesung)),
      };
    },
  };

  U.wuerfelbauer = {
    zeige(a, c) {
      const benutzt = [];
      const gemerkt = [];
      const n = a.wuerfel.length;
      const bau = h('div', { class: 'bauplatz', 'aria-live': 'polite' });
      const knoepfe = a.wuerfel.map((w, i) => h('button', {
        class: 'wuerfelknopf', 'data-augen': w, 'aria-label': 'Würfel mit ' + w,
        onclick: () => {
          if (c.E.gesperrt || benutzt.indexOf(i) >= 0) return;
          benutzt.push(i);
          male();
          if (a.art === 'drei' && benutzt.length === n) merke();
        },
      }, B.wuerfel(w)));
      const liste = h('div', { class: 'gemerkt' });
      function male() {
        bau.innerHTML = '';
        for (let k = 0; k < n; k++) bau.appendChild(h('span', { class: 'platz' }, benutzt[k] !== undefined ? String(a.wuerfel[benutzt[k]]) : ''));
        knoepfe.forEach((k, i) => { k.disabled = benutzt.indexOf(i) >= 0; });
      }
      const zahlJetzt = () => Number(benutzt.map((i) => a.wuerfel[i]).join(''));
      function merke() {
        const z = zahlJetzt();
        if (gemerkt.indexOf(z) >= 0) c.melde('Die Zahl ' + F(z) + ' hast du schon. Baue eine andere.', 'fast');
        else {
          gemerkt.push(z);
          liste.appendChild(h('span', { class: 'gesammelt' }, F(z)));
          c.melde('', '');
        }
        benutzt.length = 0;
        c.spaeter(male, 350);
        if (gemerkt.length === 3) c.spaeter(() => c.pruefe(), 360);
      }
      male();
      const zurueck = h('button', { class: 'knopf hell', 'data-aktion': 'zurueck', onclick: () => { if (!c.E.gesperrt) { benutzt.pop(); male(); } } }, 'Letzte Ziffer zurücknehmen');
      c.el.append(h('div', { class: 'wuerfelreihe' }, knoepfe), bau, zurueck, liste);
      const texte = {
        groesste: 'Baue die größte Zahl, die möglich ist.',
        kleinste: 'Baue die kleinste Zahl, die möglich ist.',
        zweitgroesste: 'Baue die zweitgrößte Zahl, die möglich ist.',
        zweitkleinste: 'Baue die zweitkleinste Zahl, die möglich ist.',
        groessteGerade: 'Baue die größte gerade Zahl, die möglich ist.',
        drei: 'Baue 3 verschiedene Zahlen.',
      };
      return {
        frage: texte[a.art] + ' Tippe die Würfel nacheinander an.',
        ohnePruefKnopf: a.art === 'drei',
        pruefen() {
          if (a.art === 'drei') return gemerkt.length === 3 ? true : null;
          return benutzt.length < n ? null : zahlJetzt() === a.loesung;
        },
        tipp: () => absatz('Ganz links steht die Ziffer, die am meisten wert ist. Welcher Würfel gehört dorthin?'),
        loesung: () => absatz(a.art === 'drei' ? 'Zum Beispiel: ' + a.loesung.map(F).join(', ') : 'Die gesuchte Zahl ist ' + F(a.loesung) + '.'),
      };
    },
  };

  U.knobel = {
    zeige(a, c) {
      const werte = a.ziel === 24 ? [1, 1, 1, 1] : [1, 2, 3, 4];
      let beruehrt = false;
      const knoepfe = werte.map((_, i) => h('button', {
        class: 'wuerfelknopf', 'data-index': i,
        onclick: () => {
          if (c.E.gesperrt) return;
          beruehrt = true;
          werte[i] = (werte[i] % 6) + 1;
          male(i);
        },
      }));
      function male(i) {
        knoepfe[i].innerHTML = '';
        knoepfe[i].appendChild(B.wuerfel(werte[i]));
        knoepfe[i].setAttribute('aria-label', 'Würfel ' + (i + 1) + ' zeigt ' + werte[i] + '. Antippen zum Weiterdrehen.');
      }
      werte.forEach((_, i) => male(i));
      c.el.append(h('div', { class: 'wuerfelreihe' }, knoepfe), h('p', { class: 'hinweis' }, 'Tippe auf einen Würfel, um ihn weiterzudrehen.'));
      const liste = (w) => h('div', { class: 'zahlenliste' }, Z.alleAnordnungen(w).map((z) => h('span', {}, F(z))));
      return {
        frage: a.ziel === 1
          ? 'Stelle die 4 Würfel so ein, dass man daraus nur 1 Zahl bauen kann.'
          : 'Stelle die 4 Würfel so ein, dass man daraus genau ' + a.ziel + ' verschiedene Zahlen bauen kann.',
        pruefen() {
          if (!beruehrt) return null;
          const n = Z.alleAnordnungen(werte).length;
          if (n === a.ziel) {
            c.el.appendChild(liste(werte));
            return true;
          }
          return { ok: false, text: 'Aus deinen Würfeln kann man ' + n + (n === 1 ? ' Zahl' : ' verschiedene Zahlen') + ' bauen. Gesucht: ' + a.ziel + '.' };
        },
        tipp: () => absatz('Probiere aus: Was passiert, wenn alle Würfel gleich sind? Wenn drei gleich sind? Wenn es zwei Paare sind?'),
        loesung: () => {
          const muster = { 1: 'alle vier gleich', 4: 'drei gleich, einer anders', 6: 'zwei Paare', 12: 'ein Paar und zwei andere', 24: 'alle vier verschieden' }[a.ziel];
          return h('div', {}, absatz('Zum Beispiel ' + a.loesung.join(', ') + ' (' + muster + '):'), liste(a.loesung));
        },
      };
    },
  };

  U.packungen = {
    zeige(a, c) {
      const d = a.ding;
      let text, einheit;
      if (a.art === 'behaelter') {
        text = 'In ' + d.einer + ' passen ' + F(a.je) + ' ' + d.viel + '. Wie viele ' + d.behaelter + ' brauchst du für ' + F(a.gesamt) + ' ' + d.viel + '?';
        einheit = d.behaelter;
      } else if (a.art === 'je') {
        text = F(a.gesamt) + ' ' + d.viel + ' werden gerecht auf ' + F(a.kisten) + ' ' + d.behaelter + ' verteilt. Wie viele ' + d.viel + ' sind in ' + d.einem + '?';
        einheit = d.viel;
      } else {
        text = 'In ' + d.einem + ' sind ' + F(a.je) + ' ' + d.viel + '. Wie viele ' + d.viel + ' sind in ' + F(a.kisten) + ' ' + d.datPl + '?';
        einheit = d.viel;
      }
      c.el.appendChild(h('div', { class: 'sachaufgabe' }, h('span', { class: 'sachbild', 'aria-hidden': 'true' }, d.bild), h('p', {}, text)));
      const e = einFeld(c, a.loesung, { label: einheit });
      c.el.appendChild(zeile(e.f.el, h('span', {}, einheit)));
      return {
        frage: 'Große Mengen: Rechne geschickt.',
        vorlesen: text,
        pruefen: e.pruefen,
        tipp: () => absatz(a.art === 'gesamt'
          ? 'Rechne zuerst mit 10 ' + d.datPl + ' oder 100 ' + d.datPl + ' und setze dann zusammen.'
          : 'Gehe in Schritten: Wie oft brauchst du es für 1\u202f000 oder 10\u202f000? Wie oft passt das in ' + F(a.gesamt) + '?'),
        loesung: () => {
          const anzahl = a.art === 'behaelter' ? a.loesung : a.kisten;
          const je = a.art === 'je' ? a.loesung : a.je;
          return absatz(F(anzahl) + ' · ' + F(je) + ' = ' + F(anzahl * je));
        },
      };
    },
  };

  U.mmpapier = {
    zeige(a, c) {
      const legende = h('p', { class: 'hinweis' }, '1 großes Quadrat = 10\u202f000. Eine Reihe darin = 1\u202f000. Ein Kästchen = 100.');
      if (a.art === 'streifen') {
        c.el.appendChild(h('div', { class: 'streifen', role: 'img', 'aria-label': '10 große Quadrate nebeneinander' }, Array.from({ length: 10 }, () => h('i', {}))));
        const e = einFeld(c, a.loesung, { label: 'Länge in Zentimetern' });
        c.el.appendChild(zeile(e.f.el, h('span', {}, 'cm')));
        return {
          frage: 'Ein großes Quadrat ist 10 cm breit. Du legst 10 Quadrate nebeneinander. Wie lang ist der Streifen mit 100\u202f000 mm-Quadraten?',
          pruefen: e.pruefen,
          tipp: () => absatz('Jedes der 10 Quadrate ist 10 cm breit.'),
          loesung: () => absatz('10 · 10 cm = 100 cm. Der Streifen ist 1 Meter lang.'),
        };
      }
      if (a.art === 'lesen') {
        const M = B.mmpapier({ wert: a.zahl });
        const e = einFeld(c, a.loesung, { label: 'Anzahl' });
        c.el.append(M.el, legende, zeile(h('span', {}, 'Ausgemalt sind'), e.f.el));
        return {
          frage: 'Wie viele Millimeterquadrate sind ausgemalt?',
          pruefen: e.pruefen,
          tipp: () => absatz('Zähle zuerst die ganz vollen großen Quadrate, dann die vollen Reihen, dann die einzelnen Kästchen.'),
          loesung: () => absatz('Ausgemalt sind ' + F(a.zahl) + '.'),
        };
      }
      const M = B.mmpapier({ bedienbar: true, schritt: a.schritt });
      const knopf = (d, text) => h('button', { class: 'knopf hell', 'data-mm': d, onclick: () => M.setze(M.wert + d) }, text);
      const leiste = h('div', { class: 'mm-knoepfe' },
        knopf(10000, '+ Quadrat'), knopf(1000, '+ Reihe'), a.schritt === 100 ? knopf(100, '+ Kästchen') : null,
        knopf(-10000, '− Quadrat'), knopf(-1000, '− Reihe'), a.schritt === 100 ? knopf(-100, '− Kästchen') : null,
        h('button', { class: 'knopf hell', onclick: () => M.setze(0) }, 'Alles löschen'));
      c.el.append(gross(F(a.zahl), 'zahl'), M.el, legende, leiste);
      c.beiSperre(() => {
        M.gesperrt = true;
        leiste.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      });
      return {
        frage: 'Male so viele Millimeterquadrate aus. Tippe ins Papier oder nutze die Knöpfe.',
        pruefen: () => (M.wert === 0 ? null : M.wert === a.zahl),
        tipp: () => absatz('Überlege: Wie viele volle große Quadrate brauchst du? Dann: wie viele Reihen?'),
        loesung: () => {
          const zt = Math.floor(a.zahl / 10000);
          const t = Math.floor((a.zahl % 10000) / 1000);
          const rest = (a.zahl % 1000) / 100;
          M.gesperrt = false;
          M.setze(a.zahl);
          M.gesperrt = true;
          return absatz(zt + ' große Quadrate, ' + t + ' Reihen und ' + rest + ' Kästchen. So sieht es jetzt oben aus.');
        },
      };
    },
  };

  U.ergaenzen = {
    zeige(a, c) {
      const fuellung = h('i', { style: 'width:' + (a.zahl / 1000) + '%' });
      c.el.appendChild(h('div', { class: 'schatz' }, h('span', { class: 'sachbild', 'aria-hidden': 'true' }, '💰'),
        h('div', { class: 'balken', role: 'img', 'aria-label': 'Die Truhe ist teilweise gefüllt' }, fuellung),
        h('p', {}, 'In der Truhe liegen ' + F(a.zahl) + ' Goldstücke.')));
      const e = einFeld(c, a.loesung, { label: 'fehlende Goldstücke' });
      c.el.appendChild(zeile(h('span', { class: 'zahl' }, F(a.zahl)), h('span', {}, '+'), e.f.el, h('span', {}, '= 100\u202f000')));
      return {
        frage: 'Wie viele Goldstücke fehlen bis 100\u202f000?',
        pruefen() {
          const ok = e.pruefen();
          if (ok) fuellung.style.width = '100%';
          return ok;
        },
        tipp: () => absatz('Ergänze in Schritten: erst bis zum nächsten vollen Tausender, dann bis zum nächsten Zehntausender, dann bis 100\u202f000.'),
        loesung: () => absatz(F(a.zahl) + ' + ' + F(a.loesung) + ' = 100\u202f000'),
      };
    },
  };

  U.merkeEingabe = (E) => { felderPruefen.E = E; };

  global.Uebungen = U;
})(window);
