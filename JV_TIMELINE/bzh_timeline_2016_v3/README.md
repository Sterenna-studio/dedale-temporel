# ChronoTablet — BZH CHRONICLES (UI v3)

## Ajouts (UX/UI)
- **Page d’accueil** façon “tablette de voyage ludique” :
  - explique le principe
  - sélection d’année (**2016** dispo)
  - texte “les ingénieurs de Sterenna…” pour les autres sauts temporels
- **Sons UI (SFX)** : nav / modal / reveal / erreur / reset  
  - 0 fichiers audio (WebAudio)
  - toggle SFX persistant via `localStorage`
- **Effet “écran” sur le calendrier** : scanlines + glass + bezel + micro-oscillation.

## Lancer
`fetch()` peut être bloqué en `file://`.

```bash
cd src
python -m http.server 8000
```

Ouvre: http://localhost:8000

## Données
`src/data/games_2016.json`

Champs utiles :
- `steam_appid` ⇒ lien Steam + image header
- `steam_url` ⇒ lien custom (si hors Steam)
