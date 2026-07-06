# ⚙️ S.T.E.A.M. Clicker — Évolution Finale

Clicker steampunk complet en **fichier unique autonome** (`index.html`).
Aucune dépendance externe hors Google Fonts.

---

## 🚀 Lancement

```bash
# Option 1 — direct navigateur
open index.html

# Option 2 — serveur local (recommandé)
npx serve .
# ou
python3 -m http.server 8080
```

---

## 🎮 Mécaniques

| Fonctionnalité | Détail |
|---|---|
| Engrenages | 7 tiers (Bronze → Quantique) |
| Anneaux orbitaux | +25% production par anneau, tier coloré |
| Artisans | 4 tiers · Confrérie (×3) · Quartier (×5) · Conglomérat (×10) |
| Boost manivelle | Jusqu'à 300% · décroissance automatique |
| Or | 5 taux d'échange vapeur → or |
| Achievements | 20 succès avec récompenses or |
| Quêtes | Journalières / Globales / Secrètes |
| Sauvegarde | `steamClickerSave` localStorage · auto toutes les 5s |

---

## ⌨️ Raccourcis clavier

| Touche | Action |
|---|---|
| `B` | Ouvrir/fermer la boutique |
| `A` | Ouvrir les succès |
| `Q` | Ouvrir les quêtes |
| `M` + molette ↑↓ | Contrôler le boost manivelle |

---

## 📁 Structure

```
steam-clicker/
├── index.html      ← jeu complet (HTML + CSS + JS inline)
├── README.md
├── .gitignore
└── setup-git.sh    ← script de push initial
```

---

## 🔧 Intégration Lab (Sterenna)

La sauvegarde utilise la clé `steamClickerSave` dans `localStorage`.
Pour brancher le système d'or partagé du lab :

```js
// Remplacer dans index.html :
state.gold += reward;

// Par :
import { addGold } from '../shared/economy.js';
await addGold(reward);
```

---

## 📊 Valeurs de référence

- Évolution engrenage : **9 gears** → 1 anneau + 1 gear tier supérieur
- Seuil Atelier : **10 000 000 vapeur**
- Taux or basique : **10 000 000 vapeur → 1 or**
- Boost max : **300%** (upgradable)

---

## 👨‍💻 Développement

**Phase 1** — Engrenages + boutique  
**Phase 2** — Mode Atelier + Artisans  
**Phase 3** — Répliques + Quêtes  
**Phase 4** — Finition + refactor standalone  

Statut : ✅ **Jouable**
