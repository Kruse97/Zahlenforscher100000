/* Wiederverwendbare Bausteine der Oberfläche: Eingabe, Tafel, Zahlenstrahl, Material, Ton … */
(function (global) {
  'use strict';
  const Z = global.Zahlen;
  const F = Z.format;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const B = {};

  function setze(el, attrs) {
    Object.keys(attrs || {}).forEach((k) => {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
  }
  function fuege(el, kinder) {
    kinder.forEach((k) => {
      if (k === undefined || k === null || k === false) return;
      if (Array.isArray(k)) fuege(el, k);
      else el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
    });
  }
  B.h = function (tag, attrs, ...kinder) {
    const el = document.createElement(tag);
    setze(el, attrs);
    if (tag === 'button' && !(attrs && attrs.type)) el.type = 'button';
    fuege(el, kinder);
    return el;
  };
  B.s = function (tag, attrs, ...kinder) {
    const el = document.createElementNS(SVGNS, tag);
    setze(el, attrs);
    fuege(el, kinder);
    return el;
  };
  const h = B.h;
  const s = B.s;

  /* ---------- Fuchs Flitz (Maskottchen) ---------- */
  B.flitz = function (laune, klasse) {
    const augen = {
      froh: '<path d="M37 61q7-9 14 0M69 61q7-9 14 0" fill="none" stroke="#17324d" stroke-width="5" stroke-linecap="round"/>',
      normal: '<circle cx="44" cy="60" r="6.5" fill="#17324d"/><circle cx="76" cy="60" r="6.5" fill="#17324d"/><circle cx="46.5" cy="57.5" r="2" fill="#fff"/><circle cx="78.5" cy="57.5" r="2" fill="#fff"/>',
      denkt: '<circle cx="44" cy="59" r="6" fill="#17324d"/><circle cx="76" cy="59" r="6" fill="#17324d"/><circle cx="46" cy="56" r="2.2" fill="#fff"/><circle cx="78" cy="56" r="2.2" fill="#fff"/><path d="M68 46l16-4" stroke="#17324d" stroke-width="4" stroke-linecap="round"/>',
    };
    const mund = laune === 'froh'
      ? '<path d="M48 93q12 16 24 0z" fill="#8a2d2d"/>'
      : laune === 'denkt'
        ? '<path d="M52 98q8-4 16 0" fill="none" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>'
        : '<path d="M50 95q10 9 20 0" fill="none" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>';
    const el = h('span', { class: 'flitz ' + (klasse || ''), 'aria-hidden': 'true' });
    el.innerHTML = '<svg viewBox="0 0 120 120">' +
      '<path d="M19 56L22 8l34 28z" fill="#ee7a1d"/><path d="M26 40l1-20 16 15z" fill="#ffdfbd"/>' +
      '<path d="M101 56L98 8 64 36z" fill="#ee7a1d"/><path d="M94 40l-1-20-16 15z" fill="#ffdfbd"/>' +
      '<path d="M12 62q6-34 48-34t48 34q-16 40-48 50-32-10-48-50z" fill="#f68c2c"/>' +
      '<path d="M12 62q22 0 34 15t14 35q-32-10-48-50zM108 62q-22 0-34 15t-14 35q32-10 48-50z" fill="#fff6ea"/>' +
      '<path d="M32 38q2-27 28-27t28 27z" fill="#c9a15a"/><path d="M33 32h54v7H33z" fill="#7a5a2a"/><ellipse cx="60" cy="40" rx="42" ry="6" fill="#b58b43"/>' +
      (augen[laune] || augen.normal) +
      '<ellipse cx="60" cy="85" rx="8" ry="6" fill="#17324d"/>' + mund + '</svg>';
    return el;
  };

  /* ---------- Eingabefelder mit Zahlentasten ---------- */
  B.Eingabe = function () {
    const felder = [];
    let aktiv = null;
    const E = { felder, gesperrt: false };

    function zeige(f) {
      const roh = f.roh;
      f.el.textContent = roh.length > 3 && roh[0] !== '0' ? F(Number(roh)) : roh;
      f.el.setAttribute('aria-label', f.label + (roh ? ': ' + roh : ', leer'));
    }
    E.waehle = function (f) {
      if (E.gesperrt || !f || f.fest) return;
      aktiv = f;
      felder.forEach((x) => x.el.classList.toggle('aktiv', x === f));
      f.frisch = true;
    };
    E.feld = function (opt) {
      const o = Object.assign({ max: 6, label: 'Antwortfeld', klasse: '' }, opt);
      const el = h('button', { class: 'feld ' + o.klasse + (o.max === 1 ? ' feld-ziffer' : '') });
      const f = { el, roh: '', max: o.max, label: o.label, frisch: false, fest: false };
      el.addEventListener('click', () => E.waehle(f));
      f.wert = () => (f.roh === '' ? null : Number(f.roh));
      f.setze = (v) => { f.roh = v === null || v === '' ? '' : String(v); zeige(f); };
      f.markiere = (richtig) => {
        el.classList.remove('richtig', 'falsch');
        el.classList.add(richtig ? 'richtig' : 'falsch');
      };
      felder.push(f);
      zeige(f);
      if (!aktiv) E.waehle(f);
      return f;
    };
    E.tippe = function (z) {
      const f = aktiv;
      if (E.gesperrt || !f) return;
      f.el.classList.remove('richtig', 'falsch');
      if (f.max === 1) f.roh = z;
      else {
        // ein falsch markiertes Feld wird beim ersten neuen Tastendruck geleert
        if (f.loeschenBeimTippen) { f.roh = ''; f.loeschenBeimTippen = false; }
        if (f.roh === '0') f.roh = '';
        if (f.roh.length < f.max) f.roh += z;
      }
      zeige(f);
      if (f.max === 1) {
        const i = felder.indexOf(f);
        if (i < felder.length - 1) E.waehle(felder[i + 1]);
      }
    };
    E.loesche = function () {
      let f = aktiv;
      if (E.gesperrt || !f) return;
      f.el.classList.remove('richtig', 'falsch');
      f.loeschenBeimTippen = false;
      if (f.roh === '' && f.max === 1) {
        const i = felder.indexOf(f);
        if (i > 0) { E.waehle(felder[i - 1]); f = aktiv; }
      }
      f.roh = f.roh.slice(0, -1);
      zeige(f);
    };
    E.naechstes = function () {
      if (!felder.length) return;
      const i = felder.indexOf(aktiv);
      E.waehle(felder[(i + 1) % felder.length]);
    };
    E.alleVoll = () => felder.every((f) => f.roh !== '');
    E.sperre = () => {
      E.gesperrt = true;
      felder.forEach((f) => f.el.classList.remove('aktiv'));
    };
    E.tastatur = function () {
      const taste = (text, aktion, label, klasse) => h('button', { class: 'taste ' + (klasse || ''), onclick: aktion, 'aria-label': label, 'data-taste': label }, text);
      const box = h('div', { class: 'tastatur', role: 'group', 'aria-label': 'Zahlentasten' });
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach((z) => box.appendChild(taste(z, () => E.tippe(z), z)));
      box.appendChild(taste('⌫', E.loesche, 'löschen', 'taste-extra'));
      if (felder.length > 1) box.appendChild(taste('Nächstes Feld', E.naechstes, 'nächstes Feld', 'taste-extra taste-breit'));
      return box;
    };
    return E;
  };

  /* ---------- Stellenwerttafel ---------- */
  /** zellen: 5 Inhalte (Zahl, Text oder Element) für ZT T H Z E */
  B.tafel = function (zellen, opt) {
    const o = opt || {};
    const kopf = h('tr', {}, Z.STELLEN.map((st) => h('th', { class: 'st st-' + st.k, title: st.name, scope: 'col' }, st.k)));
    const zeile = h('tr', {}, zellen.map((inhalt, i) => h('td', { class: 'st-' + Z.STELLEN[i].k }, inhalt)));
    return h('table', { class: 'stellentafel ' + (o.klasse || '') }, h('thead', {}, kopf), h('tbody', {}, zeile));
  };
  B.tafelFuer = (n) => B.tafel(Z.ziffern(n), { klasse: 'klein' });

  /* ---------- Plättchen-Tafel ---------- */
  B.plaettchenTafel = function (start, opt) {
    const o = opt || {};
    const werte = start.slice();
    const felder = [];
    const T = {};
    function male(i) {
      const f = felder[i];
      f.innerHTML = '';
      for (let k = 0; k < werte[i]; k++) f.appendChild(h('i', { class: 'plaettchen' }));
      f.setAttribute('aria-label', werte[i] + ' Plättchen bei ' + Z.STELLEN[i].name);
    }
    const zellen = Z.STELLEN.map((st, i) => {
      const flaeche = h('div', { class: 'plaettchen-flaeche', role: 'img' });
      felder.push(flaeche);
      if (!o.bedienbar) return flaeche;
      flaeche.addEventListener('click', () => T.aendere(i, 1));
      return h('div', { class: 'plaettchen-spalte' }, flaeche,
        h('div', { class: 'plusminus' },
          h('button', { class: 'rund', 'aria-label': 'Ein Plättchen weg bei ' + st.name, 'data-minus': st.k, onclick: () => T.aendere(i, -1) }, '−'),
          h('button', { class: 'rund', 'aria-label': 'Ein Plättchen dazu bei ' + st.name, 'data-plus': st.k, onclick: () => T.aendere(i, 1) }, '+')));
    });
    T.el = B.tafel(zellen, { klasse: 'chips' });
    T.gesperrt = false;
    T.aendere = (i, d) => {
      if (T.gesperrt) return;
      const neu = werte[i] + d;
      if (neu < 0 || neu > 9) return;
      werte[i] = neu;
      male(i);
    };
    T.werte = () => werte.slice();
    T.zahl = () => Z.ausZiffern(werte);
    werte.forEach((_, i) => male(i));
    return T;
  };

  /* ---------- Zahlenstrahl ---------- */
  /**
   * cfg: { start, ende, schritt, beschriftet }
   * opt: { pfeil: Wert, setzbar: bool }
   */
  B.zahlenstrahl = function (cfg, opt) {
    const o = opt || {};
    const W = 1000;
    const L = 40;
    const R = 40;
    const x = (v) => L + ((v - cfg.start) / (cfg.ende - cfg.start)) * (W - L - R);
    const svg = s('svg', { viewBox: '0 0 ' + W + ' 130', class: 'strahl', role: 'img', 'aria-label': 'Zahlenstrahl von ' + cfg.start + ' bis ' + cfg.ende });
    svg.appendChild(s('line', { x1: L - 12, y1: 70, x2: W - R + 12, y2: 70, class: 'achse' }));
    for (let i = 0; i <= 100; i++) {
      const v = cfg.start + i * cfg.schritt;
      const laenge = i % 10 === 0 ? 24 : i % 5 === 0 ? 17 : 9;
      svg.appendChild(s('line', { x1: x(v), x2: x(v), y1: 70 - laenge / 2, y2: 70 + laenge / 2, class: i % 10 === 0 ? 'strich gross' : i % 5 === 0 ? 'strich mittel' : 'strich' }));
    }
    cfg.beschriftet.forEach((v) => svg.appendChild(s('text', { x: x(v), y: 108, 'text-anchor': 'middle', class: 'marke' }, F(v))));
    function zeiger(v, klasse) {
      return s('g', { class: klasse, transform: 'translate(' + x(v) + ',0)' },
        s('line', { x1: 0, x2: 0, y1: 8, y2: 52 }), s('path', { d: 'M-9 44L0 66L9 44z' }));
    }
    if (o.pfeil !== undefined) svg.appendChild(zeiger(o.pfeil, 'pfeil'));

    const huelle = h('div', { class: 'strahl-scroll' }, svg);
    const box = h('div', { class: 'strahl-box' }, huelle, h('p', { class: 'schiebe-hinweis' }, '👆 Du kannst den Zahlenstrahl nach links und rechts schieben.'));
    const S = { el: box, wert: null, gesperrt: false };

    S.zeigeLoesung = (v) => {
      svg.appendChild(zeiger(v, 'pfeil loesung'));
      svg.appendChild(s('text', { x: Math.min(W - 55, Math.max(55, x(v))), y: 128, 'text-anchor': 'middle', class: 'marke loesungstext' }, F(v)));
    };
    S.rolleZu = (v) => {
      requestAnimationFrame(() => {
        huelle.scrollLeft = (x(v) / W) * svg.getBoundingClientRect().width - huelle.clientWidth / 2;
      });
    };
    if (o.pfeil !== undefined) S.rolleZu(o.pfeil);

    if (o.setzbar) {
      let fahne = null;
      const lupe = s('svg', { viewBox: '0 0 420 100', class: 'lupe' });
      const lupenBox = h('div', { class: 'lupen-box' }, h('span', { class: 'lupen-zeichen', 'aria-hidden': 'true' }, '🔍'), lupe);
      function maleLupe() {
        lupe.innerHTML = '';
        if (S.wert === null) {
          lupe.appendChild(s('text', { x: 210, y: 56, 'text-anchor': 'middle', class: 'lupen-hinweis' }, 'Tippe auf den Zahlenstrahl'));
          return;
        }
        const mitte = Math.round((S.wert - cfg.start) / cfg.schritt);
        lupe.appendChild(s('line', { x1: 0, y1: 58, x2: 420, y2: 58, class: 'achse' }));
        for (let k = -10; k <= 10; k++) {
          const i = mitte + k;
          if (i < 0 || i > 100) continue;
          const px = 210 + k * 20;
          const laenge = i % 10 === 0 ? 28 : i % 5 === 0 ? 20 : 11;
          lupe.appendChild(s('line', { x1: px, x2: px, y1: 58 - laenge / 2, y2: 58 + laenge / 2, class: i % 10 === 0 ? 'strich gross' : 'strich' }));
          if (i % 10 === 0) lupe.appendChild(s('text', { x: Math.min(366, Math.max(54, px)), y: 96, 'text-anchor': 'middle', class: 'marke' }, F(cfg.start + i * cfg.schritt)));
        }
        lupe.appendChild(s('path', { d: 'M210 52V6l30 11-30 11', class: 'fahne-klein' }));
      }
      S.setze = (v) => {
        if (S.gesperrt) return;
        const i = Math.max(0, Math.min(100, Math.round((v - cfg.start) / cfg.schritt)));
        S.wert = cfg.start + i * cfg.schritt;
        if (fahne) fahne.remove();
        fahne = s('g', { class: 'fahne', transform: 'translate(' + x(S.wert) + ',0)' }, s('path', { d: 'M0 68V8l28 11L0 30' }));
        svg.appendChild(fahne);
        maleLupe();
      };
      svg.classList.add('setzbar');
      svg.addEventListener('click', (ev) => {
        const r = svg.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * W;
        S.setze(cfg.start + ((px - L) / (W - L - R)) * (cfg.ende - cfg.start));
      });
      const ruecke = (d) => S.setze(S.wert === null ? cfg.start + 50 * cfg.schritt : S.wert + d * cfg.schritt);
      box.appendChild(lupenBox);
      box.appendChild(h('div', { class: 'strahl-knoepfe' },
        h('button', { class: 'knopf hell', 'data-ruecke': '-1', onclick: () => ruecke(-1), 'aria-label': 'Fähnchen einen Strich nach links' }, '◀ 1 Strich'),
        h('button', { class: 'knopf hell', 'data-ruecke': '1', onclick: () => ruecke(1), 'aria-label': 'Fähnchen einen Strich nach rechts' }, '1 Strich ▶')));
      maleLupe();
    }
    return S;
  };

  /* ---------- Zehnersystem-Material ---------- */
  const K = 6; // Kantenlänge eines Einer-Würfels in Bildpunkten
  function raster(g, x0, y0, spalten, zeilen) {
    g.appendChild(s('rect', { x: x0, y: y0, width: spalten * K, height: zeilen * K, class: 'holz' }));
    let d = '';
    for (let i = 1; i < spalten; i++) d += 'M' + (x0 + i * K) + ' ' + y0 + 'v' + zeilen * K;
    for (let i = 1; i < zeilen; i++) d += 'M' + x0 + ' ' + (y0 + i * K) + 'h' + spalten * K;
    if (d) g.appendChild(s('path', { d, class: 'fuge' }));
  }
  function block(wuerfel) {
    // wuerfel Tausenderwürfel nebeneinander (1 = Tausender, 10 = Zehntausenderstange)
    const kante = 10 * K;
    const tiefe = 24;
    const breite = wuerfel * kante;
    const svg = s('svg', { viewBox: '-1 -1 ' + (breite + tiefe + 2) + ' ' + (kante + tiefe + 2), width: breite + tiefe + 2, height: kante + tiefe + 2 });
    svg.appendChild(s('path', { d: 'M0 ' + tiefe + 'L' + tiefe + ' 0H' + (breite + tiefe) + 'L' + breite + ' ' + tiefe + 'z', class: 'holz-oben' }));
    svg.appendChild(s('path', { d: 'M' + breite + ' ' + tiefe + 'L' + (breite + tiefe) + ' 0V' + kante + 'L' + breite + ' ' + (kante + tiefe) + 'z', class: 'holz-seite' }));
    raster(svg, 0, tiefe, wuerfel * 10, 10);
    for (let i = 1; i < wuerfel; i++) svg.appendChild(s('path', { d: 'M' + i * kante + ' ' + (kante + tiefe) + 'V' + tiefe + 'l' + tiefe + ' ' + -tiefe, class: 'kante' }));
    return svg;
  }
  function flach(spalten, zeilen) {
    const svg = s('svg', { viewBox: '-1 -1 ' + (spalten * K + 2) + ' ' + (zeilen * K + 2), width: spalten * K + 2, height: zeilen * K + 2 });
    raster(svg, 0, 0, spalten, zeilen);
    return svg;
  }
  B.material = function (anzahlen) {
    const bau = [() => block(10), () => block(1), () => flach(10, 10), () => flach(1, 10), () => flach(1, 1)];
    const box = h('div', { class: 'material', role: 'img', 'aria-label': 'Zehnersystem-Material' });
    anzahlen.forEach((n, i) => {
      if (!n) return;
      const gruppe = h('div', { class: 'material-gruppe material-' + Z.STELLEN[i].k, 'data-anzahl': n });
      for (let k = 0; k < n; k++) gruppe.appendChild(bau[i]());
      box.appendChild(gruppe);
    });
    return box;
  };
  B.materialLegende = function () {
    const eintrag = (svg, text) => h('figure', {}, svg, h('figcaption', {}, text));
    return h('div', { class: 'material legende' },
      eintrag(block(10), 'Stange: 10\u202f000'), eintrag(block(1), 'Würfel: 1\u202f000'),
      eintrag(flach(10, 10), 'Platte: 100'), eintrag(flach(1, 10), '10'), eintrag(flach(1, 1), '1'));
  };

  /* ---------- Millimeterpapier ---------- */
  /** 10 große Quadrate zu je 10 000; ein Kästchen sind 100 mm-Quadrate. */
  B.mmpapier = function (opt) {
    const o = opt || {};
    const G = 100;
    const LUECKE = 6;
    const pos = (k) => ({ x: (k % 5) * (G + LUECKE) + 2, y: Math.floor(k / 5) * (G + LUECKE) + 2 });
    const W = 5 * G + 4 * LUECKE + 4;
    const H = 2 * G + LUECKE + 4;
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mm' + (o.bedienbar ? ' setzbar' : ''), role: 'img', 'aria-label': 'Millimeterpapier mit 10 großen Quadraten' });
    const farbe = s('g', { class: 'mm-farbe' });
    const linien = s('g', {});
    for (let k = 0; k < 10; k++) {
      const p = pos(k);
      svg.appendChild(s('rect', { x: p.x, y: p.y, width: G, height: G, class: 'mm-grund' }));
      let fein = '';
      let grob = '';
      for (let i = 1; i < 100; i++) {
        if (i % 10 === 0) grob += 'M' + (p.x + i) + ' ' + p.y + 'v' + G + 'M' + p.x + ' ' + (p.y + i) + 'h' + G;
        else if (i % 2 === 0) fein += 'M' + (p.x + i) + ' ' + p.y + 'v' + G + 'M' + p.x + ' ' + (p.y + i) + 'h' + G;
      }
      linien.appendChild(s('path', { d: fein, class: 'mm-fein' }));
      linien.appendChild(s('path', { d: grob, class: 'mm-grob' }));
      linien.appendChild(s('rect', { x: p.x, y: p.y, width: G, height: G, class: 'mm-rahmen' }));
    }
    svg.appendChild(farbe);
    svg.appendChild(linien);
    const M = { el: svg, wert: o.wert || 0, gesperrt: false };
    function male() {
      farbe.innerHTML = '';
      const zellen = M.wert / 100;
      for (let k = 0; k < 10; k++) {
        const n = Math.max(0, Math.min(100, zellen - k * 100));
        if (!n) break;
        const p = pos(k);
        const voll = Math.floor(n / 10);
        const rest = n % 10;
        if (voll) farbe.appendChild(s('rect', { x: p.x, y: p.y, width: G, height: voll * 10 }));
        if (rest) farbe.appendChild(s('rect', { x: p.x, y: p.y + voll * 10, width: rest * 10, height: 10 }));
      }
    }
    M.setze = (v) => {
      if (M.gesperrt) return;
      M.wert = Math.max(0, Math.min(100000, v));
      male();
    };
    if (o.bedienbar) {
      svg.addEventListener('click', (ev) => {
        const r = svg.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * W - 2;
        const py = ((ev.clientY - r.top) / r.height) * H - 2;
        const sp = Math.floor(px / (G + LUECKE));
        const ze = Math.floor(py / (G + LUECKE));
        const ix = px - sp * (G + LUECKE);
        const iy = py - ze * (G + LUECKE);
        if (sp < 0 || sp > 4 || ze < 0 || ze > 1 || ix > G || iy > G || ix < 0 || iy < 0) return;
        const k = ze * 5 + sp;
        const zelle = Math.min(9, Math.floor(iy / 10)) * 10 + Math.min(9, Math.floor(ix / 10)) + 1;
        const roh = (k * 100 + zelle) * 100;
        const schritt = o.schritt || 100;
        M.setze(Math.ceil(roh / schritt) * schritt);
      });
    }
    male();
    return M;
  };

  /* ---------- Würfel ---------- */
  const AUGEN = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  B.wuerfel = function (n) {
    const svg = s('svg', { viewBox: '0 0 60 60', class: 'wuerfel', role: 'img', 'aria-label': 'Würfel mit ' + n });
    svg.appendChild(s('rect', { x: 2, y: 2, width: 56, height: 56, rx: 12 }));
    (AUGEN[n] || []).forEach((p) => svg.appendChild(s('circle', { cx: 15 + (p % 3) * 15, cy: 15 + Math.floor(p / 3) * 15, r: 5.5 })));
    return svg;
  };

  /* ---------- Vorlesen und Töne ---------- */
  B.kannSprechen = () => 'speechSynthesis' in global && typeof global.SpeechSynthesisUtterance === 'function';
  B.sprich = function (text, tempo, sprache) {
    if (!B.kannSprechen()) return false;
    try {
      const sy = global.speechSynthesis;
      sy.cancel();
      const u = new global.SpeechSynthesisUtterance(String(text).replace(/\u00ad/g, '').replace(/\u202f/g, ''));
      const lang = sprache || 'de-DE';
      u.lang = lang;
      u.rate = tempo || 0.9;
      const stimme = sy.getVoices().find((v) => v.lang.slice(0, 2).toLowerCase() === lang.slice(0, 2));
      if (stimme) u.voice = stimme;
      sy.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  };

  let audio = null;
  B.tonAn = () => true;
  B.ton = function (art) {
    if (!B.tonAn()) return;
    try {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      if (!audio) audio = new AC();
      if (audio.state === 'suspended') audio.resume();
      const folgen = { gut: [660, 880], fast: [330, 300], stern: [523, 659, 784, 1047], plopp: [520], klick: [300] };
      (folgen[art] || folgen.klick).forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        const t = audio.currentTime + i * 0.11;
        o.type = art === 'fast' ? 'sine' : 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.18);
      });
    } catch (e) { /* ohne Ton geht es auch */ }
  };

  /* ---------- Konfetti ---------- */
  B.konfetti = function () {
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'konfetti', 'aria-hidden': 'true' });
    c.width = global.innerWidth;
    c.height = global.innerHeight;
    document.body.appendChild(c);
    const g = c.getContext('2d');
    if (!g) { c.remove(); return; }
    const farben = ['#7a5bc7', '#2780c4', '#2f9e6e', '#f29e1f', '#e4483f', '#ffd23f'];
    const teile = Array.from({ length: 140 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.6, vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 4, w: 6 + Math.random() * 8, r: Math.random() * 6, f: farben[Math.floor(Math.random() * farben.length)],
    }));
    const start = performance.now();
    (function bild(t) {
      g.clearRect(0, 0, c.width, c.height);
      teile.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.r += 0.1;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.f;
        g.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); g.restore();
      });
      if (t - start < 2600) requestAnimationFrame(bild);
      else c.remove();
    })(start);
  };

  global.Bausteine = B;
})(window);
