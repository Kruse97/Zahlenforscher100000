# Zahlen-Expedition bis 100 000

Eine Lern-App für Klasse 4. Die Kinder reisen mit Fuchs Flitz über sechs Inseln, sammeln Sterne, „Schritte“ (bis 100 000) und Abzeichen. Sie läuft im Browser auf Tablet, PC und Handy, ohne Anmeldung und ohne Server.

## Online stellen mit GitHub Pages

1. Auf [github.com](https://github.com) anmelden und über **New repository** ein neues Repository anlegen, z. B. `zahlen-expedition`. Sichtbarkeit **Public** (bei einem kostenlosen Konto ist das für GitHub Pages nötig).
2. Die ZIP-Datei auf dem Computer **entpacken**.
3. Im Repository **Add file → Upload files** wählen (bei einem leeren Repository: Link „uploading an existing file“). Alle entpackten Dateien hineinziehen (nicht die ZIP selbst) und **Commit changes** klicken.
4. **Settings → Pages** öffnen. Unter *Build and deployment* bei *Source* **Deploy from a branch** wählen, Branch **main**, Ordner **/(root)**, dann **Save**.
5. Nach ein paar Minuten steht oben auf dieser Seite die Adresse, meist `https://DEIN-NAME.github.io/zahlen-expedition/`. Diesen Link oder einen QR-Code davon bekommen die Kinder.

Tipp für Tablets: Die Seite im Browser öffnen und „Zum Home-Bildschirm“ wählen. Dann verhält sie sich wie eine App.

## Inseln und Übungen

| Insel | Übungen |
|---|---|
| Stellenwert-Strand | Bündel-Werkstatt, Würfel-Berge (Zehnersystem-Material), Plättchen legen, Zahlen zerlegen, Karten-Salat, Zahlen-Steckbrief |
| Zahlenwort-Wald | Zahlen-Diktat (mit Vorlesestimme), Wort zu Zahl, Zahl zu Wort, Sprachen-Detektiv (Englisch, Französisch), Zahlen-Memory |
| Zahlenstrahl-Fluss | Pfeile ablesen, Fähnchen setzen, Nachbarzahlen, Nachbar-Detektiv, Sprungsteine (Zahlenfolgen), Rundungs-Rutsche |
| Vergleichs-Berge | Größer oder kleiner, Ballon-Platzen (ordnen), Zahlenrätsel, Tresor knacken |
| Forscher-Vulkan | Plättchen-Forscher, Würfel-Zahlen, Würfel-Knobelei, Wie viel ist 100 000?, Millimeterpapier, Schatztruhe füllen |
| Spiele-Lager | Zahlen-Würfelspiel (gegen Flitz oder zu zweit), Blitzrunde, Partner-Diktat |

Jede Übung gibt es in **Leicht, Mittel und Schwer**. Die Zahlen werden bei jeder Runde neu gewürfelt (bis auf wenige feste Knobelaufgaben).

## So wird bewertet

- Pro Aufgabe gibt es zwei Versuche, danach wird die Lösung erklärt. (Bei einigen Spielen und Knobelaufgaben gilt eine eigene Regel.)
- Sterne je Runde: ab 90 % drei, ab 65 % zwei, ab 40 % einer. Eine Antwort im zweiten Versuch zählt halb.
- „Schritte“ gibt es für richtige Antworten, in schwereren Stufen mehr.
- 27 Abzeichen, dazu eine druckbare Urkunde.
- Nachbarzahlen: Ist eine Zahl selbst ein voller Zehner, Hunderter usw., sind die Nachbarn der davor und der danach (Nachbarzehner von 42 870: 42 860 und 42 880).

## Datenschutz und Speichern

- Spitznamen und Spielstände liegen nur im Browser des jeweiligen Geräts. Auf einem anderen Gerät beginnt das Kind neu.
- Mehrere Kinder können sich ein Gerät teilen (oben auf den Namen tippen).
- Unter **Für Erwachsene** (unten auf der Karte) steht der Fortschritt aller Kinder dieses Geräts; dort lassen sich Spielstände auch löschen.
- Die App lädt nichts von fremden Servern, hat keine Werbung und kein Tracking. GitHub als Webhoster erhält beim Aufruf technisch bedingt die IP-Adresse. Bitte klärt das nach den Regeln eurer Schule.
- Die Vorlesefunktion nutzt die Stimme des Geräts bzw. Browsers. Manche Browser erzeugen sie online beim Hersteller.

## Anpassen

| Was | Wo |
|---|---|
| Namen der Übungen, Aufgaben pro Runde, Abzeichen | `abzeichen.js` |
| Zahlenbereiche und Schwierigkeit | `aufgaben.js` |
| Arbeitsaufträge, Tipps | `uebungen.js`, `spiele.js` |
| Farben und Aussehen | `style.css` |

Nach Änderungen die Dateien erneut ins Repository hochladen.

## Schriften

Andika und Baloo 2 stehen unter der SIL Open Font License (siehe die beiden Lizenzdateien).
