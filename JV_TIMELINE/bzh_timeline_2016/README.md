# BZH CHRONICLES — Timeline jeux majeurs (2016)

Mini-projet **HTML statique** (sans build) pour afficher une **timeline mensuelle** des sorties majeures 2016, avec une logique “temps réel → projection 2016”.

## Fonctionnalités
- Navigation **par mois** (flèches + dropdown).
- “Aujourd’hui” est calculé côté navigateur : **date réelle (ex: 29/01/2026) → 29/01/2016** (année - 10).
- Les jeux **dans les 15 prochains jours** (par rapport à la date timeline) sont **grisées**.
- Les jeux **au-delà** sont **masqués** et peuvent être dévoilés via un système **Reveal (5 / 24h)**.
- Persistance : `localStorage` (mois sélectionné, compteur de reveals, date de départ des reveals).

## Structure
```
bzh_timeline_2016/
  src/
    index.html
    data/
      games_2016.json
    assets/
  docs/
```

## Lancer en local (2 options)
### Option A — Simple (double-clic)
Ouvre `src/index.html` dans ton navigateur.

> Note: certains navigateurs bloquent `fetch()` en `file://`.
> Si tu as un écran vide/erreur, utilise Option B.

### Option B — Serveur local (recommandé)
Python:
```bash
cd src
python -m http.server 8000
```
Puis ouvre: http://localhost:8000

## Déploiement dans ton lab Sterenna
Copie le dossier `src/` dans ton `lab/` (ex: `/lab/timeline2016/`), et assure-toi que `index.html` et `data/games_2016.json` sont servis.

## Modifier / compléter la liste des jeux
Édite: `src/data/games_2016.json`

Format:
```json
{ "d": "2016-05-10", "t": "Uncharted 4: A Thief’s End", "p": ["PS4"], "g": ["Action","Aventure"] }
```

- `d` : date ISO `YYYY-MM-DD` (année 2016)
- `t` : titre
- `p` : plateformes (liste)
- `g` : tags/genres (liste)

## Reset reveals
Dans l’UI: bouton `RESET`
ou supprime le localStorage du site.

## Notes
- Liste “majeurs” = sélection (non exhaustive).
- Le style est inspiré de la DA cyberpunk de **BZH CHRONICLES** (neon + cuivre + HUD).
