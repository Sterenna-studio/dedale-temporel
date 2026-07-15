# Dédale Temporel

Projet d'**escape game** sur le thème *cuivre / vapeur / temporel* (univers steampunk).
Le couloir des portes temporelles et ses salles-énigmes sont déployés sur
[`nitro.sterenna.fr/dedale`](https://nitro.sterenna.fr/dedale/) (convention Nitro apps).

## Arborescence

```text
apps/
├── corridor/         # Couloir des portes temporelles (hub)      → /dedale/
├── spectrocrypt/     # SpectroCrypt (décrypteur audio)           → /dedale/portemachine/
├── imprimerie/       # Puzzle Imprimerie Médicale                → /dedale/reliques/
├── salles/           # Salles-énigmes (briefing, cartographie, observatoire, archive, condamnee)
├── steam-clicker-wl/ # Salle des Engrenages (idle clicker vapeur) → /dedale/steam-clicker/
├── WORKPLATE/        # Atelier de Calibration (carnets d'agent)  → /dedale/workplate/
├── dispersion/       # Chambre de Dispersion (réseau de tuyaux)  → /dedale/dispersion/
└── panini/           # Salle des Vignettes (album de missions)    → /dedale/panini/
assets/
└── sfx/              # Pack de sons (ambiance, UI, portes)       → /dedale/sounds/
deploy/               # Gabarits de déploiement (page d'attente « salle en calibrage »)
archive/              # Anciennes itérations & variantes, non déployées
```

Chaque module déployé garde ses versions antérieures dans son propre `old.vers/`
(convention utilisée par `imprimerie`, `steam-clicker-wl`, `panini`) : jamais
publiées (exclues du build), mais conservées pour l'historique du projet.

## Modules

| Dossier | Description |
|---------|-------------|
| [`apps/corridor`](apps/corridor) | Cœur du dédale : labyrinthe de portes-temporelles avec console de saisie de codes, énigmes, notes et page d'admin (gardée par superuser Supabase). Config des portes : [`config/config.js`](apps/corridor/config/config.js). |
| [`apps/spectrocrypt`](apps/spectrocrypt) | **SpectroCrypt** — app web (vanilla JS) pour chiffrer/déchiffrer des messages cachés dans l'audio (SpectroGlyph, FSK + CRC-16) avec vue spectrogramme. Tests Jest. Seul `public/` est déployé. |
| [`apps/imprimerie`](apps/imprimerie) | Énigme « Imprimerie Médicale » : puzzle de pièces avec physique (inertie, collisions, snap), sons et reconstitution d'un code d'identification. |
| [`apps/salles`](apps/salles) | Salles-énigmes du scénario (briefing, cartographie, observatoire, archive, condamnée), chacune déployée sous `/dedale/<salle>/`. |
| [`apps/steam-clicker-wl`](apps/steam-clicker-wl) | **Salle des Engrenages** — idle clicker vapeur. Anciennes itérations dans `old.vers/`. |
| [`apps/WORKPLATE`](apps/WORKPLATE) | **Atelier de Calibration** — carnets de calibration et fiches de mission imprimables pour les agents. |
| [`apps/dispersion`](apps/dispersion) | **Chambre de Dispersion** — réseau de tuyaux reconfigurable (seul `index.html` est déployé). |
| [`apps/panini`](apps/panini) | **Salle des Vignettes** — album de missions à collectionner. Anciennes itérations dans `old.vers/`. |
| [`assets/sfx`](assets/sfx) | Pack de sons (ambiance, UI, portes, lore) MP3/WAV + mapping JSON. |
| [`deploy`](deploy) | Gabarits de déploiement Nitro (page d'attente). |
| [`archive`](archive) | Itérations & variantes conservées, **non déployées**. |

## Déploiement

`.github/workflows/deploy-nitro.yml` assemble couloir + salles + sons en un seul
arbre et le pousse via rsync SSH vers `~/nitro/dedale/`. Déclenché à chaque push
touchant l'un des dossiers déployés (voir `paths:` dans le workflow), `assets/sfx/sounds/**`
ou `deploy/**` — les `old.vers/` et le reste de `apps/panini/` en sont exclus.

| Porte | Source | URL |
|-------|--------|-----|
| Couloir | `apps/corridor` | `/dedale/` |
| Porte-Machine | `apps/spectrocrypt/public` | `/dedale/portemachine/` |
| Atelier des Reliques | `apps/imprimerie` (hors `old.vers/`) | `/dedale/reliques/` |
| Briefing · Cartographie · Observatoire · Archive · Couloir Bêta | `apps/salles/<salle>` | `/dedale/<salle>/` |
| Salle des Engrenages | `apps/steam-clicker-wl` (hors `old.vers/`) | `/dedale/steam-clicker/` |
| Atelier de Calibration | `apps/WORKPLATE` | `/dedale/workplate/` |
| Chambre de Dispersion | `apps/dispersion` (`index.html` seul) | `/dedale/dispersion/` |
| Salle des Vignettes | `apps/panini/steam_panini_hub_v2` | `/dedale/panini/` |

Le fil rouge (4 fragments → Sceau → Porte Condamnée) est décrit dans [`SCENARIO.md`](SCENARIO.md).
L'état de progression est partagé entre les pages via `localStorage` ([`apps/corridor/js/dedale-state.js`](apps/corridor/js/dedale-state.js)).

## Lancement local

Pages statiques : servir via un petit serveur local.

```bash
python -m http.server 8000   # puis http://localhost:8000/apps/corridor/
```

Pour **SpectroCrypt** (dépendances + tests) :

```bash
cd apps/spectrocrypt
npm install
npm run serve     # http://localhost:8000/public/
npm test          # tests Jest
```

> Le mode micro de SpectroCrypt nécessite HTTPS. La page admin du couloir requiert
> une session **superuser Supabase** (shared Nitro) et reste masquée sinon.

## Notes

- Chaque module a son propre `README.md`.
- `node_modules/` et `coverage/` ne sont pas versionnés (voir `.gitignore`).
