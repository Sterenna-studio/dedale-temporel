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

Cette variante est servie sous `/dedale/steam-clicker/unifie/`. Elle garde sa
propre économie et la clé locale `steamClickerSave`; la version active conserve
`steam_clicker_v6`.

Pour lancer localement, utilisez un serveur HTTP depuis la racine du dépôt :

```powershell
python -m http.server 8080 --directory apps/steam-clicker-wl/unifie
```

Puis ouvrez `http://localhost:8080/`.

Le placement des engrenages et des anneaux s’adapte maintenant à la taille de
la scène, y compris lors d’un redimensionnement. La mécanique et l’économie du
jeu restent celles de cette variante importée.
