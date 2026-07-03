# Dédale Temporel — Scénario

Référence narrative et logique du jeu. Sert de cahier des charges pour construire
les salles (`apps/corridor` + salles déployées sous `/dedale/<salle>/`).

## Pitch

Un agent **S.T.E.A.M.** explore le dédale pour reconstituer le **Sceau Temporel**.
Le sceau est éclaté en **4 fragments** disséminés dans les salles. Une fois les
fragments réunis, l'**Archive** assemble le Sceau — qui déverrouille la **Porte
Condamnée**, salle secrète où se joue la révélation finale.

## Structure — progression *mixte*

```text
        ┌─────────────┐
        │  BRIEFING   │  (imposé en premier — donne la mission)
        └──────┬──────┘
               │ débloque l'exploration libre
   ┌───────────┼───────────┬───────────────┐
   ▼           ▼           ▼               ▼
PORTE-      CARTO-     OBSERVA-        ATELIER DES
MACHINE     GRAPHIE    TOIRE          RELIQUES
(frag Σ)    (frag Λ)   (frag Ω)       (frag Δ)
   └───────────┴─────┬─────┴───────────────┘
                     ▼
              ┌─────────────┐
              │   ARCHIVE    │  (requiert les 4 fragments)
              │  → SCEAU     │
              └──────┬───────┘
                     ▼
            ┌──────────────────┐
            │ PORTE CONDAMNÉE   │  (déverrouillée par le Sceau)
            │  → révélation     │
            └──────┬───────────┘
                   ▼
                SORTIE → steamescape.fr/limoges
```

**Règles de progression**
1. **Briefing** est la seule salle ouverte au départ. La terminer arme l'exploration.
2. **Porte-Machine, Cartographie, Observatoire, Reliques** : accessibles librement,
   dans n'importe quel ordre. Chacune livre **un fragment** indépendant.
3. **Archive** : verrouillée tant que les **4 fragments** ne sont pas collectés.
   Elle les assemble → révèle le **Sceau Temporel**.
4. **Porte Condamnée** : reste grisée jusqu'à obtention du Sceau, puis s'ouvre
   sur la salle secrète (révélation finale).
5. **Sortie** : disponible après la révélation.

## Salles — spécification

| Salle | Thème | Mécanique | Produit |
|-------|-------|-----------|---------|
| **Briefing** | Mémoire des missions | Lore + ordre de mission ; révèle la liste des 4 fragments à trouver | Arme l'exploration |
| **Porte-Machine** (SpectroCrypt) | Décrypteur spectral | Décoder le message caché dans l'audio | **Fragment Σ** |
| **Cartographie** | Atlas des lignes temporelles | Relier / placer une coordonnée sur l'atlas | **Fragment Λ** |
| **Observatoire** | Fenêtres sur les instants | « Observer » un instant → scène figée révélant un signe | **Fragment Ω** |
| **Atelier des Reliques** (Imprimerie) | Objets hors-temps | Reconstituer la plaque d'identification (puzzle pièces) | **Fragment Δ** |
| **Archive** | Dossiers effacés | Saisir les 4 fragments → l'effacement laisse apparaître le Sceau | **Sceau Temporel** |
| **Porte Condamnée** | Branche scellée | Déverrouillée par le Sceau → révélation finale | Fin |

> Les valeurs exactes des fragments (Σ Λ Ω Δ) et du Sceau seront figées lors de la
> construction de chaque salle, en fonction de la sortie réelle de chaque énigme
> (message décodé SpectroCrypt, séquence de symboles de l'Imprimerie, etc.).

## Codes — état actuel vs cible

Chaque porte accepte un code = son nom (`briefing`, `cartographie`…). Ces codes
ne s'inventent pas : ils se **trouvent**. Des **notes d'agents** oubliées sont
disséminées dans le couloir (posées au sol, de côté). Les ramasser révèle le code
d'une salle et les range dans le **Carnet de bord** (inventaire local persistant,
`localStorage`), reconsultable à tout moment.

- Catalogue des indices : [`apps/corridor/js/clues.js`](apps/corridor/js/clues.js)
- Inventaire : `DedaleState.findItem / foundItems` dans
  [`dedale-state.js`](apps/corridor/js/dedale-state.js)

La **progression** repose ensuite sur les **fragments** collectés (et non sur les noms).

| Porte | Code d'accès (inchangé) | Rôle dans le fil rouge |
|-------|-------------------------|------------------------|
| Briefing | `briefing` | point de départ, arme l'exploration |
| Porte-Machine | `portemachine` | rend le Fragment Σ |
| Cartographie | `cartographie` / `atlas` | rend le Fragment Λ |
| Observatoire | `observatoire` | rend le Fragment Ω |
| Reliques | `reliques` | rend le Fragment Δ |
| Archive | `archive` + **4 fragments** | assemble le Sceau |
| Condamnée | *(pas de code)* | s'ouvre via le Sceau |

## Notes d'implémentation (pour la phase de build)

- **Suivi des fragments** : stocker la collecte (ex. `localStorage` `dedale_fragments`)
  pour que l'état persiste entre les salles servies sous des sous-chemins différents.
  Le retour au couloir lit cet état pour débloquer Archive / Condamnée.
- **Archive** : la console n'accepte le code `archive` que si les 4 fragments sont présents ;
  sinon message « dossiers encore illisibles — fragments manquants ».
- **Porte Condamnée** : `type: "locked"` tant que le Sceau n'est pas obtenu ; bascule
  en accessible (révélation) une fois le Sceau en mémoire.
- **Briefing-gate** : les 4 salles de fragments restent grisées tant que Briefing
  n'a pas été visité (drapeau `dedale_briefing_done`).
- Ces règles impliquent des évolutions de `apps/corridor/js/main.js` (gestion d'état)
  en plus du contenu de chaque salle.

## Ordre de construction suggéré

1. **Briefing** (pilote de style + pose le gate d'exploration)
2. **Cartographie** ou **Observatoire** (salle-énigme « fragment » modèle)
3. Réplique sur les 2 autres salles de fragments
4. **Archive** (assemblage du Sceau)
5. **Porte Condamnée** (révélation finale) + branchement Sortie
6. Câblage de l'état (`main.js`) au fil de l'eau
