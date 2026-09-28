# Ateliers S.T.E.A.M. — Hub + Dédale (merge)

## Fichiers
- `index.html` : hub + vue dédale (portes)
- `admin.html` : scan serveur + création rapide de porte/projet
- `steam_projects.json` : métadonnées des sous-projets
- `steam_doors.json` : configuration du dédale (portes)
- `api/*` : endpoints PHP (scan + save + add)

## Déploiement (OVH)
1) Copie tout le dossier dans `sterenna.fr/base/steam/`
2) Vérifie que PHP est activé sur le dossier (API dans `/api/`).

## Scan & création rapide
- Ouvre `.../base/steam/admin.html`
- Code: `REDACTED_ARCHIVE_ADMIN_CODE`
- Clique **Scanner les sous-dossiers**
- Pour chaque dossier détecté :
  - **Créer Porte** ajoute une entrée dans `steam_doors.json`
  - **Créer Projet** ajoute une entrée dans `steam_projects.json`
  - **Les deux** fait les deux en 1 clic

## Personnaliser le rendu "porte"
Dans `steam_doors.json` → `doors[]` :
- `type` : `temporal` | `room` | `locked` | `exit`
- `requireCode` + `validCodes` : contrôle d'accès
- `riddleTitle` / `riddleText` : texte narratif

> Note : pour l’instant, l’admin propose une édition JSON directe (beta). Tu peux ensuite affiner l’UI d’édition champ par champ.
