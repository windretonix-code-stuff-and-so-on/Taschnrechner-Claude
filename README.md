# Magic Orb Calculator

Ein Taschenrechner, der wie ein physisches magisches Kristallkugel-Artefakt aussieht — kein
konventioneller Rechner mit Fantasy-Skin.

V1-Ziel: voll funktionsfähiger, responsiver Desktop-Web-Rechner (Vanilla HTML/CSS/JS,
kein Framework), mit hochwertiger visueller Umsetzung (Kristallkugel, Gold-Rahmen, Rauch-
/Partikelsystem, Zauberer-Fehlersequenz, Kerzen-Sound-Steuerung).

Siehe [PLAN.md](PLAN.md) für die Umsetzungsplanung und den Anforderungs-Abgleich, sowie
[ASSETS.md](ASSETS.md) für die Asset-Spezifikation (Platzhalter vs. finale Premium-Assets).

## Entwicklung

Kein Build-Schritt nötig — `index.html` direkt im Browser öffnen, oder z. B. mit
`npx serve` lokal ausliefern.

## Tests

```bash
node tests/run.js
```

Reine Unit-Tests für Tokenizer/Parser/Evaluator/Formatter/State, unabhängig von der UI.
