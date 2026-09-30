// main.js - S.T.E.A.M. Clicker ÉVOLUTION FINALE - Ajustements Interface + Corrections
import { initSession, initPlayer, getCachedPlayer, getDisplayName } from '../shared/supabaseData.js';
import { getGold, addGold, refreshGold } from '../shared/economy.js';

const GEAR_TYPES = [
    { id: 1, name: "Engrenage Bronze", cost: 100, production: 1, tier: 1, description: "Mécanisme de base • Alliage rustique", material: "bronze", color: "#cd7f32", svg: "./assets/gear_1.svg" },
    { id: 2, name: "Engrenage Fer", cost: 1000, production: 5, tier: 2, description: "Mécanisme renforcé • Résistance accrue", material: "iron", color: "#708090", svg: "./assets/gear_2.svg" },
    { id: 3, name: "Engrenage Acier", cost: 10000, production: 20, tier: 3, description: "Système avancé • Précision industrielle", material: "steel", color: "#4682b4", svg: "./assets/gear_3.svg" },
    { id: 4, name: "Turbine Titanium", cost: 1000000, production: 100, tier: 4, description: "Technologie haute performance • Alliage spatial", material: "titanium", color: "#c0c0c0", svg: "./assets/gear_4.svg" },
    { id: 5, name: "Générateur Aether", cost: 10000000, production: 500, tier: 5, description: "Manipulation éthérée • Énergie mystique", material: "aether", color: "#9370db", svg: "./assets/gear_5.svg" },
    { id: 6, name: "Réacteur Plasma", cost: 1000000000, production: 1000, tier: 6, description: "Fusion énergétique • État plasma maîtrisé", material: "plasma", color: "#ff69b4", svg: "./assets/gear_6.svg" },
    { id: 7, name: "Processeur Quantique", cost: 100000000000, production: 2500, tier: 7, description: "Réalité altérée • Mécanique quantique", material: "quantum", color: "#00ffff", svg: "./assets/gear_7.svg" }
];

const ARTISAN_BASE_TYPES = [
    { id: 1, name: "Apprenti Vapeur", tier: 1, baseCost: 50000000, gearCostType: 1, gearCostAmount: 3, production: 100 * GEAR_TYPES.find(g => g.tier === 1).production, description: "Optimise les mécanismes basiques", icon: "👨‍🔧" },
    { id: 2, name: "Forgeron Maître", tier: 2, baseCost: 500000000, gearCostType: 2, gearCostAmount: 3, production: 100 * GEAR_TYPES.find(g => g.tier === 2).production, description: "Maintient les équipements avancés", icon: "🔨" },
    { id: 3, name: "Ingénieur Turbine", tier: 3, baseCost: 5000000000, gearCostType: 3, gearCostAmount: 3, production: 100 * GEAR_TYPES.find(g => g.tier === 3).production, description: "Spécialiste en efficacité énergétique", icon: "⚡" },
    { id: 4, name: "Technicien Quantique", tier: 4, baseCost: 50000000000, gearCostType: 4, gearCostAmount: 3, production: 100 * GEAR_TYPES.find(g => g.tier === 4).production, description: "Maîtrise les technologies avancées", icon: "🧬" }
];

const EVOLUTION_TYPES = {
    brotherhood: { name: "Confrérie", description: "9 artisans du même tier forment une confrérie", requirement: 3, multiplier: 3, icon: "🏢", svg: "./assets/brotherhood.svg" },
    district: { name: "Quartier Industriel", description: "3 confréries forment un quartier industriel", requirement: 3, multiplier: 5, icon: "🏘️", svg: "./assets/district.svg" },
    conglomerate: { name: "Conglomérat", description: "3 quartiers forment un conglomérat", requirement: 3, multiplier: 10, icon: "🏭", svg: "./assets/conglomerate.svg" }
};

const REPLICA_COSTS = [
    { id: 1, name: "Première Réplique", cost: 1000000000, description: "Double votre production", multiplier: 2, unlocked: false },
    { id: 2, name: "Réplique Industrielle", cost: 100000000000, description: "Triple votre production totale", multiplier: 3, unlocked: false }
];

// ============================================================================
// PARAMÈTRES GLOBAUX ET VARIABLES D'INTERFACE
//
// BUY_FACTORS définit les multiplicateurs disponibles pour l'achat en masse. Le
// joueur peut cycler entre ces valeurs grâce au bouton dans la boutique.
const BUY_FACTORS = [1, 3, 9, 25, 50];

// gearDisplayCounts conserve le nombre maximum d'engrenages jamais possédés pour
// chaque tier. Ce compteur permet de continuer à afficher les engrenages même
// après leur conversion en anneaux afin que l'affichage ne disparaisse pas.
const gearDisplayCounts = {};

const GOLD_EXCHANGE_RATES = [
    { id: 1, steamCost: 10000000, goldReward: 1, name: "Conversion Basique", description: "Échange standard • Taux de base" },
    { id: 2, steamCost: 100000000, goldReward: 12, name: "Conversion Groupée", description: "Échange en volume • +20% bonus", bonus: "20% bonus!" },
    { id: 3, steamCost: 1000000000, goldReward: 150, name: "Conversion Premium", description: "Échange de maître • +50% bonus", bonus: "50% bonus!" },
    { id: 4, steamCost: 10000000000, goldReward: 2000, name: "Conversion VIP", description: "Échange de grand maître • +100% bonus", bonus: "50% bonus!" },
];

const PLAYER_UPGRADES = [
    { id: 1, name: "Multiplicateur de Clic", type: "click_multiplier", baseCost: 1, description: "Augmente la vapeur gagnée par clic", icon: "👆", maxLevel: 20 },
    { id: 2, name: "Transmission Améliorée", type: "transmission", baseCost: 2, description: "Réduit la perte de boost (-15% → -14%)", icon: "⚙️", maxLevel: 10 },
    { id: 3, name: "Efficacité Manivelle", type: "efficiency", baseCost: 5, description: "Augmente le boost maximum (+200% → +220%)", icon: "⚡", maxLevel: 15 },
    { id: 4, name: "Chance de l'Inventeur", type: "luck", baseCost: 10, description: "Chance de double récompense", icon: "🍀", maxLevel: 10 }
];

const DAILY_QUESTS = [
    { id: "daily_connection", name: "Connexion Quotidienne", description: "Se connecter au laboratoire", icon: "🔐", reward: { gold: 50 }, requirement: { type: "login", value: 1 }, category: "daily" },
    { id: "daily_clicks_100", name: "Manivelle Active", description: "Cliquer 100 fois sur l'engrenage", icon: "👆", reward: { gold: 30 }, requirement: { type: "clicks", value: 100 }, category: "daily" },
    { id: "daily_clicks_1000", name: "Maître Manivelle", description: "Cliquer 1000 fois sur l'engrenage", icon: "⚡", reward: { gold: 150 }, requirement: { type: "clicks", value: 1000 }, category: "daily" },
    { id: "daily_steam_10k", name: "Production Journalière", description: "Générer 10K vapeur aujourd'hui", icon: "💨", reward: { gold: 80 }, requirement: { type: "steam_daily", value: 10000 }, category: "daily" },
    { id: "daily_gear_buy", name: "Achat d'Équipement", description: "Acheter 5 engrenages", icon: "⚙️", reward: { gold: 100 }, requirement: { type: "gear_buy_daily", value: 5 }, category: "daily" },
    { id: "daily_boost_150", name: "Boost Supérieur", description: "Atteindre 150% de boost", icon: "🔥", reward: { gold: 120 }, requirement: { type: "max_boost_daily", value: 150 }, category: "daily" }
];

const GLOBAL_QUESTS = [
    { id: "global_steam_1m", name: "Million de Vapeur", description: "Générer 1 million de vapeur totale", icon: "🌟", reward: { gold: 50 }, requirement: { type: "steam_total", value: 1000000 }, category: "global" },
    { id: "global_artisan_10", name: "Équipe Complète", description: "Embaucher 10 artisans", icon: "👥", reward: { gold: 100 }, requirement: { type: "artisan_total", value: 10 }, category: "global" },
    { id: "global_evolution_5", name: "Maître Évolution", description: "Effectuer 5 évolutions d'engrenages", icon: "🔄", reward: { gold: 200 }, requirement: { type: "evolution_count", value: 5 }, category: "global" },
    { id: "global_replica_1", name: "Premier Clone", description: "Acheter votre première réplique", icon: "🔄", reward: { gold: 500 }, requirement: { type: "replica_count", value: 1 }, category: "global" },
    { id: "global_gold_100", name: "Collectionneur", description: "Accumuler 100 pièces d'or", icon: "💰", reward: { gold: 25 }, requirement: { type: "gold_total", value: 100 }, category: "global" }
];

const SECRET_QUESTS = [
    { id: "secret_click_master", name: "Légende du Clic", description: "Cliquer 10000 fois au total", icon: "🔥", reward: { gold: 300 }, requirement: { type: "clicks", value: 10000 }, category: "secret" },
    { id: "secret_idle_master", name: "Maître de l'Inaction", description: "Rester 24h sans cliquer", icon: "😴", reward: { gold: 150 }, requirement: { type: "idle_time", value: 86400 }, category: "secret" },
    { id: "secret_speed_demon", name: "Démon de Vitesse", description: "Atteindre 200% de boost", icon: "⚡", reward: { gold: 400 }, requirement: { type: "max_boost", value: 200 }, category: "secret" },
    { id: "secret_perfectionist", name: "Perfectionniste", description: "Maximiser toutes les améliorations joueur", icon: "💎", reward: { gold: 1000 }, requirement: { type: "all_upgrades_max", value: 1 }, category: "secret" },
    { id: "secret_industrial_lord", name: "Seigneur Industriel", description: "Créer 3 conglomérats", icon: "🏭", reward: { gold: 2000 }, requirement: { type: "conglomerate_total", value: 3 }, category: "secret" }
];

const ACHIEVEMENTS = {
    steam_1k: { id: "steam_1k", name: "Premier Souffle", description: "Générer 1 000 unités de vapeur", icon: "💨", requirement: { type: "steam_total", value: 1000 }, reward: { gold: 1 }, category: "milestone" },
    steam_10k: { id: "steam_10k", name: "Apprenti Ingénieur", description: "Générer 10 000 unités de vapeur", icon: "⚙️", requirement: { type: "steam_total", value: 10000 }, reward: { gold: 5 }, category: "milestone" },
    steam_100k: { id: "steam_100k", name: "Maître Mécanicien", description: "Générer 100 000 unités de vapeur", icon: "🔧", requirement: { type: "steam_total", value: 100000 }, reward: { gold: 25 }, category: "milestone" },
    steam_1m: { id: "steam_1m", name: "Baron de la Vapeur", description: "Générer 1 000 000 unités de vapeur", icon: "👑", requirement: { type: "steam_total", value: 1000000 }, reward: { gold: 150 }, category: "milestone" },
    steam_10m: { id: "steam_10m", name: "Seigneur des Machines", description: "Générer 10 000 000 unités de vapeur", icon: "🏰", requirement: { type: "steam_total", value: 10000000 }, reward: { gold: 800 }, category: "milestone" },
    steam_100m: { id: "steam_100m", name: "Empereur Industriel", description: "Générer 100 000 000 unités de vapeur", icon: "👨‍💼", requirement: { type: "steam_total", value: 100000000 }, reward: { gold: 5000 }, category: "milestone" },
    steam_1b: { id: "steam_1b", name: "Titan de la Vapeur", description: "Générer 1 000 000 000 unités de vapeur", icon: "🌟", requirement: { type: "steam_total", value: 1000000000 }, reward: { gold: 25000 }, category: "milestone" },
    first_gear: { id: "first_gear", name: "Premier Mécanisme", description: "Fabriquer votre premier engrenage", icon: "⚙️", requirement: { type: "gear_total", value: 1 }, reward: { gold: 2 }, category: "gear" },
    gear_tier_2: { id: "gear_tier_2", name: "Métallurgie Avancée", description: "Débloquer les engrenages de fer", icon: "🔩", requirement: { type: "gear_tier", value: 2 }, reward: { gold: 8 }, category: "gear" },
    gear_tier_7: { id: "gear_tier_7", name: "Maître Quantique", description: "Atteindre la technologie quantique", icon: "🌀", requirement: { type: "gear_tier", value: 7 }, reward: { gold: 1000 }, category: "gear" },
    first_evolution: { id: "first_evolution", name: "Première Évolution", description: "Faire évoluer 10 engrenages du même tier", icon: "🔄", requirement: { type: "evolution_count", value: 1 }, reward: { gold: 50 }, category: "evolution" },
    chain_master: { id: "chain_master", name: "Maître des Chaînes", description: "Effectuer 5 évolutions d'engrenages", icon: "⛓️", requirement: { type: "evolution_count", value: 5 }, reward: { gold: 250 }, category: "evolution" },
    evolution_expert: { id: "evolution_expert", name: "Expert Évolution", description: "Effectuer 25 évolutions d'engrenages", icon: "🔄", requirement: { type: "evolution_count", value: 25 }, reward: { gold: 1000 }, category: "evolution" },
    first_artisan: { id: "first_artisan", name: "Premier Apprenti", description: "Embaucher votre premier artisan", icon: "👨‍🔧", requirement: { type: "artisan_total", value: 1 }, reward: { gold: 15 }, category: "artisan" },
    artisan_master: { id: "artisan_master", name: "Maître de Guilde", description: "Embaucher 10 artisans au total", icon: "👥", requirement: { type: "artisan_total", value: 10 }, reward: { gold: 100 }, category: "artisan" },
    artisan_army: { id: "artisan_army", name: "Armée d'Artisans", description: "Embaucher 50 artisans au total", icon: "🏭", requirement: { type: "artisan_total", value: 50 }, reward: { gold: 1000 }, category: "artisan" },
    first_brotherhood: { id: "first_brotherhood", name: "Fondateur de Confrérie", description: "Former votre première confrérie d'artisans", icon: "🏢", requirement: { type: "brotherhood_total", value: 1 }, reward: { gold: 200 }, category: "workshop" },
    first_district: { id: "first_district", name: "Urbaniste Industriel", description: "Développer votre premier quartier industriel", icon: "🏘️", requirement: { type: "district_total", value: 1 }, reward: { gold: 1000 }, category: "workshop" },
    first_conglomerate: { id: "first_conglomerate", name: "Magnat de l'Industrie", description: "Créer votre premier conglomérat", icon: "🏭", requirement: { type: "conglomerate_total", value: 1 }, reward: { gold: 5000 }, category: "workshop" },
    industrial_empire: { id: "industrial_empire", name: "Empire Industriel", description: "Créer 5 conglomérats", icon: "🌟", requirement: { type: "conglomerate_total", value: 5 }, reward: { gold: 25000 }, category: "workshop" },
    first_replica: { id: "first_replica", name: "Premier Clone", description: "Acheter votre première réplique", icon: "🔄", requirement: { type: "replica_count", value: 1 }, reward: { gold: 2000 }, category: "replica" },
    replica_master: { id: "replica_master", name: "Maître de Réplication", description: "Posséder 3 répliques actives", icon: "🔄", requirement: { type: "replica_count", value: 3 }, reward: { gold: 10000 }, category: "replica" },
    click_master: { id: "click_master", name: "Maître du Clic", description: "Cliquer 1 000 fois sur l'engrenage principal", icon: "👆", requirement: { type: "clicks", value: 1000 }, reward: { gold: 10 }, category: "special" },
    click_legend: { id: "click_legend", name: "Légende du Clic", description: "Cliquer 10 000 fois sur l'engrenage principal", icon: "🔥", requirement: { type: "clicks", value: 10000 }, reward: { gold: 500 }, category: "special" },
    click_speed: { id: "click_speed", name: "Manivelle Express", description: "Atteindre 150% de boost manivelle", icon: "⚡", requirement: { type: "max_boost", value: 150 }, reward: { gold: 50 }, category: "special" },
    speed_demon: { id: "speed_demon", name: "Démon de Vitesse", description: "Atteindre 200% de boost manivelle", icon: "🌪️", requirement: { type: "max_boost", value: 200 }, reward: { gold: 500 }, category: "special" },
    gold_hoarder: { id: "gold_hoarder", name: "Collectionneur d'Or", description: "Accumuler 100 pièces d'or", icon: "💰", requirement: { type: "gold_total", value: 100 }, reward: { gold: 20 }, category: "special" },
    gold_tycoon: { id: "gold_tycoon", name: "Magnat de l'Or", description: "Accumuler 1000 pièces d'or", icon: "👑", requirement: { type: "gold_total", value: 1000 }, reward: { gold: 200 }, category: "special" },
    reset_master: { id: "reset_master", name: "Maître du Recommencement", description: "Réinitialiser la sauvegarde au moins une fois", icon: "🔄", requirement: { type: "resets", value: 1 }, reward: { gold: 5 }, category: "special" },
    ring_master: { id: "ring_master", name: "Seigneur des Anneaux", description: "Posséder 5 anneaux productifs", icon: "💍", requirement: { type: "ring_total", value: 5 }, reward: { gold: 100 }, category: "ring" },
    ring_lord: { id: "ring_lord", name: "Souverain des Anneaux", description: "Posséder 25 anneaux productifs", icon: "💍", requirement: { type: "ring_total", value: 25 }, reward: { gold: 1000 }, category: "ring" },
    workshop_unlock: { id: "workshop_unlock", name: "Industrialisation", description: "Débloquer le mode Atelier", icon: "🏭", requirement: { type: "steam_total", value: 10000000 }, reward: { gold: 500 }, category: "milestone" },
    player_shop: { id: "player_shop", name: "Perfectionnement", description: "Débloquer la boutique personnelle", icon: "👤", requirement: { type: "clicks", value: 1000 }, reward: { gold: 25 }, category: "special" },
    quest_master: { id: "quest_master", name: "Maître des Quêtes", description: "Compléter 10 quêtes journalières", icon: "📋", requirement: { type: "daily_quests_completed", value: 10 }, reward: { gold: 100 }, category: "quest" },
    perfectionist: { id: "perfectionist", name: "Perfectionniste", description: "Maximiser toutes les améliorations joueur", icon: "💎", requirement: { type: "all_upgrades_max", value: 1 }, reward: { gold: 1000 }, category: "special" }
};

// Configuration du système de boost
const RING_BONUS_PERCENTAGE = 25;
const BOOST_TRANSMISSION_LOSS = 15;
const MAX_BOOST_PERCENTAGE = 200;

// NOUVEAU : Variables de production séparées
// gameState stocke l'intégralité des données persistantes du joueur. De nouvelles propriétés ont été
// ajoutées pour gérer la manivelle, les facteurs d'achat, la sauvegarde et la production des artisans.
let gameState = {
    steam: 0, 
    steamTotal: 0, 
    steamPerSecond: 0,         // Production statique (engrenages + artisans)
    steamPerSecondBoost: 0,    // Production supplémentaire du boost (manivelle)
    materials: {},
    gears: {},
    artisans: {},
    brotherhoods: {},
    districts: {},
    conglomerates: {},
    gearEvolutions: {},
    totalEvolutions: 0,
    totalClicks: 0,
    totalResets: 0,
    rings: {},
    mode: 'etabli',  // CHANGEMENT : "laboratory" → "etabli"
    replicas: 1,
    clickBoost: 0,
    maxBoostReached: 0,
    lastClickTime: 0,
    // Joueur
    playerUpgrades: {},
    playerShopUnlocked: false,
    unlockedShops: { gear: true, gold: false, artisan: false, upgrade: false, replica: false },
    lastSave: Date.now(),
    achievements: { unlocked: [], claimed: [] },
    recentAchievements: [],
    firstClick: false,
    dailyQuests: {},
    globalQuests: {},
    secretQuests: {},
    questsCompleted: 0,
    dailyQuestsCompleted: 0,
    lastDailyReset: null,
    dailyStats: {},
    // NOUVEAU : état de la manivelle
    crankVelocity: 0,
    crankRotation: 0,
    // NOUVEAU : compteur de resets (augmenté à chaque reset)
    resets: 0,
    // NOUVEAU : état d'activation de la conversion automatique en anneaux par tier
    autoRing: {},
    // NOUVEAU : index du facteur d'achat courant (0 → BUY_FACTORS[0])
    buyFactorIndex: 0
};

let uiState = { rightPanelCollapsed: false };
let isAuthenticated = false;
let goldSystemEnabled = false;

// Variables de boost
let boostInterval = null;
let isClicking = false;

// Variables quêtes
let currentQuestTab = 'daily';

// FONCTION HELPER SÉCURISÉE
function $(selector) { 
    try {
        return document.querySelector(selector); 
    } catch (error) {
        console.warn(`Selector error for "${selector}":`, error);
        return null;
    }
}

function safeSetText(selector, text) {
    try {
        const element = $(selector);
        if (element && element.textContent !== undefined) {
            element.textContent = text;
            return true;
        }
        return false;
    } catch (error) {
        console.warn(`Failed to set text for "${selector}":`, error);
        return false;
    }
}

function safeSetHTML(selector, html) {
    try {
        const element = $(selector);
        if (element && element.innerHTML !== undefined) {
            element.innerHTML = html;
            return true;
        }
        return false;
    } catch (error) {
        console.warn(`Failed to set HTML for "${selector}":`, error);
        return false;
    }
}

function safeSetStyle(selector, property, value) {
    try {
        const element = $(selector);
        if (element && element.style) {
            element.style[property] = value;
            return true;
        }
        return false;
    } catch (error) {
        console.warn(`Failed to set style for "${selector}":`, error);
        return false;
    }
}

// ============================================================================
// FACTEUR D'ACHAT
// Ces fonctions gèrent le facteur d'achat global utilisé pour toutes les
// transactions (engrenages, artisans, etc.). Le facteur est stocké dans
// gameState.buyFactorIndex et est appliqué dans les fonctions d'achat.

/**
 * Retourne le facteur d'achat courant en fonction de l'indice stocké dans
 * gameState.buyFactorIndex.
 * @returns {number} Le multiplicateur d'achat courant.
 */
function getBuyFactor() {
    const index = gameState.buyFactorIndex || 0;
    return BUY_FACTORS[index] || 1;
}

/**
 * Incrémente l'indice du facteur d'achat et met à jour l'UI. Boucle sur
 * BUY_FACTORS lorsque la fin est atteinte.
 */
function cycleBuyFactor() {
    const current = gameState.buyFactorIndex || 0;
    const next = (current + 1) % BUY_FACTORS.length;
    gameState.buyFactorIndex = next;
    updateBuyFactorUI();
    saveGameState();
}

/**
 * Met à jour le texte du bouton de facteur d'achat dans la boutique.
 */
function updateBuyFactorUI() {
    const btn = document.getElementById('shopBuyFactorBtn');
    if (btn) {
        const factor = getBuyFactor();
        btn.textContent = `×${factor}`;
    }
}

// Exposer cycleBuyFactor globalement pour que les attributs onclick du HTML puissent l'utiliser
window.cycleBuyFactor = cycleBuyFactor;

function formatNumber(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// SYSTÈME DE QUÊTES COMPLET - CORRECTION: FONCTIONS MANQUANTES AJOUTÉES
function initDailyQuests() {
    const today = new Date().toDateString();
    if (gameState.lastDailyReset !== today) {
        gameState.lastDailyReset = today;
        gameState.dailyQuests = {};
        gameState.dailyStats = {
            clicksToday: 0,
            steamToday: 0,
            gearsBoughtToday: 0,
            maxBoostToday: 0,
            loginToday: true
        };

        const availableQuests = [...DAILY_QUESTS];
        const selectedQuests = [];

        for (let i = 0; i < 3 && availableQuests.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableQuests.length);
            selectedQuests.push(availableQuests.splice(randomIndex, 1)[0]);
        }

        selectedQuests.forEach(quest => {
            gameState.dailyQuests[quest.id] = {
                ...quest,
                progress: 0,
                completed: false,
                claimed: false
            };
        });

        saveGameState();
        showGoldToast(0, "✨ Nouvelles quêtes journalières disponibles !");
    }

    updateDailyQuestDisplay();
}
function updateDailyQuestDisplay() {
    const container = $('#dailyQuestDisplay');
    if (!container) return;

    const activeQuests = Object.values(gameState.dailyQuests).filter(q => !q.claimed);

    if (activeQuests.length === 0) {
        safeSetHTML('#dailyQuestDisplay', `
            <div style="text-align: center; color: var(--brass-light);">
                <div style="font-size: 16px; margin-bottom: 5px;">✅</div>
                <div style="font-size: 12px;">Toutes les quêtes terminées</div>
                <div style="font-size: 10px; color: #90EE90;">Revenez demain !</div>
            </div>
        `);
        return;
    }

    const quest = activeQuests[0];
    const progress = Math.min(quest.progress / quest.requirement.value, 1);
    const progressPercent = Math.round(progress * 100);

    safeSetHTML('#dailyQuestDisplay', `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="font-size: 20px;">${quest.icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: bold; color: var(--brass-light); font-size: 12px;">${quest.name}</div>
                <div style="font-size: 10px; color: var(--parchment); margin-bottom: 4px;">${quest.description}</div>
                <div style="font-size: 10px; color: var(--gold);">🏆 ${quest.reward.gold} Or</div>
            </div>
        </div>
        <div style="width: 100%; height: 6px; background: #2c1810; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
            <div style="height: 100%; background: linear-gradient(90deg, #cd7f32, #ffd700); width: ${progressPercent}%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 10px; text-align: center; color: var(--parchment);">
            ${quest.progress} / ${quest.requirement.value} (${progressPercent}%)
        </div>
        ${quest.completed && !quest.claimed ? `
            <button onclick="claimQuest('${quest.id}')" style="width: 100%; margin-top: 8px; padding: 4px; background: var(--gold); border: 1px solid var(--brass); border-radius: 4px; color: var(--mahogany); font-size: 10px; font-weight: bold; cursor: pointer;">
                Réclamer Récompense
            </button>
        ` : ''}
    `);
}

function updateQuestProgress(type, amount = 1) {
    let progressMade = false;

    switch (type) {
        case 'clicks':
            gameState.dailyStats.clicksToday += amount;
            break;
        case 'steam_daily':
            gameState.dailyStats.steamToday += amount;
            break;
        case 'gear_buy_daily':
            gameState.dailyStats.gearsBoughtToday += amount;
            break;
        case 'max_boost_daily':
            gameState.dailyStats.maxBoostToday = Math.max(gameState.dailyStats.maxBoostToday || 0, amount);
            break;
    }

    Object.keys(gameState.dailyQuests).forEach(questId => {
        const quest = gameState.dailyQuests[questId];
        if (quest.completed || quest.claimed) return;

        let currentValue = 0;
        switch (quest.requirement.type) {
            case 'login':
                currentValue = gameState.dailyStats.loginToday ? 1 : 0;
                break;
            case 'clicks':
                currentValue = gameState.dailyStats.clicksToday;
                break;
            case 'steam_daily':
                currentValue = gameState.dailyStats.steamToday;
                break;
            case 'gear_buy_daily':
                currentValue = gameState.dailyStats.gearsBoughtToday;
                break;
            case 'max_boost_daily':
                currentValue = gameState.dailyStats.maxBoostToday;
                break;
        }

        quest.progress = currentValue;
        if (quest.progress >= quest.requirement.value && !quest.completed) {
            quest.completed = true;
            progressMade = true;
            showGoldToast(0, `🎯 Quête terminée: ${quest.name}`);
        }
    });

    [...GLOBAL_QUESTS, ...SECRET_QUESTS].forEach(questTemplate => {
        if (gameState.globalQuests[questTemplate.id]?.completed || gameState.secretQuests[questTemplate.id]?.completed) return;

        let currentValue = 0;
        switch (questTemplate.requirement.type) {
            case 'steam_total':
                currentValue = gameState.steamTotal;
                break;
            case 'artisan_total':
                currentValue = Object.values(gameState.artisans).reduce((sum, count) => sum + count, 0) +
                              Object.values(gameState.brotherhoods).reduce((sum, count) => sum + count, 0) +
                              Object.values(gameState.districts).reduce((sum, count) => sum + count, 0) +
                              Object.values(gameState.conglomerates).reduce((sum, count) => sum + count, 0);
                break;
            case 'evolution_count':
                currentValue = gameState.totalEvolutions;
                break;
            case 'replica_count':
                currentValue = gameState.replicas;
                break;
            case 'clicks':
                currentValue = gameState.totalClicks;
                break;
            case 'max_boost':
                currentValue = gameState.maxBoostReached;
                break;
            case 'gold_total':
                if (goldSystemEnabled) {
                    (async () => {
                        try {
                            const goldAmount = await getGold();
                            if (goldAmount >= questTemplate.requirement.value) {
                                const questCategory = questTemplate.category === 'secret' ? 'secretQuests' : 'globalQuests';
                                if (!gameState[questCategory][questTemplate.id]) {
                                    gameState[questCategory][questTemplate.id] = { ...questTemplate, completed: true, claimed: false };
                                    showGoldToast(0, `🌟 Quête ${questTemplate.category} terminée: ${questTemplate.name}`);
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to check gold quest:', error);
                        }
                    })();
                }
                return;
            case 'all_upgrades_max':
                const allMaxed = PLAYER_UPGRADES.every(upgrade => 
                    (gameState.playerUpgrades[upgrade.type] || 0) >= upgrade.maxLevel
                );
                currentValue = allMaxed ? 1 : 0;
                break;
            case 'conglomerate_total':
                currentValue = Object.values(gameState.conglomerates).reduce((sum, count) => sum + count, 0);
                break;
            case 'daily_quests_completed':
                currentValue = gameState.dailyQuestsCompleted;
                break;
        }

        if (currentValue >= questTemplate.requirement.value) {
            const questCategory = questTemplate.category === 'secret' ? 'secretQuests' : 'globalQuests';
            if (!gameState[questCategory][questTemplate.id]) {
                gameState[questCategory][questTemplate.id] = { ...questTemplate, completed: true, claimed: false };
                progressMade = true;
                showGoldToast(0, `🌟 Quête ${questTemplate.category} terminée: ${questTemplate.name}`);
            }
        }
    });

    if (progressMade) {
        updateDailyQuestDisplay();
        updateQuestDisplay();
        saveGameState();
    }
}

async function claimQuest(questId) {
    let quest = null;
    let questCategory = null;

    if (gameState.dailyQuests[questId]) {
        quest = gameState.dailyQuests[questId];
        questCategory = 'daily';
    } else if (gameState.globalQuests[questId]) {
        quest = gameState.globalQuests[questId];
        questCategory = 'global';
    } else if (gameState.secretQuests[questId]) {
        quest = gameState.secretQuests[questId];
        questCategory = 'secret';
    }

    if (!quest || !quest.completed || quest.claimed) return;

    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour réclamer les récompenses");
        return;
    }

    try {
        quest.claimed = true;
        gameState.questsCompleted++;

        if (questCategory === 'daily') {
            gameState.dailyQuestsCompleted++;
        }

        if (quest.reward.gold) {
            await addGold(quest.reward.gold);
            showGoldToast(quest.reward.gold, `🎯 Quête terminée: ${quest.name}`);

            const questElement = $(`[data-quest="${questId}"]`);
            if (questElement) {
                triggerCoinExplosion(questElement);
            }

            await updateGoldDisplay();
        }

        updateQuestProgress('daily_quests_completed', 1);
        updateDailyQuestDisplay();
        updateQuestDisplay();
        checkAchievements();
        saveGameState();

    } catch (error) {
        quest.claimed = false;
        console.error('Failed to claim quest reward:', error);
        showGoldToast(0, "Erreur lors de la réclamation");
    }
}

function checkQuests() {
    updateQuestProgress('steam_total', 0);
    updateQuestProgress('artisan_total', 0);
    updateQuestProgress('evolution_count', 0);
    updateQuestProgress('replica_count', 0);
    updateQuestProgress('max_boost', gameState.maxBoostReached);
    updateQuestProgress('conglomerate_total', 0);
    updateQuestProgress('all_upgrades_max', 0);
}

function showQuestModal() {
    const modal = $('#questModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateQuestDisplay();
    }
}

function hideQuestModal() {
    const modal = $('#questModal');
    if (modal) modal.classList.add('hidden');
}

function switchQuestTab(tab) {
    currentQuestTab = tab;

    document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
    const targetTab = $(`#questTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (targetTab) targetTab.classList.add('active');

    updateQuestDisplay();
}

function updateQuestDisplay() {
    const grid = $('#questGrid');
    if (!grid) return;

    grid.innerHTML = '';
    let questsToShow = [];

    switch (currentQuestTab) {
        case 'daily':
            questsToShow = Object.values(gameState.dailyQuests);
            break;
        case 'global':
            questsToShow = Object.values(gameState.globalQuests);
            GLOBAL_QUESTS.forEach(quest => {
                if (!gameState.globalQuests[quest.id]) {
                    questsToShow.push({ ...quest, completed: false, claimed: false, locked: true });
                }
            });
            break;
        case 'secret':
            questsToShow = Object.values(gameState.secretQuests);
            SECRET_QUESTS.forEach(quest => {
                if (!gameState.secretQuests[quest.id]) {
                    questsToShow.push({ ...quest, completed: false, claimed: false, locked: true, hidden: true });
                }
            });
            break;
    }

    questsToShow.forEach(quest => {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.completed ? 'completed' : ''} ${quest.locked ? 'locked' : ''}`;
        card.setAttribute('data-quest', quest.id);

        let progressBar = '';
        let actionButton = '';

        if (!quest.hidden) {
            if (quest.progress !== undefined) {
                const progressPercent = Math.min((quest.progress / quest.requirement.value) * 100, 100);
                progressBar = `
                    <div class="quest-progress">
                        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">${quest.progress} / ${quest.requirement.value}</div>
                `;
            }

            if (quest.completed && !quest.claimed) {
                actionButton = `<button onclick="claimQuest('${quest.id}')" class="claim-quest-button">Réclamer ${quest.reward.gold} Or</button>`;
            } else if (quest.claimed) {
                actionButton = '<div style="color: var(--gold); font-weight: bold;">✓ Réclamé</div>';
            }
        }

        card.innerHTML = `
            <div class="quest-icon">${quest.hidden ? '❓' : quest.icon}</div>
            <div class="quest-title">${quest.hidden ? 'Quête Mystère' : quest.name}</div>
            <div class="quest-description">${quest.hidden ? 'Continuez à jouer pour découvrir cette quête secrète!' : quest.description}</div>
            ${progressBar}
            <div class="quest-reward">${quest.hidden ? '🏆 ???' : `🏆 ${quest.reward.gold} Or`}</div>
            ${actionButton}
        `;

        grid.appendChild(card);
    });

    if (questsToShow.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--parchment); font-style: italic; padding: 40px;">
                Aucune quête ${currentQuestTab} disponible
            </div>
        `;
    }
}

// Exports des fonctions de quêtes
window.claimQuest = claimQuest;
window.showQuestModal = showQuestModal;
window.hideQuestModal = hideQuestModal;
window.switchQuestTab = switchQuestTab;







// BOUTIQUE JOUEUR
function openPlayerShop() {
    if (gameState.totalClicks < 1000) {
        showGoldToast(0, `Boutique joueur débloquée à 1000 clics (${gameState.totalClicks}/1000)`);
        return;
    }

    if (!gameState.playerShopUnlocked) {
        gameState.playerShopUnlocked = true;
        showGoldToast(25, "🎉 Boutique du Joueur débloquée !");
        checkAchievements();
        checkQuests();
        saveGameState();
    }

    showPlayerShopModal();
}

function showPlayerShopModal() {
    const existingModal = $('#playerShopModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'playerShopModal';
    modal.className = 'achievement-modal';

    modal.innerHTML = `
        <div class="achievement-modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-family: 'Cinzel', serif; font-size: 2rem; color: var(--copper); margin: 0;">👤 Boutique du Maître</h2>
                <button onclick="hidePlayerShop()" style="background: var(--brass); border: 2px solid var(--copper-dark); color: var(--mahogany); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 18px; font-weight: bold;">×</button>
            </div>
            <div class="achievement-grid" id="playerShopGrid">
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    updatePlayerShopDisplay();
}

function updatePlayerShopDisplay() {
    const grid = $('#playerShopGrid');
    if (!grid) return;

    grid.innerHTML = '';

    PLAYER_UPGRADES.forEach(upgrade => {
        const currentLevel = gameState.playerUpgrades[upgrade.type] || 0;
        const cost = upgrade.baseCost * Math.pow(2, currentLevel);
        const canAfford = goldSystemEnabled;
        const isMaxed = currentLevel >= upgrade.maxLevel;

        const card = document.createElement('div');
        card.className = `achievement-card ${!canAfford || isMaxed ? 'locked' : ''}`;

        let statusInfo = '';
        if (isMaxed) {
            statusInfo = '<div style="color: var(--gold); font-weight: bold;">✓ Maximisé</div>';
        } else if (canAfford) {
            statusInfo = `<button onclick="buyPlayerUpgrade('${upgrade.type}')" class="claim-button">Acheter ${cost} Or</button>`;
        } else {
            statusInfo = '<div style="color: #F08080; font-style: italic;">Authentification requise</div>';
        }

        card.innerHTML = `
            <div class="achievement-icon">${upgrade.icon}</div>
            <div class="achievement-title">${upgrade.name} (${currentLevel}/${upgrade.maxLevel})</div>
            <div class="achievement-description">${upgrade.description}</div>
            ${statusInfo}
        `;

        grid.appendChild(card);
    });
}

async function buyPlayerUpgrade(upgradeType) {
    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour acheter des améliorations");
        return;
    }

    const upgrade = PLAYER_UPGRADES.find(u => u.type === upgradeType);
    if (!upgrade) return;

    const currentLevel = gameState.playerUpgrades[upgradeType] || 0;
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = upgrade.baseCost * Math.pow(2, currentLevel);

    try {
        const currentGold = await getGold();
        if (currentGold < cost) {
            showGoldToast(0, "Or insuffisant");
            return;
        }

        await addGold(-cost);
        gameState.playerUpgrades[upgradeType] = currentLevel + 1;

        showGoldToast(0, `✨ ${upgrade.name} amélioré ! Niveau ${currentLevel + 1}`);
        triggerCoinExplosion($('#playerShopModal'));

        updatePlayerShopDisplay();
        updateGoldDisplay();
        checkAchievements();
        checkQuests();
        saveGameState();

    } catch (error) {
        console.error('Failed to buy player upgrade:', error);
        showGoldToast(0, "Erreur lors de l'achat");
    }
}

function hidePlayerShop() {
    const modal = $('#playerShopModal');
    if (modal) modal.remove();
}

window.openPlayerShop = openPlayerShop;
window.hidePlayerShop = hidePlayerShop;
window.buyPlayerUpgrade = buyPlayerUpgrade;














// SYSTÈME DE BOOST MANIVELLE AVEC PRODUCTION SÉPARÉE
function updateClickBoost() {
    // Désactivation du boost au clic : la valeur de clickBoost est désormais
    // uniquement influencée par la manivelle (crank). On applique ici une
    // diminution lente afin de permettre une décroissance lorsque le joueur
    // arrête de faire tourner la manivelle. Aucune augmentation n'est faite
    // lors du clic.
    if (gameState.clickBoost > 0) {
        gameState.clickBoost = Math.max(gameState.clickBoost - 1, 0);
    }
    // Recalculer la production boost à partir de clickBoost
    calculateBoostProduction();
    updateBoostGauge();
}

// ============================================================================
// MANIVELLE
// Gestion de la molette pour la manivelle et de sa rotation. La vitesse de
// rotation (crankVelocity) est modifiée par la molette du joueur. Une
// friction décroissante est appliquée pour simuler l'inertie.

// Constantes de la manivelle
const CRANK_ACCELERATION = 0.002; // vitesse ajoutée par mouvement de molette
const CRANK_FRICTION = 0.001;     // perte de vitesse par tick

/**
 * Handle le défilement de la molette sur la manivelle. Un défilement vers le haut
 * accélère la rotation dans le sens horaire (boost), un défilement vers le bas
 * ralentit la rotation.
 */
function handleCrankWheel(event) {
    event.preventDefault();
    const delta = event.deltaY || event.wheelDelta || 0;
    // deltaY positif vers le bas, négatif vers le haut. Inverser pour que
    // rouler vers le haut augmente la vitesse positivement.
    const direction = delta > 0 ? -1 : 1;
    gameState.crankVelocity += direction * CRANK_ACCELERATION;
    // Limiter la vitesse pour éviter des valeurs extrêmes
    const maxSpeed = 0.1;
    if (gameState.crankVelocity > maxSpeed) gameState.crankVelocity = maxSpeed;
    if (gameState.crankVelocity < -maxSpeed) gameState.crankVelocity = -maxSpeed;
}

/**
 * Met à jour la rotation de la manivelle et dérive un boost proportionnel à
 * l'amplitude de la vitesse. Doit être appelée à chaque tick.
 */
function updateCrank() {
    // Appliquer friction pour ramener la vitesse vers zéro
    if (gameState.crankVelocity > 0) {
        gameState.crankVelocity = Math.max(0, gameState.crankVelocity - CRANK_FRICTION);
    } else if (gameState.crankVelocity < 0) {
        gameState.crankVelocity = Math.min(0, gameState.crankVelocity + CRANK_FRICTION);
    }
    // Mise à jour de l'angle de rotation
    gameState.crankRotation += gameState.crankVelocity * 180; // multiplier pour amplifier l'effet visuel
    const crank = document.getElementById('crankHandle');
    if (crank) {
        crank.style.transform = `translate(-50%, -50%) rotate(${gameState.crankRotation}deg)`;
    }
    // Déterminer un boost basé sur la vitesse actuelle
    // La vitesse max (0.1) correspond à un boost maximum (getMaxBoost()). On
    // convertit donc proportionnellement la vitesse absolue en pourcentage.
    const velocityAbs = Math.abs(gameState.crankVelocity);
    const maxSpeed = 0.1;
    const ratio = velocityAbs / maxSpeed;
    gameState.clickBoost = Math.min(getMaxBoost(), ratio * getMaxBoost());
    calculateBoostProduction();
    updateBoostGauge();
}

// Exposer la fonction de manivelle pour l'attribut onclick/wheel
window.handleCrankWheel = handleCrankWheel;

function getMaxBoost() {
    const baseMax = MAX_BOOST_PERCENTAGE;
    const efficiencyLevel = gameState.playerUpgrades.efficiency || 0;
    return baseMax + (efficiencyLevel * 20);
}

function getTransmissionLoss() {
    const baseLoss = BOOST_TRANSMISSION_LOSS;
    const transmissionLevel = gameState.playerUpgrades.transmission || 0;
    return Math.max(baseLoss - transmissionLevel, 5);
}

function updateBoostGauge() {
    const boostFill = $('#boostFill');
    const boostPercentage = $('#boostPercentage');
    const currentBoostDisplay = $('#currentBoostDisplay');

    if (boostFill && boostPercentage) {
        const maxBoost = getMaxBoost();
        const percentage = (gameState.clickBoost / maxBoost) * 100;

        safeSetStyle('#boostFill', 'width', `${percentage}%`);
        safeSetText('#boostPercentage', `${Math.round(gameState.clickBoost)}%`);
    }

    if (currentBoostDisplay) {
        safeSetText('#currentBoostDisplay', `+${Math.round(gameState.clickBoost)}%`);
    }
}

function calculateBoostForTier(tier) {
    const baseLoss = getTransmissionLoss();
    const lossMultiplier = Math.pow((100 - baseLoss) / 100, tier - 1);
    return gameState.clickBoost * lossMultiplier;
}

// NOUVEAU : CALCUL PRODUCTION BOOST SÉPARÉE
function calculateBoostProduction() {
    let boostProduction = 0;

    // Production boost des engrenages
    for (const [gearId, count] of Object.entries(gameState.gears)) {
        const gearType = GEAR_TYPES.find(g => g.id === parseInt(gearId));
        if (gearType && count > 0) {
            let baseGearProduction = gearType.production * count;

            // Bonus des anneaux
            const ringCount = gameState.rings[gearType.tier] || 0;
            if (ringCount > 0) {
                const ringBonus = 1 + (ringCount * (RING_BONUS_PERCENTAGE / 100));
                baseGearProduction *= ringBonus;
            }

            // Boost par tier
            const tierBoost = calculateBoostForTier(gearType.tier);
            const boostMultiplier = tierBoost / 100;
            boostProduction += baseGearProduction * boostMultiplier;
        }
    }

    // Production boost des anneaux
    for (const [tier, ringCount] of Object.entries(gameState.rings)) {
        const tierData = GEAR_TYPES.find(g => g.tier === parseInt(tier));
        if (tierData && ringCount > 0) {
            let baseRingProduction = tierData.production * 10 * ringCount;
            const tierBoost = calculateBoostForTier(tierData.tier);
            const boostMultiplier = tierBoost / 100;
            boostProduction += baseRingProduction * boostMultiplier;
        }
    }

    // Multiplier par répliques
    boostProduction *= gameState.replicas;

    gameState.steamPerSecondBoost = boostProduction;
}

// MODE SWITCHES AVEC INTERFACE COMPLÈTE (Établi/Atelier)
function switchToEtabli() {  // CHANGEMENT : switchToLaboratory → switchToEtabli
    gameState.mode = 'etabli';
    updateModeDisplay();
    updateShopsVisibility();
    saveGameState();
}

function switchToWorkshop() {
    if (gameState.steamTotal < 10000000) {
        showGoldToast(0, "Atelier débloqué à 10M de vapeur totale");
        return;
    }
    gameState.mode = 'workshop';
    updateModeDisplay();
    updateShopsVisibility();
    updateWorkshopArtisans();
    saveGameState();
}

function updateModeDisplay() {
    const etabliMode = $('#etabliMode');    // CHANGEMENT : labMode → etabliMode
    const workshopMode = $('#workshopMode');
    const etabliView = $('#etabliView');    // CHANGEMENT : laboratoryView → etabliView
    const workshopView = $('#workshopView');
    const boostGauge = $('#boostGauge');

    if (etabliMode && workshopMode) {
        if (gameState.mode === 'etabli') {
            etabliMode.classList.add('active');
            workshopMode.classList.remove('active');
        } else {
            etabliMode.classList.remove('active');
            workshopMode.classList.add('active');
        }

        if (gameState.steamTotal >= 10000000) {
            workshopMode.classList.remove('locked');
        }
    }

    if (etabliView && workshopView) {
        if (gameState.mode === 'etabli') {
            etabliView.classList.remove('hidden');
            workshopView.classList.remove('active');
        } else {
            etabliView.classList.add('hidden');
            workshopView.classList.add('active');
        }
    }

    if (boostGauge) {
        boostGauge.className = `boost-gauge ${gameState.mode}`;
    }
}

function updateShopsVisibility() {
    const gearWorkshop = $('#gearWorkshop');
    const goldExchange = $('#goldExchange');
    const replicaShop = $('#replicaShop');
    const workshopArtisans = $('#workshopArtisans');
    const evolutionWorkshop = $('#evolutionWorkshop');

    if (gameState.mode === 'etabli') {  // CHANGEMENT : 'laboratory' → 'etabli'
        // Mode Établi : Engrenages + Or + Répliques
        safeSetStyle('#gearWorkshop', 'display', 'block');
        safeSetStyle('#goldExchange', 'display', gameState.unlockedShops.gold ? 'block' : 'none');
        safeSetStyle('#replicaShop', 'display', gameState.unlockedShops.replica ? 'block' : 'none');
        safeSetStyle('#workshopArtisans', 'display', 'none');
        safeSetStyle('#evolutionWorkshop', 'display', 'none');
    } else {
        // Mode Atelier : Artisans + Évolutions
        safeSetStyle('#gearWorkshop', 'display', 'none');
        safeSetStyle('#goldExchange', 'display', 'none');
        safeSetStyle('#replicaShop', 'display', 'none');
        safeSetStyle('#workshopArtisans', 'display', 'block');
        safeSetStyle('#evolutionWorkshop', 'display', 'block');
    }
}

window.switchToEtabli = switchToEtabli;        // CHANGEMENT : switchToLaboratory → switchToEtabli
window.switchToWorkshop = switchToWorkshop;

// CALCUL PRODUCTION COMPLET AVEC SÉPARATION
function calculateProduction() {
    let staticProduction = 0; // NOUVEAU : Production statique (sans boost)

    // Production statique des engrenages (sans boost)
    for (const [gearId, count] of Object.entries(gameState.gears)) {
        const gearType = GEAR_TYPES.find(g => g.id === parseInt(gearId));
        if (gearType) {
            let gearProduction = gearType.production * count;

            // Bonus des anneaux
            const ringCount = gameState.rings[gearType.tier] || 0;
            if (ringCount > 0) {
                const bonus = 1 + (ringCount * (RING_BONUS_PERCENTAGE / 100));
                gearProduction *= bonus;
            }

            staticProduction += gearProduction;
        }
    }

    // Production statique des anneaux (sans boost)
    for (const [tier, ringCount] of Object.entries(gameState.rings)) {
        const tierData = GEAR_TYPES.find(g => g.tier === parseInt(tier));
        if (tierData) {
            let ringProduction = tierData.production * 10 * ringCount;
            staticProduction += ringProduction;
        }
    }

    // Production artisans simples (statique)
    for (const [artisanId, count] of Object.entries(gameState.artisans)) {
        const artisanType = ARTISAN_BASE_TYPES.find(a => a.id === parseInt(artisanId));
        if (artisanType) {
            staticProduction += artisanType.production * count;
        }
    }

    // Production confréries (statique)
    for (const [tier, count] of Object.entries(gameState.brotherhoods)) {
        const artisan = ARTISAN_BASE_TYPES.find(a => a.tier === parseInt(tier));
        if (artisan) {
            const brotherhoodProduction = artisan.production * EVOLUTION_TYPES.brotherhood.multiplier * count;
            staticProduction += brotherhoodProduction;
        }
    }

    // Production quartiers (statique)
    for (const [tier, count] of Object.entries(gameState.districts)) {
        const artisan = ARTISAN_BASE_TYPES.find(a => a.tier === parseInt(tier));
        if (artisan) {
            const districtProduction = artisan.production * EVOLUTION_TYPES.district.multiplier * EVOLUTION_TYPES.brotherhood.multiplier * count;
            staticProduction += districtProduction;
        }
    }

    // Production conglomérats (statique)
    for (const [tier, count] of Object.entries(gameState.conglomerates)) {
        const artisan = ARTISAN_BASE_TYPES.find(a => a.tier === parseInt(tier));
        if (artisan) {
            const conglomerateProduction = artisan.production * 
                EVOLUTION_TYPES.conglomerate.multiplier * 
                EVOLUTION_TYPES.district.multiplier * 
                EVOLUTION_TYPES.brotherhood.multiplier * count;
            staticProduction += conglomerateProduction;
        }
    }

    // Multiplicateur de répliques sur production statique
    staticProduction *= gameState.replicas;

    // Enregistrer production statique
    gameState.steamPerSecond = staticProduction;

    // Calculer production boost séparément
    calculateBoostProduction();
}

/**
 * Calcule la production d'engrenages fournie par les artisans et met à jour
 * gameState.gears ainsi que gearDisplayCounts. Cette fonction applique les
 * multiplicateurs de confrérie (×3 sur les groupes de 9 artisans), de quartier
 * (×3 supplémentaires sur les groupes de 27 artisans) et une aura de
 * conglomérat (×1,5 par conglomérat) sur l'ensemble de la production.
 *
 * Elle est appelée à chaque tick dans gameLoop() afin de produire des
 * engrenages automatiquement.
 */
function processArtisanCrafting(deltaSeconds = 1) {
    // Pour chaque tier d'artisan, calculer la production de gears
    let hasProduction = false;
    for (const [id, count] of Object.entries(gameState.artisans)) {
        const artisanType = ARTISAN_BASE_TYPES.find(a => a.id === parseInt(id));
        if (!artisanType || count <= 0) continue;
        const tier = artisanType.tier;
        const totalArtisans = count;
        // Déterminer le nombre de conglomérats, quartiers et confréries sans consommer d'artisans
        const conglomerates = Math.floor(totalArtisans / 81);
        const remainingAfterCongloms = totalArtisans % 81;
        const districts = Math.floor(remainingAfterCongloms / 27);
        const remainingAfterDistricts = remainingAfterCongloms % 27;
        const brotherhoods = Math.floor(remainingAfterDistricts / 9);
        const remaining = remainingAfterDistricts % 9;
        // Production de base
        let production = 0;
        // Production des artisans restants (non dans des structures)
        production += remaining * 1;
        // Production des confréries (9 artisans) : ×3 pour ces 9
        production += brotherhoods * (9 * 3);
        // Production des quartiers (27 artisans) : chaque artisan reçoit ×9 (3 de confrérie + 3 de quartier)
        production += districts * (27 * 9);
        // Production des conglomérats (81 artisans) : chaque artisan reçoit ×9 (confrérie+quartier)
        production += conglomerates * (81 * 9);
        // Aura conglomérat : multiplier toute la production du tier par 1.5^conglomerates
        const auraMultiplier = Math.pow(1.5, conglomerates);
        production *= auraMultiplier;
        // Appliquer la durée du tick
        production *= deltaSeconds;
        // Ajouter les engrenages produits au stock
        if (production > 0) {
            const gearTierId = GEAR_TYPES.find(g => g.tier === tier)?.id;
            if (gearTierId) {
                const wholeGears = Math.floor(production);
                const fractional = production - wholeGears;
                // Stocker la fraction de production pour le prochain tick (éviter perte)
                gameState.artisansFraction = gameState.artisansFraction || {};
                const prevFraction = gameState.artisansFraction[tier] || 0;
                const totalFraction = prevFraction + fractional;
                const extraWhole = Math.floor(totalFraction);
                gameState.artisansFraction[tier] = totalFraction - extraWhole;
                const gearsToAdd = wholeGears + extraWhole;
                if (gearsToAdd > 0) {
                    gameState.gears[gearTierId] = (gameState.gears[gearTierId] || 0) + gearsToAdd;
                    gearDisplayCounts[gearTierId] = (gearDisplayCounts[gearTierId] || 0) + gearsToAdd;
                    hasProduction = true;
                }
            }
        }
    }
    if (hasProduction) {
        // Recalculer la production de vapeur après ajout d'engrenages
        calculateProduction();
        updateDisplay();
        updatePyramidalGears();
        updateThickRings();
        updateShops();
        // Vérifier les évolutions d'engrenages (anneaux)
        checkGearEvolution();
        // Sauvegarde
        saveGameState();
    }
}

// AFFICHAGE PRINCIPAL AVEC PRODUCTION SÉPARÉE
function updateDisplay() {
    safeSetText('#steamCounter', formatNumber(gameState.steam));
    safeSetText('#steamRate', formatNumber(gameState.steamPerSecond));
    safeSetText('#steamTotalDisplay', formatNumber(gameState.steamTotal));

    // NOUVEAU : Affichage production boost séparée dans le HUD
    const boostProductionDisplay = $('#steamPerSecondBoost'); // Nouvel élément dans le HUD
    if (boostProductionDisplay) { safeSetText('#steamPerSecondBoost', formatNumber(gameState.steamPerSecondBoost)); }

    // NOUVEAU : Production totale = statique + boost
    const totalProduction = gameState.steamPerSecond + gameState.steamPerSecondBoost;
    safeSetText('#steamRateTotal', formatNumber(totalProduction));

    const materialCount = Object.values(gameState.materials).reduce((sum, count) => sum + count, 0);
    safeSetText('#materialCount', materialCount);

    const gearCount = Object.values(gameState.gears).reduce((sum, count) => sum + count, 0);
    safeSetText('#gearCount', gearCount);

    const artisanCount = Object.values(gameState.artisans).reduce((sum, count) => sum + count, 0);
    const brotherhoodCount = Object.values(gameState.brotherhoods).reduce((sum, count) => sum + count, 0);
    const districtCount = Object.values(gameState.districts).reduce((sum, count) => sum + count, 0);
    const conglomerateCount = Object.values(gameState.conglomerates).reduce((sum, count) => sum + count, 0);
    const totalArtisans = artisanCount + brotherhoodCount + districtCount + conglomerateCount;

    safeSetText('#artisanCount', artisanCount);
    safeSetText('#artisanTotalCount', totalArtisans);

    const ringCount = Object.values(gameState.rings).reduce((sum, count) => sum + count, 0);
    safeSetText('#ringCount', ringCount);
    safeSetText('#ringCountDisplay', ringCount);

    // Affichage répliques
    safeSetText('#replicaCount', gameState.replicas);
    safeSetText('#replicaCountDisplay', gameState.replicas);
    safeSetText('#replicaCountStat', gameState.replicas);

    updateMilestoneProgress();
    updateGoldDisplay();
    updateMainGearRotation();
    updateBoostGauge();
    updateModeDisplay();

    // NOUVEAU : Mettre à jour la production par tier dans le panneau statistiques
    updateTierProductionPanel();
}

// CORRECTION : CENTRAGE DU GEAR PRINCIPAL
function updateMainGearRotation() {
    const mainGear = $('#mainGear');
    if (!mainGear) return;
    const gearContainer = mainGear.parentElement;
    if (gearContainer) {
        mainGear.position = 'absolute';
        mainGear.style.left = '50%';
        mainGear.style.top  = '50%';
        mainGear.style.transform = 'translate(-50%, -50%)';

    }

    const baseSpeed = 20;
    const productionSpeedBonus = Math.max(gameState.steamPerSecond / 10, 0);
    const boostSpeedBonus = gameState.clickBoost / 10;
    const replicaMultiplier = gameState.replicas;
    const rotationSpeed = Math.max((baseSpeed - productionSpeedBonus - boostSpeedBonus) / replicaMultiplier, 0.5);

    mainGear.style.animation = `mainGearSpin ${rotationSpeed}s linear infinite`;

    // UNIQUEMENT ATELIER : Mettre à jour les répliques avec des vitesses différentes
    if (gameState.mode === 'workshop') {
        for (let i = 2; i <= gameState.replicas; i++) {
            const replicaGear = $(`#replicaGear${i}`);
            if (replicaGear) {
                const replicaSpeed = rotationSpeed * (0.8 + (i * 0.1));
                replicaGear.style.animation = `mainGearSpin ${replicaSpeed}s linear infinite`;
            }
        }
    }
}

/**
 * Met à jour l'affichage détaillé de la production d'engrenages par tier dans
 * le panneau de droite. Pour chaque tier possédant des artisans, la ligne
 * affiche le nombre d'artisans, de confréries, de quartiers et de conglomérats,
 * ainsi que le multiplicateur effectif (incluant l'aura) et la production de
 * gears/sec. Une infobulle expliquant le calcul apparaît au survol.
 */
function updateTierProductionPanel() {
    const container = document.getElementById('tierProductionPanel');
    if (!container) return;
    // Vider le contenu
    container.innerHTML = '';
    // Pour chaque tier
    ARTISAN_BASE_TYPES.forEach(artisanType => {
        const tier = artisanType.tier;
        const count = gameState.artisans[artisanType.id] || 0;
        if (count > 0) {
            // Calculer structures (sans consommer les artisans)
            const congloms = Math.floor(count / 81);
            const remAfterCong = count % 81;
            const districts = Math.floor(remAfterCong / 27);
            const remAfterDist = remAfterCong % 27;
            const brotherhoods = Math.floor(remAfterDist / 9);
            const remArtisans = remAfterDist % 9;
            // Production avant aura
            let production = 0;
            production += remArtisans * 1;
            production += brotherhoods * 9 * 3;
            production += districts * 27 * 9;
            production += congloms * 81 * 9;
            // Multiplicateur aura
            const aura = Math.pow(1.5, congloms);
            const effectiveProd = production * aura;
            // Multiplicateur effectif
            const multBase = effectiveProd / (count || 1);
            // Construire la ligne
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '0.8rem';
            row.style.marginBottom = '4px';
            // Titre
            row.innerHTML = `<span style="color: var(--parchment);">Tier ${tier}</span>` +
                `<span style="color: var(--parchment);">A:${count} Cfr:${brotherhoods} Qrt:${districts} Cg:${congloms}</span>` +
                `<span style="color: var(--parchment);">×${multBase.toFixed(2)}</span>` +
                `<span style="color: var(--green);">⚙️ ${effectiveProd.toFixed(1)}/s</span>`;
            // Infobulle avec explication
            const tooltip = [];
            tooltip.push(`Base: ${count} artisan${count > 1 ? 's' : ''} ×1`);
            if (brotherhoods > 0) tooltip.push(`Confréries: ${brotherhoods} ×3 chacune (groupes de 9)`);
            if (districts > 0) tooltip.push(`Quartiers: ${districts} ×3 supplémentaires (groupes de 27)`);
            if (congloms > 0) tooltip.push(`Conglomérats: ${congloms} aura ×1.5 chacun sur l'ensemble du tier`);
            tooltip.push(`Multiplicateur effectif: ×${multBase.toFixed(2)}`);
            tooltip.push(`Production totale: ${effectiveProd.toFixed(1)} gears/sec`);
            row.title = tooltip.join(' \n');
            container.appendChild(row);
        }
    });
}

// CORRECTION : PLACEMENT PYRAMIDES AVEC DISTANCE AJUSTÉE SELON ANNEAUX
function updatePyramidalGears() {
    const pyramidsContainer = $('#gearPyramids');
    const chainsContainer = $('#gearChains');
    if (!pyramidsContainer || !chainsContainer) return;

    pyramidsContainer.innerHTML = '';
    chainsContainer.innerHTML = '';

    // Afficher les engrenages en utilisant le nombre maximum d'engrenages jamais produits (gearDisplayCounts)
    for (const gearType of GEAR_TYPES) {
        const count = gearDisplayCounts[gearType.id] || (gameState.gears[gearType.id] || 0);
        if (count > 0) {
            createSingleTierPyramid(gearType, count, pyramidsContainer, chainsContainer);
        }
    }
    addPyramidAnimationStyles();
}

function createSingleTierPyramid(gearType, count, pyramidsContainer, chainsContainer) {
    const tier = gearType.tier;

    // Rayon constant pour chaque tier : on ne s'écarte plus en fonction du nombre d'anneaux
    const baseRadius = 120 + (tier - 1) * 40;

    const chain = document.createElement('div');
    chain.className = `gear-chain tier-${tier}`;
    chain.style.cssText = `
        width: ${baseRadius * 2}px;
        height: ${baseRadius * 2}px;
    `;
    chainsContainer.appendChild(chain);

    // Placement constant à trois positions autour de l'engrenage central
    const totalPackets = Math.ceil(count / 3);
    const anglePerPacket = 120; // 360° / 3 positions

    for (let packet = 0; packet < totalPackets; packet++) {
        const packetAngle = (packet % 3) * anglePerPacket;
        const gearsInThisPacket = Math.min(3, count - (packet * 3));

        createPyramidPacket(gearType, gearsInThisPacket, baseRadius, packetAngle, pyramidsContainer);
    }
}

function createPyramidPacket(gearType, gearsInPacket, radius, baseAngle, container) {
    const tier = gearType.tier;
    const packetOffsets = [{ x: 0, y: -8 }, { x: -8, y: 8 }, { x: 8, y: 8 }];

    const tierBoost = calculateBoostForTier(tier);
    const speedMultiplier = 1 + (tierBoost / 100);

    for (let i = 0; i < gearsInPacket; i++) {
        const offset = packetOffsets[i] || { x: 0, y: 0 };
        const angle = (baseAngle * Math.PI) / 180;
        const x = radius * Math.cos(angle) + offset.x;
        const y = radius * Math.sin(angle) + offset.y;

        const baseAnimationTime = 8 + tier;
        const boostedAnimationTime = baseAnimationTime / speedMultiplier;

        const gear = document.createElement('div');
        gear.className = 'pyramid-gear';
        gear.style.cssText = `
            background-image: url('${gearType.svg}');
            border: 1px solid ${gearType.color};
            left: calc(50% + ${x}px);
            top: calc(50% + ${y}px);
            transform: translate(-50%, -50%);
            animation: pyramidGearSpin${tier % 2 === 0 ? 'Reverse' : ''} ${boostedAnimationTime}s linear infinite;
            animation-delay: ${i * 0.3}s;
            box-shadow: 0 0 8px ${gearType.color}40;
        `;

        container.appendChild(gear);
    }
}

// CORRECTION : PLACEMENT ANNEAUX INSTANTANÉ AVEC DISTANCE AJUSTÉE
function updateThickRings() {
    const ringsContainer = $('#gearRings');
    if (!ringsContainer) return;

    ringsContainer.innerHTML = '';

    let ringIndex = 0;
    for (const [tier, ringCount] of Object.entries(gameState.rings)) {
        if (ringCount > 0) {
            const tierData = GEAR_TYPES.find(g => g.tier === parseInt(tier));
            if (tierData) {
                // CORRECTION : Espacement ajusté pour éviter les chevauchements avec les gears
                const ringSize = 200 + (ringIndex * 45); // Augmenté de 35 à 45px
                const thickness = Math.min(3 + (ringCount * 2), 15);

                const ring = document.createElement('div');
                ring.className = `gear-ring tier-${tierData.tier}`;
                ring.style.cssText = `
                    width: ${ringSize}px; 
                    height: ${ringSize}px; 
                    border-color: ${tierData.color}; 
                    border-width: ${thickness}px;
                    animation: rotate 8s linear infinite;
                    animation-delay: ${ringIndex * 0.5}s;
                    opacity: ${0.6 + (ringCount * 0.1)};
                    transform: translate(-50%, -50%);
                    position: absolute;
                    left: 50%;
                    top: 50%;
                `;

                ringsContainer.appendChild(ring);
                ringIndex++;
            }
        }
    }
}

// Animation d'apparition d'anneau instantanée (MAINTENUE)
function showRingCreationEffect(tierData) {
    const ringsContainer = $('#gearRings');
    if (!ringsContainer) return;

    // Calculer la position finale de l'anneau
    const currentRingCount = Object.keys(gameState.rings).length;
    const ringSize = 200 + (currentRingCount * 45); // CORRECTION : même espacement
    const thickness = Math.min(3 + (gameState.rings[tierData.tier] * 2), 15);

    // Créer l'anneau directement à sa position finale (CORRECTION MAINTENUE)
    const newRing = document.createElement('div');
    newRing.className = `gear-ring tier-${tierData.tier}`;
    newRing.style.cssText = `
        width: ${ringSize}px; 
        height: ${ringSize}px; 
        border-color: ${tierData.color}; 
        border-width: ${thickness}px;
        transform: translate(-50%, -50%) scale(0);
        animation: ringAppear 0.6s ease-out forwards, rotate 8s linear infinite 0.6s;
        opacity: ${0.6 + (gameState.rings[tierData.tier] * 0.1)};
        position: absolute;
        left: 50%;
        top: 50%;
    `;

    ringsContainer.appendChild(newRing);

    // Ajouter l'animation d'apparition
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ringAppear {
            0% { 
                transform: translate(-50%, -50%) scale(0) rotate(0deg); 
                opacity: 0; 
                border-color: #ffd700;
            }
            50% { 
                transform: translate(-50%, -50%) scale(1.2) rotate(180deg); 
                opacity: 0.8; 
                border-color: ${tierData.color};
            }
            100% { 
                transform: translate(-50%, -50%) scale(1) rotate(360deg); 
                opacity: ${0.6 + (gameState.rings[tierData.tier] * 0.1)}; 
            }
        }
    `;

    document.head.appendChild(style);

    setTimeout(() => {
        style.remove();
    }, 2000);
}

function addPyramidAnimationStyles() {
    if (document.getElementById('pyramidStyles')) return;

    const style = document.createElement('style');
    style.id = 'pyramidStyles';
    style.textContent = `
        @keyframes mainGearSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pyramidGearSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pyramidGearSpinReverse {
            from { transform: translate(-50%, -50%) rotate(360deg); }
            to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `;

    document.head.appendChild(style);
}

// RÉPLIQUES UNIQUEMENT DANS L'ATELIER
function updateReplicaVisuals() {
    const container = $('#workshopMachineReplicas'); // Container spécifique atelier
    if (!container || gameState.mode !== 'workshop') return;

    // Supprimer les anciennes répliques (garder la machine principale)
    const existingReplicas = container.querySelectorAll('.replica-machine:not(:first-child)');
    existingReplicas.forEach(replica => replica.remove());

    // Ajouter les nouvelles répliques (uniquement dans l'atelier)
    for (let i = 2; i <= gameState.replicas; i++) {
        createReplicaMachine(container, i);
    }

    // Mettre à jour les compteurs sécurisés
    safeSetText('#replicaCount', gameState.replicas);
    safeSetText('#replicaCountDisplay', gameState.replicas);
    safeSetText('#replicaCountStat', gameState.replicas);
}

function createReplicaMachine(container, replicaNumber) {
    const replicaMachine = document.createElement('div');
    replicaMachine.className = 'replica-machine';

    const speedMultiplier = 0.8 + (replicaNumber * 0.1); // Vitesses différentes

    replicaMachine.innerHTML = `
        <div class="gear-container">
            <div class="replica-gear" id="replicaGear${replicaNumber}" 
                 style="background-image: url('./assets/main-gear.svg'); 
                        animation: mainGearSpin ${20 / speedMultiplier}s linear infinite;
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);">
            </div>
        </div>
        <div class="replica-label">Réplique ${replicaNumber - 1}</div>
    `;

    container.appendChild(replicaMachine);
}

// BOUTIQUE ENGRENAGES AVEC AFFICHAGE PRODUCTION D'ANNEAUX
function updateGearShop() {
    const container = $('#gearShopItems');
    if (!container) return;
    container.innerHTML = '';

    GEAR_TYPES.forEach(gear => {
        const canAfford = gameState.steam >= gear.cost;
        const owned = gameState.gears[gear.id] || 0;
        const ringCount = gameState.rings[gear.tier] || 0;
        const item = document.createElement('div');
        item.className = 'shop-item';

        const borderColor = canAfford ? 'var(--brass-light)' : '#666';
        const bgColor = canAfford ? 'linear-gradient(135deg, rgba(139, 69, 19, 0.8), rgba(160, 82, 45, 0.8))' : 'linear-gradient(135deg, rgba(75, 85, 99, 0.6), rgba(55, 65, 81, 0.6))';

        // Production de base
        let baseProduction = gear.production;

        // NOUVEAU : Calcul et affichage de la production d'anneau
        let ringProductionText = '';
        if (ringCount > 0) {
            const ringProduction = gear.production * 10; // Production de base d'un anneau
            const totalRingProduction = ringProduction * ringCount;
            ringProductionText = `<br><span style="color: #9370db; font-weight: bold;">💍 ${ringCount} anneau${ringCount > 1 ? 'x' : ''}: +${formatNumber(totalRingProduction)}/sec</span>`;
        }

        // Bonus des anneaux sur l'engrenage
        let bonusText = '';
        if (ringCount > 0) {
            const bonus = Math.round((ringCount * RING_BONUS_PERCENTAGE));
            bonusText = `<br><span style="color: #9370db; font-weight: bold;">💍 Bonus engrenages: +${bonus}%</span>`;
        }

        // Bonus boost
        const currentBoost = calculateBoostForTier(gear.tier);
        let boostText = '';
        if (currentBoost > 0) {
            boostText = `<br><span style="color: #ff6b35; font-weight: bold;">⚡ Boost actuel: +${Math.round(currentBoost)}%</span>`;
        }

        // Bonus répliques
        let replicaText = '';
        if (gameState.replicas > 1) {
            replicaText = `<br><span style="color: #AFEEEE; font-weight: bold;">🔄 x${gameState.replicas} répliques</span>`;
        }

        item.style.cssText = `background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 16px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; transition: all 0.3s ease; opacity: ${canAfford ? '1' : '0.7'}; position: relative; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1); margin-bottom: 8px; display: flex; align-items: center; gap: 12px;`;

        item.innerHTML = `
            <div style="width: 40px; height: 40px; background-image: url('${gear.svg}'); background-size: cover; background-position: center; border-radius: 50%; border: 2px solid ${gear.color}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);"></div>
            <div style="flex: 1;">
                <div style="font-family: 'Cinzel', serif; font-weight: bold; color: var(--brass-light); margin-bottom: 4px; font-size: 15px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);">${gear.name} (${owned})</div>
                <div style="font-family: 'Crimson Text', serif; color: var(--parchment); font-size: 12px; margin-bottom: 8px; line-height: 1.4;">
                    ${gear.description}<br>
                    ⚙️ Production base: ${formatNumber(baseProduction)}/sec${bonusText}${ringProductionText}${boostText}${replicaText}
                </div>
                <div style="color: #90EE90; font-weight: bold; font-size: 14px; font-family: 'Cinzel', serif;">💨 ${formatNumber(gear.cost)} Vapeur</div>
            </div>
        `;

        if (canAfford) {
            item.addEventListener('click', () => buyGear(gear.id));
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-3px) scale(1.02)';
                item.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)';
                item.style.borderColor = 'var(--gold)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'none';
                item.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                item.style.borderColor = borderColor;
            });
        }
        // Ajout d'un bouton pour activer/désactiver la conversion automatique en anneau
        const autoBtn = document.createElement('button');
        autoBtn.className = 'auto-ring-toggle';
        autoBtn.textContent = (gameState.autoRing && gameState.autoRing[gear.id] === false) ? 'Auto Off' : 'Auto On';
        autoBtn.title = 'Activer/Désactiver la conversion automatique en anneau pour cet engrenage';
        autoBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; padding: 2px 6px; font-size: 10px; border: 1px solid #555; background: rgba(0,0,0,0.4); color: #f4e4bc; border-radius: 4px; cursor: pointer;';
        autoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAutoRing(gear.id);
            // Mettre à jour le texte du bouton
            autoBtn.textContent = (gameState.autoRing && gameState.autoRing[gear.id] === false) ? 'Auto Off' : 'Auto On';
        });
        item.appendChild(autoBtn);
        container.appendChild(item);
    });
}

// Toggle la conversion automatique en anneau pour un type d'engrenage
function toggleAutoRing(gearId) {
    if (!gameState.autoRing) gameState.autoRing = {};
    if (gameState.autoRing[gearId] === false) {
        // passer à true (ou undefined par défaut)
        delete gameState.autoRing[gearId];
    } else {
        gameState.autoRing[gearId] = false;
    }
    saveGameState();
}

async function buyGear(gearId) {
    const gear = GEAR_TYPES.find(g => g.id === gearId);
    if (!gear) return;
    // Déterminer la quantité maximale selon le facteur d'achat et la vapeur disponible
    const factor = getBuyFactor();
    const maxAffordable = Math.floor(gameState.steam / gear.cost);
    const quantity = Math.min(factor, maxAffordable);
    if (quantity <= 0) return;
    // Coût total
    const totalCost = gear.cost * quantity;
    gameState.steam -= totalCost;
    gameState.steamTotal += totalCost;
    // Mettre à jour les ressources
    gameState.gears[gearId] = (gameState.gears[gearId] || 0) + quantity;
    if (gear.material) {
        gameState.materials[gear.material] = (gameState.materials[gear.material] || 0) + quantity;
    }
    // Conserver l'affichage des engrenages
    gearDisplayCounts[gearId] = (gearDisplayCounts[gearId] || 0) + quantity;
    // Mise à jour de la production et de l'affichage
    calculateProduction();
    updateDisplay();
    updatePyramidalGears();
    updateThickRings();
    updateShops();
    checkGearEvolution();
    checkAchievements();
    checkQuests();
    updateQuestProgress('gear_buy_daily', quantity);
    saveGameState();
}

// SYSTÈME DE RÉPLIQUES COMPLET
function updateReplicaShop() {
    const container = $('#replicaShopItems');
    if (!container) return;

    container.innerHTML = '';

    REPLICA_COSTS.forEach(replica => {
        const canAfford = gameState.steam >= replica.cost;
        const owned = gameState.replicas >= replica.id + 1;

        const item = document.createElement('div');
        item.className = `shop-item ${!canAfford || owned ? 'locked' : ''}`;

        const statusText = owned ? '✅ Possédé' : (canAfford ? 'Disponible' : 'Indisponible');
        const statusColor = owned ? '#90EE90' : (canAfford ? '#90EE90' : '#F08080');

        item.innerHTML = `
            <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; 
                        background: linear-gradient(135deg, #4682b4, #191970); border-radius: 50%; font-size: 20px; 
                        border: 2px solid #0f0f47;">🔄</div>
            <div style="flex: 1;">
                <div style="font-family: 'Cinzel', serif; font-weight: bold; color: #AFEEEE; margin-bottom: 4px; 
                            font-size: 15px;">${replica.name}</div>
                <div style="font-family: 'Crimson Text', serif; color: var(--parchment); font-size: 12px; 
                            margin-bottom: 8px; line-height: 1.4;">${replica.description}<br>
                            🔄 x${replica.multiplier} Production Totale</div>
                <div style="color: ${statusColor}; font-weight: bold; font-size: 14px; font-family: 'Cinzel', serif;">
                    💨 ${formatNumber(replica.cost)} Vapeur<br>
                    📊 ${statusText}
                </div>
            </div>
        `;

        if (canAfford && !owned) {
            item.addEventListener('click', () => buyReplica(replica.id));
        }

        container.appendChild(item);
    });
}

async function buyReplica(replicaId) {
    const replica = REPLICA_COSTS.find(r => r.id === replicaId);
    if (!replica || gameState.steam < replica.cost || gameState.replicas >= replica.id + 1) return;

    gameState.steam -= replica.cost;
    gameState.steamTotal += replica.cost;
    gameState.replicas = replica.id + 1;

    calculateProduction();
    updateDisplay();
    updateShops();
    updateReplicaVisuals(); // Uniquement pour l'atelier

    showGoldToast(replica.reward || 0, `🔄 ${replica.name} activée ! Production x${replica.multiplier}`);
    triggerCoinExplosion($('#replicaShop'));

    checkAchievements();
    checkQuests();
    saveGameState();
}

function updateShops() {
    // S'assurer que le libellé du facteur d'achat est à jour
    updateBuyFactorUI();
    updateGearShop();
    updateGoldShop();
    updateReplicaShop();
    updateWorkshopArtisanShop();

    // Débloquer boutiques selon progression
    if (gameState.steamTotal >= 1000 && !gameState.unlockedShops.gold) {
        gameState.unlockedShops.gold = true;
        const goldExchange = $('#goldExchange');
        if (goldExchange && gameState.mode === 'etabli') {
            safeSetStyle('#goldExchange', 'display', 'block');
            if (goldSystemEnabled) showGoldToast(2, "Forge Alchimique débloquée !");
        }
    }

    // Débloquer boutique répliques
    if (gameState.steamTotal >= 1000000000 && !gameState.unlockedShops.replica) {
        gameState.unlockedShops.replica = true;
        const replicaShop = $('#replicaShop');
        if (replicaShop && gameState.mode === 'etabli') {
            safeSetStyle('#replicaShop', 'display', 'block');
            if (goldSystemEnabled) showGoldToast(5, "Laboratoire de Réplication débloqué !");
        }
    }
}

// GESTION COMPLÈTE DU CLIC PRINCIPAL
function handleMainGearClick() {
    isClicking = true;
    gameState.lastClickTime = Date.now();

    const clickMultiplier = 1 + (gameState.playerUpgrades.click_multiplier || 0) * 0.1;
    const steamGain = Math.ceil(1 * clickMultiplier * gameState.replicas);

    gameState.steam += steamGain;
    gameState.steamTotal += steamGain;
    gameState.totalClicks++;

    // Quêtes
    updateQuestProgress('clicks', 1);
    updateQuestProgress('steam_daily', steamGain);

    if (!gameState.firstClick) {
        gameState.firstClick = true;
        const instructionPlaque = $('#instructionPlaque');
        if (instructionPlaque) instructionPlaque.classList.add('hidden');
        saveGameState();
    }

    updateDisplay();

    if (goldSystemEnabled && gameState.totalClicks % 100 === 0) checkAchievements();
    if (gameState.steamTotal % 1000 === 0) updateShops();
    if (gameState.totalClicks % 50 === 0) checkQuests();
}

// SYSTÈME D'ARTISANS ÉVOLUTIFS
function updateWorkshopArtisans() {
    const container = $('#workshopArtisansContainer');
    if (!container || gameState.mode !== 'workshop') return;
    container.innerHTML = '';
    // Positions autour de la machine pour 8 groupes (Nord, Nord-Est, etc.)
    const positions = [
        { class: 'pos-1', name: 'Nord' },
        { class: 'pos-2', name: 'Nord-Est' },
        { class: 'pos-3', name: 'Est' },
        { class: 'pos-4', name: 'Sud-Est' },
        { class: 'pos-5', name: 'Sud' },
        { class: 'pos-6', name: 'Sud-Ouest' },
        { class: 'pos-7', name: 'Ouest' },
        { class: 'pos-8', name: 'Nord-Ouest' }
    ];
    let positionIndex = 0;
    // Réinitialiser les structures calculées pour l'affichage
    gameState.brotherhoods = {};
    gameState.districts = {};
    gameState.conglomerates = {};
    // Pour chaque type d'artisan, calculer les regroupements et afficher
    ARTISAN_BASE_TYPES.forEach(artisanType => {
        const id = artisanType.id;
        const count = gameState.artisans[id] || 0;
        if (count <= 0 || positionIndex >= positions.length) return;
        const tier = artisanType.tier;
        // Calculer structures sans consommer d'artisans
        const congloms = Math.floor(count / 81);
        const remAfterCong = count % 81;
        const districts = Math.floor(remAfterCong / 27);
        const remAfterDist = remAfterCong % 27;
        const brotherhoods = Math.floor(remAfterDist / 9);
        const artisansOnly = remAfterDist % 9;
        // Mettre à jour gameState pour d'autres calculs
        if (brotherhoods > 0) gameState.brotherhoods[tier] = brotherhoods;
        if (districts > 0) gameState.districts[tier] = districts;
        if (congloms > 0) gameState.conglomerates[tier] = congloms;
        // Afficher les conglomérats
        if (congloms > 0 && positionIndex < positions.length) {
            createArtisanGroup(container, positions[positionIndex], artisanType, congloms, 'conglomerate');
            positionIndex++;
        }
        // Afficher les quartiers
        if (districts > 0 && positionIndex < positions.length) {
            createArtisanGroup(container, positions[positionIndex], artisanType, districts, 'district');
            positionIndex++;
        }
        // Afficher les confréries
        if (brotherhoods > 0 && positionIndex < positions.length) {
            createArtisanGroup(container, positions[positionIndex], artisanType, brotherhoods, 'brotherhood');
            positionIndex++;
        }
        // Afficher les artisans restants
        if (artisansOnly > 0 && positionIndex < positions.length) {
            createArtisanGroup(container, positions[positionIndex], artisanType, artisansOnly, 'artisan');
            positionIndex++;
        }
    });
}

function createArtisanGroup(container, position, artisanType, count, evolutionLevel) {
    const group = document.createElement('div');
    group.className = `artisan-group ${position.class}`;

    let unitClass, displayIcon, groupName;

    switch (evolutionLevel) {
        case 'artisan':
            unitClass = 'artisan-unit';
            displayIcon = artisanType.icon;
            groupName = `${artisanType.name}`;
            break;
        case 'brotherhood':
            unitClass = 'brotherhood-unit';
            displayIcon = EVOLUTION_TYPES.brotherhood.icon;
            groupName = `Confrérie ${artisanType.name}`;
            break;
        case 'district':
            unitClass = 'district-unit';
            displayIcon = EVOLUTION_TYPES.district.icon;
            groupName = `Quartier ${artisanType.name}`;
            break;
        case 'conglomerate':
            unitClass = 'conglomerate-unit';
            displayIcon = EVOLUTION_TYPES.conglomerate.icon;
            groupName = `Conglomérat ${artisanType.name}`;
            break;
    }

    const unit = document.createElement('div');
    unit.className = unitClass;
    unit.innerHTML = `
        ${displayIcon}
        ${count > 1 ? `<div class="count-badge">${count}</div>` : ''}
    `;
    unit.title = `${groupName} (${count}) - Production: ${getArtisanProduction(artisanType, evolutionLevel, count)}/sec`;

    if (count > 0) {
        setInterval(() => {
            createGearTransport(unit, artisanType.tier);
        }, 4000 + Math.random() * 2000);
    }

    group.appendChild(unit);
    container.appendChild(group);
}

function createGearTransport(fromElement, gearTier) {
    const centralMachine = $('#centralMachine');
    if (!centralMachine) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = centralMachine.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;

    const transport = document.createElement('div');
    transport.className = 'gear-transport';

    const gearType = GEAR_TYPES.find(g => g.tier === gearTier);
    if (gearType) {
        transport.style.backgroundImage = `url('${gearType.svg}')`;
    }

    transport.style.left = `${fromX}px`;
    transport.style.top = `${fromY}px`;
    transport.style.setProperty('--target-x', `${toX - fromX}px`);
    transport.style.setProperty('--target-y', `${toY - fromY}px`);

    document.body.appendChild(transport);

    setTimeout(() => {
        transport.remove();
    }, 4000);
}

function getArtisanProduction(artisanType, evolutionLevel, count) {
    // Affiche une estimation de la production d'un groupe selon le niveau d'évolution.
    // Les artisans produisent 1 gear/sec chacun ; les confréries (9 artisans) produisent
    // 9 × 3 gears/sec ; les quartiers (27 artisans) produisent 27 × 9 gears/sec ;
    // les conglomérats (81 artisans) produisent 81 × 9 gears/sec avant aura.
    let production = 0;
    switch (evolutionLevel) {
        case 'artisan':
            production = count * 1;
            break;
        case 'brotherhood':
            // chaque confrérie représente 9 artisans boostés ×3
            production = count * (9 * 3);
            break;
        case 'district':
            // chaque quartier représente 27 artisans boostés ×9
            production = count * (27 * 9);
            break;
        case 'conglomerate':
            // chaque conglomérat représente 81 artisans boostés ×9 (sans aura)
            production = count * (81 * 9);
            // on peut ajouter approximativement l'aura 1.5^count pour chaque conglomérat
            production *= Math.pow(1.5, count);
            break;
    }
    return Math.floor(production);
}

// ACHAT D'ARTISANS AVEC ENGRENAGES
function updateWorkshopArtisanShop() {
    const container = $('#workshopArtisanItems');
    if (!container || gameState.mode !== 'workshop') return;
    container.innerHTML = '';

    ARTISAN_BASE_TYPES.forEach(artisan => {
        const canAfford = gameState.steam >= artisan.baseCost && 
                         (gameState.gears[artisan.gearCostType] || 0) >= artisan.gearCostAmount;
        const owned = gameState.artisans[artisan.id] || 0;
        const item = document.createElement('div');
        item.className = `shop-item ${!canAfford ? 'locked' : ''}`;

        const gearType = GEAR_TYPES.find(g => g.id === artisan.gearCostType);

        item.innerHTML = `
            <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; 
                        background: linear-gradient(135deg, #dda0dd, #9370db); border-radius: 50%; font-size: 20px; 
                        border: 2px solid #800080;">${artisan.icon}</div>
            <div style="flex: 1;">
                <div style="font-family: 'Cinzel', serif; font-weight: bold; color: #DDA0DD; margin-bottom: 4px; 
                            font-size: 15px;">${artisan.name} (${owned})</div>
                <div style="font-family: 'Crimson Text', serif; color: var(--parchment); font-size: 12px; 
                            margin-bottom: 8px; line-height: 1.4;">${artisan.description}<br>
                            ⚡ +${formatNumber(artisan.production)}/sec</div>
                <div style="color: #90EE90; font-weight: bold; font-size: 14px; font-family: 'Cinzel', serif;">
                    💨 ${formatNumber(artisan.baseCost)}<br>
                    ⚙️ ${artisan.gearCostAmount} ${gearType ? gearType.name : ''}
                </div>
            </div>
        `;

        if (canAfford) {
            item.addEventListener('click', () => buyWorkshopArtisan(artisan.id));
        }
        container.appendChild(item);
    });
}

async function buyWorkshopArtisan(artisanId) {
    const artisan = ARTISAN_BASE_TYPES.find(a => a.id === artisanId);
    if (!artisan) return;
    // Déterminer la quantité maximale à acheter selon le facteur d'achat et les ressources disponibles
    const factor = getBuyFactor();
    const availableBySteam = Math.floor(gameState.steam / artisan.baseCost);
    const availableByGear = Math.floor((gameState.gears[artisan.gearCostType] || 0) / artisan.gearCostAmount);
    const quantity = Math.min(factor, availableBySteam, availableByGear);
    if (quantity <= 0) return;
    // Coût total et consommations
    const totalCost = artisan.baseCost * quantity;
    const totalGearsCost = artisan.gearCostAmount * quantity;
    gameState.steam -= totalCost;
    gameState.steamTotal += totalCost;
    gameState.gears[artisan.gearCostType] = (gameState.gears[artisan.gearCostType] || 0) - totalGearsCost;
    if (gameState.gears[artisan.gearCostType] <= 0) {
        delete gameState.gears[artisan.gearCostType];
    }
    // Ajouter les artisans
    gameState.artisans[artisanId] = (gameState.artisans[artisanId] || 0) + quantity;
    // Mise à jour production et affichage
    calculateProduction();
    updateDisplay();
    updateShops();
    updateWorkshopArtisans();
    // Les évolutions d'artisans sont gérées dynamiquement via processArtisanCrafting
    showGoldToast(0, `👥 ${artisan.name} ×${quantity} embauché${quantity > 1 ? 's' : ''} ! Production d'engrenages tier ${artisan.tier}`);
    checkAchievements();
    checkQuests();
    saveGameState();
}

// ÉVOLUTIONS D'ARTISANS
function checkArtisanEvolutions() {
    let hasEvolution = false;

    // Artisan → Confrérie
    for (const [artisanId, count] of Object.entries(gameState.artisans)) {
        if (count >= 10) {
            const artisan = ARTISAN_BASE_TYPES.find(a => a.id === parseInt(artisanId));
            if (artisan) {
                const confreriesCreated = Math.floor(count / 10);
                const remainingArtisans = count % 10;

                gameState.artisans[artisanId] = remainingArtisans;
                if (remainingArtisans === 0) delete gameState.artisans[artisanId];

                gameState.brotherhoods[artisan.tier] = (gameState.brotherhoods[artisan.tier] || 0) + confreriesCreated;

                showEvolutionEffect(`${confreriesCreated} Confrérie${confreriesCreated > 1 ? 's' : ''} ${artisan.name} formée${confreriesCreated > 1 ? 's' : ''} !`);
                hasEvolution = true;
            }
        }
    }

    // Confrérie → Quartier
    for (const [tier, count] of Object.entries(gameState.brotherhoods)) {
        if (count >= 5) {
            const quartiersCreated = Math.floor(count / 5);
            const remainingBrotherhoods = count % 5;

            gameState.brotherhoods[tier] = remainingBrotherhoods;
            if (remainingBrotherhoods === 0) delete gameState.brotherhoods[tier];

            gameState.districts[tier] = (gameState.districts[tier] || 0) + quartiersCreated;

            showEvolutionEffect(`${quartiersCreated} Quartier${quartiersCreated > 1 ? 's' : ''} Industriel${quartiersCreated > 1 ? 's' : ''} développé${quartiersCreated > 1 ? 's' : ''} !`);
            hasEvolution = true;
        }
    }

    // Quartier → Conglomérat
    for (const [tier, count] of Object.entries(gameState.districts)) {
        if (count >= 2) {
            const conglomeratesCreated = Math.floor(count / 2);
            const remainingDistricts = count % 2;

            gameState.districts[tier] = remainingDistricts;
            if (remainingDistricts === 0) delete gameState.districts[tier];

            gameState.conglomerates[tier] = (gameState.conglomerates[tier] || 0) + conglomeratesCreated;

            showEvolutionEffect(`${conglomeratesCreated} Conglomérat${conglomeratesCreated > 1 ? 's' : ''} créé${conglomeratesCreated > 1 ? 's' : ''} !`);
            hasEvolution = true;
        }
    }

    if (hasEvolution) {
        calculateProduction();
        updateDisplay();
        updateWorkshopArtisans();
        checkAchievements();
        checkQuests();
        saveGameState();
    }
}

function showEvolutionEffect(message) {
    const centralMachine = $('#centralMachine');
    if (!centralMachine) return;

    const effect = document.createElement('div');
    effect.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4682b4, #191970);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        border: 3px solid #0f0f47;
        font-family: 'Cinzel', serif;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        pointer-events: none;
        animation: evolutionEffect 3s ease-out forwards;
    `;

    effect.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes evolutionEffect {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;

    document.head.appendChild(style);
    centralMachine.appendChild(effect);

    setTimeout(() => {
        effect.remove();
        style.remove();
    }, 3000);
}

// GEAR EVOLUTION SÉCURISÉE
const EVOLUTION_COST = 10; // Nombre d'engrenages nécessaires pour une évolution + anneau

function checkGearEvolution() {
    let hasEvolution = false;
    for (const [gearId, count] of Object.entries(gameState.gears)) {
        if (count >= EVOLUTION_COST) {
            const tierData = GEAR_TYPES.find(g => g.id === parseInt(gearId));
            // Si la conversion automatique est désactivée pour ce tier, ignorer
            if (tierData && tierData.tier < 7) {
                // Vérifier auto-ring (par défaut activé si non défini)
                const auto = gameState.autoRing ? gameState.autoRing[gearId] : undefined;
                // Si auto est explicitement false, ne pas évoluer
                if (auto === false) continue;
                const nextTier = tierData.tier + 1;
                const nextGearType = GEAR_TYPES.find(g => g.tier === nextTier);
                if (nextGearType) {
                    performIntelligentEvolution(tierData, nextGearType, gearId);
                    hasEvolution = true;
                }
            }
        }
    }
    if (hasEvolution) {
        calculateProduction();
        updateDisplay();
        updatePyramidalGears();
        updateThickRings();
        updateShops();
        checkAchievements();
        checkQuests();
        saveGameState();
    }
}


function performIntelligentEvolution(fromTier, toTier, gearId) {
    const currentCount = gameState.gears[gearId] || 0;
    const packs = Math.floor(currentCount / EVOLUTION_COST);
    if (packs <= 0) return;

    const totalCost = packs * EVOLUTION_COST;
    gameState.gears[gearId] = currentCount - totalCost;
    if (gameState.gears[gearId] <= 0) delete gameState.gears[gearId];

    // On gagne packs engrenages du tier supérieur
    gameState.gears[toTier.id] = (gameState.gears[toTier.id] || 0) + packs;

    // Et packs anneaux du tier d'origine
    gameState.rings[fromTier.tier] = (gameState.rings[fromTier.tier] || 0) + packs;

    // Statistiques d'évolution
    gameState.gearEvolutions[gearId] = (gameState.gearEvolutions[gearId] || 0) + packs;
    gameState.totalEvolutions += packs;

    // Matériaux éventuels
    if (toTier.material) {
        gameState.materials[toTier.material] = (gameState.materials[toTier.material] || 0) + packs;
    }

    // Effets visuels : une animation, mais un toast qui indique le nombre
    showGearEvolutionEffect(fromTier, toTier);
    showRingCreationEffect(fromTier);
    showGoldToast(0, `🔄 Évolution x${packs}: ${fromTier.name} → ${toTier.name} + 💍 Anneau ${fromTier.name} ×${packs}`);
    updateQuestProgress('evolution_count', packs);
}


function showGearEvolutionEffect(fromTier, toTier) {
    const mainGear = $('#mainGear');
    if (!mainGear) return;

    const chain = document.createElement('div');
    chain.style.cssText = `position: absolute; top: 50%; left: 50%; width: 220px; height: 220px; border: 4px solid ${fromTier.color}; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; animation: chainEvolution 2s ease-in-out forwards; z-index: 5;`;

    const style = document.createElement('style');
    style.textContent = `@keyframes chainEvolution { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); border-color: ${fromTier.color}; } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); border-color: ${toTier.color}; } 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); border-color: ${toTier.color}; } }`;

    document.head.appendChild(style);
    mainGear.parentElement.appendChild(chain);
    setTimeout(() => {
        chain.remove();
        style.remove();
    }, 2000);
}

// EXPLOSION DE PIÈCES AMÉLIORÉE
function triggerCoinExplosion(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const explosion = document.createElement('div');
    explosion.className = 'coin-explosion';
    explosion.style.left = `${centerX}px`;
    explosion.style.top = `${centerY}px`;

    // Plus de pièces et animations plus variées
    for (let i = 0; i < 20; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';

        const angle = (i / 20) * 2 * Math.PI;
        const distance = 60 + Math.random() * 120;
        const finalX = Math.cos(angle) * distance;
        const finalY = Math.sin(angle) * distance;

        coin.style.left = '0px';
        coin.style.top = '0px';
        coin.style.setProperty('--final-x', `${finalX}px`);
        coin.style.setProperty('--final-y', `${finalY}px`);
        coin.style.animationDelay = `${Math.random() * 0.4}s`;
        coin.style.animationDuration = `${1 + Math.random() * 0.5}s`;

        explosion.appendChild(coin);
    }

    document.body.appendChild(explosion);

    setTimeout(() => {
        explosion.remove();
    }, 2000);
}

// ACHIEVEMENTS SÉCURISÉS
function checkAchievements() {
    if (!goldSystemEnabled) return;

    for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (gameState.achievements.unlocked.includes(achievementId)) continue;

        let unlocked = false;
        const req = achievement.requirement;

        switch (req.type) {
            case 'steam_total':
                unlocked = gameState.steamTotal >= req.value;
                break;
            case 'gear_total':
                unlocked = Object.values(gameState.gears).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'gear_tier':
                unlocked = Object.keys(gameState.gears).some(gearId => parseInt(gearId) >= req.value);
                break;
            case 'evolution_count':
                unlocked = gameState.totalEvolutions >= req.value;
                break;
            case 'artisan_total':
                unlocked = Object.values(gameState.artisans).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'brotherhood_total':
                unlocked = Object.values(gameState.brotherhoods).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'district_total':
                unlocked = Object.values(gameState.districts).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'conglomerate_total':
                unlocked = Object.values(gameState.conglomerates).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'replica_count':
                unlocked = gameState.replicas >= req.value;
                break;
            case 'clicks':
                unlocked = gameState.totalClicks >= req.value;
                break;
            case 'max_boost':
                unlocked = gameState.maxBoostReached >= req.value;
                break;
            case 'resets':
                unlocked = gameState.totalResets >= req.value;
                break;
            case 'ring_total':
                unlocked = Object.values(gameState.rings).reduce((sum, count) => sum + count, 0) >= req.value;
                break;
            case 'daily_quests_completed':
                unlocked = gameState.dailyQuestsCompleted >= req.value;
                break;
            case 'all_upgrades_max':
                unlocked = PLAYER_UPGRADES.every(upgrade => 
                    (gameState.playerUpgrades[upgrade.type] || 0) >= upgrade.maxLevel
                );
                break;
            case 'gold_total':
                (async () => {
                    try {
                        const goldAmount = await getGold();
                        if (goldAmount >= req.value && !gameState.achievements.unlocked.includes(achievementId)) {
                            unlockAchievement(achievementId);
                        }
                    } catch (error) {
                        console.warn('Failed to check gold achievement:', error);
                    }
                })();
                break;
        }

        if (unlocked) {
            unlockAchievement(achievementId);
        }
    }
}

function unlockAchievement(achievementId) {
    if (gameState.achievements.unlocked.includes(achievementId)) return;
    gameState.achievements.unlocked.push(achievementId);
    const achievement = ACHIEVEMENTS[achievementId];
    showGoldToast(0, `🏆 Succès débloqué: ${achievement.name}`);
    addRecentAchievement(`🏆 ${achievement.name}`, 0);
    saveGameState();
    updateAchievementsDisplay();
}

async function claimAchievement(achievementId) {
    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour réclamer les récompenses");
        return;
    }
    if (!gameState.achievements.unlocked.includes(achievementId) || gameState.achievements.claimed.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS[achievementId];
    try {
        if (achievement.reward.gold) {
            await addGold(achievement.reward.gold);
            gameState.achievements.claimed.push(achievementId);
            showGoldToast(achievement.reward.gold, `Récompense réclamée: ${achievement.name}`);
            addRecentAchievement(`💰 ${achievement.name}`, achievement.reward.gold);

            const achievementCard = $(`[data-achievement="${achievementId}"]`);
            if (achievementCard) {
                triggerCoinExplosion(achievementCard);
            }

            await updateGoldDisplay();
            saveGameState();
            updateAchievementsDisplay();
        }
    } catch (error) {
        console.error('Failed to claim achievement reward:', error);
        showGoldToast(0, "Erreur lors de la réclamation");
    }
}

function updateAchievementsDisplay() {
    const grid = $('#achievementGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
        const isUnlocked = gameState.achievements.unlocked.includes(achievementId);
        const isClaimed = gameState.achievements.claimed.includes(achievementId);

        const card = document.createElement('div');
        card.className = `achievement-card ${!isUnlocked ? 'locked' : ''} ${isClaimed ? 'claimed' : ''}`;
        card.setAttribute('data-achievement', achievementId);

        let statusInfo = '';
        if (!isUnlocked) {
            statusInfo = '<div style="color: #666; font-style: italic;">Succès Secret</div>';
        } else if (!isClaimed && achievement.reward.gold) {
            statusInfo = `<button onclick="claimAchievement('${achievementId}')" class="claim-button">Réclamer ${achievement.reward.gold} Or</button>`;
        } else if (isClaimed) {
            statusInfo = '<div style="color: var(--gold); font-weight: bold;">✓ Réclamé</div>';
        }

        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${isUnlocked ? achievement.name : '???'}</div>
            <div class="achievement-description">${isUnlocked ? achievement.description : 'Succès masqué - Continuez à jouer pour le découvrir!'}</div>
            ${statusInfo}
        `;

        if (isUnlocked) {
            card.addEventListener('click', () => {
                if (!card.querySelector('.claim-button')) {
                    showGoldToast(0, `${achievement.icon} ${achievement.name}: ${achievement.description}`);
                }
            });
        }
        grid.appendChild(card);
    }
}

function showAchievementsModal() {
    const modal = $('#achievementModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateAchievementsDisplay();
    }
}

function hideAchievementsModal() {
    const modal = $('#achievementModal');
    if (modal) modal.classList.add('hidden');
}

function updateGoldShop() {
    if (!gameState.unlockedShops.gold) return;
    const container = $('#goldShopItems');
    if (!container) return;
    container.innerHTML = '';

    GOLD_EXCHANGE_RATES.forEach(exchange => {
        const canAfford = gameState.steam >= exchange.steamCost;
        const isGoldEnabled = goldSystemEnabled;
        const item = document.createElement('div');
        item.className = 'shop-item gold-item';

        const borderColor = (canAfford && isGoldEnabled) ? 'var(--gold)' : '#666';
        const bgColor = isGoldEnabled ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(212, 175, 55, 0.2))' : 'linear-gradient(135deg, rgba(75, 85, 99, 0.6), rgba(55, 65, 81, 0.6))';

        item.style.cssText = `background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; padding: 16px; cursor: ${(canAfford && isGoldEnabled) ? 'pointer' : 'not-allowed'}; transition: all 0.3s ease; opacity: ${(canAfford && isGoldEnabled) ? '1' : '0.7'}; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1); margin-bottom: 8px;`;

        item.innerHTML = `
            <div style="font-family: 'Cinzel', serif; font-weight: bold; color: var(--gold); margin-bottom: 6px; font-size: 15px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);">${exchange.name}</div>
            <div style="font-family: 'Crimson Text', serif; color: var(--parchment); font-size: 13px; margin-bottom: 10px; line-height: 1.4;">
                ${exchange.description}${exchange.bonus ? '<br><strong style="color: var(--gold);">' + exchange.bonus + '</strong>' : ''}${!isGoldEnabled ? '<br><em style="color: #F08080;">Authentification requise</em>' : ''}
            </div>
            <div style="color: var(--gold); font-weight: bold; font-size: 14px; font-family: 'Cinzel', serif;">💨 ${formatNumber(exchange.steamCost)} → 🏆 ${exchange.goldReward} Or</div>
        `;

        if (canAfford && isGoldEnabled) {
            item.addEventListener('click', () => buyGold(exchange.id));
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-3px) scale(1.02)';
                item.style.boxShadow = '0 8px 16px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'none';
                item.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
            });
        } else if (!isGoldEnabled) {
            item.addEventListener('click', () => showGoldToast(0, "Connectez-vous pour échanger de l'or"));
        }
        container.appendChild(item);
    });
}

async function buyGold(exchangeId) {
    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour échanger de l'or");
        return;
    }
    const exchange = GOLD_EXCHANGE_RATES.find(e => e.id === exchangeId);
    if (!exchange || gameState.steam < exchange.steamCost) return;

    try {
        gameState.steam -= exchange.steamCost;
        gameState.steamTotal += exchange.steamCost;

        let goldReward = exchange.goldReward;

        // Système de chance amélioré
        const luckLevel = gameState.playerUpgrades.luck || 0;
        const luckChance = luckLevel * 0.05; // 5% par niveau
        if (Math.random() < luckChance) {
            goldReward *= 2;
            showGoldToast(goldReward, `🍀 Chance ! Double récompense ! ${exchange.bonus || ''}`);
            triggerCoinExplosion($('#goldExchange'));
        } else {
            showGoldToast(goldReward, `Conversion réussie ! ${exchange.bonus || ''}`);
        }

        await addGold(goldReward);
        updateDisplay();
        updateShops();
        checkAchievements();
        checkQuests();
        saveGameState();
    } catch (error) {
        gameState.steam += exchange.steamCost;
        gameState.steamTotal -= exchange.steamCost;
        showGoldToast(0, "Erreur de conversion, vapeur remboursée");
        console.error('Gold exchange failed:', error);
    }
}

// AUTHENTIFICATION ET AFFICHAGE SÉCURISÉS
async function initAuthentication() {
    try {
        console.log('🔐 Initializing authentication...');
        const user = await initSession();
        if (user) {
            console.log('✅ User authenticated:', user.email);
            const player = await initPlayer();
            if (player) {
                console.log('✅ Player initialized:', player.username);
                isAuthenticated = true;
                goldSystemEnabled = true;
                safeSetText('#authStatus', getDisplayName());
                safeSetStyle('#authStatus', 'color', '#90EE90');
                safeSetText('#goldSystemStatus', 'Opérationnel');
                safeSetStyle('#goldSystemStatus', 'color', '#90EE90');
                safeSetText('#username-display', getDisplayName());
                const authWarning = $('#authWarning');
                if (authWarning) authWarning.classList.add('hidden');
                return true;
            }
        }
        console.warn('⚠️ User not authenticated');
        isAuthenticated = false;
        goldSystemEnabled = false;
        safeSetText('#authStatus', 'Non connecté');
        safeSetStyle('#authStatus', 'color', '#F08080');
        safeSetText('#goldSystemStatus', 'Indisponible');
        safeSetStyle('#goldSystemStatus', 'color', '#F08080');
        const authWarning = $('#authWarning');
        if (authWarning) authWarning.classList.remove('hidden');
        const reconnectBtn = $('#reconnectBtn');
        if (reconnectBtn) safeSetStyle('#reconnectBtn', 'display', 'block');
        return false;
    } catch (error) {
        console.error('❌ Authentication error:', error);
        isAuthenticated = false;
        goldSystemEnabled = false;
        safeSetText('#authStatus', 'Erreur');
        safeSetStyle('#authStatus', 'color', '#F08080');
        safeSetText('#goldSystemStatus', 'Erreur de connexion');
        safeSetStyle('#goldSystemStatus', 'color', '#F08080');
        const authWarning = $('#authWarning');
        if (authWarning) authWarning.classList.remove('hidden');
        const reconnectBtn = $('#reconnectBtn');
        if (reconnectBtn) safeSetStyle('#reconnectBtn', 'display', 'block');
        return false;
    }
}

async function updateGoldDisplay() {
    if (!goldSystemEnabled) {
        safeSetText('#goldCounter', '⚠️');
        safeSetText('#goldTotalDisplay', 'Auth requise');
        return;
    }

    try {
        const goldAmount = await getGold();
        safeSetText('#goldCounter', goldAmount);
        safeSetText('#goldTotalDisplay', formatNumber(goldAmount));
    } catch (error) {
        console.error('Gold display error:', error);
        safeSetText('#goldCounter', '❌');
    }
}

async function refreshGoldDisplay() {
    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour accéder au système d'or");
        return;
    }
    try {
        await refreshGold();
        await updateGoldDisplay();
    } catch (error) {
        console.error('Gold refresh error:', error);
        showGoldToast(0, "Erreur de connexion au système d'or");
    }
}

function showGoldToast(amount, message) {
    document.querySelectorAll('.gold-toast').forEach(toast => toast.remove());
    const toast = document.createElement('div');
    toast.className = 'gold-toast';
    toast.innerHTML = `<div style="font-size: 24px; animation: pulse 2s infinite;">${amount > 0 ? '🏆' : (goldSystemEnabled ? '⚠️' : '🔐')}</div><div><div style="font-weight: bold; font-size: 14px;">${amount > 0 ? '+' + amount + ' Or' : 'Information'}</div><div style="font-size: 12px; opacity: 0.9;">${message}</div></div>`;
    document.body.appendChild(toast);
    if (amount > 0) addRecentAchievement(message, amount);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 600);
    }, 4000);
}

function addRecentAchievement(message, goldAmount) {
    gameState.recentAchievements.unshift({ message, goldAmount, timestamp: Date.now() });
    gameState.recentAchievements = gameState.recentAchievements.slice(0, 5);
    updateRecentAchievements();
}

function updateRecentAchievements() {
    const container = $('#recentAchievements');
    if (!container) return;

    if (gameState.recentAchievements.length === 0) {
        safeSetHTML('#recentAchievements', '<div style="font-size: 0.875rem; color: #9ca3af; text-align: center;">Aucun succès récent</div>');
        return;
    }

    const achievementsHTML = gameState.recentAchievements.map(achievement => 
        `<div onclick="showAchievementDetails('${achievement.message}')" style="font-size: 12px; color: var(--parchment); margin-bottom: 8px; padding: 8px; background: rgba(0, 0, 0, 0.4); border-radius: 6px; border: 1px solid var(--brass); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.backgroundColor='rgba(212, 175, 55, 0.1)'" onmouseout="this.style.backgroundColor='rgba(0, 0, 0, 0.4)'"><div style="color: var(--brass-light); font-weight: bold;">${achievement.goldAmount > 0 ? '+' + achievement.goldAmount + ' 🏆' : '🏆'}</div><div style="font-family: 'Crimson Text', serif;">${achievement.message}</div></div>`
    ).join('');

    safeSetHTML('#recentAchievements', achievementsHTML);
}

function showAchievementDetails(message) {
    const achievement = Object.values(ACHIEVEMENTS).find(a => message.includes(a.name) || message.includes(a.description));
    if (achievement) {
        showGoldToast(0, `${achievement.icon} ${achievement.name}: ${achievement.description}`);
    }
}

function updateMilestoneProgress() {
    const milestones = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 100000000, 1000000000, 10000000000];
    const nextMilestone = milestones.find(m => m > gameState.steamTotal) || milestones[milestones.length - 1];
    const progress = Math.min(100, (gameState.steamTotal / nextMilestone) * 100);

    safeSetStyle('#milestoneProgress', 'width', `${progress}%`);
    safeSetText('#nextMilestone', formatNumber(nextMilestone));
}

function saveGameState() {
    try {
        localStorage.setItem('steamClickerSave', JSON.stringify({
            ...gameState,
            lastSave: Date.now()
        }));
    } catch (error) {
        console.warn('Failed to save game state:', error);
    }
}

function saveUIState() {
    try {
        localStorage.setItem('steamClickerUI', JSON.stringify(uiState));
    } catch (error) {
        console.warn('Failed to save UI state:', error);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('steamClickerSave');
        if (saved) {
            const parsedSave = JSON.parse(saved);
            gameState = { ...gameState, ...parsedSave };

            // NOUVEAU : Assurer compatibilité avec production séparée
            if (gameState.steamPerSecondBoost === undefined) gameState.steamPerSecondBoost = 0;

            // Assurer compatibilité avec toutes les nouvelles fonctionnalités
            if (!gameState.rings) gameState.rings = {};
            if (!gameState.mode) gameState.mode = 'etabli'; // CHANGEMENT : 'laboratory' → 'etabli'
            if (gameState.clickBoost === undefined) gameState.clickBoost = 0;
            if (gameState.maxBoostReached === undefined) gameState.maxBoostReached = 0;
            if (gameState.lastClickTime === undefined) gameState.lastClickTime = 0;
            if (!gameState.playerUpgrades) gameState.playerUpgrades = {};
            if (gameState.playerShopUnlocked === undefined) gameState.playerShopUnlocked = false;
            if (!gameState.brotherhoods) gameState.brotherhoods = {};
            if (!gameState.districts) gameState.districts = {};
            if (!gameState.conglomerates) gameState.conglomerates = {};
            if (gameState.replicas === undefined) gameState.replicas = 1;
            if (!gameState.dailyQuests) gameState.dailyQuests = {};
            if (!gameState.globalQuests) gameState.globalQuests = {};
            if (!gameState.secretQuests) gameState.secretQuests = {};
            if (gameState.questsCompleted === undefined) gameState.questsCompleted = 0;
            if (gameState.dailyQuestsCompleted === undefined) gameState.dailyQuestsCompleted = 0;
            if (!gameState.dailyStats) gameState.dailyStats = {};

            // Migration ancien mode 'laboratory' vers 'etabli'
            if (gameState.mode === 'laboratory') {
                gameState.mode = 'etabli';
            }

            // Production hors-ligne avec or améliorée
            const offlineTime = Math.min((Date.now() - gameState.lastSave) / 1000, 7200); // Max 2h
            if (offlineTime > 60 && gameState.steamPerSecond > 0) {
                const totalProduction = gameState.steamPerSecond + gameState.steamPerSecondBoost;
                const offlineGain = Math.floor(totalProduction * offlineTime * 0.6); // 60% efficacité
                gameState.steam += offlineGain;
                gameState.steamTotal += offlineGain;

                if (goldSystemEnabled && offlineGain > 0) {
                    const offlineGold = Math.floor(offlineGain / 80000); // 80k vapeur = 1 or
                    if (offlineGold > 0) {
                        setTimeout(async () => {
                            try {
                                await addGold(offlineGold);
                                showGoldToast(offlineGold, `Production hors-ligne: ${formatNumber(offlineGain)} Vapeur + ${offlineGold} Or !`);
                                await updateGoldDisplay();
                            } catch (error) {
                                showGoldToast(0, `Production hors-ligne: ${formatNumber(offlineGain)} Vapeur !`);
                            }
                        }, 1500);
                    } else {
                        setTimeout(() => showGoldToast(0, `Production hors-ligne: ${formatNumber(offlineGain)} Vapeur !`), 1500);
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Failed to load game state:', error);
    }
}

function loadUIState() {
    try {
        const saved = localStorage.getItem('steamClickerUI');
        if (saved) {
            const parsedState = JSON.parse(saved);
            uiState = { ...uiState, ...parsedState };
        }
        setTimeout(applyUIState, 100);
    } catch (error) {
        console.warn('Failed to load UI state:', error);
        setTimeout(applyUIState, 100);
    }
}

function applyUIState() {
    const rightPanel = $('#rightPanel');
    const rightToggle = $('#rightToggle');

    if (rightPanel && rightToggle) {
        if (uiState.rightPanelCollapsed) {
            rightPanel.classList.add('collapsed');
            rightToggle.textContent = '◀';
            safeSetStyle('#rightPanelTitle', 'opacity', '0');
            safeSetStyle('#rightPanelContent', 'opacity', '0');
        } else {
            rightPanel.classList.remove('collapsed');
            rightToggle.textContent = '▶';
            safeSetStyle('#rightPanelTitle', 'opacity', '1');
            safeSetStyle('#rightPanelContent', 'opacity', '1');
        }
    }
}

function toggleRightPanel() {
    const panel = $('#rightPanel');
    const toggle = $('#rightToggle');
    if (!panel || !toggle) return;

    uiState.rightPanelCollapsed = !uiState.rightPanelCollapsed;

    if (uiState.rightPanelCollapsed) {
        panel.classList.add('collapsed');
        toggle.textContent = '◀';
        toggle.title = 'Ouvrir le dashboard';
        safeSetStyle('#rightPanelTitle', 'opacity', '0');
        safeSetStyle('#rightPanelContent', 'opacity', '0');
    } else {
        panel.classList.remove('collapsed');
        toggle.textContent = '▶';
        toggle.title = 'Fermer le dashboard';
        safeSetStyle('#rightPanelTitle', 'opacity', '1');
        safeSetStyle('#rightPanelContent', 'opacity', '1');
        setTimeout(() => {
            updateDisplay();
            updateRecentAchievements();
            updateDailyQuestDisplay();
        }, 500);
    }
    saveUIState();
}

// Permettre de réduire/agrandir le panneau de gauche (boutique)
function toggleLeftPanel() {
    const panel = document.getElementById('leftPanel');
    const toggle = document.getElementById('leftToggle');
    if (!panel || !toggle) return;
    uiState.leftPanelCollapsed = !uiState.leftPanelCollapsed;
    if (uiState.leftPanelCollapsed) {
        panel.classList.add('collapsed');
        toggle.textContent = '▶';
        toggle.title = 'Ouvrir la boutique';
        const titleEl = document.getElementById('leftPanelTitle');
        const contentEl = document.getElementById('leftPanelContent');
        if (titleEl) titleEl.style.opacity = '0';
        if (contentEl) contentEl.style.opacity = '0';
    } else {
        panel.classList.remove('collapsed');
        toggle.textContent = '◀';
        toggle.title = 'Fermer la boutique';
        const titleEl = document.getElementById('leftPanelTitle');
        const contentEl = document.getElementById('leftPanelContent');
        if (titleEl) titleEl.style.opacity = '1';
        if (contentEl) contentEl.style.opacity = '1';
        // Mettre à jour l'affichage après ouverture pour être certain que les infos sont fraîches
        setTimeout(() => {
            updateDisplay();
            updateShops();
        }, 500);
    }
    saveUIState();
}

// Remboursement total : supprime engrenages, anneaux, artisans et rembourse leur valeur en vapeur
function refundAllItems() {
    let refundSteam = 0;
    // Calculer valeur des engrenages
    for (const [gearIdStr, count] of Object.entries(gameState.gears)) {
        const gearId = parseInt(gearIdStr);
        const gearType = GEAR_TYPES.find(g => g.id === gearId);
        if (gearType) {
            refundSteam += gearType.cost * count;
        }
    }
    // Valeur des anneaux (10 engrenages par anneau)
    for (const [tierStr, ringCount] of Object.entries(gameState.rings)) {
        const tier = parseInt(tierStr);
        const gearType = GEAR_TYPES.find(g => g.tier === tier);
        if (gearType) {
            refundSteam += gearType.cost * 10 * ringCount;
        }
    }
    // Valeur des artisans (coût en vapeur + coût en engrenages qu'ils ont requis)
    for (const [artisanIdStr, count] of Object.entries(gameState.artisans)) {
        const artisanId = parseInt(artisanIdStr);
        const artisan = ARTISAN_BASE_TYPES.find(a => a.id === artisanId);
        if (artisan) {
            refundSteam += artisan.baseCost * count;
            const gearType = GEAR_TYPES.find(g => g.id === artisan.gearCostType);
            if (gearType) {
                refundSteam += gearType.cost * artisan.gearCostAmount * count;
            }
        }
    }
    // Vider les collections
    gameState.gears = {};
    gameState.rings = {};
    gameState.artisans = {};
    gameState.brotherhoods = {};
    gameState.districts = {};
    gameState.conglomerates = {};
    gameState.gearEvolutions = {};
    // Vider l'affichage des engrenages
    Object.keys(gearDisplayCounts).forEach(k => delete gearDisplayCounts[k]);
    // Ajouter la vapeur remboursée
    gameState.steam += refundSteam;
    gameState.steamTotal += refundSteam;
    // Recalculer la production
    calculateProduction();
    updateDisplay();
    updatePyramidalGears();
    updateThickRings();
    updateShops();
    updateWorkshopArtisans();
    showGoldToast(0, `💸 Remboursement total: +${formatNumber(refundSteam)} vapeur`);
    saveGameState();
}

// Réinitialiser la partie : purge la sauvegarde et incrémente le compteur de resets
function resetGame() {
    const newResets = (gameState.resets || 0) + 1;
    // Supprimer la sauvegarde existante
    localStorage.removeItem('steamClickerSave');
    // Réinitialiser l'état du jeu en conservant le nombre de resets
    gameState = {
        steam: 0,
        steamTotal: 0,
        steamPerSecond: 0,
        steamPerSecondBoost: 0,
        materials: {},
        gears: {},
        artisans: {},
        brotherhoods: {},
        districts: {},
        conglomerates: {},
        gearEvolutions: {},
        totalEvolutions: 0,
        totalClicks: 0,
        totalResets: newResets,
        rings: {},
        mode: 'etabli',
        replicas: 1,
        clickBoost: 0,
        maxBoostReached: 0,
        lastClickTime: 0,
        playerUpgrades: {},
        playerShopUnlocked: false,
        unlockedShops: { gear: true, gold: false, artisan: false, upgrade: false, replica: false },
        lastSave: Date.now(),
        achievements: { unlocked: [], claimed: [] },
        recentAchievements: [],
        firstClick: false,
        dailyQuests: {},
        globalQuests: {},
        secretQuests: {},
        questsCompleted: 0,
        dailyQuestsCompleted: 0,
        lastDailyReset: null,
        dailyStats: {},
        crankVelocity: 0,
        crankRotation: 0,
        resets: newResets,
        autoRing: {},
        buyFactorIndex: 0
    };
    // Enregistrer la nouvelle sauvegarde et recharger
    saveGameState();
    location.reload();
}

// Exporter la sauvegarde locale dans un fichier JSON
function exportSave() {
    const data = { gameState, uiState };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'steam_clicker_save.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showGoldToast(0, '💾 Sauvegarde exportée');
}

// Importer une sauvegarde depuis un fichier JSON
async function importSave(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.gameState) {
            // Fusionner les états en conservant les propriétés actuelles non présentes dans le fichier importé
            gameState = { ...gameState, ...data.gameState };
            uiState = { ...uiState, ...(data.uiState || {}) };
            // Correction : s'assurer que certaines propriétés essentielles existent
            if (!gameState.gears) gameState.gears = {};
            if (!gameState.artisans) gameState.artisans = {};
            if (!gameState.rings) gameState.rings = {};
            if (!gameState.autoRing) gameState.autoRing = {};
            if (gameState.buyFactorIndex === undefined) gameState.buyFactorIndex = 0;
            // Réenregistrer et mettre à jour l'affichage
            saveGameState();
            calculateProduction();
            updateDisplay();
            updatePyramidalGears();
            updateThickRings();
            updateShops();
            updateWorkshopArtisans();
            updateTierProductionPanel();
            showGoldToast(0, '💾 Sauvegarde importée');
        }
    } catch (err) {
        console.error('Erreur import de sauvegarde:', err);
        showGoldToast(0, '❌ Fichier de sauvegarde invalide');
    }
}


function gameLoop() {
    const totalProduction = gameState.steamPerSecond + gameState.steamPerSecondBoost; // NOUVEAU : production totale

    if (totalProduction > 0) {
        gameState.steam += totalProduction;
        gameState.steamTotal += totalProduction;
        updateDisplay();

        // Mise à jour quêtes de production
        updateQuestProgress('steam_daily', totalProduction);

        if (goldSystemEnabled && Math.random() < 0.1) checkAchievements();
        if (Math.random() < 0.05) checkQuests();
    }

    // Mettre à jour la manivelle (rotation + boost)
    updateCrank();
    // Diminuer légèrement le boost si aucune rotation
    updateClickBoost();
    // Produire des engrenages automatiquement via les artisans
    processArtisanCrafting(1);
    // Evolutions d'engrenages (anneaux) si auto-anneaux activé
    checkGearEvolution();
    // Les artisans ne disparaissent plus : la formation de confréries/districts
    // est désormais calculée à la volée dans updateWorkshopArtisans.
    if (Date.now() % 5000 < 1000) updateShops();
    if (Date.now() % 10000 < 1000) updateDailyQuestDisplay();
    saveGameState();
    saveUIState();
}

async function init() {
    try {
        console.log('🏆 Initializing S.T.E.A.M. Clicker ÉVOLUTION FINALE...');
        loadGameState();
        loadUIState();
        await initAuthentication();
        initDailyQuests();

        const mainGear = $('#mainGear');
        if (mainGear) {
            // CORRECTION : S'assurer que le gear principal est bien centré
            mainGear.style.position = 'absolute';
            mainGear.style.left = '50%';
            mainGear.style.top = '50%';
            mainGear.style.transform = 'translate(-50%, -50%)';

            mainGear.addEventListener('mousedown', async (e) => {
                if (e.button !== 0) return;
                handleMainGearClick();
                mainGear.style.transform = 'translate(-50%, -50%) scale(0.9)';
            });

            mainGear.addEventListener('mouseup', () => {
                isClicking = false;
                mainGear.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            mainGear.addEventListener('mouseleave', () => {
                isClicking = false;
                mainGear.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            mainGear.addEventListener('touchstart', (e) => {
                e.preventDefault();
                isClicking = true;
                gameState.lastClickTime = Date.now();
                handleMainGearClick();
            });

            mainGear.addEventListener('touchend', (e) => {
                e.preventDefault();
                isClicking = false;
                mainGear.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        }

        // Attacher les événements pour la manivelle et l'import de sauvegarde après que les éléments soient dans le DOM
        const crankHandle = document.getElementById('crankHandle');
        if (crankHandle) {
            crankHandle.addEventListener('wheel', handleCrankWheel);
        }
        const importInput = document.getElementById('importFileInput');
        if (importInput) {
            importInput.addEventListener('change', importSave);
        }

        calculateProduction();
        updateDisplay();
        updatePyramidalGears();
        updateThickRings();
        updateShops();
        updateWorkshopArtisans();
        updateReplicaVisuals();
        updateRecentAchievements();
        updateModeDisplay();
        updateShopsVisibility();
        updateDailyQuestDisplay();

        if (goldSystemEnabled) {
            checkAchievements();
            checkQuests();
            const today = new Date().toDateString();
            const lastBonus = localStorage.getItem('lastDailyBonus');
            if (lastBonus !== today) {
                try {
                    await addGold(5);
                    localStorage.setItem('lastDailyBonus', today);
                    showGoldToast(5, "Bonus quotidien d'atelier");
                    await updateGoldDisplay();
                } catch (error) {
                    console.warn('Failed to award daily bonus:', error);
                }
            }
        }

        if (gameState.firstClick) {
            const instructionPlaque = $('#instructionPlaque');
            if (instructionPlaque) instructionPlaque.classList.add('hidden');
        }

        setInterval(gameLoop, 1000);

        console.log('✅ S.T.E.A.M. Clicker ÉVOLUTION FINALE initialized!');
        console.log(`🎮 Mode actuel: ${gameState.mode}`);
        console.log(`🔄 Répliques: ${gameState.replicas}`);
        console.log(`👥 Artisans: ${Object.keys(gameState.artisans).length}`);
        console.log(`📋 Quêtes complétées: ${gameState.questsCompleted}`);
        console.log(`📊 Production statique: ${formatNumber(gameState.steamPerSecond)}/sec`);
        console.log(`⚡ Production boost: ${formatNumber(gameState.steamPerSecondBoost)}/sec`);

    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
}

// EXPORTS WINDOW
window.refreshGoldDisplay = refreshGoldDisplay;
window.reconnectAuth = async function() { location.reload(); };
window.showAchievementDetails = showAchievementDetails;
window.switchToEtabli = switchToEtabli;
window.switchToWorkshop = switchToWorkshop;
window.toggleRightPanel = toggleRightPanel;
window.toggleLeftPanel = toggleLeftPanel;
window.showAchievementsModal = showAchievementsModal;
window.hideAchievementsModal = hideAchievementsModal;
window.claimAchievement = claimAchievement;
window.saveGame = saveGameState;
window.refundAllItems = refundAllItems;
window.resetGame = resetGame;
window.exportSave = exportSave;
window.importSaveFile = function() {
    const input = document.getElementById('importFileInput');
    if (input) {
        input.value = null;
        input.click();
    }
};
window.refreshAllDisplays = async function() {
    updateDisplay();
    if (goldSystemEnabled) await refreshGoldDisplay();
    updatePyramidalGears();
    updateThickRings();
    updateShops();
    updateWorkshopArtisans();
    updateReplicaVisuals();
    updateRecentAchievements();
    updateDailyQuestDisplay();
    showGoldToast(0, "Affichages actualisés");
};

init();
