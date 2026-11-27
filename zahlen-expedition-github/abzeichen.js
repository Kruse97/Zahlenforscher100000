/* Inseln, Übungen, Spielstände, Punkte und Abzeichen. */
(function (global) {
  'use strict';

  const INSELN = [
    { id: 'strand', name: 'Stellenwert-Strand', bild: '🏖️', farbe: '#d97a00', text: 'Zahlen bauen und zerlegen',
      uebungen: ['buendeln', 'material', 'legen', 'zerlegen', 'kartensalat', 'steckbrief'] },
    { id: 'wald', name: 'Zahlenwort-Wald', bild: '🌳', farbe: '#1f8456', text: 'Zahlen hören, lesen, schreiben',
      uebungen: ['diktat', 'wortzahl', 'zahlwort', 'sprachen', 'memory'] },
    { id: 'fluss', name: 'Zahlenstrahl-Fluss', bild: '🛶', farbe: '#1f6fb2', text: 'Zahlenstrahl, Nachbarn, Runden',
      uebungen: ['pfeil', 'setzen', 'nachbarn', 'detektiv', 'folgen', 'runden'] },
    { id: 'berge', name: 'Vergleichs-Berge', bild: '⛰️', farbe: '#6b4bb8', text: 'Vergleichen, ordnen, rätseln',
      uebungen: ['vergleichen', 'ballons', 'raetsel', 'tresor'] },
    { id: 'vulkan', name: 'Forscher-Vulkan', bild: '🌋', farbe: '#c4372f', text: 'Entdecken und knobeln',
      uebungen: ['plaettchen', 'wuerfelbauer', 'knobel', 'packungen', 'mmpapier', 'ergaenzen'] },
    { id: 'lager', name: 'Spiele-Lager', bild: '🏕️', farbe: '#b1357c', text: 'Spielen, allein oder zu zweit',
      uebungen: ['wuerfelspiel', 'blitz', 'partner'] },
  ];

  const UEBUNGEN = {
    buendeln: { titel: 'Bündel-Werkstatt', bild: '📦', text: 'Wie viele Tausender sind 3 Zehntausender?', runde: 6 },
    material: { titel: 'Würfel-Berge', bild: '🧊', text: 'Welche Zahl ist hier gebaut?', runde: 5 },
    legen: { titel: 'Plättchen legen', bild: '🔴', text: 'Lege Zahlen in die Stellenwerttafel.', runde: 5 },
    zerlegen: { titel: 'Zahlen zerlegen', bild: '✂️', text: 'Teile Zahlen in ihre Stellenwerte.', runde: 5 },
    kartensalat: { titel: 'Karten-Salat', bild: '🥗', text: 'Die Stellen sind durcheinander geraten.', runde: 6 },
    steckbrief: { titel: 'Zahlen-Steckbrief', bild: '🪪', text: 'Stelle eine Zahl auf viele Arten dar.', runde: 4 },
    diktat: { titel: 'Zahlen-Diktat', bild: '🎧', text: 'Hör gut zu und schreibe die Zahl.', runde: 6 },
    wortzahl: { titel: 'Wort zu Zahl', bild: '🔤', text: 'Lies das Zahlwort und schreibe Ziffern.', runde: 6 },
    zahlwort: { titel: 'Zahl zu Wort', bild: '💬', text: 'Finde das passende Zahlwort.', runde: 6 },
    sprachen: { titel: 'Sprachen-Detektiv', bild: '🌍', text: 'Zahlen auf Englisch und Französisch.', runde: 5 },
    memory: { titel: 'Zahlen-Memory', bild: '🃏', text: 'Finde die Paare.', spiel: true },
    pfeil: { titel: 'Pfeile ablesen', bild: '📍', text: 'Auf welche Zahl zeigt der Pfeil?', runde: 6 },
    setzen: { titel: 'Fähnchen setzen', bild: '🚩', text: 'Setze die Zahl an den Zahlenstrahl.', runde: 6 },
    nachbarn: { titel: 'Nachbarzahlen', bild: '🏘️', text: 'Vorgänger, Nachfolger und mehr.', runde: 5 },
    detektiv: { titel: 'Nachbar-Detektiv', bild: '🕵️', text: 'Welche Zahl versteckt sich?', runde: 5 },
    folgen: { titel: 'Sprungsteine', bild: '🪨', text: 'Zähle in Schritten weiter.', runde: 5 },
    runden: { titel: 'Rundungs-Rutsche', bild: '🛝', text: 'Runde auf Zehner bis Zehntausender.', runde: 8 },
    vergleichen: { titel: 'Größer oder kleiner', bild: '⚖️', text: 'Setze <, > oder = ein.', runde: 8 },
    ballons: { titel: 'Ballon-Platzen', bild: '🎈', text: 'Tippe die Zahlen der Größe nach an.', runde: 5 },
    raetsel: { titel: 'Zahlenrätsel', bild: '❓', text: 'Knacke die Rätsel.', runde: 5 },
    tresor: { titel: 'Tresor knacken', bild: '🔐', text: 'Finde die Geheimzahl.', spiel: true },
    plaettchen: { titel: 'Plättchen-Forscher', bild: '🔬', text: 'Was passiert, wenn ein Plättchen wandert?', runde: 5 },
    wuerfelbauer: { titel: 'Würfel-Zahlen', bild: '🎲', text: 'Baue Zahlen aus gewürfelten Ziffern.', runde: 5 },
    knobel: { titel: 'Würfel-Knobelei', bild: '🧩', text: 'Wie viele Zahlen kann man bauen?', runde: 4 },
    packungen: { titel: 'Wie viel ist 100\u202f000?', bild: '🫙', text: 'Gläser, Dosen und riesige Mengen.', runde: 5 },
    mmpapier: { titel: 'Millimeterpapier', bild: '📐', text: 'Male große Zahlen aus.', runde: 4 },
    ergaenzen: { titel: 'Schatztruhe füllen', bild: '💰', text: 'Wie viel fehlt bis 100\u202f000?', runde: 6 },
    wuerfelspiel: { titel: 'Zahlen-Würfelspiel', bild: '🏆', text: 'Wer baut die größte Zahl?', spiel: true },
    blitz: { titel: 'Blitzrunde', bild: '⚡', text: '60 Sekunden, so viele wie möglich.', spiel: true },
    partner: { titel: 'Partner-Diktat', bild: '🤝', text: 'Einer liest vor, einer schreibt.', spiel: true },
  };

  const TIERE = ['🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐢', '🐯', '🐨', '🐧'];
  const BASIS = [250, 375, 500];
  const ZIEL = 100000;

  function heute() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function neuesProfil(name, tier) {
    return {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      name, tier, stufe: 1, schritte: 0, serie: 0, besteSerie: 0, richtig: 0, zweiter: 0, perfekt: 0, runden: 0,
      mut: false, sterne: {}, abzeichen: {}, tage: [], wuerfelSiege: 0, blitzRekord: 0,
    };
  }

  const bestSterne = (p, id) => Math.max(0, ...(p.sterne[id] || [0]));
  const alleSterne = (p) => Object.keys(UEBUNGEN).reduce((s, id) => s + bestSterne(p, id), 0);
  const inselSterne = (p, insel) => insel.uebungen.reduce((s, id) => s + bestSterne(p, id), 0);
  const inselGeschafft = (p, insel) => insel.uebungen.every((id) => bestSterne(p, id) >= 2);

  function sterneFuer(quote) {
    return quote >= 0.9 ? 3 : quote >= 0.65 ? 2 : quote >= 0.4 ? 1 : 0;
  }

  /** Eine Antwort verbuchen. wert: 1 = sofort richtig, 0.5 = im zweiten Versuch, 0 = falsch. */
  function antwort(p, wert, stufe) {
    let punkte = 0;
    if (wert === 1) {
      p.serie += 1;
      p.richtig += 1;
      punkte = BASIS[stufe - 1] + 10 * Math.min(p.serie, 10);
    } else {
      p.serie = 0;
      if (wert > 0) {
        p.richtig += 1;
        p.zweiter += 1;
        punkte = Math.round(BASIS[stufe - 1] / 20) * 10;
      }
    }
    p.besteSerie = Math.max(p.besteSerie, p.serie);
    return gutschreiben(p, punkte);
  }

  function gutschreiben(p, punkte) {
    const vorher = p.schritte;
    p.schritte = Math.min(ZIEL, p.schritte + punkte);
    return p.schritte - vorher;
  }

  function rundeFertig(p, { id, stufe, sterne, perfekt }) {
    p.runden += 1;
    if (!p.sterne[id]) p.sterne[id] = [0, 0, 0];
    p.sterne[id][stufe - 1] = Math.max(p.sterne[id][stufe - 1], sterne);
    if (perfekt) p.perfekt += 1;
    if (stufe === 3 && sterne >= 2) p.mut = true;
    const t = heute();
    if (p.tage.indexOf(t) < 0) p.tage.push(t);
  }

  const ABZEICHEN = [
    { id: 'start', bild: '🥾', name: 'Erste Schritte', text: 'Schließe deine erste Runde ab.', gilt: (p) => p.runden >= 1 },
    { id: 'perfekt1', bild: '💎', name: 'Fehlerfrei', text: 'Schaffe eine Runde ohne einen Fehler.', gilt: (p) => p.perfekt >= 1 },
    { id: 'perfekt7', bild: '🦅', name: 'Adlerauge', text: 'Schaffe 7 Runden ohne Fehler.', gilt: (p) => p.perfekt >= 7 },
    { id: 'serie10', bild: '🔥', name: 'Feuer-Serie', text: '10 Antworten hintereinander richtig.', gilt: (p) => p.besteSerie >= 10 },
    { id: 'serie25', bild: '☄️', name: 'Kometen-Serie', text: '25 Antworten hintereinander richtig.', gilt: (p) => p.besteSerie >= 25 },
    { id: 'fleiss50', bild: '🐝', name: 'Fleißbiene', text: 'Löse 50 Aufgaben richtig.', gilt: (p) => p.richtig >= 50 },
    { id: 'fleiss250', bild: '🦫', name: 'Meister-Biber', text: 'Löse 250 Aufgaben richtig.', gilt: (p) => p.richtig >= 250 },
    { id: 'nie', bild: '💪', name: 'Nie aufgeben', text: '10-mal im zweiten Versuch doch noch geschafft.', gilt: (p) => p.zweiter >= 10 },
    { id: 'mut', bild: '🧗', name: 'Mutprobe', text: 'Hole 2 Sterne in einer schweren Runde.', gilt: (p) => p.mut },
    { id: 'tage3', bild: '📅', name: 'Dranbleiber', text: 'Übe an 3 verschiedenen Tagen.', gilt: (p) => p.tage.length >= 3 },
    { id: 'stern10', bild: '⭐', name: 'Sternensammler', text: 'Sammle 10 Sterne.', gilt: (p) => alleSterne(p) >= 10 },
    { id: 'stern40', bild: '🌟', name: 'Sternenfänger', text: 'Sammle 40 Sterne.', gilt: (p) => alleSterne(p) >= 40 },
    { id: 'stern75', bild: '🌌', name: 'Sternenkönig', text: 'Sammle 75 Sterne.', gilt: (p) => alleSterne(p) >= 75 },
    ...INSELN.map((i) => ({ id: 'insel-' + i.id, bild: i.bild, name: 'Meister: ' + i.name, text: 'Hole auf dieser Insel überall mindestens 2 Sterne.', gilt: (p) => inselGeschafft(p, i) })),
    { id: 'tresor', bild: '🗝️', name: 'Tresorknacker', text: 'Knacke den Tresor mit 3 Sternen.', gilt: (p) => bestSterne(p, 'tresor') >= 3 },
    { id: 'wuerfel', bild: '🎯', name: 'Würfel-Champion', text: 'Gewinne 3-mal gegen Fuchs Flitz.', gilt: (p) => p.wuerfelSiege >= 3 },
    { id: 'blitz', bild: '⚡', name: 'Blitzmerker', text: '12 richtige Antworten in einer Blitzrunde.', gilt: (p) => p.blitzRekord >= 12 },
    { id: 'welt', bild: '🌍', name: 'Weltreisender', text: 'Hole 3 Sterne beim Sprachen-Detektiv.', gilt: (p) => bestSterne(p, 'sprachen') >= 3 },
    { id: 'team', bild: '🤝', name: 'Teamgeist', text: 'Spiele ein Partner-Diktat zu Ende.', gilt: (p) => !!p.sterne.partner },
    { id: 'weg10', bild: '🏁', name: '10\u202f000 Schritte', text: 'Komme auf deiner Reise bis 10\u202f000.', gilt: (p) => p.schritte >= 10000 },
    { id: 'weg50', bild: '⛺', name: 'Halbzeit', text: 'Komme auf deiner Reise bis 50\u202f000.', gilt: (p) => p.schritte >= 50000 },
    { id: 'weg100', bild: '👑', name: 'Hunderttausend!', text: 'Erreiche das Ziel: 100\u202f000 Schritte.', gilt: (p) => p.schritte >= ZIEL },
  ];

  /** Prüft alle Bedingungen, trägt neue Abzeichen ein und gibt sie zurück. */
  function neueAbzeichen(p) {
    const neu = ABZEICHEN.filter((a) => !p.abzeichen[a.id] && a.gilt(p));
    neu.forEach((a) => { p.abzeichen[a.id] = heute(); });
    return neu;
  }

  /* ---------- Speichern auf diesem Gerät ---------- */
  const SCHLUESSEL = 'zahlen-expedition-v1';
  const Speicher = {
    daten: { profile: [], aktiv: null, ton: true },
    dauerhaft: true,
    laden() {
      try {
        const roh = global.localStorage.getItem(SCHLUESSEL);
        if (roh) {
          const d = JSON.parse(roh);
          if (d && Array.isArray(d.profile)) {
            d.profile = d.profile.filter((p) => p && p.id && p.name).map((p) => Object.assign(neuesProfil(p.name, p.tier), p));
            this.daten = Object.assign({ aktiv: null, ton: true }, d);
          }
        }
      } catch (e) {
        this.dauerhaft = false;
      }
    },
    sichern() {
      try {
        global.localStorage.setItem(SCHLUESSEL, JSON.stringify(this.daten));
        this.dauerhaft = true;
      } catch (e) {
        this.dauerhaft = false;
      }
    },
    aktiv() { return this.daten.profile.find((p) => p.id === this.daten.aktiv) || null; },
    anlegen(name, tier) {
      const p = neuesProfil(name, tier);
      this.daten.profile.push(p);
      this.daten.aktiv = p.id;
      this.sichern();
      return p;
    },
    waehlen(id) { this.daten.aktiv = id; this.sichern(); },
    loeschen(id) {
      this.daten.profile = this.daten.profile.filter((p) => p.id !== id);
      if (this.daten.aktiv === id) this.daten.aktiv = null;
      this.sichern();
    },
  };

  const K = {
    INSELN, UEBUNGEN, TIERE, ABZEICHEN, ZIEL, BASIS, heute, neuesProfil, bestSterne, alleSterne, inselSterne,
    inselGeschafft, sterneFuer, antwort, gutschreiben, rundeFertig, neueAbzeichen, Speicher,
  };
  global.Katalog = K;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
