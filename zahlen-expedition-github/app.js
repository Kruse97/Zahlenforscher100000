/* Navigation, Bildschirme und Ablauf einer Runde. */
(function (global) {
  'use strict';
  const Z = global.Zahlen;
  const A = global.Aufgaben;
  const K = global.Katalog;
  const B = global.Bausteine;
  const U = global.Uebungen;
  const S = global.Spiele;
  const h = B.h;
  const F = Z.format;
  const Sp = K.Speicher;

  Sp.laden();
  B.tonAn = () => Sp.daten.ton;

  const kopf = document.getElementById('kopf');
  const haupt = document.getElementById('haupt');
  const toasts = document.getElementById('toasts');

  /* ---------- Aufräumen beim Bildschirmwechsel ---------- */
  let zeiten = [];
  let takte = [];
  let tasten = null; // { E, enter }
  function raeumeAuf() {
    zeiten.forEach(clearTimeout);
    takte.forEach(clearInterval);
    zeiten = [];
    takte = [];
    tasten = null;
    if (B.kannSprechen()) { try { global.speechSynthesis.cancel(); } catch (e) { /* egal */ } }
  }
  const spaeter = (fn, ms) => { zeiten.push(setTimeout(fn, ms)); };
  const takt = (fn, ms) => {
    const id = setInterval(fn, ms);
    takte.push(id);
    return () => clearInterval(id);
  };

  document.addEventListener('mousedown', (ev) => {
    if (ev.target.closest && ev.target.closest('.aufgabe button, .tastatur button')) ev.preventDefault();
  });

  document.addEventListener('keydown', (ev) => {
    if (!tasten || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (tasten.geaendert && ev.key !== 'Enter') tasten.geaendert();
    if (/^[0-9]$/.test(ev.key) && tasten.E) { tasten.E.tippe(ev.key); ev.preventDefault(); } else if (ev.key === 'Backspace' && tasten.E) { tasten.E.loesche(); ev.preventDefault(); } else if (ev.key === 'Enter' && tasten.enter && !ev.repeat) {
      const knopf = t && t.closest && t.closest('button, a, summary');
      if (knopf && !knopf.classList.contains('feld')) return; // Knopf löst selbst aus
      ev.preventDefault();
      tasten.enter();
    }
  });

  /* ---------- Hinweise für neue Abzeichen ---------- */
  function pruefeAbzeichen(p) {
    const neu = K.neueAbzeichen(p);
    neu.forEach((a, i) => {
      const t = h('div', { class: 'toast' }, h('span', { class: 'medaille klein' }, a.bild), h('div', {}, h('strong', {}, 'Neues Abzeichen!'), h('div', {}, a.name)));
      setTimeout(() => {
        toasts.appendChild(t);
        B.ton('stern');
        setTimeout(() => t.remove(), 3800);
      }, i * 500);
    });
    return neu;
  }
  function sichern() {
    Sp.sichern();
    maleKopf();
  }

  /* ---------- Kopfzeile ---------- */
  function maleKopf() {
    const p = Sp.aktiv();
    kopf.innerHTML = '';
    kopf.appendChild(h('a', { class: 'marke-app', href: '#/' }, B.flitz('normal', 'mini'), h('span', {}, 'Zahlen-Expedition')));
    const rechts = h('nav', { class: 'kopf-rechts', 'aria-label': 'Menü' });
    if (p) {
      rechts.append(
        h('a', { class: 'pille', href: '#/wer', title: 'Kind wechseln' }, h('span', { 'aria-hidden': 'true' }, p.tier), h('span', { class: 'name' }, p.name)),
        h('a', { class: 'pille schritte', href: '#/abzeichen', title: 'Schritte auf deiner Reise' }, '👣 ' + F(p.schritte)),
        h('a', { class: 'pille', href: '#/abzeichen', title: 'Meine Abzeichen', 'aria-label': 'Meine Abzeichen: ' + Object.keys(p.abzeichen).length }, '🏅 ' + Object.keys(p.abzeichen).length));
    }
    rechts.appendChild(h('button', {
      class: 'pille', 'aria-pressed': String(Sp.daten.ton), 'aria-label': Sp.daten.ton ? 'Töne ausschalten' : 'Töne einschalten',
      onclick: () => { Sp.daten.ton = !Sp.daten.ton; sichern(); B.ton('gut'); },
    }, Sp.daten.ton ? '🔔' : '🔕'));
    kopf.appendChild(rechts);
  }

  /* ---------- Bildschirm: Wer spielt? ---------- */
  function schirmWer() {
    const box = h('div', { class: 'seite schmal' });
    box.appendChild(h('div', { class: 'begruessung' }, B.flitz('froh', 'gross-bild'),
      h('div', { class: 'sprechblase' }, h('h1', {}, 'Hallo! Ich bin Flitz.'), h('p', {}, 'Komm mit auf die Zahlen-Expedition bis 100\u202f000. Wer bist du?'))));
    if (Sp.daten.profile.length) {
      box.appendChild(h('div', { class: 'kinderliste' }, Sp.daten.profile.map((p) => h('button', {
        class: 'kind', onclick: () => { Sp.waehlen(p.id); maleKopf(); gehe('#/'); },
      }, h('span', { class: 'tier' }, p.tier), h('strong', {}, p.name), h('span', {}, '👣 ' + F(p.schritte))))));
    }
    let tier = K.TIERE[0];
    const eingabe = h('input', { type: 'text', id: 'spitzname', maxlength: '14', autocomplete: 'off', placeholder: 'z. B. Mia' });
    const meldung = h('p', { class: 'meldung fast', 'aria-live': 'polite' });
    const tierKnoepfe = K.TIERE.map((t, i) => h('button', {
      type: 'button', class: 'tierwahl' + (i === 0 ? ' gewaehlt' : ''), 'aria-pressed': String(i === 0), 'aria-label': 'Tier ' + (i + 1) + ' ' + t,
      onclick: (ev) => {
        tier = t;
        tierKnoepfe.forEach((k) => { k.classList.toggle('gewaehlt', k === ev.currentTarget); k.setAttribute('aria-pressed', String(k === ev.currentTarget)); });
      },
    }, t));
    const form = h('form', {
      class: 'karte neues-kind', novalidate: true,
      onsubmit: (ev) => {
        ev.preventDefault();
        const name = eingabe.value.trim().slice(0, 14);
        if (!name) { meldung.textContent = 'Schreibe zuerst einen Spitznamen.'; eingabe.focus(); return; }
        if (Sp.daten.profile.some((p) => p.name.toLowerCase() === name.toLowerCase())) { meldung.textContent = 'Diesen Namen gibt es schon. Tippe oben darauf oder wähle einen anderen.'; return; }
        Sp.anlegen(name, tier);
        maleKopf();
        gehe('#/');
      },
    },
    h('h2', {}, Sp.daten.profile.length ? 'Neu hier?' : 'Los geht’s'),
    h('label', { for: 'spitzname' }, 'Dein Spitzname (bitte nicht den ganzen Namen)'), eingabe,
    h('div', { class: 'tiere', role: 'group', 'aria-label': 'Wähle ein Tier' }, tierKnoepfe),
    h('button', { type: 'submit', class: 'knopf riesig' }, 'Expedition starten'), meldung);
    box.appendChild(form);
    return box;
  }

  /* ---------- Bildschirm: Karte ---------- */
  const sterneText = (n, von) => '★'.repeat(n) + '☆'.repeat((von || 3) - n);
  const sterneBild = (n) => h('span', { class: 'sterne', role: 'img', 'aria-label': n + ' von 3 Sternen' }, [1, 2, 3].map((i) => h('span', { class: i <= n ? 'an' : 'aus' }, '★')));

  function reiseLeiste(p) {
    const prozent = (p.schritte / K.ZIEL) * 100;
    return h('section', { class: 'reise', 'aria-label': 'Deine Reise zur 100\u202f000' },
      h('h2', {}, 'Deine Reise zur 100\u202f000'),
      h('div', { class: 'reise-bahn' },
        h('div', { class: 'reise-weg' }, h('i', { style: 'width:' + prozent + '%' })),
        h('div', { class: 'reise-flitz', style: 'left:' + prozent + '%' }, B.flitz('froh', 'mini')),
        [0, 10000, 25000, 50000, 75000, 100000].map((v) => h('span', { class: 'reise-marke' + (p.schritte >= v ? ' erreicht' : ''), style: 'left:' + v / 1000 + '%' }, F(v)))),
      h('p', {}, p.schritte >= K.ZIEL ? 'Geschafft! Du bist bei 100\u202f000 angekommen. 👑' : 'Du bist bei ' + F(p.schritte) + '. Noch ' + F(K.ZIEL - p.schritte) + ' Schritte bis zum Ziel.'));
  }

  function vorschlag(p) {
    for (const insel of K.INSELN) {
      const id = insel.uebungen.find((u) => K.bestSterne(p, u) === 0);
      if (id) return { id, text: K.bestSterne(p, 'buendeln') === 0 && !p.runden ? 'Fang am Stellenwert-Strand an!' : 'Neu zu entdecken:' };
    }
    const offen = Object.keys(K.UEBUNGEN).find((u) => K.bestSterne(p, u) < 3);
    return offen ? { id: offen, text: 'Hier fehlt dir noch ein Stern:' } : null;
  }

  function schirmKarte(p) {
    const box = h('div', { class: 'seite' });
    const v = vorschlag(p);
    box.appendChild(h('div', { class: 'begruessung' }, B.flitz('froh', 'gross-bild'),
      h('div', { class: 'sprechblase' },
        h('h1', {}, 'Hallo, ' + p.name + '!'),
        v ? h('p', {}, v.text) : h('p', {}, 'Du hast alle Sterne gesammelt. Unglaublich!'),
        v ? h('a', { class: 'knopf', href: '#/ueben/' + v.id }, K.UEBUNGEN[v.id].bild + ' ' + K.UEBUNGEN[v.id].titel) : null)));
    box.appendChild(reiseLeiste(p));

    const pfad = B.s('svg', { class: 'pfad', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
      B.s('path', { d: 'M17 26 C 30 10, 38 8, 50 22 S 72 42, 83 28 C 96 42, 96 62, 83 76 S 62 62, 50 72 S 28 92, 17 76' }));
    const karte = h('nav', { class: 'weltkarte', 'aria-label': 'Inseln' }, pfad, K.INSELN.map((insel, i) => {
      const sterne = K.inselSterne(p, insel);
      const max = insel.uebungen.length * 3;
      return h('a', { class: 'insel insel-' + i, href: '#/insel/' + insel.id, style: '--farbe:' + insel.farbe },
        h('span', { class: 'insel-land', 'aria-hidden': 'true' }, h('span', { class: 'insel-bild' }, insel.bild), K.inselGeschafft(p, insel) ? h('span', { class: 'insel-fahne' }, '🏅') : null),
        h('span', { class: 'insel-schild' }, h('strong', {}, insel.name), h('span', { class: 'insel-text' }, insel.text), h('span', { class: 'insel-sterne' }, '★ ' + sterne + ' von ' + max)));
    }));
    box.appendChild(karte);
    box.appendChild(h('p', { class: 'fusszeile' }, h('a', { href: '#/info' }, 'Für Erwachsene: Fortschritt und Datenschutz')));
    return box;
  }

  /* ---------- Bildschirm: Insel ---------- */
  function schirmInsel(p, insel) {
    return h('div', { class: 'seite', style: '--farbe:' + insel.farbe },
      h('a', { class: 'zurueck', href: '#/' }, '◀ Zur Karte'),
      h('header', { class: 'insel-kopf' }, h('span', { class: 'insel-bild', 'aria-hidden': 'true' }, insel.bild), h('div', {}, h('h1', {}, insel.name), h('p', {}, insel.text))),
      h('div', { class: 'stationen' }, insel.uebungen.map((id) => {
        const u = K.UEBUNGEN[id];
        return h('a', { class: 'station', href: '#/ueben/' + id },
          h('span', { class: 'station-bild', 'aria-hidden': 'true' }, u.bild),
          h('span', { class: 'station-text' }, h('strong', {}, u.titel), h('span', {}, u.text), sterneBild(K.bestSterne(p, id))));
      })));
  }

  const inselVon = (id) => K.INSELN.find((i) => i.uebungen.indexOf(id) >= 0);

  /* ---------- Bildschirm: Start einer Übung ---------- */
  const STUFEN = ['Leicht', 'Mittel', 'Schwer'];

  function schirmStart(p, id) {
    const u = K.UEBUNGEN[id];
    const insel = inselVon(id);
    let stufe = p.stufe || 1;
    const knoepfe = STUFEN.map((name, i) => h('button', {
      class: 'stufenwahl' + (stufe === i + 1 ? ' gewaehlt' : ''), 'aria-pressed': String(stufe === i + 1), 'data-stufe': i + 1,
      onclick: (ev) => {
        stufe = i + 1;
        knoepfe.forEach((k) => { k.classList.toggle('gewaehlt', k === ev.currentTarget); k.setAttribute('aria-pressed', String(k === ev.currentTarget)); });
      },
    }, h('strong', {}, name), sterneBild((p.sterne[id] || [0, 0, 0])[i])));
    return h('div', { class: 'seite schmal', style: '--farbe:' + insel.farbe },
      h('a', { class: 'zurueck', href: '#/insel/' + insel.id }, '◀ ' + insel.name),
      h('div', { class: 'karte startkarte' },
        h('span', { class: 'start-bild', 'aria-hidden': 'true' }, u.bild),
        h('h1', {}, u.titel), h('p', {}, u.text),
        h('div', { class: 'stufen', role: 'group', 'aria-label': 'Schwierigkeit' }, knoepfe),
        h('button', { class: 'knopf riesig', 'data-aktion': 'start', onclick: () => { p.stufe = stufe; Sp.sichern(); starte(p, id, stufe); } }, 'Start')));
  }

  function starte(p, id, stufe) {
    raeumeAuf();
    if (K.UEBUNGEN[id].spiel) spielRunde(p, id, stufe);
    else quizRunde(p, id, stufe);
    global.scrollTo(0, 0);
  }

  function rahmen(id, stufe) {
    const u = K.UEBUNGEN[id];
    const insel = inselVon(id);
    haupt.innerHTML = '';
    const seite = h('div', { class: 'seite mittel', style: '--farbe:' + insel.farbe },
      h('div', { class: 'runden-kopf' },
        h('a', { class: 'zurueck', href: '#/insel/' + insel.id }, '◀ Beenden'),
        h('h1', {}, u.bild + ' ' + u.titel),
        h('span', { class: 'stufen-schild' }, STUFEN[stufe - 1])));
    haupt.appendChild(seite);
    return seite;
  }

  function zufallsquelle() {
    return Z.zufall(global.ZE_SEED !== undefined ? global.ZE_SEED : undefined);
  }

  /* ---------- Eine Quiz-Runde ---------- */
  const LOB = ['Richtig! Klasse!', 'Super gemacht!', 'Genau so!', 'Stark!', 'Toll gerechnet!', 'Volltreffer!'];

  function quizRunde(p, id, stufe) {
    const u = K.UEBUNGEN[id];
    const rng = zufallsquelle();
    const seite = rahmen(id, stufe);
    const punkteLeiste = h('ol', { class: 'fortschritt', 'aria-label': 'Fortschritt' }, Array.from({ length: u.runde }, (_, i) => h('li', {}, String(i + 1))));
    const karte = h('div', { class: 'karte aufgabenkarte' });
    seite.append(punkteLeiste, karte);
    const gesehen = new Set();
    const ergebnisse = [];
    let verdient = 0;
    let neuInRunde = [];

    function aufgabe(nr) {
      raeumeAuf();
      let a;
      let schluessel;
      let versuchKey = 0;
      do { a = A[id](stufe, rng, nr); schluessel = JSON.stringify(a); } while (gesehen.has(schluessel) && versuchKey++ < 30);
      gesehen.add(schluessel);
      Array.from(punkteLeiste.children).forEach((li, i) => li.classList.toggle('jetzt', i === nr));

      karte.innerHTML = '';
      const E = B.Eingabe();
      const el = h('div', { class: 'aufgabe' });
      const meldung = h('div', { class: 'meldung', role: 'status', 'aria-live': 'polite' });
      const sperren = [];
      let versuch = 0;
      let geradeFalsch = 0; // Zeitpunkt des letzten Fehlversuchs, solange nichts geändert wurde
      let fertig = false;
      let ctrl = null;

      const melde = (text, art) => { meldung.className = 'meldung ' + (art || ''); meldung.textContent = text || ''; };
      const c = {
        el, E, stufe, melde, spaeter,
        beiSperre: (fn) => sperren.push(fn),
        pruefe: () => pruefe(),
        fertig: (wert) => abschliessen(wert),
      };
      U.merkeEingabe(E);
      ctrl = U[id].zeige(a, c);

      const frageText = ctrl.frage;
      const kopfzeile = h('div', { class: 'frage' }, h('h2', {}, frageText),
        B.kannSprechen() ? h('button', { class: 'rund vorlesen', 'aria-label': 'Aufgabe vorlesen', title: 'Aufgabe vorlesen', onclick: () => B.sprich(ctrl.vorlesen || frageText) }, '🔊') : null);
      karte.append(kopfzeile, el);
      const tastatur = E.felder.length ? E.tastatur() : null;
      if (tastatur) karte.appendChild(tastatur);
      const geaendert = () => { geradeFalsch = 0; };
      [el, tastatur].forEach((b) => b && b.addEventListener('click', geaendert, true));

      const tippBox = h('div', { class: 'tipp', hidden: true });
      const tippKnopf = h('button', {
        class: 'knopf hell', 'data-aktion': 'tipp', 'aria-expanded': 'false',
        onclick: () => {
          if (tippBox.hidden) {
            tippBox.innerHTML = '';
            tippBox.append(B.flitz('denkt', 'mini'), h('div', {}, ctrl.tipp()));
          }
          tippBox.hidden = !tippBox.hidden;
          tippKnopf.setAttribute('aria-expanded', String(!tippBox.hidden));
        },
      }, '💡 Tipp');
      const pruefKnopf = ctrl.ohnePruefKnopf || ctrl.ohnePruefen ? null : h('button', { class: 'knopf', 'data-aktion': 'pruefen', onclick: () => pruefe() }, '✔ Prüfen');
      const aktionen = h('div', { class: 'aktionen' }, tippKnopf, pruefKnopf);
      karte.append(aktionen, tippBox, meldung);
      tasten = { E, geaendert, enter: () => { if (!fertig && pruefKnopf) pruefe(); } };

      function pruefe() {
        if (fertig || Date.now() - geradeFalsch < 1200) return;
        const r = ctrl.pruefen();
        if (r === null || r === undefined) { melde('Fülle erst alles aus, dann prüfe.', 'fast'); return; }
        const ok = r === true || r.ok === true;
        if (ok) { abschliessen(versuch === 0 ? 1 : 0.5); return; }
        versuch++;
        geradeFalsch = Date.now();
        const text = (r && r.text) || '';
        if (versuch >= 2) { abschliessen(0, text); return; }
        B.ton('fast');
        melde((text ? text + ' ' : '') + 'Noch nicht ganz. Du hast noch einen Versuch!', 'fast');
      }

      function abschliessen(wert, zusatz) {
        if (fertig) return;
        fertig = true;
        E.sperre();
        sperren.forEach((fn) => fn());
        el.querySelectorAll('.wahl, .wuerfelknopf, .plusminus button, [data-aktion="zurueck"], .strahl-knoepfe button').forEach((b) => { b.disabled = true; });
        const plus = K.antwort(p, wert, stufe);
        verdient += plus;
        ergebnisse.push(wert);
        const li = punkteLeiste.children[nr];
        li.classList.remove('jetzt');
        li.classList.add(wert === 1 ? 'gut' : wert > 0 ? 'halb' : 'daneben');
        li.textContent = wert === 1 ? '★' : wert > 0 ? '✓' : '·';
        li.setAttribute('aria-label', wert === 1 ? 'richtig' : wert > 0 ? 'im zweiten Versuch richtig' : 'nicht gelöst');

        meldung.className = 'meldung ' + (wert > 0 ? 'gut' : 'loesung');
        meldung.innerHTML = '';
        meldung.dataset.wert = String(wert);
        let kopfText;
        if (wert === 1) kopfText = LOB[Math.floor(Math.random() * LOB.length)];
        else if (wert > 0) kopfText = 'Geschafft! Gut, dass du drangeblieben bist.';
        else kopfText = (zusatz ? zusatz + ' ' : '') + 'Das war knifflig. Schau dir die Lösung an:';
        meldung.append(B.flitz(wert > 0 ? 'froh' : 'denkt', 'mini'), h('div', {},
          h('strong', {}, kopfText), plus ? h('span', { class: 'plus' }, ' +' + F(plus) + ' Schritte') : null,
          wert === 0 ? h('div', { class: 'loesungstext-box' }, ctrl.loesung()) : null));
        B.ton(wert > 0 ? 'gut' : 'fast');

        neuInRunde = neuInRunde.concat(pruefeAbzeichen(p));
        sichern();
        tippKnopf.disabled = true;
        if (pruefKnopf) pruefKnopf.remove();
        if (tastatur) tastatur.hidden = true;
        const letzte = nr === u.runde - 1;
        const weiter = h('button', {
          class: 'knopf kurz-warten', 'data-aktion': 'weiter',
          onclick: () => {
            if (letzte) ende();
            else { aufgabe(nr + 1); global.scrollTo(0, 0); }
          },
        }, letzte ? 'Ergebnis ansehen' : 'Weiter ▶');
        aktionen.appendChild(weiter);
        tasten = { E: null, enter: () => weiter.click() };
        spaeter(() => weiter.classList.remove('kurz-warten'), 600);
        weiter.focus({ preventScroll: true });
        spaeter(() => weiter.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
      }

      if (global.ZE_TEST) global.ZE = { id, stufe, nr, aufgabe: a };
    }

    function ende() {
      const summe = ergebnisse.reduce((x, y) => x + y, 0);
      const sterne = K.sterneFuer(summe / u.runde);
      const erste = ergebnisse.filter((w) => w === 1).length;
      zeigeEnde(p, id, stufe, {
        sterne, perfekt: erste === u.runde, verdient, neu: neuInRunde,
        text: erste + ' von ' + u.runde + ' beim ersten Versuch richtig' + (ergebnisse.some((w) => w === 0.5) ? ', ' + ergebnisse.filter((w) => w === 0.5).length + ' im zweiten.' : '.'),
      });
    }

    aufgabe(0);
  }

  /* ---------- Spiele ---------- */
  function spielRunde(p, id, stufe) {
    const seite = rahmen(id, stufe);
    const karte = h('div', { class: 'karte aufgabenkarte' });
    const el = h('div', { class: 'aufgabe spielfeld' });
    const meldung = h('div', { class: 'meldung', role: 'status', 'aria-live': 'polite' });
    karte.append(el, meldung);
    seite.appendChild(karte);
    const vorher = p.schritte;
    let neu = [];
    let beendet = false;
    let fehlerlos = true;
    const nach = () => { neu = neu.concat(pruefeAbzeichen(p)); sichern(); };
    const c = {
      el, stufe, spaeter, takt, name: p.name, zufall: zufallsquelle(),
      melde: (text, art) => { meldung.className = 'meldung ' + (art || ''); meldung.textContent = text || ''; },
      eingabe: (E, enter) => { tasten = E ? { E, enter } : null; },
      antwort: (wert) => { if (wert < 1) fehlerlos = false; K.antwort(p, wert, stufe); nach(); },
      antwortKurz: () => { p.richtig += 1; K.gutschreiben(p, 100); nach(); },
      punkte: (n) => { K.gutschreiben(p, n); nach(); },
      flitzSieg: () => { p.wuerfelSiege += 1; },
      blitzErgebnis: (n) => { p.blitzRekord = Math.max(p.blitzRekord, n); },
      ende(erg) {
        if (beendet) return;
        beendet = true;
        const perfekt = id === 'partner' && erg.sterne === 3 && fehlerlos;
        zeigeEnde(p, id, stufe, { sterne: erg.sterne, perfekt, verdient: p.schritte - vorher, neu, text: erg.text });
      },
    };
    if (global.ZE_TEST) global.ZE = { id, stufe, nr: 0 };
    S[id](c);
  }

  /* ---------- Ergebnis ---------- */
  function zeigeEnde(p, id, stufe, erg) {
    raeumeAuf();
    const insel = inselVon(id);
    let neu = erg.neu || [];
    if (erg.sterne !== null) K.rundeFertig(p, { id, stufe, sterne: erg.sterne, perfekt: erg.perfekt });
    else p.runden += 1;
    neu = neu.concat(pruefeAbzeichen(p));
    sichern();

    const seite = rahmen(id, stufe);
    const titel = erg.sterne === null ? 'Gut gespielt!' : ['Weiter üben, du schaffst das!', 'Ein Stern ist dein!', 'Richtig stark!', 'Fantastisch!'][erg.sterne];
    const weiterKnoepfe = h('div', { class: 'aktionen' },
      h('button', { class: 'knopf hell', 'data-aktion': 'nochmal', onclick: () => starte(p, id, stufe) }, '🔁 Nochmal'),
      erg.sterne >= 2 && stufe < 3 ? h('button', { class: 'knopf', 'data-aktion': 'naechste-stufe', onclick: () => { p.stufe = stufe + 1; sichern(); starte(p, id, stufe + 1); } }, '🧗 Stufe „' + STUFEN[stufe] + '“') : null,
      h('a', { class: 'knopf', href: '#/insel/' + insel.id }, insel.bild + ' Zur Insel'),
      h('a', { class: 'knopf hell', href: '#/' }, '🗺️ Zur Karte'));
    seite.appendChild(h('div', { class: 'karte ergebnis' },
      B.flitz(erg.sterne === null || erg.sterne >= 2 ? 'froh' : 'normal', 'gross-bild'),
      h('h2', {}, titel),
      erg.sterne !== null ? h('div', { class: 'grosse-sterne', role: 'img', 'aria-label': erg.sterne + ' von 3 Sternen' }, [1, 2, 3].map((i) => h('span', { class: i <= erg.sterne ? 'an' : 'aus', style: 'animation-delay:' + i * 0.25 + 's' }, '★'))) : null,
      h('p', {}, erg.text),
      h('p', { class: 'plus' }, '+' + F(erg.verdient) + ' Schritte auf deiner Reise'),
      neu.length ? h('div', { class: 'neue-abzeichen' }, h('h3', {}, neu.length === 1 ? 'Neues Abzeichen' : 'Neue Abzeichen'), h('div', { class: 'abzeichen-reihe' }, neu.map((a) => h('figure', {}, h('span', { class: 'medaille' }, a.bild), h('figcaption', {}, a.name))))) : null,
      weiterKnoepfe));
    if (erg.sterne === null || erg.sterne >= 2) B.konfetti();
    if (erg.sterne > 0) B.ton('stern');
    global.scrollTo(0, 0);
    if (global.ZE_TEST) global.ZE = { id, stufe, ende: true, sterne: erg.sterne };
  }

  /* ---------- Abzeichen und Urkunde ---------- */
  const datum = (iso) => iso.split('-').reverse().join('.');

  function schirmAbzeichen(p) {
    const anzahl = K.ABZEICHEN.filter((a) => p.abzeichen[a.id]).length;
    const werte = [['👣 Schritte', F(p.schritte)], ['★ Sterne', K.alleSterne(p) + ' von ' + Object.keys(K.UEBUNGEN).length * 3], ['✔ Richtige Aufgaben', F(p.richtig)], ['🔥 Beste Serie', F(p.besteSerie)]];
    return h('div', { class: 'seite' },
      h('a', { class: 'zurueck', href: '#/' }, '◀ Zur Karte'),
      h('h1', {}, 'Dein Forscherpass, ' + p.name),
      h('dl', { class: 'werte' }, werte.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))),
      h('h2', {}, anzahl + ' von ' + K.ABZEICHEN.length + ' Abzeichen'),
      h('ul', { class: 'abzeichen-wand' }, K.ABZEICHEN.map((a) => {
        const hat = p.abzeichen[a.id];
        return h('li', { class: hat ? 'hat' : 'offen' }, h('span', { class: 'medaille', 'aria-hidden': 'true' }, a.bild), h('strong', {}, a.name), h('span', {}, a.text), h('span', { class: 'status' }, hat ? 'Geschafft am ' + datum(hat) : 'Noch offen'));
      })),
      h('p', { class: 'mitte-knopf' }, h('a', { class: 'knopf', href: '#/urkunde' }, '📜 Meine Urkunde')));
  }

  function schirmUrkunde(p) {
    const meine = K.ABZEICHEN.filter((a) => p.abzeichen[a.id]);
    return h('div', { class: 'seite schmal' },
      h('a', { class: 'zurueck nicht-drucken', href: '#/abzeichen' }, '◀ Zum Forscherpass'),
      h('div', { class: 'urkunde' },
        B.flitz('froh', 'gross-bild'),
        h('h1', {}, 'Urkunde'),
        h('p', {}, 'für'),
        h('p', { class: 'urkunde-name' }, p.tier + ' ' + p.name),
        h('p', {}, 'für die Zahlen-Expedition im Zahlenraum bis 100\u202f000.'),
        h('p', {}, h('strong', {}, F(p.schritte) + ' Schritte, ' + K.alleSterne(p) + ' Sterne, ' + meine.length + ' Abzeichen')),
        h('div', { class: 'abzeichen-reihe' }, meine.map((a) => h('span', { class: 'medaille klein', title: a.name }, a.bild))),
        h('div', { class: 'unterschrift' }, h('span', {}, 'Datum: ' + datum(K.heute())), h('span', {}, 'Unterschrift'))),
      // In der eingebetteten Vorschau ist Drucken gesperrt, dort gibt es keinen Knopf.
      global.ZE_VORSCHAU ? null : h('p', { class: 'mitte-knopf nicht-drucken' }, h('button', { class: 'knopf', onclick: () => global.print() }, '🖨️ Drucken')));
  }

  /* ---------- Für Erwachsene ---------- */
  function schirmInfo() {
    const box = h('div', { class: 'seite' }, h('a', { class: 'zurueck', href: '#/' }, '◀ Zur Karte'), h('h1', {}, 'Für Erwachsene'));
    box.appendChild(h('div', { class: 'karte' },
      h('h2', {}, 'Datenschutz'),
      h('p', {}, 'Spitznamen und Spielstände werden nur im Browser dieses Geräts gespeichert. Die App lädt nichts von fremden Servern nach und verwendet keine Werbung und kein Tracking. Der Webhoster (z. B. GitHub Pages) sieht beim Aufruf wie jede Website die IP-Adresse.'),
      h('p', {}, 'Das Vorlesen nutzt die Sprachausgabe des Geräts bzw. Browsers. Manche Browser erzeugen die Stimme auf Servern ihres Herstellers; übertragen wird dann nur der vorzulesende Aufgabentext.'),
      h('p', {}, 'Wird der Browserverlauf gelöscht oder ein anderes Gerät benutzt, beginnt der Spielstand neu.'),
      Sp.dauerhaft ? null : h('p', { class: 'meldung fast' }, 'Achtung: Dieser Browser erlaubt gerade kein Speichern. Der Spielstand geht beim Schließen verloren.')));
    const liste = h('div', { class: 'karte' }, h('h2', {}, 'Fortschritt auf diesem Gerät'));
    if (!Sp.daten.profile.length) liste.appendChild(h('p', {}, 'Noch kein Kind angelegt.'));
    Sp.daten.profile.forEach((p) => {
      const frage = h('span', { class: 'loeschen' });
      const knopf = h('button', {
        class: 'knopf hell klein', 'data-aktion': 'loeschen',
        onclick: () => {
          knopf.hidden = true;
          frage.append(h('span', {}, 'Spielstand wirklich löschen? '),
            h('button', { class: 'knopf klein gefahr', 'data-aktion': 'ja', onclick: () => { Sp.loeschen(p.id); maleKopf(); zeichne(); } }, 'Ja, löschen'),
            h('button', { class: 'knopf klein hell', onclick: () => { frage.innerHTML = ''; knopf.hidden = false; } }, 'Behalten'));
        },
      }, 'Löschen');
      liste.appendChild(h('details', { class: 'fortschritt-kind' },
        h('summary', {}, p.tier + ' ' + p.name + ': ' + F(p.richtig) + ' richtig, ' + K.alleSterne(p) + ' Sterne, ' + p.tage.length + (p.tage.length === 1 ? ' Übungstag' : ' Übungstage')),
        h('div', { class: 'tabellen-scroll' }, h('table', { class: 'uebersicht' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Übung'), STUFEN.map((s) => h('th', {}, s)))),
          h('tbody', {}, Object.keys(K.UEBUNGEN).map((id) => h('tr', {}, h('th', { scope: 'row' }, K.UEBUNGEN[id].titel), [0, 1, 2].map((i) => h('td', {}, sterneText((p.sterne[id] || [0, 0, 0])[i])))))))),
        h('p', {}, knopf, frage)));
    });
    box.appendChild(liste);
    return box;
  }

  /* ---------- Navigation ---------- */
  function gehe(hash) {
    if (global.location.hash === hash) zeichne();
    else global.location.hash = hash;
  }

  function zeichne() {
    raeumeAuf();
    const teile = global.location.hash.replace(/^#\/?/, '').split('/');
    const p = Sp.aktiv();
    maleKopf();
    let schirm;
    if (teile[0] === 'info') schirm = schirmInfo();
    else if (!p || teile[0] === 'wer') schirm = schirmWer();
    else if (teile[0] === 'insel' && K.INSELN.some((i) => i.id === teile[1])) schirm = schirmInsel(p, K.INSELN.find((i) => i.id === teile[1]));
    else if (teile[0] === 'ueben' && Object.prototype.hasOwnProperty.call(K.UEBUNGEN, teile[1])) schirm = schirmStart(p, teile[1]);
    else if (teile[0] === 'abzeichen') schirm = schirmAbzeichen(p);
    else if (teile[0] === 'urkunde') schirm = schirmUrkunde(p);
    else schirm = schirmKarte(p);
    haupt.innerHTML = '';
    haupt.appendChild(schirm);
    global.scrollTo(0, 0);
  }

  global.addEventListener('hashchange', zeichne);
  // Ein Klick auf den Link der aktuellen Seite (z. B. „Zur Insel“ nach einer Runde) soll auch neu zeichnen
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    ev.preventDefault();
    gehe(a.getAttribute('href'));
  });
  zeichne();

  if (!global.ZE_EINZELDATEI && 'serviceWorker' in navigator && global.location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})(window);
