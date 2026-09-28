# ATELIER — archive historique, import du 28 septembre 2026

Origine : `C:\DEV\toCheck\ATELIER`. Cette archive conserve l'ancien atelier
S.T.E.A.M. et ses versions successives ; les applications actuelles restent dans
`apps/`. Aucun fichier actif n'a été remplacé et aucun déploiement n'a été modifié.

## Contenu et intégrité

- `source/` : 1 296 fichiers historiques hors dépendances, caches et métadonnées Git.
- `manifest.json` : chemin, SHA-256 original, SHA-256 archivé, indicateur de nettoyage.
- Copie intégrale privée : `../../local-private/atelier-2026-09-28/`, 5 605 fichiers
  originaux vérifiés par SHA-256, plus son manifeste. Ce dossier est ignoré par Git.
- La source dans `toCheck` reste intacte.

Les anciens identifiants d'administration ont été neutralisés dans six fichiers
du hub PHP ; les originaux exacts sont préservés uniquement dans la copie privée.
Les empreintes différentes sont explicites dans le manifeste. Ne pas publier
`local-private/` ni réutiliser ces anciens identifiants.

## Examen des variantes

La comparaison avec six dépôts locaux a retrouvé 1 169 contenus identiques ;
127 fichiers n'avaient pas de correspondance exacte dans ce périmètre.
Ce ne sont pas nécessairement des améliorations à reporter dans l'application.

| Historique | Correspondance actuelle / constat |
| --- | --- |
| `dedale/` | Ancien hub PHP, pages d'administration, jeux et catalogue ; conservé comme ensemble, hors site déployé. |
| `MED/` | Variantes de l'imprimerie médicale ; `apps/imprimerie` reste la source active. |
| `spectrocrypt_v1_vanilla/` | Correspond à `apps/spectrocrypt` ; sa page HTML manque des ajouts d'intégration/protection présents dans la version actuelle. Ne pas rétablir cette ancienne page. |
| `dedale_sfx_pack/` | Les 13 fichiers du pack ont déjà un contenu identique dans les dépôts comparés. |
| `archives/` | Itérations antérieures du dédale et du décrypteur. |

Répartition des 127 variantes : archives 42, ancien hub `dedale` 41, `MED` 41,
documents de rangement 2, page SpectroCrypt 1. Les versions et chemins internes
sont conservés pour permettre une comparaison ultérieure sans casser les références.

## Exécution et publication

Archive de référence, pas une application à remettre en production. Le hub PHP
historique écrit des fichiers JSON et utilise une authentification ancienne ;
il n'est pas activé par cet import. Les workflows actuels assemblent `apps/`,
les sons et `deploy/`, pas ce dossier d'archive.

Validation : copies et empreintes, conservation des originaux, neutralisation
des identifiants repérés, exclusion Git de la copie privée et examen du périmètre
de déploiement. Pas de test de jeu, audio ou serveur PHP historique.
