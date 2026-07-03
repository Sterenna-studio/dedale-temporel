// dedale-state.js
// État partagé du Dédale Temporel (progression mixte).
// localStorage est par-origine : toutes les pages servies sous nitro.sterenna.fr
// (couloir + salles /dedale/<salle>/) partagent le même état.
//
// Modèle :
//   {
//     briefing: boolean,
//     fragments: { "Σ": bool, "Λ": bool, "Ω": bool, "Δ": bool },
//     sceau: boolean
//   }

(function (global) {
  const KEY = "dedale_state_v1";

  // Métadonnées des 4 fragments du Sceau Temporel.
  const FRAGMENTS = [
    { sym: "Σ", name: "Signal Spectral", room: "Porte-Machine" },
    { sym: "Λ", name: "Ligne Temporelle", room: "Salle Cartographique" },
    { sym: "Ω", name: "Instant Figé", room: "Observatoire Synchronique" },
    { sym: "Δ", name: "Plaque d'Identité", room: "Atelier des Reliques" },
  ];
  const SYMS = FRAGMENTS.map((f) => f.sym);

  function defaults() {
    const fragments = {};
    SYMS.forEach((s) => (fragments[s] = false));
    return { briefing: false, fragments, sceau: false, inventory: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      const base = defaults();
      base.briefing = !!parsed.briefing;
      base.sceau = !!parsed.sceau;
      if (parsed.fragments) {
        SYMS.forEach((s) => (base.fragments[s] = !!parsed.fragments[s]));
      }
      if (parsed.inventory && typeof parsed.inventory === "object") {
        base.inventory = {};
        Object.keys(parsed.inventory).forEach((k) => {
          if (parsed.inventory[k]) base.inventory[k] = true;
        });
      }
      return base;
    } catch (e) {
      return defaults();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* mode privé / quota : on continue sans persistance */
    }
  }

  const DedaleState = {
    FRAGMENTS,
    SYMS,

    get() {
      return load();
    },

    // Briefing
    markBriefing() {
      const s = load();
      s.briefing = true;
      save(s);
      return s;
    },
    briefingDone() {
      return load().briefing === true;
    },

    // Fragments
    grant(sym) {
      if (SYMS.indexOf(sym) === -1) return load();
      const s = load();
      s.fragments[sym] = true;
      save(s);
      return s;
    },
    has(sym) {
      return load().fragments[sym] === true;
    },
    collected() {
      const f = load().fragments;
      return SYMS.filter((s) => f[s] === true);
    },
    count() {
      return this.collected().length;
    },
    allCollected() {
      return this.count() === SYMS.length;
    },

    // Sceau
    setSceau() {
      const s = load();
      if (SYMS.every((x) => s.fragments[x])) {
        s.sceau = true;
        save(s);
      }
      return s;
    },
    sceauDone() {
      return load().sceau === true;
    },

    // Inventaire (notes / indices trouvés dans le couloir)
    findItem(id) {
      if (!id) return load();
      const s = load();
      s.inventory[id] = true;
      save(s);
      return s;
    },
    hasItem(id) {
      return load().inventory[id] === true;
    },
    foundItems() {
      return Object.keys(load().inventory);
    },
    inventoryCount() {
      return this.foundItems().length;
    },

    reset() {
      save(defaults());
    },
  };

  global.DedaleState = DedaleState;
})(window);
