/* Rechenlogik rund um den Zahlenraum bis 100 000. Ohne Oberfläche, damit sie testbar ist. */
(function (global) {
  'use strict';

  const LUECKE = '\u202f';

  const STELLEN = [
    { k: 'ZT', wert: 10000, name: 'Zehntausender', einzahl: 'Zehntausender' },
    { k: 'T', wert: 1000, name: 'Tausender', einzahl: 'Tausender' },
    { k: 'H', wert: 100, name: 'Hunderter', einzahl: 'Hunderter' },
    { k: 'Z', wert: 10, name: 'Zehner', einzahl: 'Zehner' },
    { k: 'E', wert: 1, name: 'Einer', einzahl: 'Einer' },
  ];
  const WERT = { HT: 100000, ZT: 10000, T: 1000, H: 100, Z: 10, E: 1 };

  /** 12647 -> "12 647" (schmales Leerzeichen) */
  function format(n) {
    const s = String(Math.trunc(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, LUECKE);
    return n < 0 ? '−' + s : s;
  }

  /** Ziffern [ZT, T, H, Z, E] für 0 … 99 999 */
  function ziffern(n) {
    return STELLEN.map((s) => Math.floor(n / s.wert) % 10);
  }

  function ausZiffern(arr) {
    return arr.reduce((summe, d, i) => summe + d * STELLEN[i].wert, 0);
  }

  /** Kaufmännisches Runden auf 10, 100, 1000 oder 10 000 */
  function runden(n, s) {
    return Math.floor((n + s / 2) / s) * s;
  }

  /**
   * Nachbarzahlen. Ist n selbst z. B. ein voller Zehner, sind die Nachbarzehner
   * der Zehner davor und der danach.
   */
  function nachbarn(n, s) {
    return { unten: (Math.ceil(n / s) - 1) * s, oben: (Math.floor(n / s) + 1) * s };
  }

  /* ---------- Zahlwörter ---------- */
  const DE_EINER = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  const DE_ZEHN = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const DE_ZEHNER = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

  function deUnter100(n, amEnde) {
    if (n === 0) return '';
    if (n === 1) return amEnde ? 'eins' : 'ein';
    if (n < 10) return DE_EINER[n];
    if (n < 20) return DE_ZEHN[n - 10];
    const e = n % 10;
    const z = Math.floor(n / 10);
    return e ? DE_EINER[e] + 'und' + DE_ZEHNER[z] : DE_ZEHNER[z];
  }

  function deUnter1000(n, amEnde) {
    const h = Math.floor(n / 100);
    return (h ? DE_EINER[h] + 'hundert' : '') + deUnter100(n % 100, amEnde);
  }

  function wortDe(n) {
    if (n === 0) return 'null';
    const t = Math.floor(n / 1000);
    return (t ? deUnter1000(t, false) + 'tausend' : '') + deUnter1000(n % 1000, true);
  }

  /** Mit weichen Trennstrichen, damit lange Wörter schön umbrechen. */
  function wortDeTrennbar(n) {
    return wortDe(n).replace(/tausend(?=.)|hundert(?=.)|und(?!ert)/g, '$&\u00ad');
  }

  const EN_KLEIN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
    'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const EN_ZEHNER = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function enUnter100(n) {
    if (n < 20) return EN_KLEIN[n];
    return EN_ZEHNER[Math.floor(n / 10)] + (n % 10 ? '-' + EN_KLEIN[n % 10] : '');
  }

  function enUnter1000(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (!h) return enUnter100(r);
    return EN_KLEIN[h] + ' hundred' + (r ? ' and ' + enUnter100(r) : '');
  }

  function wortEn(n) {
    if (n === 0) return 'zero';
    const t = Math.floor(n / 1000);
    const r = n % 1000;
    if (!t) return enUnter1000(r);
    let s = enUnter1000(t) + ' thousand';
    if (r) s += (r < 100 ? ' and ' : ' ') + enUnter1000(r);
    return s;
  }

  const FR_KLEIN = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze',
    'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const FR_ZEHNER = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

  function frUnter100(n, amEnde) {
    if (n < 20) return FR_KLEIN[n];
    if (n < 70) {
      const z = FR_ZEHNER[Math.floor(n / 10)];
      const e = n % 10;
      if (e === 0) return z;
      if (e === 1) return z + ' et un';
      return z + '-' + FR_KLEIN[e];
    }
    if (n < 80) return n === 71 ? 'soixante et onze' : 'soixante-' + FR_KLEIN[n - 60];
    if (n === 80) return amEnde ? 'quatre-vingts' : 'quatre-vingt';
    return 'quatre-vingt-' + FR_KLEIN[n - 80];
  }

  function frUnter1000(n, amEnde) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (!h) return frUnter100(r, amEnde);
    let s = h === 1 ? 'cent' : FR_KLEIN[h] + ' cent' + (!r && amEnde ? 's' : '');
    if (r) s += ' ' + frUnter100(r, amEnde);
    return s;
  }

  function wortFr(n) {
    if (n === 0) return 'zéro';
    const t = Math.floor(n / 1000);
    const r = n % 1000;
    const teile = [];
    if (t === 1) teile.push('mille');
    else if (t > 1) teile.push(frUnter1000(t, false) + ' mille');
    if (r) teile.push(frUnter1000(r, true));
    return teile.join(' ');
  }

  /* ---------- Zufall ---------- */
  function zufall(seed) {
    let rnd = Math.random;
    if (seed !== undefined) {
      let a = seed >>> 0;
      rnd = function () {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const r = {
      zahl: rnd,
      int: (a, b) => a + Math.floor(rnd() * (b - a + 1)),
      aus: (arr) => arr[Math.floor(rnd() * arr.length)],
      wahr: (p) => rnd() < (p === undefined ? 0.5 : p),
      mische(arr) {
        const k = arr.slice();
        for (let i = k.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [k[i], k[j]] = [k[j], k[i]];
        }
        return k;
      },
    };
    return r;
  }

  /** Alle verschiedenen Zahlen, die man aus genau diesen Ziffern legen kann (aufsteigend). */
  function alleAnordnungen(liste) {
    const ergebnis = new Set();
    (function baue(rest, praefix) {
      if (!rest.length) {
        ergebnis.add(Number(praefix));
        return;
      }
      rest.forEach((d, i) => baue(rest.slice(0, i).concat(rest.slice(i + 1)), praefix + d));
    })(liste, '');
    return Array.from(ergebnis).sort((a, b) => a - b);
  }

  const Z = {
    LUECKE, STELLEN, WERT, format, ziffern, ausZiffern, runden, nachbarn,
    wortDe, wortDeTrennbar, wortEn, wortFr, zufall, alleAnordnungen,
  };
  global.Zahlen = Z;
  if (typeof module !== 'undefined' && module.exports) module.exports = Z;
})(typeof window !== 'undefined' ? window : globalThis);
