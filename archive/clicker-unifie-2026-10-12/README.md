# S.T.E.A.M. Clicker - version unifiee

Ce dossier regroupe la version la plus complete des variantes presentes dans `LAB_files`.

- Base HTML/CSS : `steamclicker/steam_clicker_hud_clickonly_outerring_compat/dev`
- Moteur de jeu : `steamclicker/steam_clicker_main_fix_ringCount_updateGearShop/main.js`
- Assets, audio et SVG : `clicker_dl`
- Modules partages : copies locales dans `shared/`

Corrections appliquees :

- imports `shared` rendus locaux au dossier final ;
- ajout de `shared/supaRaw.js`, manquant dans les sources ;
- demarrage possible sans session Supabase active ;
- boutons `Rembourser` et `Reset` reconnectes dans `main.js` ;
- remboursement adapte aux artisans evolues, quartiers et conglomerats.

Pour lancer localement, utilisez un petit serveur HTTP depuis ce dossier parent :

```powershell
python -m http.server 8080
```

Puis ouvrez `http://localhost:8080/clicker_unifie/`.
