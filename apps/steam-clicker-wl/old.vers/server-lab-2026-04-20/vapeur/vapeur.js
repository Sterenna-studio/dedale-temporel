/*
 * Vapeur Clicker Minimal
 *
 * Ce script propose une version simplifiée du jeu S.T.E.A.M. Clicker. Il conserve les
 * mécaniques essentielles (achat d'engrenages et d'artisans, production automatique,
 * conversion des engrenages en anneaux) tout en offrant une interface minimaliste.
 * Les données sont stockées dans le même emplacement de sauvegarde que la version
 * complète afin de garantir la compatibilité des saves. Les valeurs affichées
 * restent cohérentes avec la progression existante.
 */

// Définition des types d'engrenages.
// Ces valeurs sont basées sur le fichier "donnée clicker.js" afin de
// rester cohérents avec la version complète. Les chemins SVG pointent
// vers les ressources de lab/clicker afin d'éviter la duplication des
// icônes. Chaque objet contient :
// - id        : identifiant interne
// - name      : nom de l'engrenage
// - cost      : coût en vapeur pour acheter un engrenage
// - production: vapeur produite par cet engrenage par seconde (avant bonus)
// - tier      : niveau de l'engrenage (sert pour les anneaux)
// - description: bref texte descriptif (facultatif)
// - material  : type de matériau (pour des extensions ultérieures)
// - color     : couleur d'accent (non utilisé ici)
// - svg       : chemin relatif vers l'icône
const GEAR_TYPES = [
    { id: 1, name: "Engrenage Bronze",    cost: 100,         production: 1,     tier: 1, description: "Mécanisme de base • Alliage rustique", material: "bronze",   color: "#cd7f32", svg: "../clicker/assets/gear_1.svg" },
    { id: 2, name: "Engrenage Fer",       cost: 1000,        production: 5,     tier: 2, description: "Mécanisme renforcé • Résistance accrue", material: "iron",     color: "#708090", svg: "../clicker/assets/gear_2.svg" },
    { id: 3, name: "Engrenage Acier",     cost: 10000,       production: 25,    tier: 3, description: "Système avancé • Précision industrielle", material: "steel",    color: "#4682b4", svg: "../clicker/assets/gear_3.svg" },
    { id: 4, name: "Turbine Titanium",    cost: 100000,      production: 50,    tier: 4, description: "Technologie haute performance • Alliage spatial", material: "titanium", color: "#c0c0c0", svg: "../clicker/assets/gear_4.svg" },
    { id: 5, name: "Générateur Aether",   cost: 1000000,     production: 100,   tier: 5, description: "Manipulation éthérée • Énergie mystique", material: "aether",  color: "#9370db", svg: "../clicker/assets/gear_5.svg" },
    { id: 6, name: "Réacteur Plasma",     cost: 10000000,    production: 500,   tier: 6, description: "Fusion énergétique • État plasma maîtrisé", material: "plasma",   color: "#ff69b4", svg: "../clicker/assets/gear_6.svg" },
    { id: 7, name: "Processeur Quantique",cost: 1000000000,  production: 1000,  tier: 7, description: "Réalité altérée • Mécanique quantique", material: "quantum", color: "#00ffff", svg: "../clicker/assets/gear_7.svg" }
];

// Définition des artisans : chaque artisan fabrique des engrenages de son tier.
// Les coûts et tiers sont basés sur "donnée clicker.js". Le champ production n'est
// pas stocké ici car la production réelle dépend du nombre d'artisans et des
// multiplicateurs de bâtiments. L'icône est partagée par tous les artisans.
const ARTISAN_TYPES = [
    {
        id: 1,
        tier: 1,
        name: "Apprenti Vapeur",
        baseCost: 5000000000,
        gearCostType: 1,
        gearCostAmount: 3,
        svg: "../clicker/assets/artisan.svg",
        description: "Optimise les mécanismes basiques"
    },
    {
        id: 2,
        tier: 2,
        name: "Forgeron Maître",
        baseCost: 50000000000,
        gearCostType: 2,
        gearCostAmount: 3,
        svg: "../clicker/assets/artisan.svg",
        description: "Maintient les équipements avancés"
    },
    {
        id: 3,
        tier: 3,
        name: "Ingénieur Turbine",
        baseCost: 500000000000,
        gearCostType: 3,
        gearCostAmount: 3,
        svg: "../clicker/assets/artisan.svg",
        description: "Spécialiste en efficacité énergétique"
    },
    {
        id: 4,
        tier: 4,
        name: "Technicien Quantique",
        baseCost: 5000000000000,
        gearCostType: 4,
        gearCostAmount: 3,
        svg: "../clicker/assets/artisan.svg",
        description: "Maîtrise les technologies avancées"
    }
];

// Coût pour convertir des engrenages en anneaux (nombre d'engrenages nécessaires).
// La conversion se fait par paquets de 9 engrenages, conformément à la logique
// améliorée du clicker complet (triade de 9). Changer cette valeur pour 10 si
// vous souhaitez revenir à la conversion classique.  
const EVOLUTION_COST = 9;

// Facteurs de regroupement pour les artisans (confrérie, quartier, conglomérat).
// Ces multiplicateurs s'appuient désormais sur les nouvelles définitions du
// jeu original : ×3 pour chaque confrérie (9 artisans), ×5 pour chaque quartier
// (3 confréries) et ×10 pour chaque conglomérat (3 quartiers). Les multiplicateurs
// s'appliquent de manière multiplicative sur le nombre d'artisans.
const GROUP_FACTORS = {
    brotherhood: 3,
    district: 5,
    conglomerate: 10
};

// Facteurs d'achat global pour permettre l'achat en masse.
// Les valeurs ont été ajustées pour refléter les données de base modifiées.
// Le joueur peut désormais cycler entre ×1, ×5, ×10, ×50 et ×100.
const BUY_FACTORS = [1, 5, 10, 50, 100];

// Pourcentage de bonus de vapeur octroyé par chaque anneau (25% = 0.25 par anneau).
// Ce paramètre est partagé avec la version complète afin de calculer la production
// unitaire des engrenages en tenant compte des anneaux. Le calcul final se fait
// dans updateGearList().
const RING_BONUS_PERCENTAGE = 25;

// Données pour les conversions d'or. Ces éléments sont importés depuis "donnée clicker.js"
// et offrent différentes options pour échanger de la vapeur contre de l'or.
const GOLD_EXCHANGE_RATES = [
    { id: 1, steamCost: 10000000,       goldReward: 1,     name: "Conversion Basique",   description: "Échange standard • Taux de base" },
    { id: 2, steamCost: 100000000,      goldReward: 12,    name: "Conversion Groupée",  description: "Échange en volume • +20% bonus" },
    { id: 3, steamCost: 1000000000,     goldReward: 150,   name: "Conversion Premium",  description: "Échange de maître • +50% bonus" },
    { id: 4, steamCost: 10000000000,    goldReward: 2000,  name: "Conversion VIP",      description: "Échange de grand maître • +100% bonus" },
    { id: 5, steamCost: 1000000000000,  goldReward: 250000,name: "Conversion Gobelin",    description: "Échange de grand maître • +100% bonus" }
];

// État initial du jeu
let rawSaveData = null;

let gameState = {
    steam: 0,
    steamTotal: 0,
    steamPerSecond: 0,
    gears: {},
    artisans: {},
    rings: {},
    artisanCraftBuffer: {},
    totalResets: 0,
    buyFactorIndex: 0
    , gold: 0
    , autoConvert: {} // gestion de la conversion automatique pour chaque id d'engrenage
    , currentBoost: 0 // boost actuel en pourcentage (affichable)
    , crankPower: 0    // inertie ou puissance de la manivelle (affichage uniquement)
};

// Chargement de l'état du jeu à partir du localStorage
function loadGameState() {
    try {
        const saved = localStorage.getItem('steamClickerSave');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Conserve la sauvegarde brute pour ne pas perdre des champs inconnus utilisés dans la version complète
            rawSaveData = parsed;
            gameState.steam = parsed.steam || 0;
            gameState.steamTotal = parsed.steamTotal || parsed.steam || 0;
            gameState.gears = parsed.gears || {};
            gameState.artisans = parsed.artisans || {};
            gameState.rings = parsed.rings || {};
            gameState.totalResets = parsed.totalResets || 0;
            gameState.buyFactorIndex = parsed.buyFactorIndex || 0;
            gameState.gold = parsed.gold || 0;
            gameState.autoConvert = parsed.autoConvert || {};
            gameState.currentBoost = parsed.currentBoost || 0;
            gameState.crankPower = parsed.crankPower || 0;
        }
    } catch (error) {
        console.warn('Impossible de charger la sauvegarde :', error);
    }
}

// Sauvegarde de l'état du jeu dans le localStorage
function saveGameState() {
    try {
        // On fusionne nos champs dans la sauvegarde brute pour conserver les données additionnelles
        const base = rawSaveData || {};
        const merged = {
            ...base,
            steam: gameState.steam,
            steamTotal: gameState.steamTotal,
            gears: gameState.gears,
            artisans: gameState.artisans,
            rings: gameState.rings,
            totalResets: gameState.totalResets,
            buyFactorIndex: gameState.buyFactorIndex,
            gold: gameState.gold,
            autoConvert: gameState.autoConvert,
            currentBoost: gameState.currentBoost,
            crankPower: gameState.crankPower
        };
        localStorage.setItem('steamClickerSave', JSON.stringify(merged));
        // Met à jour la sauvegarde brute locale pour les prochaines modifications
        rawSaveData = merged;
    } catch (error) {
        console.warn('Impossible de sauvegarder :', error);
    }
}

// Formatage de grands nombres pour l'affichage (K, M, B, T, …)
function formatNumber(value) {
    /**
     * Convertit un nombre en chaîne lisible avec suffixes.
     * Supporte des valeurs bien au-delà de 10^33 en utilisant une liste étendue de suffixes.
     * Les suffixes sont basés sur des abréviations usuelles (Qa = Quadrillion, Qi = Quintillion, etc.) et
     * continuent avec des variantes latines pour éviter d'afficher des exposants bruts.
     */
    const num = Number(value);
    if (!isFinite(num)) return '0';
    if (Math.abs(num) < 1000) return Math.floor(num).toString();
    // Liste étendue de suffixes pour les nombres très grands.
    // Indices : 10^0 → '', 10^3 → 'K', 10^6 → 'M', 10^9 → 'B', 10^12 → 'T', etc.
    const suffixes = [
        '', 'K', 'M', 'B', 'T',
        'Qa', // Quadrillion (10^15)
        'Qi', // Quintillion (10^18)
        'Sx', // Sextillion (10^21)
        'Sp', // Septillion (10^24)
        'Oc', // Octillion (10^27)
        'No', // Nonillion (10^30)
        'Dc', // Decillion (10^33)
        'Ud', // Undecillion (10^36)
        'Dd', // Duodecillion (10^39)
        'Td', // Tredecillion (10^42)
        'Qad', // Quattuordecillion (10^45)
        'Qid', // Quindecillion (10^48)
        'Sxd', // Sexdecillion (10^51)
        'Spd', // Septendecillion (10^54)
        'Ocd', // Octodecillion (10^57)
        'Nod', // Novemdecillion (10^60)
        'Vg', // Vigintillion (10^63)
        'Uv', // Unvigintillion (10^66)
        'Dv', // Duovigintillion (10^69)
        'Tv', // Tresvigintillion (10^72)
        'Qav', // Quattuorvigintillion (10^75)
        'Qiv', // Quinvigintillion (10^78)
        'Sxv', // Sexvigintillion (10^81)
        'Spv', // Septenvigintillion (10^84)
        'Ocv', // Octovigintillion (10^87)
        'Nov'  // Novemvigintillion (10^90)
    ];
    let n = Math.abs(num);
    let idx = 0;
    while (n >= 1000 && idx < suffixes.length - 1) {
        n /= 1000;
        idx++;
    }
    const sign = num < 0 ? '-' : '';
    return sign + n.toFixed(2) + suffixes[idx];
}

// Récupère le facteur d'achat actuel
function getBuyFactor() {
    return BUY_FACTORS[gameState.buyFactorIndex % BUY_FACTORS.length];
}

// Met à jour l'indicateur du facteur d'achat dans l'interface
function updateBuyFactorUI() {
    const btn = document.getElementById('buyFactorBtn');
    if (btn) {
        btn.textContent = '×' + getBuyFactor();
    }
}

// Fait passer le facteur d'achat à la valeur suivante
function cycleBuyFactor() {
    gameState.buyFactorIndex = (gameState.buyFactorIndex + 1) % BUY_FACTORS.length;
    updateBuyFactorUI();
    saveGameState();
}

// Calcule la production totale de vapeur par seconde basée sur les engrenages possédés
function calculateSteamProduction() {
    let totalSteam = 0;
    for (const gear of GEAR_TYPES) {
        const count = gameState.gears[gear.id] || 0;
        totalSteam += count * gear.production;
    }
    // Applique le boost de la manivelle (currentBoost exprimé en pourcentage) :
    // Un boost de 0 signifie aucune augmentation ; 100 signifie ×2.
    const boostMultiplier = 1 + ((gameState.currentBoost || 0) / 100);
    gameState.steamPerSecond = totalSteam * boostMultiplier;
}

// Produit des engrenages grâce aux artisans (avec multiplicateurs)
function processArtisanCrafting(dt = 1) {
    for (const art of ARTISAN_TYPES) {
        const tier = art.tier;
        const count = gameState.artisans[art.id] || 0;
        if (count <= 0) continue;
        // Calcul des groupes (non destructif)
        const brotherhoods = Math.floor(count / 9);
        const districts = Math.floor(brotherhoods / 3);
        const congloms = Math.floor(districts / 3);
        let multiplier = 1;
        if (brotherhoods > 0) multiplier *= Math.pow(GROUP_FACTORS.brotherhood, brotherhoods);
        if (districts > 0) multiplier *= Math.pow(GROUP_FACTORS.district, districts);
        if (congloms > 0) multiplier *= Math.pow(GROUP_FACTORS.conglomerate, congloms);
        const craftRate = count * multiplier;
        if (!gameState.artisanCraftBuffer[tier]) {
            gameState.artisanCraftBuffer[tier] = 0;
        }
        gameState.artisanCraftBuffer[tier] += craftRate * dt;
        const whole = Math.floor(gameState.artisanCraftBuffer[tier]);
        if (whole > 0) {
            gameState.artisanCraftBuffer[tier] -= whole;
            const gear = GEAR_TYPES.find(g => g.tier === tier);
            if (gear) {
                gameState.gears[gear.id] = (gameState.gears[gear.id] || 0) + whole;
            }
        }
    }
}

// Convertit les engrenages en anneaux dès qu'un multiple de EVOLUTION_COST est atteint
function convertGearsToRings() {
    // Parcourt chaque type d'engrenage et convertit tous les paquets disponibles
    // sauf si l'auto-conversion est explicitement désactivée pour cet id.
    for (const gear of GEAR_TYPES) {
        const gearId = gear.id;
        const count = gameState.gears[gearId] || 0;
        // Vérifie si l'auto-conversion est permise pour ce gear
        const auto = gameState.autoConvert[gearId];
        if (auto === false) continue;
        const packs = Math.floor(count / EVOLUTION_COST);
        if (packs > 0) {
            gameState.gears[gearId] = count - packs * EVOLUTION_COST;
            if (gameState.gears[gearId] <= 0) delete gameState.gears[gearId];
            const tier = gear.tier;
            gameState.rings[tier] = (gameState.rings[tier] || 0) + packs;
        }
    }
}

// Conversion manuelle : convertit tous les engrenages en anneaux, en ignorant l'état d'auto-conversion
function convertAllGears() {
    for (const gear of GEAR_TYPES) {
        const gearId = gear.id;
        const count = gameState.gears[gearId] || 0;
        const packs = Math.floor(count / EVOLUTION_COST);
        if (packs > 0) {
            gameState.gears[gearId] = count - packs * EVOLUTION_COST;
            if (gameState.gears[gearId] <= 0) delete gameState.gears[gearId];
            const tier = gear.tier;
            gameState.rings[tier] = (gameState.rings[tier] || 0) + packs;
        }
    }
    calculateSteamProduction();
    updateDisplay();
    saveGameState();
}

// Active ou désactive la conversion automatique pour un type d'engrenage
function toggleAutoConvert(gearId) {
    // Par défaut, autoConvert est undefined ou true. Passer à false pour désactiver,
    // true pour activer.
    const current = gameState.autoConvert[gearId];
    if (current === false) {
        // réactive
        gameState.autoConvert[gearId] = true;
    } else {
        // désactive si null ou true
        gameState.autoConvert[gearId] = false;
    }
    updateGearList();
    saveGameState();
}

// Met à jour l'affichage de la liste des engrenages
function updateGearList() {
    const gearList = document.getElementById('gearList');
    if (!gearList) return;
    gearList.innerHTML = '';
    for (const gear of GEAR_TYPES) {
        const count = gameState.gears[gear.id] || 0;
        const ringCount = gameState.rings[gear.tier] || 0;
        // Calcul du multiplicateur d'anneaux et de boost
        const ringMultiplier = 1 + (ringCount * (RING_BONUS_PERCENTAGE / 100));
        // Production unitaire après anneaux, sans boost
        const unitAfterRing = gear.production * ringMultiplier;
        // Multiplicateur de boost actuel (exprimé en pourcentage)
        const boostMultiplier = 1 + (gameState.currentBoost || 0) / 100;
        // Production unitaire finale après anneaux et boost
        const unitAfterBoost = unitAfterRing * boostMultiplier;
        const totalProduction = unitAfterBoost * count;
        const auto = gameState.autoConvert[gear.id] !== false; // true par défaut
        const li = document.createElement('li');
        li.className = 'item-row';
        // Définition d'une info-bulle pour détailler les calculs
        const tooltip = `Base: ${gear.production}/s\nAnneaux: ×${ringMultiplier.toFixed(2)} → ${unitAfterRing.toFixed(2)}/s\nBoost: ×${boostMultiplier.toFixed(2)} → ${unitAfterBoost.toFixed(2)}/s`;
        li.innerHTML = `
            <div class="item-info">
                <img src="${gear.svg}" alt="${gear.name}" title="${gear.description || gear.name}">
                <div>
                    <div><strong>${gear.name}</strong></div>
                    <div class="small-text">${formatNumber(count)} engrenages</div>
                    <div class="extra-text">Anneaux : ${formatNumber(unitAfterRing.toFixed(2))}/s</div>
                    <div class="extra-text">Boost : ${formatNumber(unitAfterBoost.toFixed(2))}/s</div>
                </div>
            </div>
            <div class="item-actions">
                <div class="small-text">${formatNumber(totalProduction.toFixed(2))} /s</div>
                <button class="buy-btn" data-gear-id="${gear.id}">Acheter ×${getBuyFactor()}</button>
                <button class="auto-btn" data-gear-id="${gear.id}">${auto ? 'Auto: ON' : 'Auto: OFF'}</button>
            </div>`;
        // Ajoute un title pour afficher les détails au survol
        li.title = tooltip;
        gearList.appendChild(li);
    }
    // Attache les écouteurs pour les boutons
    gearList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-gear-id'));
            buyGear(id);
        });
    });
    gearList.querySelectorAll('.auto-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-gear-id'));
            toggleAutoConvert(id);
            e.stopPropagation();
        });
    });
}

// Met à jour l'affichage de la liste des structures (confréries, quartiers, conglomérats)
function updateStructureList() {
    const structureList = document.getElementById('structureList');
    if (!structureList) return;
    structureList.innerHTML = '';
    // Pour chaque type d'artisan, calcule les regroupements
    for (const art of ARTISAN_TYPES) {
        const count = gameState.artisans[art.id] || 0;
        if (count <= 0) continue;
        const brotherhoods = Math.floor(count / 9);
        const districts = Math.floor(brotherhoods / 3);
        const congloms = Math.floor(districts / 3);
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <div class="item-info">
                <strong>Tier ${art.tier}</strong>
                <div class="small-text">${formatNumber(count)} artisans</div>
            </div>
            <div class="item-actions">
                <div class="small-text">Cfr: ${brotherhoods}, Qt: ${districts}, Cg: ${congloms}</div>
            </div>`;
        structureList.appendChild(li);
    }
}

// Met à jour l'affichage de la boutique d'or
function updateGoldList() {
    const goldList = document.getElementById('goldList');
    if (!goldList) return;
    goldList.innerHTML = '';
    for (const exch of GOLD_EXCHANGE_RATES) {
        const li = document.createElement('li');
        li.className = 'item-row';
        const affordable = gameState.steam >= exch.steamCost;
        li.innerHTML = `
            <div class="item-info">
                <div><strong>${exch.name}</strong></div>
                <div class="small-text">${exch.description}</div>
            </div>
            <div class="item-actions">
                <div class="small-text">${formatNumber(exch.steamCost)} vapeur → +${exch.goldReward} or</div>
                <button class="gold-buy-btn" data-exchange-id="${exch.id}" ${affordable ? '' : 'disabled'}>Acheter</button>
            </div>`;
        goldList.appendChild(li);
    }
    // Attache les écouteurs
    goldList.querySelectorAll('.gold-buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-exchange-id'));
            buyGold(id);
        });
    });
}

// Achète une conversion d'or
function buyGold(exchangeId) {
    const exch = GOLD_EXCHANGE_RATES.find(x => x.id === exchangeId);
    if (!exch) return;
    if (gameState.steam >= exch.steamCost) {
        gameState.steam -= exch.steamCost;
        gameState.steamTotal += exch.steamCost;
        gameState.gold = (gameState.gold || 0) + exch.goldReward;
        updateDisplay();
        saveGameState();
    }
}

// Met à jour l'affichage de la liste des artisans
function updateArtisanList() {
    const artisanList = document.getElementById('artisanList');
    if (!artisanList) return;
    artisanList.innerHTML = '';
    for (const art of ARTISAN_TYPES) {
        const count = gameState.artisans[art.id] || 0;
        // Calcul du multiplicateur non destructif (mêmes règles que dans processArtisanCrafting)
        const brotherhoods = Math.floor(count / 9);
        const districts = Math.floor(brotherhoods / 3);
        const congloms = Math.floor(districts / 3);
        let multiplier = 1;
        if (brotherhoods > 0) multiplier *= Math.pow(GROUP_FACTORS.brotherhood, brotherhoods);
        if (districts > 0) multiplier *= Math.pow(GROUP_FACTORS.district, districts);
        if (congloms > 0) multiplier *= Math.pow(GROUP_FACTORS.conglomerate, congloms);
        // Base craft rate = 1 gear/sec per artisan
        const baseCraft = count;
        const totalCraft = count * multiplier;
        const li = document.createElement('li');
        li.className = 'item-row';
        // Construire un tooltip détaillant les étapes de calcul
        const tipParts = [];
        tipParts.push(`Base : ${baseCraft} gear/s`);
        if (brotherhoods > 0) {
            tipParts.push(`Confréries : ×${GROUP_FACTORS.brotherhood}^${brotherhoods}`);
        }
        if (districts > 0) {
            tipParts.push(`Quartiers : ×${GROUP_FACTORS.district}^${districts}`);
        }
        if (congloms > 0) {
            tipParts.push(`Conglomérats : ×${GROUP_FACTORS.conglomerate}^${congloms}`);
        }
        tipParts.push(`Total : ×${multiplier.toFixed(2)} → ${totalCraft.toFixed(2)} gears/s`);
        const tip = tipParts.join('\n');
        li.innerHTML = `
            <div class="item-info">
                <img src="${art.svg}" alt="${art.name}" title="${art.description || art.name}">
                <div>
                    <div><strong>${art.name}</strong></div>
                    <div class="small-text">${formatNumber(count)} artisans</div>
                    <div class="extra-text">Mult. : ×${multiplier.toFixed(2)}</div>
                    <div class="extra-text">Prod : ${formatNumber(totalCraft.toFixed(2))} gears/s</div>
                </div>
            </div>
            <div class="item-actions">
                <button class="buy-btn" data-artisan-id="${art.id}">Acheter ×${getBuyFactor()}</button>
            </div>`;
        // Attache un titre détaillé pour ce tier
        li.title = tip;
        artisanList.appendChild(li);
    }
    artisanList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-artisan-id'));
            buyArtisan(id);
        });
    });
}

// Met à jour l'affichage global (vapeur, production, listes)
function updateDisplay() {
    const steamEl = document.getElementById('steamValue');
    const prodEl = document.getElementById('productionValue');
    const goldEl = document.getElementById('goldValue');
    const boostEl = document.getElementById('boostDisplay');
    const crankEl = document.getElementById('crankDisplay');
    if (steamEl) steamEl.textContent = formatNumber(gameState.steam);
    if (prodEl) prodEl.textContent = formatNumber(gameState.steamPerSecond);
    if (goldEl) goldEl.textContent = formatNumber(gameState.gold || 0);
    if (boostEl) boostEl.textContent = 'Boost : ' + (gameState.currentBoost || 0).toFixed(0) + ' %';
    if (crankEl) crankEl.textContent = '🔄 ' + (gameState.crankPower || 0).toFixed(0);
    updateGearList();
    updateArtisanList();
    updateStructureList();
    updateGoldList();
}

// Achat d'engrenages
function buyGear(id) {
    const gear = GEAR_TYPES.find(g => g.id === id);
    if (!gear) return;
    const factor = getBuyFactor();
    let qty = factor;
    const maxAffordable = Math.floor(gameState.steam / gear.cost);
    if (maxAffordable < 1) return;
    if (maxAffordable < qty) qty = maxAffordable;
    const totalCost = gear.cost * qty;
    gameState.steam -= totalCost;
    gameState.steamTotal += totalCost;
    gameState.gears[id] = (gameState.gears[id] || 0) + qty;
    calculateSteamProduction();
    updateDisplay();
    saveGameState();
}

// Achat d'artisans
function buyArtisan(id) {
    const art = ARTISAN_TYPES.find(a => a.id === id);
    if (!art) return;
    let qty = getBuyFactor();
    let purchased = 0;
    for (let i = 0; i < qty; i++) {
        const steamCost = art.baseCost;
        const gearCostId = art.gearCostType;
        const gearCostAmount = art.gearCostAmount;
        if (gameState.steam >= steamCost && (gameState.gears[gearCostId] || 0) >= gearCostAmount) {
            gameState.steam -= steamCost;
            gameState.steamTotal += steamCost;
            gameState.gears[gearCostId] -= gearCostAmount;
            if (gameState.gears[gearCostId] <= 0) delete gameState.gears[gearCostId];
            purchased++;
        } else {
            break;
        }
    }
    if (purchased > 0) {
        gameState.artisans[id] = (gameState.artisans[id] || 0) + purchased;
        updateDisplay();
        saveGameState();
    }
}

// Export de la sauvegarde en fichier JSON
function exportSave() {
    const data = {
        steam: gameState.steam,
        steamTotal: gameState.steamTotal,
        gears: gameState.gears,
        artisans: gameState.artisans,
        rings: gameState.rings,
        totalResets: gameState.totalResets,
        buyFactorIndex: gameState.buyFactorIndex
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vapeur_save.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Import d'une sauvegarde
function importSaveFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            gameState.steam = data.steam || 0;
            gameState.steamTotal = data.steamTotal || data.steam || 0;
            gameState.gears = data.gears || {};
            gameState.artisans = data.artisans || {};
            gameState.rings = data.rings || {};
            gameState.totalResets = data.totalResets || 0;
            gameState.buyFactorIndex = data.buyFactorIndex || 0;
            calculateSteamProduction();
            updateDisplay();
            saveGameState();
        } catch (error) {
            console.warn('Erreur lors de l\'importation :', error);
        }
    };
    reader.readAsText(file);
}

// Remboursement complet : convertit tout en vapeur et vide les inventaires
function refundAll() {
    let refund = 0;
    // Rembourse engrenages
    for (const gear of GEAR_TYPES) {
        const count = gameState.gears[gear.id] || 0;
        if (count > 0) {
            refund += count * gear.cost;
            gameState.gears[gear.id] = 0;
        }
    }
    // Rembourse anneaux
    for (const tier in gameState.rings) {
        const ringCount = gameState.rings[tier];
        if (ringCount > 0) {
            const gear = GEAR_TYPES.find(g => g.tier === parseInt(tier));
            if (gear) {
                refund += ringCount * EVOLUTION_COST * gear.cost;
            }
            gameState.rings[tier] = 0;
        }
    }
    // Rembourse artisans
    for (const art of ARTISAN_TYPES) {
        const count = gameState.artisans[art.id] || 0;
        if (count > 0) {
            refund += count * art.baseCost;
            // On restitue aussi les engrenages consommés lors de l'achat
            const gearId = art.gearCostType;
            const gearAmt = art.gearCostAmount * count;
            gameState.gears[gearId] = (gameState.gears[gearId] || 0) + gearAmt;
            gameState.artisans[art.id] = 0;
        }
    }
    gameState.steam += refund;
    calculateSteamProduction();
    updateDisplay();
    saveGameState();
}

// Réinitialise complètement la sauvegarde
function resetSave() {
    gameState.steam = 0;
    gameState.steamTotal = 0;
    gameState.gears = {};
    gameState.artisans = {};
    gameState.rings = {};
    gameState.artisanCraftBuffer = {};
    gameState.totalResets = (gameState.totalResets || 0) + 1;
    gameState.buyFactorIndex = 0;
    calculateSteamProduction();
    updateDisplay();
    saveGameState();
}

// Navigation entre pages
function setupPageNavigation() {
    const btns = document.querySelectorAll('.page-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById('page-' + page);
            if (target) {
                target.classList.add('active');
            }
        });
    });
}

// Initialisation
function init() {
    loadGameState();
    calculateSteamProduction();
    updateBuyFactorUI();
    setupPageNavigation();
    updateDisplay();
    document.getElementById('exportBtn').addEventListener('click', exportSave);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        importSaveFromFile(file);
        e.target.value = '';
    });
    document.getElementById('refundBtn').addEventListener('click', refundAll);
    document.getElementById('resetBtn').addEventListener('click', resetSave);
    // Convertir tous les engrenages sur bouton dédié
    const convertBtn = document.getElementById('convertAllBtn');
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            convertAllGears();
        });
    }
    // Ajoute le bouton du facteur d'achat dans la navigation
    const nav = document.querySelector('.nav');
    if (nav) {
        const factorBtn = document.createElement('button');
        factorBtn.id = 'buyFactorBtn';
        factorBtn.className = 'factor-btn';
        factorBtn.textContent = '×' + getBuyFactor();
        factorBtn.addEventListener('click', () => {
            cycleBuyFactor();
            // mise à jour des listes pour refléter le nouveau facteur sur les boutons
            updateGearList();
            updateArtisanList();
        });
        nav.appendChild(factorBtn);
    }
    // Gestion du clic sur la gear centrale
    const central = document.getElementById('centralGear');
    if (central) {
        central.addEventListener('click', () => {
            // Génère de la vapeur lors du clic. Nous utilisons 1 vapeur par clic dans cette version minimaliste.
            gameState.steam += 1;
            gameState.steamTotal += 1;
            updateDisplay();
            saveGameState();
        });
    }

    // Activation de la manivelle via la touche "M" et la molette de la souris.
    // Lorsque l'utilisateur maintient la touche M enfoncée, la molette n'agit plus sur le défilement
    // mais augmente ou diminue la puissance de la manivelle. Le défilement est bloqué durant cet usage.
    let manivelleActive = false;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            manivelleActive = true;
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            manivelleActive = false;
        }
    });
    document.addEventListener('wheel', (e) => {
        if (manivelleActive) {
            // Empêche le scroll normal lorsque la touche M est maintenue
            e.preventDefault();
            // deltaY négatif = molette vers le haut → augmente le boost, positif = vers le bas → diminue
            const delta = e.deltaY < 0 ? 1 : -1;
            // Modifie la puissance de la manivelle (affichée dans crankDisplay)
            gameState.crankPower = (gameState.crankPower || 0) + delta;
            if (gameState.crankPower < 0) gameState.crankPower = 0;
            // La puissance de la manivelle se traduit par un pourcentage de boost identique
            // On peut plafonner le boost pour éviter des valeurs démesurées (par ex. max 1000 %)
            const maxBoost = 1000;
            gameState.currentBoost = Math.min(gameState.crankPower, maxBoost);
            // Recalcule la production immédiatement pour refléter le nouveau boost
            calculateSteamProduction();
            updateDisplay();
            saveGameState();
        }
    }, { passive: false });
    // Boucle de jeu principale
    setInterval(() => {
        // Production artisanale de gears
        processArtisanCrafting(1);
        // Conversion automatique des gears (si activé)
        convertGearsToRings();
        // Production de vapeur des gears
        calculateSteamProduction();
        // Ajout de la production au stock de vapeur
        gameState.steam += gameState.steamPerSecond;
        gameState.steamTotal += gameState.steamPerSecond;
        // Met à jour les compteurs
        updateDisplay();
        // Sauvegarde périodique
        saveGameState();
    }, 1000);
}

// Lancement de l'initialisation lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', init);

// Ajout d'un clic manuel sur la valeur de vapeur pour générer de la vapeur
// Chaque clic sur l'élément "steamValue" ajoute 1 vapeur (sans boost)
document.addEventListener('DOMContentLoaded', () => {
    const steamEl = document.getElementById('steamValue');
    if (steamEl) {
        steamEl.style.cursor = 'pointer';
        steamEl.title = 'Cliquez pour générer de la vapeur';
        steamEl.addEventListener('click', () => {
            gameState.steam += 1;
            gameState.steamTotal += 1;
            updateDisplay();
            saveGameState();
        });
    }
});