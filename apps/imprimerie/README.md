# Imprimerie Médicale — Puzzle (v7.3)

## Changements demandés
- ✅ Zoom / resize **ne reset plus** : les pièces, paires complètes et la ligne restent en mémoire jusqu’à **Reset**
- ✅ Textes corrigés (plus de `undefined / undefined`)
- ✅ Chaque paire compose une “page” d’annonce / offre de Noël médicale (début XXe), avec easter eggs (Dr. M., hommes en noir…)

## Audio collisions
- Tint collision **désactivé** par défaut (évite boucle). Voir `COLLISION_TINT_ENABLED` dans `app.js`.

## Lancer
`python -m http.server 8000` puis `http://localhost:8000`

## Variantes et intégration Dédale

- Le fond d'atelier de l'intake v7.8.1 est intégré à la page active; la copie reçue complète est conservée dans `archive/imprimerie-med-v7-8-1-bg-intake-2026-10-12/` avec son manifeste SHA-256. Le garde-couloir et l'attribution du fragment Δ restent ceux du dépôt.
- Le puzzle autonome Imprimerie Médicale — Noël 1927 est servi dans `noel-1927/`, protégé par le même accès `porte-reliques`; sa réussite accorde Δ. L'original reçu est archivé avec SHA-256 dans `archive/imprimerie-noel-1927-intake-2026-10-12/`.
