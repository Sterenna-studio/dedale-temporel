# Audit du rangement de l'atelier

Date de l'intervention : 17 août 2026  
Dossier audité : `C:\Users\pierr\Desktop\DONWLOAD\ATELIER`  
Nature de l'intervention : inventaire, classement et archivage sans suppression.

## État initial

La racine contenait les dossiers suivants :

- `decrypteur/`
- `dedale/`
- `dedale_dossier_complet/`
- `dedale_dossier_complet_v2/` à `dedale_dossier_complet_v7/`
- `MED/`, contenant treize variantes de l'imprimerie médicale

Total initial constaté : 1 242 fichiers.

## Analyse effectuée

- Le fichier `dedale/readme_installation.md` identifie `dedale/` comme le hub S.T.E.A.M. fusionné.
- `decrypteur/portemachine/` et `dedale/dedale/portemachine/` contenaient trois fichiers strictement identiques, vérifiés par empreinte SHA-256.
- MED `v7_8_2` et `v7_8_1_bg` contenaient 76 fichiers identiques sur 77. Seul `style.css` différait.
- MED `v7_8_2` a été retenue comme version autonome actuelle, car son numéro de version est le plus élevé.
- Le fichier `dedale/panini/missions/images/La dague du Roi Richard_old.jpg` a été conservé à sa place, car `missions.json` l'utilise encore.

## Déplacements réalisés

| Source initiale | Destination actuelle | Motif |
| --- | --- | --- |
| `dedale_dossier_complet/` | `archives/dedale_versions_anterieures/` | version antérieure |
| `dedale_dossier_complet_v2/` à `v7/` | `archives/dedale_versions_anterieures/` | versions antérieures |
| `decrypteur/` | `archives/projets_autonomes_integres/decrypteur/` | version autonome déjà intégrée |
| douze variantes MED antérieures | `MED/archives/` | versions antérieures |
| `MED/med_imprimerie_puzzle_v7_8_2 (1)/` | `MED/version_actuelle_v7_8_2/` | nettoyage du nom de la version actuelle |

Aucun fichier ni dossier n'a été supprimé.

## État final contrôlé

| Zone | Nombre de fichiers | Taille constatée |
| --- | ---: | ---: |
| `dedale/` | 219 | 45,41 Mo |
| `MED/version_actuelle_v7_8_2/` | 77 | 2,51 Mo |
| `MED/archives/` | 892 | 20,17 Mo |
| `archives/dedale_versions_anterieures/` | 50 | 14,65 Mo |
| `archives/projets_autonomes_integres/` | 4 | 0,06 Mo |

Le total après rangement était de 1 243 fichiers, dont le nouveau fichier `README_RANGEMENT.md`. L'ajout du présent rapport porte le total attendu à 1 244 fichiers.

## Vérifications techniques

- Point d'entrée `dedale/index.html` : présent.
- Point d'entrée MED actuel : présent dans `MED/version_actuelle_v7_8_2/med_imprimerie_puzzle_v7_6_2/index.html`.
- Point d'entrée du décrypteur archivé : présent.
- Dix fichiers JavaScript actifs contrôlés avec `node --check` : aucune erreur de syntaxe.
- Nombre de fichiers avant rangement, après déplacement et après ajout de la documentation : cohérent ; aucune perte constatée.

## Restauration manuelle

Pour revenir à l'organisation initiale :

1. déplacer les sept dossiers `dedale_dossier_complet*` depuis `archives/dedale_versions_anterieures/` vers la racine ;
2. déplacer `archives/projets_autonomes_integres/decrypteur/` vers la racine ;
3. déplacer les douze dossiers de `MED/archives/` vers `MED/` ;
4. renommer `MED/version_actuelle_v7_8_2/` en `MED/med_imprimerie_puzzle_v7_8_2 (1)/`.

Cette restauration ne nécessite aucune récupération de sauvegarde, puisque tous les éléments ont été conservés.

## Conclusion

Le rangement est terminé et contrôlé. La racine présente désormais les projets actifs, les versions antérieures sont regroupées dans des archives clairement nommées, et l'opération reste entièrement réversible.
