# Implementierungsplan — Magic Orb Calculator

Grundlage: `Magic-Orb-Claude-Code-Brief.md` (authoritativer Implementierungsvertrag).

## Modulübersicht (Anforderung → Modul)

| Bereich | Modul(e) | Kernanforderungen |
|---|---|---|
| Zustand | `js/state.js` | Ausdruck, Ergebnis, Modus (idle/result/error), unabhängig von Animation |
| Eingabesteuerung | `js/inputController.js` | Maus + Tastatur, Validierung unmöglicher Sequenzen, `C`-Priorität |
| Tokenizer | `js/tokenizer.js` | Zahlen (Komma/Punkt), Operatoren, Klammern → Tokens |
| Parser | `js/parser.js` | Rekursiver Abstieg, Klammern/Verschachtelung, Präzedenz |
| Evaluator | `js/evaluator.js` | Kein `eval`, Division durch (indirekt) Null → Fehler-Signal |
| Formatter | `js/formatter.js` | Gleitkomma-Normalisierung (0.1+0.2→0.3), Komma-Anzeige |
| Anzeige | `js/displayController.js` | 9-Zeichen-Fenster, Verdrängung/Wiederherstellung, Padding-Regeln |
| Animation | `js/animationController.js` | Ergebnis-Sequenz (~1.4s), Fehler/Zauberer-Sequenz (~3.5s), `C`-Abbruch |
| Rauch/Partikel | `js/smokeRenderer.js` | Canvas 2D, idle mist, Akkumulation, Kondensation, Turbulenz |
| Audio | `js/audioController.js` | Lachen (3x synchronisiert), Kerzenstatus |
| Storage | `js/storage.js` | Sound-Status persistieren (localStorage) |
| Layout | `js/layout.js` | Normalisiertes 1000×1000-Koordinatensystem, Desktop- + Portrait-Master |
| Assets | `js/assets.js`, `assets/` | Lade-/Platzhalter-Schnittstelle für Kristall/Zauberer/Audio |
| Orchestrierung | `js/main.js` | Verdrahtung aller Module |

## Branch-Aufteilung (ein Branch + PR pro Baustein)

1. `feature/project-setup` — Grundgerüst: Ordnerstruktur, `index.html`, Basis-CSS, Testrunner, Platzhalter-Module.
2. `feature/core-math-engine` — Tokenizer, Parser, Evaluator, Formatter, State + Unit-Tests (Review-Gate 1 Vorstufe).
3. `feature/layout-structure` — Master-Koordinatensystem, DOM-Struktur für Kugeln/Rahmen/Basis, Responsive-Skalierung (Desktop + Portrait).
4. `feature/visual-design` — Kristall-/Gold-Optik (SVG/CSS-Annäherung gemäß `ASSETS.md`), Typografie, Interaktionszustände.
5. `feature/animation-particles` — Canvas-Rauchsystem, 9-Zeichen-Smoke, Ergebnis-Animation, Zauberer-Fehlersequenz.
6. `feature/audio-candle` — Lach-Audio (Platzhalter-Datei + Sync), Kerze (Flamme/Rauchwisp/Sound-Toggle), Storage.
7. `feature/tests-review-fixes` — Review-Gate 1 (Korrektheit/Sicherheit/State) + Review-Gate 2 (visuell/Performance), Fixes, finaler Testlauf.

Jeder Branch geht per PR gegen `main`.

## Bekannte Einschränkung: Premium-Assets

Es können keine finalen Bild-/Audio-Dateien (gerenderte 3D-Kristallkugel, Zauberer-
Sprite-Sequenz, Lach-Audio) generiert werden. Umsetzung erfolgt als möglichst hochwertige
SVG/CSS-Annäherung plus dokumentierte Austausch-Schnittstelle, siehe `ASSETS.md`. Dies wird
im Abschlussbericht als Asset-Limitation ausgewiesen (Brief-Vorgabe).
