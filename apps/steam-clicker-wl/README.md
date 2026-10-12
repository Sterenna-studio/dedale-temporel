# S.T.E.A.M. Clicker

La version unifiée est la version servie par défaut à `/dedale/steam-clicker/`.
Elle reprend le moteur et le placement des engrenages de `clicker_unifie`, avec
une sauvegarde locale `steamClickerSave`.

## Sauvegarde de l’ancienne version

La version qui était active avant l’unifiée est conservée dans
`backup/current-active-2026-10-12/`. Le workflow Nitro exclut tout le dossier
`backup/` et `old.vers/` du site publié.

## Lancement local

Depuis la racine du dépôt : `python -m http.server 8080`, puis ouvrir
`http://localhost:8080/apps/steam-clicker-wl/`.

## Vérification

- `node scripts/check-clicker-unifie.mjs` vérifie la version par défaut et le
  placement des engrenages/anneaux à taille bureau et mobile.
- `node scripts/check-steam-clicker.mjs` vérifie l’ancienne version sauvegardée
  à travers la route locale de test `/steam-clicker/backup/`.

Les tests utilisent Chrome headless et un profil temporaire dans `.artifacts`.
