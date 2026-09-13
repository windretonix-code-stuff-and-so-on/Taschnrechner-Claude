# Asset-Spezifikation

V1 verwendet handgefertigte SVG/CSS-Annäherungen für alle "physischen" Elemente (Kristall,
Gold/Messing, Kerze) statt gerasterter Premium-Renderings, da keine Bild-/Audio-Generierung
zur Verfügung steht. Struktur ist so aufgebaut, dass jede Datei unten 1:1 durch ein echtes
Asset ersetzt werden kann, ohne Code-Änderungen (nur Datei-Austausch unter gleichem Pfad/
gleicher Größe).

## Austauschbare Asset-Slots

| Slot | Pfad (Platzhalter) | Format/Maße | Ebene |
|---|---|---|---|
| Hauptkugel – Rückwand/Lichtstruktur | `assets/orb-back.svg` | 1000×1000, transparent | 1 (rear crystal) |
| Hauptkugel – Frontglas/Reflexionen | `assets/orb-front.svg` | 1000×1000, transparent | 5 (front glass) |
| Gold/Messing-Rahmen + Basis | `assets/frame.svg` | 1000×1000, transparent | 6 (frame) |
| Kleine Kugel-Fassung (1×, wird per CSS repliziert) | `assets/small-setting.svg` | 200×200, transparent | — |
| Kerze (Halter, Wachs, unbeleuchtet) | `assets/candle-base.svg` | 200×300, transparent | — |
| Kerzenflamme (beleuchtet, animiert per CSS) | `assets/candle-flame.svg` | 100×150, transparent | — |
| Zauberer-Sequenz | `assets/wizard/frame-XX.svg` (mehrteilig) oder Sprite-Sheet | 1000×650, transparent, synchron zu 3 Lachimpulsen | 3.5s Sequenz |
| Lach-Audio | `assets/audio/wizard-laugh.mp3` | 3 klar getrennte Lachimpulse, ruhige männliche Fantasy-Stimme, dezenter Raumhall | ~3–4s |

`js/assets.js` lädt ausschließlich über diese Pfade — ein Asset-Austausch erfordert keine
Code-Änderung. Bis echte Assets vorliegen, sind Kristall/Rahmen als parametrisches SVG (Radial-
Gradients, mehrere Reflexions-Layer) implementiert, die Zauberer-Sequenz als CSS-animierte
SVG-Formen (Augen/Mund/Bart-Bewegung synchron zu den 3 Audio-Impulsen), und das Lachen als
kurze, lizenzfreie Platzhalter-Audiodatei bzw. stummer Fallback mit Kommentar im Code.
