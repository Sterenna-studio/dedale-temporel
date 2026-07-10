# Imprimerie Médicale — Tirage spécial de Noël (Puzzle) v2

Puzzle digital (offline) : 8 plaques, chaque plaque est coupée en 2 moitiés.

## Logique
- **PC / écran large** : les paires se forment **en hauteur** (vertical), puis on assemble les plaques **en ligne** (horizontal) START → END.
- **Mobile / écran étroit** : les paires se forment **en largeur** (horizontal), puis on assemble les plaques **en colonne** (vertical) START → END.

## Lancer
### Option 1
Ouvre `index.html`.

### Option 2 (recommandé)
- **Windows** : `py -m http.server 8000`
- **Linux/Mac** : `python3 -m http.server 8000`

Puis : `http://localhost:8000`

## Notes
- Les pièces ne peuvent pas sortir de la zone de jeu (clamp strict pendant le drag).
- Le code final est une suite de **symboles** (dessinés en SVG).


## Connecteurs (v3)
- Les jonctions sont rendues via des fichiers SVG dans `connectors/`.
- Recommandé : lancer via un petit serveur local (`python -m http.server`) pour éviter les restrictions `file://` sur certains navigateurs.


## v4
- Indicateur "R1 • 1/2" masqué (toggle `SHOW_HALF_BADGES`).
- Texte centré sur les pièces.
- Jonction mâle = tab qui ressort, jonction femelle = trou réel (mask SVG).
