# Outil de création — Jonctions SVG (Puzzle)

Tu voulais un truc simple : **les SVG des jonctions**.
Je t’ai mis deux choses :
1) `svgs/` : 16 fichiers prêts (C1..C8 en **mâle↓** et **femelle↑**)
2) `index.html` : mini outil offline pour générer/exporter : modèle + mâle/femelle + orientation + taille.

## Lancer
Ouvre `index.html`.

Si ton navigateur bloque les modules ES6 en local :
- Windows : `py -m http.server 8000`
- Linux/Mac : `python3 -m http.server 8000`
Puis : `http://localhost:8000`

## Notes
- Les paths sont normalisés (x:0→1). L’outil applique les transforms + rotations.
