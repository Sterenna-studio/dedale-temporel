# Imprimerie Médicale — Puzzle (v7)

## Nouveautés
- Physique avec inertie (on peut lancer les pièces)
- Limitation de superposition (≈ 1/3) + léger tintement lors des collisions
- Accrochage correct : **cling** + snap + apparition gravée du symbole (effet relief)
- Accrochage incorrect : **bonk bonk** + secousse + forte répulsion
- Sons dans `assets/sounds/` + musique de fond `backmusic.mp3`
- Panneau de droite : saisie de la suite de symboles une fois la ligne complète → affiche un code d’identification
- Style alternatif : **Munich 1908 (Gerhard Lang)** via le bouton « Style »

## Lancer
Ouvrir `index.html` via un petit serveur local (recommandé) :
- `python -m http.server 8000`
puis ouvrir `http://localhost:8000`

## Remarque sons
Les fichiers mp3 fournis sont des placeholders générés (tonalités simples) que tu peux remplacer.
