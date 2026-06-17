# BZH CHRONICLES — Timeline jeux majeurs (2016) (v2)

- **Barre d'énergie** (5 reveals / 24h, rolling)
- **Tiles cliquables** → modal avec lien (Steam ou custom), infos, image header Steam (si `steam_appid`).

## Lancer (recommandé)
`fetch()` peut être bloqué en `file://`.

```bash
cd src
python -m http.server 8000
```

Ouvre: http://localhost:8000

## Reveal / énergie
- 5 tokens max
- 1 clic sur un jeu masqué = 1 token consommé + jeu révélé
- recharge toutes les 24h (rolling)

Reset via bouton `RESET`.

## Données
Édite `src/data/games_2016.json`

Champs utiles:
- `d` : date ISO `YYYY-MM-DD`
- `t` : titre
- `p` : plateformes (liste)
- `g` : tags/genres (liste)
- `steam_appid` : number (image auto + lien Steam)
- `steam_url` : string (si hors Steam)
- `note` : string (optionnel)
