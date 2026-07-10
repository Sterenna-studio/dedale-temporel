// ═══════════════════════════════════════════════════════════
// STEAM CLICKER — ÉVOLUTION FINALE  |  build 2.0
// ═══════════════════════════════════════════════════════════

// ─── STUBS LOCAUX (pas de Supabase) ──────────────────────────
const _GOLD_KEY = 'steamClickerGold';
const _PLAYER_NAME = 'Inventeur';
function initSession()    { return Promise.resolve({ email: _PLAYER_NAME }); }
function initPlayer()     { return Promise.resolve({ username: _PLAYER_NAME }); }
function getDisplayName() { return _PLAYER_NAME; }
function getGold()        { return Promise.resolve(parseInt(localStorage.getItem(_GOLD_KEY)||'0',10)); }
function addGold(delta)   {
  const next = Math.max(0, parseInt(localStorage.getItem(_GOLD_KEY)||'0',10) + delta);
  localStorage.setItem(_GOLD_KEY, String(next));
  return Promise.resolve(next);
}
function refreshGold() { return getGold(); }

// ─── PHASES ─────────────────────────────────────────────────
//  1 → Artisan   (dès le début)
//  2 → Atelier   (100M vapeur totale)
//  3 → Chaîne    (premier prestige)
const PHASE_THRESHOLDS = {
  phase2: 100_000_000,   // 100M vapeur totale
  phase3: 1,             // prestige ≥ 1
};

// ─── ENGRENAGES (7 tiers) ────────────────────────────────────
// Ratio : coût ×12 / prod ×4 entre chaque tier
// → ratio prod/coût quasi-constant, progression fluide
const GEAR_TYPES = [
  { id:1, name:'Engrenage Bronze',     cost:100,        production:1,    tier:1, material:'bronze',  color:'#cd7f32', icon:'🟤' },
  { id:2, name:'Engrenage Fer',        cost:1_200,      production:4,    tier:2, material:'iron',    color:'#708090', icon:'⚙️'  },
  { id:3, name:'Engrenage Acier',      cost:14_400,     production:16,   tier:3, material:'steel',   color:'#4682b4', icon:'🔩'  },
  { id:4, name:'Turbine Titanium',     cost:172_800,    production:64,   tier:4, material:'titanium',color:'#c0c0c0', icon:'🔷'  },
  { id:5, name:'Générateur Aether',    cost:2_073_600,  production:256,  tier:5, material:'aether',  color:'#9370db', icon:'🔮'  },
  { id:6, name:'Réacteur Plasma',      cost:24_883_200, production:1024, tier:6, material:'plasma',  color:'#ff69b4', icon:'⚡'  },
  { id:7, name:'Processeur Quantique', cost:298_598_400,production:4096, tier:7, material:'quantum', color:'#00ffff', icon:'💠'  },
];

// ─── UNITÉS DE PRODUCTION (Phase 2) ─────────────────────────
// Chaque unité produit des engrenages du tier correspondant
const UNIT_TYPES = [
  { id:1, name:'Apprenti Vapeur',     tier:1, baseCost:50_000_000,   unitGearType:1, gearPerSec:0.5,  icon:'👨‍🔧', description:'Forge des engrenages Bronze' },
  { id:2, name:'Forgeron Maître',     tier:2, baseCost:500_000_000,  unitGearType:2, gearPerSec:0.5,  icon:'🔨', description:'Produit des engrenages Fer' },
  { id:3, name:'Ingénieur Turbine',   tier:3, baseCost:5_000_000_000,unitGearType:3, gearPerSec:0.5,  icon:'⚡', description:'Fabrique des engrenages Acier' },
  { id:4, name:'Technicien Quantique',tier:4, baseCost:5e10,         unitGearType:4, gearPerSec:0.5,  icon:'🧬', description:'Génère des Turbines Titanium' },
];

// ─── CHAÎNE DE MACHINES (Phase 3) ────────────────────────────
const MAX_CHAIN_SLOTS = 5;

// Styles de machines — tirés au prestige
const MACHINE_STYLES = [
  { id:'classic',  name:'Atelier Classique',    icon:'🏚️', tags:['meca'],          rarity:'common',
    bonus:{ prod:1.2, desc:'+20% production, -10% coût engrenages', costReduction:0.9 } },
  { id:'pyrotherm',name:'Forge Pyrotherm',       icon:'🔥', tags:['therm','meca'],  rarity:'rare',
    bonus:{ activeMult:1.8, desc:'×1.8 prod pendant phases actives (manivelle)' } },
  { id:'cryovap',  name:'Labo Cryovap',          icon:'❄️', tags:['cryo','meca'],   rarity:'rare',
    bonus:{ idleMult:2.5, noBoostDecay:true, desc:'Boost ne décroît pas, ×2.5 idle' } },
  { id:'galvanic', name:'Institut Galvanic',      icon:'⚡', tags:['meca','therm'],  rarity:'epic',
    bonus:{ connMult:1.5, activeMult:2.0, desc:'Connexions ×1.5, prod active ×2' } },
  { id:'naturis',  name:'Guilde Naturis',         icon:'🌿', tags:['idle'],          rarity:'epic',
    bonus:{ idleMult:3.0, gearProd:1.3, desc:'Idle ×3, production engrenages +30%' } },
  { id:'necro',    name:'Crypte Nécrotherm',      icon:'💀', tags:['therm','quant'], rarity:'legendary',
    bonus:{ perPrestige:2.0, absorbGhost:0.5, desc:'×2 par prestige, absorbe 50% prod fantômes' } },
  { id:'quantum',  name:'Processeur de Réalité',  icon:'🌌', tags:['quant'],         rarity:'legendary',
    bonus:{ allMult:3.0, desc:'×3 sur TOUTE la production' } },
];

// Connexions entre machines — tirées au prestige
const CONNECTION_TYPES = [
  { id:'heat_relay',   name:'Relais Thermique',       grade:'common',   icon:'🔥', tags:['therm'],
    desc:'Machine suivante +30% si tag Thermique', effect:{ nextProd:1.3, requireTag:'therm' } },
  { id:'gear_sync',    name:'Synchronisation Méca',   grade:'common',   icon:'⚙️', tags:['meca'],
    desc:'+15% prod si les deux machines sont Méca', effect:{ bothProd:1.15, requireBoth:'meca' } },
  { id:'cryo_pipe',    name:'Conduite Cryo',           grade:'rare',     icon:'❄️', tags:['cryo'],
    desc:'Boost ne décroît pas sur toute la chaîne si Cryo adjacent', effect:{ chainNoDecay:true } },
  { id:'amp_field',    name:'Champ Amplificateur',     grade:'rare',     icon:'✨', tags:[],
    desc:'+40% prod machine précédente transmis à la suivante', effect:{ relayPct:0.4 } },
  { id:'resonance',    name:'Résonance Industrielle',  grade:'epic',     icon:'💎', tags:[],
    desc:'×2.5 machine active si ≥2 nœuds fantômes', effect:{ ghostMult:2.5, requireGhosts:2 } },
  { id:'quantum_link', name:'Lien Quantique',          grade:'epic',     icon:'🌌', tags:['quant'],
    desc:'Toute la chaîne ×1.8', effect:{ chainMult:1.8 } },
  { id:'industrial_resonance', name:'Grande Résonance',grade:'legendary',icon:'⭐', tags:[],
    desc:'×4 si tous les tags de la chaîne sont différents', effect:{ uniqueTagMult:4.0 } },
];

// ─── BLUEPRINTS (persistent après prestige) ──────────────────
const BLUEPRINT_TYPES = [
  { id:'bp_transmission', name:'Transmission Basique', icon:'⚙️',
    desc:'Tous les nœuds Méca +8%', effect:{ mecaMult:1.08 } },
  { id:'bp_combustion',   name:'Surchauffe Maîtrisée', icon:'🔥',
    desc:'Nœuds Therm ×1.8 en phase active', effect:{ thermActiveMult:1.8 } },
  { id:'bp_cryo_idle',    name:'Condensation Cryo',    icon:'❄️',
    desc:'Idle sans perte de boost', effect:{ noDecayIdle:true } },
  { id:'bp_ghost_amp',    name:'Amplification Fantôme',icon:'👻',
    desc:'Nœuds fantômes produisent 15% au lieu de 8%', effect:{ ghostPct:0.15 } },
  { id:'bp_chain_sync',   name:'Synchronisation Chaîne',icon:'🔗',
    desc:'Toutes connexions +20%', effect:{ connBonus:1.2 } },
];

// ─── TAUX D'OR ───────────────────────────────────────────────
const GOLD_EXCHANGE_RATES = [
  { id:1, steamCost:10_000_000,   goldReward:1,    name:'Conversion Basique',  bonus:null },
  { id:2, steamCost:100_000_000,  goldReward:12,   name:'Conversion Groupée',  bonus:'+20%' },
  { id:3, steamCost:1_000_000_000,goldReward:150,  name:'Conversion Premium',  bonus:'+50%' },
  { id:4, steamCost:10_000_000_000,goldReward:2000,name:'Conversion VIP',      bonus:'+100%' },
];

// ─── UPGRADES JOUEUR ─────────────────────────────────────────
const PLAYER_UPGRADES = [
  { id:1, name:'Multiplicateur de Clic', type:'click_multiplier', baseCost:1,
    description:'Augmente la vapeur gagnée par clic', icon:'👆', maxLevel:20 },
  { id:2, name:'Transmission Améliorée', type:'transmission',      baseCost:2,
    description:'Réduit la perte de boost (-15% → -14%)',icon:'⚙️', maxLevel:10 },
  { id:3, name:'Capacité de Boost',      type:'boost_capacity',    baseCost:5,
    description:'Augmente le boost maximum (+10%)', icon:'🔋', maxLevel:10 },
  { id:4, name:'Efficacité Unités',      type:'unit_efficiency',   baseCost:10,
    description:'Unités Phase 2 produisent +15% d\'engrenages', icon:'👥', maxLevel:10 },
];

// ─── QUÊTES QUOTIDIENNES ─────────────────────────────────────
const DAILY_QUESTS = [
  { id:'daily_clicks_100',  name:'Manivelle Active',    description:'Cliquer 100 fois',          icon:'👆', reward:{gold:3},  requirement:{type:'clicks',value:100},       category:'daily' },
  { id:'daily_clicks_1000', name:'Maître Manivelle',    description:'Cliquer 1000 fois',         icon:'⚡', reward:{gold:15}, requirement:{type:'clicks',value:1000},      category:'daily' },
  { id:'daily_steam_10k',   name:'Production Journalière',description:'Générer 10K vapeur',      icon:'💨', reward:{gold:8},  requirement:{type:'steam_daily',value:10000},category:'daily' },
  { id:'daily_gear_buy',    name:'Achat d\'Équipement', description:'Acheter 5 engrenages',      icon:'⚙️', reward:{gold:10}, requirement:{type:'gear_buy_daily',value:5}, category:'daily' },
  { id:'daily_boost_150',   name:'Boost Supérieur',     description:'Atteindre 150% de boost',  icon:'🔥', reward:{gold:12}, requirement:{type:'max_boost_daily',value:150},category:'daily'},
];

const GLOBAL_QUESTS = [
  { id:'global_steam_100m', name:'Centurion de Vapeur', description:'Générer 100M vapeur totale',  icon:'🌟', reward:{gold:500},  requirement:{type:'steam_total',value:100_000_000}, category:'global' },
  { id:'global_unit_10',    name:'Équipe Complète',     description:'Posséder 10 unités Phase 2',  icon:'👥', reward:{gold:200},  requirement:{type:'unit_total',value:10},            category:'global' },
  { id:'global_prestige_1', name:'Premier Prestige',    description:'Effectuer un premier prestige',icon:'⚡',reward:{gold:1000}, requirement:{type:'prestige_count',value:1},         category:'global' },
  { id:'global_chain_3',    name:'Maître de la Chaîne', description:'Avoir 3 machines en chaîne',  icon:'🔗', reward:{gold:2000}, requirement:{type:'chain_length',value:3},           category:'global' },
];

const SECRET_QUESTS = [
  { id:'secret_idle_master',  name:'Maître de l\'Inaction', description:'???',icon:'😴', reward:{gold:150}, requirement:{type:'idle_time',value:86400}, category:'secret' },
  { id:'secret_speed_demon',  name:'Démon de Vitesse',      description:'???',icon:'⚡', reward:{gold:400}, requirement:{type:'max_boost',value:200},   category:'secret' },
  { id:'secret_necro_run',    name:'???',                   description:'???',icon:'💀', reward:{gold:2000},requirement:{type:'necro_chosen',value:1},  category:'secret' },
];

// ─── ACHIEVEMENTS ────────────────────────────────────────────
const ACHIEVEMENTS = {
  steam_1k:      { id:'steam_1k',      name:'Premier Souffle',       description:'Générer 1 000 vapeur',        icon:'💨', requirement:{type:'steam_total',value:1000},          reward:{gold:1}    },
  steam_100k:    { id:'steam_100k',    name:'Apprenti Ingénieur',    description:'Générer 100K vapeur',         icon:'⚙️', requirement:{type:'steam_total',value:100000},         reward:{gold:10}   },
  steam_10m:     { id:'steam_10m',     name:'Baron de la Vapeur',    description:'Générer 10M vapeur',          icon:'👑', requirement:{type:'steam_total',value:10_000_000},     reward:{gold:100}  },
  steam_100m:    { id:'steam_100m',    name:'Industriel Confirmé',   description:'Générer 100M vapeur',         icon:'🏭', requirement:{type:'steam_total',value:100_000_000},    reward:{gold:500}  },
  steam_1b:      { id:'steam_1b',      name:'Titan de la Vapeur',    description:'Générer 1B vapeur',           icon:'🌟', requirement:{type:'steam_total',value:1_000_000_000},  reward:{gold:5000} },
  first_gear:    { id:'first_gear',    name:'Premier Mécanisme',     description:'Acheter un engrenage',        icon:'⚙️', requirement:{type:'gear_total',value:1},               reward:{gold:2}    },
  gear_99:       { id:'gear_99',       name:'La Chaîne Maximale',    description:'99 engrenages d\'un tier',    icon:'🔗', requirement:{type:'gear_tier_99',value:1},             reward:{gold:200}  },
  phase2_unlock: { id:'phase2_unlock', name:'Maître de l\'Atelier',  description:'Débloquer la Phase 2',        icon:'🔨', requirement:{type:'phase',value:2},                    reward:{gold:1000} },
  first_prestige:{ id:'first_prestige',name:'La Première Révolution',description:'Effectuer un prestige',      icon:'⚡', requirement:{type:'prestige_count',value:1},            reward:{gold:2000} },
};

// ─── CONSTANTES DE BOOST ─────────────────────────────────────
const BOOST_TRANSMISSION_LOSS = 15;
const MAX_BOOST_PERCENTAGE    = 200;



// ─── ÉTAT DU JEU ─────────────────────────────────────────────
let gameState = {
  // Ressources
  steam: 0, steamTotal: 0,

  // Phase 1 — Artisan
  gears: {},          // { gearId: count }
  materials: {},      // { material: count }
  gearChains: {},     // { tierId: true } — chaîne débloquée à 99

  // Phase 2 — Atelier (déblocage à 100M)
  units: {},          // { unitId: count }
  pendingGears: {},   // { gearId: fractional } — engrenages en cours de prod

  // Phase 3 — Chaîne & Prestige
  phase: 1,
  prestigeCount: 0,
  chain: [],          // [{ styleId, isGhost, ghostProd, blueprintId }]
  connections: [],    // [{ typeId }] — connexions entre slots de la chaîne
  currentMachineStyle: null,
  blueprints: {},     // { blueprintId: true }

  // Boost manivelle

  // Progression
  totalClicks: 0, totalResets: 0,
  rings: {},
  replicas: 1,        // gardé pour compat

  // Shops
  unlockedShops: { gear: true, unit: false, chain: false, gold: false, upgrade: false },

  // Upgrades
  playerUpgrades: {}, playerShopUnlocked: false,

  // Quêtes & achievements
  achievements: { unlocked: [], claimed: [] },
  recentAchievements: [],
  firstClick: false,
  dailyQuests: {}, globalQuests: {}, secretQuests: {},
  questsCompleted: 0, dailyQuestsCompleted: 0,
  lastDailyReset: null,
  dailyStats: {},

  lastSave: Date.now(),
};

let uiState = { rightPanelCollapsed: false, prestigeDrawOpen: false };
let isAuthenticated = false;
let goldSystemEnabled = true;

// Boost
let boostInterval = null;
let isClicking = false;
let currentQuestTab = 'daily';

// ─── HELPER $ ─────────────────────────────────────────────────
function $(sel) {
  try { return document.querySelector(sel); }
  catch(e) { console.warn('Selector error:', sel); return null; }
}
function $$(sel) {
  try { return [...document.querySelectorAll(sel)]; }
  catch(e) { return []; }
}
function safeSetText(sel, val) {
  const el = $(sel); if (el) el.textContent = val;
}
function safeSetStyle(sel, prop, val) {
  const el = $(sel); if (el) el.style[prop] = val;
}



// ═══════════════════════════════════════════════════════════
// PRODUCTION & BOOST
// ═══════════════════════════════════════════════════════════

function getMaxBoost() { return 0; }

function getTransmissionLoss() {
  const base = BOOST_TRANSMISSION_LOSS;
  const red = (gameState.playerUpgrades.transmission || 0);
  return Math.max(1, base - red);
}

// Production de base des engrenages (Phase 1)
function calcGearProduction() {
  let total = 0;
  for (const [id, count] of Object.entries(gameState.gears)) {
    const gear = GEAR_TYPES.find(g => g.id === parseInt(id));
    if (gear && count > 0) {
      let prod = gear.production * count;
      // Chaîne activée à 99 : +50% prod pour ce tier
      if (gameState.gearChains[gear.tier]) prod *= 1.5;
      total += prod;
    }
  }
  return total;
}

// Production des unités Phase 2 (ajout de gears fractionnels)
function calcUnitGearProduction() {
  if (gameState.phase < 2) return 0;
  const unitEff = 1 + (gameState.playerUpgrades.unit_efficiency || 0) * 0.15;
  let totalSteam = 0;
  for (const [id, count] of Object.entries(gameState.units)) {
    if (!count) continue;
    const unit = UNIT_TYPES.find(u => u.id === parseInt(id));
    if (!unit) continue;
    const gearType = GEAR_TYPES.find(g => g.id === unit.unitGearType);
    if (!gearType) continue;
    const gearsPerSec = unit.gearPerSec * count * unitEff;
    totalSteam += gearsPerSec * gearType.production;
  }
  return totalSteam;
}

// Multiplicateur de chaîne (Phase 3)
function calcChainMultiplier() {
  if (gameState.phase < 3 || !gameState.chain.length) return 1;
  let mult = 1;
  const style = MACHINE_STYLES.find(s => s.id === gameState.currentMachineStyle);
  if (!style) return 1;

  // Bonus du style actif
  if (style.bonus.prod)       mult *= style.bonus.prod;
  if (style.bonus.allMult)    mult *= style.bonus.allMult;

  // Bonus per prestige (Nécrotherm)
  if (style.bonus.perPrestige && gameState.prestigeCount > 0)
    mult *= Math.pow(style.bonus.perPrestige, gameState.prestigeCount);

  // Absorption nœuds fantômes (Nécrotherm)
  if (style.bonus.absorbGhost) {
    const ghostProd = gameState.chain
      .filter(n => n.isGhost)
      .reduce((s, n) => s + (n.ghostProd || 0), 0);
    mult += ghostProd * style.bonus.absorbGhost / Math.max(1, calcGearProduction() + calcUnitGearProduction());
  }

  // Connexions
  let connMult = 1;
  for (const conn of (gameState.connections || [])) {
    const ct = CONNECTION_TYPES.find(c => c.id === conn.typeId);
    if (!ct) continue;
    if (ct.effect.chainMult)     connMult *= ct.effect.chainMult;
    if (ct.effect.ghostMult && gameState.chain.filter(n=>n.isGhost).length >= (ct.effect.requireGhosts||0))
      connMult *= ct.effect.ghostMult;
  }
  // Blueprint bonus sur connexions
  if (gameState.blueprints.bp_chain_sync) connMult *= 1.2;
  mult *= connMult;

  // Blueprints
  if (gameState.blueprints.bp_cryo_idle || style.bonus.noBoostDecay) {
    // pas d'effet sur mult mais empêche decay → géré dans le boost
  }

  return Math.max(1, mult);
}

function calculateProduction() {
  const gearProd = calcGearProduction();
  const unitProd = calcUnitGearProduction();
  const staticProd = (gearProd + unitProd) * calcChainMultiplier();
  gameState.steamPerSecond = staticProd;

  // Boost manivelle
  const maxBoost = getMaxBoost();
  let boostMult = 1;
  if (gameState.currentMachineStyle) {
    const style = MACHINE_STYLES.find(s => s.id === gameState.currentMachineStyle);
    if (style && style.bonus.activeMult && boostPct > 0) boostMult = style.bonus.activeMult;
    if (style && style.bonus.idleMult   && boostPct === 0) boostMult = style.bonus.idleMult;
  }
}

// ─── CLIC (manivelle) ──────────────────────────────────────
function handleClick() {
  const clickMult = 1 + (gameState.playerUpgrades.click_multiplier || 0) * 0.1;
  const baseGain  = Math.max(1, Math.floor(gameState.steamPerSecond * 0.01));
  gameState.steam += baseGain * clickMult;
  gameState.steamTotal += baseGain * clickMult;
  gameState.totalClicks++;
  if (!gameState.firstClick) gameState.firstClick = true;
  updateQuestProgress('clicks', 1);
  updateDisplay();
  checkAchievements();
}

function handleWheel(delta) {
  updateDisplay();
  calculateProduction();
}

function getBoostDecayRate() {
  return 0;
}

function decayBoost() {}

function getCostReduction() {
  const style = MACHINE_STYLES.find(s => s.id === gameState.currentMachineStyle);
  let r = 1;
  if (style && style.bonus.costReduction) r *= style.bonus.costReduction;
  return r;
}

// Coût affiché d\'un engrenage
function getGearCost(gearId) {
  const gear = GEAR_TYPES.find(g => g.id === gearId);
  if (!gear) return 0;
  const owned = gameState.gears[gearId] || 0;
  return Math.floor(gear.cost * getCostReduction() * Math.pow(1.15, owned));
}

// ─── Phase 2 : Acheter unité ──────────────────────────────
async function buyUnit(unitId) {
  if (gameState.phase < 2) return;
  const unit = UNIT_TYPES.find(u => u.id === unitId);
  if (!unit) return;
  const owned  = gameState.units[unitId] || 0;
  const cost   = Math.floor(unit.baseCost * Math.pow(1.12, owned));
  if (gameState.steam < cost) return;

  gameState.steam     -= cost;
  gameState.steamTotal += cost;
  gameState.units[unitId] = (gameState.units[unitId] || 0) + 1;

  calculateProduction();
  updateDisplay();
  updateShops();
  checkAchievements();
  updateQuestProgress('unit_total', getTotalUnits());
  saveGameState();
}

function getTotalUnits() {
  return Object.values(gameState.units).reduce((s,v)=>s+v,0);
}

function getUnitCost(unitId) {
  const unit = UNIT_TYPES.find(u => u.id === unitId);
  if (!unit) return 0;
  const owned = gameState.units[unitId] || 0;
  return Math.floor(unit.baseCost * Math.pow(1.12, owned));
}

// ─── Refund tous les engrenages ───────────────────────────
function refundAllItems() {
  let refund = 0;
  Object.keys(gameState.gears).forEach(id => {
    const gear = GEAR_TYPES.find(g => g.id === parseInt(id));
    if (gear) refund += (gameState.gears[id] || 0) * gear.cost * 0.5;
    gameState.gears[id] = 0;
  });
  gameState.materials = {};
  gameState.gearChains = {};
  gameState.steam += refund;
  calculateProduction();
  updateDisplay();
  updateShops();
  saveGameState();
  showToast(`💸 Remboursé : ${formatNumber(Math.floor(refund))} vapeur`, '#cd7f32');
}
window.refundAllItems = refundAllItems;

// ─── Reset ────────────────────────────────────────────────
function resetGame() {
  if (!confirm('Réinitialiser la partie ? Action irréversible.')) return;
  localStorage.removeItem('steamClickerSave');
  localStorage.removeItem('steamClickerUI');
  localStorage.removeItem('steamClickerGold');
  location.reload();
}
window.resetGame = resetGame;

// ─── Vérif déblocage phases ───────────────────────────────
function checkPhaseUnlocks() {
  if (gameState.phase === 1 && gameState.steamTotal >= PHASE_THRESHOLDS.phase2) {
    gameState.phase = 2;
    gameState.unlockedShops.unit = true;
    showToast('🏭 Phase 2 débloquée — L\'Atelier !', '#5b9bd5');
    checkAchievements();
    updatePhaseUI();
  }
}



// ═══════════════════════════════════════════════════════════
// PRESTIGE & CHAÎNE
// ═══════════════════════════════════════════════════════════

// ─── Lancer le prestige ───────────────────────────────────
function openPrestigeModal() {
  if (gameState.phase < 2) {
    showToast('Le prestige requiert la Phase 2 (100M vapeur)', '#e05050');
    return;
  }
  // Affiche le tirage de 3 machines
  const draw = drawMachineCards();
  renderPrestigeModal(draw);
  document.getElementById('prestigeModal').classList.add('show');
}
window.openPrestigeModal = openPrestigeModal;

function closePrestigeModal() {
  document.getElementById('prestigeModal')?.classList.remove('show');
}
window.closePrestigeModal = closePrestigeModal;

// ─── Tirage de 3 machines (pondéré par rareté) ────────────
function drawMachineCards() {
  const weights = { common:60, rare:30, epic:8, legendary:2 };
  const pool = [...MACHINE_STYLES];
  // exclure style déjà actif si chaîne > 0
  const excluded = gameState.chain.map(n => n.styleId);
  const available = pool.filter(s => !excluded.includes(s.id));

  const weighted = [];
  for (const s of available) {
    const w = weights[s.rarity] || 10;
    for (let i = 0; i < w; i++) weighted.push(s);
  }

  const draw = [];
  const used = new Set();
  let attempts = 0;
  while (draw.length < 3 && attempts < 200) {
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    if (!used.has(pick.id)) { draw.push(pick); used.add(pick.id); }
    attempts++;
  }
  // S'assurer d'avoir 3 cartes
  while (draw.length < 3) draw.push(MACHINE_STYLES[draw.length % MACHINE_STYLES.length]);
  return draw;
}

// ─── Tirage de 3 connexions ───────────────────────────────
function drawConnectionCards() {
  const weights = { common:60, rare:25, epic:12, legendary:3 };
  const weighted = [];
  for (const c of CONNECTION_TYPES) {
    const w = weights[c.grade] || 10;
    for (let i = 0; i < w; i++) weighted.push(c);
  }
  const draw = []; const used = new Set();
  let attempts = 0;
  while (draw.length < 3 && attempts < 200) {
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    if (!used.has(pick.id)) { draw.push(pick); used.add(pick.id); }
    attempts++;
  }
  return draw;
}

// ─── Confirmer le choix de machine ────────────────────────
function chooseMachine(styleId) {
  const style = MACHINE_STYLES.find(s => s.id === styleId);
  if (!style) return;

  // Condenser la machine actuelle en nœud fantôme
  if (gameState.currentMachineStyle) {
    const ghostProd = gameState.steamPerSecond * 0.08; // 8% de sa prod au moment du prestige
    gameState.chain.push({
      styleId: gameState.currentMachineStyle,
      isGhost: true,
      ghostProd,
    });
  }

  // Débloquer blueprint de l'ancienne machine
  const oldStyle = MACHINE_STYLES.find(s => s.id === gameState.currentMachineStyle);
  if (oldStyle) unlockBlueprintForStyle(oldStyle.id);

  // Activer nouvelle machine
  gameState.currentMachineStyle = styleId;
  gameState.prestigeCount++;

  // Débloquer Phase 3 au premier prestige
  if (gameState.prestigeCount === 1) {
    gameState.phase = Math.max(gameState.phase, 3);
    gameState.unlockedShops.chain = true;
    showToast('⛓ Phase 3 débloquée — La Chaîne !', '#a78bfa');
  }

  // Reset partiel
  gameState.steam          = 0;
  gameState.steamPerSecond = 0;
  gameState.gears          = {};
  gameState.materials      = {};
  gameState.gearChains     = {};
  gameState.units          = {};
  gameState.pendingGears   = {};
  // On garde : blueprints, chain, prestigeCount, steamTotal, achievements

  // Secret quest Nécrotherm
  if (styleId === 'necro') updateQuestProgress('necro_chosen', 1);

  updateQuestProgress('prestige_count', gameState.prestigeCount);
  checkAchievements();
  closePrestigeModal();

  // Proposer une connexion si chaîne ≥ 2
  if (gameState.chain.length >= 1) {
    setTimeout(() => openConnectionModal(), 600);
  } else {
    showToast(`⚡ Run ${gameState.prestigeCount + 1} — ${style.name} !`, '#a78bfa');
    calculateProduction();
    updateDisplay();
    updateAllShops();
    saveGameState();
  }
}
window.chooseMachine = chooseMachine;

function unlockBlueprintForStyle(styleId) {
  const bpMap = {
    classic:  'bp_transmission',
    pyrotherm:'bp_combustion',
    cryovap:  'bp_cryo_idle',
    galvanic: 'bp_chain_sync',
    necro:    'bp_ghost_amp',
  };
  const bp = bpMap[styleId];
  if (bp && !gameState.blueprints[bp]) {
    gameState.blueprints[bp] = true;
    const bpDef = BLUEPRINT_TYPES.find(b => b.id === bp);
    if (bpDef) showToast(`📐 Blueprint débloqué : ${bpDef.name}`, '#4CAF50');
  }
}

// ─── Connexion entre machines ─────────────────────────────
let pendingConnectionDraw = null;
function openConnectionModal() {
  pendingConnectionDraw = drawConnectionCards();
  renderConnectionModal(pendingConnectionDraw);
  document.getElementById('connectionModal')?.classList.add('show');
}
window.openConnectionModal = openConnectionModal;

function closeConnectionModal() {
  document.getElementById('connectionModal')?.classList.remove('show');
}
window.closeConnectionModal = closeConnectionModal;

function chooseConnection(connId) {
  const conn = CONNECTION_TYPES.find(c => c.id === connId);
  if (!conn) return;

  // Ajouter connexion entre dernier fantôme et machine active
  if (!gameState.connections) gameState.connections = [];
  gameState.connections.push({ typeId: connId });

  closeConnectionModal();
  showToast(`🔗 Connexion : ${conn.name}`, '#5b9bd5');

  calculateProduction();
  updateDisplay();
  updateAllShops();
  updateChainDisplay();
  updateQuestProgress('chain_length', gameState.chain.length + 1);
  saveGameState();
}
window.chooseConnection = chooseConnection;



// ═══════════════════════════════════════════════════════════
// RENDU UI
// ═══════════════════════════════════════════════════════════

function formatNumber(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'k';
  return Math.floor(n).toString();
}

// ─── Affichage principal ──────────────────────────────────
function updateDisplay() {
  safeSetText('#steamCount',      formatNumber(Math.floor(gameState.steam)));
  safeSetText('#steamPerSec',     formatNumber(totalProd) + '/s');
  safeSetText('#steamTotal',      formatNumber(gameState.steamTotal));
  safeSetText('#totalClicks',     gameState.totalClicks);
  safeSetText('#prestigeCount',   gameState.prestigeCount);
  safeSetText('#currentPhase',    `Phase ${gameState.phase}`);
  safeSetText('#chainMult',       '×' + calcChainMultiplier().toFixed(1));

  // Phase 2 progress
  if (gameState.phase < 2) {
    const pct = Math.min(100, (gameState.steamTotal / PHASE_THRESHOLDS.phase2) * 100);
    const bar = $('#phase2Progress');
    if (bar) bar.style.width = pct.toFixed(1) + '%';
    safeSetText('#phase2ProgressText', `${formatNumber(gameState.steamTotal)} / ${formatNumber(PHASE_THRESHOLDS.phase2)}`);
  }

  updateBoostDisplay();
  updateGoldDisplay();
  syncAliasIds();
  updateMilestone();
}


// ── Alias IDs (compat right panel existant) ──────────────────
function syncAliasIds() {
  const map = {
    'steamCounter':         () => formatNumber(Math.floor(gameState.steam)),
    'materialCount':        () => Object.values(gameState.materials||{}).reduce((a,b)=>a+b,0),
    'goldTotalDisplay':     async () => { const g = await getGold(); return g; },
    'gearCount':            () => Object.values(gameState.gears||{}).reduce((a,b)=>a+b,0),
    'artisanCount':         () => getTotalUnits(),
    'ringCountDisplay':     () => gameState.prestigeCount,
    'steamTotalDisplay':    () => formatNumber(gameState.steamTotal),
    'steamTotal':           () => formatNumber(gameState.steamTotal),
  };
  for (const [id, fn] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (!el) continue;
    const val = fn();
    if (val instanceof Promise) val.then(v => { el.textContent = v; });
    else el.textContent = val;
  }
}


function updateMilestone() {
  const milestones = [1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e12];
  const next = milestones.find(m => m > gameState.steamTotal) || milestones[milestones.length-1];
  safeSetText('#nextMilestone', formatNumber(next) + ' 💨');
  const prev = milestones[milestones.indexOf(next)-1] || 0;
  const pct = Math.min(100, ((gameState.steamTotal - prev) / (next - prev)) * 100);
  safeSetStyle('#milestoneProgress', 'width', pct.toFixed(1) + '%');
}

function updateBoostDisplay() {}

// ─── Shop engrenages ─────────────────────────────────────
function updateGearShop() {
  const container = $('#gearShopItems');
  if (!container) return;
  container.innerHTML = '';
  for (const gear of GEAR_TYPES) {
    const owned = gameState.gears[gear.id] || 0;
    const cost  = getGearCost(gear.id);
    const canAfford = gameState.steam >= cost;
    const hasChain  = gameState.gearChains[gear.tier] || false;

    const item = document.createElement('div');
    item.className = 'shop-item' + (canAfford ? '' : ' locked');
    item.innerHTML = `
      <div class="shop-item-icon" style="color:${gear.color}">${gear.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${gear.name}
          ${hasChain ? '<span class="chain-badge">🔗 ×1.5</span>' : ''}
        </div>
        <div class="shop-item-desc">${gear.production}/s · T${gear.tier}</div>
        <div class="shop-item-count">Possédés : <b>${owned}</b>${owned >= 99 ? ' ✅ MAX' : ''}</div>
      </div>
      <div class="shop-item-right">
        <div class="shop-item-cost ${canAfford ? 'can-afford' : 'cant-afford'}">${formatNumber(cost)} 💨</div>
        <button onclick="buyGear(${gear.id})" ${canAfford ? '' : 'disabled'}
                class="buy-btn">Acheter</button>
        <button onclick="buyGear(${gear.id}, 10)" ${gameState.steam >= cost*10 ? '' : 'disabled'}
                class="buy-btn buy-10">×10</button>
      </div>
    `;
    container.appendChild(item);
  }
}

// ─── Shop unités Phase 2 ──────────────────────────────────
function updateUnitShop() {
  const container = $('#unitShopItems');
  if (!container) return;
  if (gameState.phase < 2) { container.innerHTML = '<p class="locked-msg">🔒 Déblocage à 100M vapeur totale</p>'; return; }
  container.innerHTML = '';
  for (const unit of UNIT_TYPES) {
    const owned    = gameState.units[unit.id] || 0;
    const cost     = getUnitCost(unit.id);
    const canAfford = gameState.steam >= cost;
    const gearType  = GEAR_TYPES.find(g => g.id === unit.unitGearType);

    const item = document.createElement('div');
    item.className = 'shop-item' + (canAfford ? '' : ' locked');
    item.innerHTML = `
      <div class="shop-item-icon">${unit.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${unit.name}</div>
        <div class="shop-item-desc">${unit.description}</div>
        <div class="shop-item-count">
          ${unit.gearPerSec}/s × ${gearType?.production||0} = <b>${(unit.gearPerSec*(gearType?.production||0)).toFixed(1)}</b> vapeur/s/unité
          · Possédées : <b>${owned}</b>
        </div>
      </div>
      <div class="shop-item-right">
        <div class="shop-item-cost ${canAfford ? 'can-afford' : 'cant-afford'}">${formatNumber(cost)} 💨</div>
        <button onclick="buyUnit(${unit.id})" ${canAfford ? '' : 'disabled'} class="buy-btn">Acheter</button>
      </div>
    `;
    container.appendChild(item);
  }
}

// ─── Affichage chaîne (Phase 3) ───────────────────────────
function updateChainDisplay() {
  const container = $('#chainDisplay');
  if (!container) return;
  if (gameState.phase < 3) {
    container.innerHTML = '<p class="locked-msg">🔒 Déblocage au premier prestige</p>';
    return;
  }
  container.innerHTML = '';
  const chain  = gameState.chain || [];
  const nodes  = [...chain.map(n => ({...n})), { styleId: gameState.currentMachineStyle, isGhost: false }];

  nodes.forEach((node, idx) => {
    const style = MACHINE_STYLES.find(s => s.id === node.styleId);
    if (!style) return;
    const tags  = style.tags.map(t => `<span class="tag-pill tag-${t}">${t}</span>`).join('');

    // Connexion avant ce nœud
    if (idx > 0) {
      const conn = (gameState.connections || [])[idx - 1];
      const ct   = conn ? CONNECTION_TYPES.find(c => c.id === conn.typeId) : null;
      const connEl = document.createElement('div');
      connEl.className = 'chain-connector' + (ct ? ' active' : '');
      connEl.innerHTML = ct ? `<div class="conn-card grade-${ct.grade}" title="${ct.desc}">${ct.icon}<span>${ct.grade}</span></div>` : '<div class="conn-empty">+</div>';
      container.appendChild(connEl);
    }

    // Nœud
    const el = document.createElement('div');
    el.className = 'chain-node' + (node.isGhost ? ' ghost' : ' active');
    el.innerHTML = `
      <div class="node-run-badge">${node.isGhost ? 'Fantôme' : 'Actif'}</div>
      <div class="node-icon">${style.icon}</div>
      <div class="node-name">${style.name}</div>
      <div class="node-tags">${tags}</div>
      <div class="node-prod">${node.isGhost ? formatNumber(node.ghostProd||0)+'/s' : formatNumber(gameState.steamPerSecond)+'/s'}</div>
    `;
    container.appendChild(el);
  });

  // Slot futur
  const futureConn = document.createElement('div');
  futureConn.className = 'chain-connector';
  futureConn.innerHTML = '<div class="conn-empty" title="Disponible au prochain prestige">+</div>';
  container.appendChild(futureConn);
  const futureEl = document.createElement('div');
  futureEl.className = 'chain-node future';
  futureEl.innerHTML = '<div class="node-icon">？</div><div class="node-name">Prochain run</div>';
  container.appendChild(futureEl);
}

// ─── Blueprints ───────────────────────────────────────────
function updateBlueprintDisplay() {
  const container = $('#blueprintList');
  if (!container) return;
  container.innerHTML = '';
  for (const bp of BLUEPRINT_TYPES) {
    const active = !!gameState.blueprints[bp.id];
    const el = document.createElement('div');
    el.className = 'blueprint-item' + (active ? ' active' : ' locked');
    el.innerHTML = `<span>${bp.icon}</span><div><b>${bp.name}</b><br><small>${bp.desc}</small></div><span>${active ? '✅' : '🔒'}</span>`;
    container.appendChild(el);
  }
}
// alias

// ─── Phase UI ────────────────────────────────────────────
function updatePhaseUI() {
  // Tabs
  $$('.phase-tab').forEach(t => {
    const ph = parseInt(t.dataset.phase||'1');
    t.classList.toggle('unlocked', gameState.phase >= ph);
    t.classList.toggle('locked',   gameState.phase < ph);
  });
  // Onglet actif par défaut
  const activeTab = $(`.phase-tab[data-phase="${gameState.phase}"]`);
  if (activeTab) activeTab.click();
}

// ─── Toast ────────────────────────────────────────────────
function showToast(msg, color='#5b9bd5') {
  const t = document.createElement('div');
  t.className = 'steam-toast';
  t.style.borderColor = color;
  t.style.color = color;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ─── Gold toast (compat) ──────────────────────────────────
function showGoldToast(amount, msg) { showToast(`💰 ${msg}`, '#cd7f32'); }

// ─── Affichage modal prestige ─────────────────────────────
function renderPrestigeModal(draw) {
  const zone = $('#prestigeCards');
  if (!zone) return;
  const GRADE_LABELS = { common:'⚪ Commun', rare:'🟢 Rare', epic:'🔵 Épique', legendary:'🟣 Légendaire' };
  zone.innerHTML = draw.map(style => {
    const tags = style.tags.map(t => `<span class="tag-pill tag-${t}">${t}</span>`).join('');
    const ghostBonusText = gameState.chain.length > 0 && style.bonus.absorbGhost
      ? `<div class="mc-synflag">✦ ×${Math.pow(style.bonus.perPrestige||1, gameState.prestigeCount).toFixed(1)} avec ${gameState.chain.length} fantôme(s)</div>` : '';
    return `
      <div class="m-card g-${style.rarity}" onclick="chooseMachine('${style.id}')">
        <div class="mc-grade">${GRADE_LABELS[style.rarity]||style.rarity}</div>
        <div class="mc-icon">${style.icon}</div>
        <div class="mc-name">${style.name}</div>
        <div class="mc-tags">${tags}</div>
        <div class="mc-bonus">${style.bonus.desc}</div>
        ${ghostBonusText}
        <button class="mc-btn">CHOISIR</button>
      </div>`;
  }).join('');
}

// ─── Affichage modal connexion ────────────────────────────
function renderConnectionModal(draw) {
  const zone = $('#connectionCards');
  if (!zone) return;
  const GRADE_LABELS = { common:'⚪ Commun', rare:'🟢 Rare', epic:'🔵 Épique', legendary:'🟣 Légendaire' };
  zone.innerHTML = draw.map(conn => `
    <div class="m-card g-${conn.grade}" onclick="chooseConnection('${conn.id}')">
      <div class="mc-grade">${GRADE_LABELS[conn.grade]||conn.grade}</div>
      <div class="mc-icon">${conn.icon}</div>
      <div class="mc-name">${conn.name}</div>
      <div class="mc-bonus">${conn.desc}</div>
      <button class="mc-btn">CHOISIR</button>
    </div>`).join('');
}



function updateAllShops() {
  updateGearShop();
  updateUnitShop();
  updateChainDisplay();
  updateBlueprintDisplay();
  updateSynergyDisplay();
  updateGoldShop();
  updatePlayerShop();
}
function updateShops() { updateAllShops(); }


function updateSynergyDisplay() {
  const list = $('#synergyList');
  if (!list) return;
  if (gameState.phase < 3 || !gameState.currentMachineStyle) {
    list.innerHTML = '<div class="syn-item"><div class="syn-dot" style="background:#2a3a4a"></div><span class="syn-off">Phase 3 requise</span></div>';
    return;
  }
  const style = MACHINE_STYLES.find(s => s.id === gameState.currentMachineStyle);
  const tags  = style ? style.tags : [];
  const ghosts= (gameState.chain||[]).filter(n=>n.isGhost).length;
  const bps   = gameState.blueprints||{};

  const syns = [
    { on: tags.includes('meca') && bps.bp_transmission, label:'Méca +8% (Blueprint Transmission)', color:'#5b9bd5' },
    { on: tags.includes('therm') && bps.bp_combustion,  label:'Therm ×1.8 actif (Blueprint Surchauffe)', color:'#e8803a' },
    { on: tags.includes('cryo')  || bps.bp_cryo_idle,   label:'Boost idle sans décroissance (Cryo)', color:'#4dd0e1' },
    { on: ghosts >= 2 && (gameState.connections||[]).some(c=>c.typeId==='resonance'),
      label:`Résonance ×2.5 (${ghosts} fantômes)`, color:'#a78bfa' },
    { on: bps.bp_ghost_amp, label:'Fantômes 15% prod (Blueprint Fantôme)', color:'#c4b5fd' },
    { on: bps.bp_chain_sync, label:'Connexions +20% (Blueprint Chaîne)', color:'#7fce82' },
  ];
  const active = syns.filter(s=>s.on);
  const inactive = syns.filter(s=>!s.on);
  list.innerHTML = [
    ...active.map(s=>`<div class="syn-item"><div class="syn-dot" style="background:${s.color}"></div><span class="syn-on">${s.label}</span></div>`),
    ...inactive.slice(0,2).map(s=>`<div class="syn-item"><div class="syn-dot" style="background:#1a2a3a"></div><span class="syn-off">${s.label}</span></div>`),
  ].join('') || '<div class="syn-item"><div class="syn-dot" style="background:#2a3a4a"></div><span class="syn-off">Aucune synergie active</span></div>';
}


function updatePlayerShop() {
  const container = $('#playerShopContent, #playerShopItems');
  if (!container) return;
  container.innerHTML = '';
  for (const upg of PLAYER_UPGRADES) {
    const level   = gameState.playerUpgrades[upg.type] || 0;
    const maxed   = level >= upg.maxLevel;
    const cost    = Math.ceil(upg.baseCost * Math.pow(1.5, level));
    const canAfford = true; // gold check async → simplified
    const el = document.createElement('div');
    el.className = 'player-upgrade-item' + (maxed ? ' maxed' : '');
    el.innerHTML = `
      <span style="font-size:1.2rem">${upg.icon}</span>
      <div style="flex:1">
        <div style="font-family:'Cinzel',serif;font-size:.65rem;color:var(--brass-light)">${upg.name}</div>
        <div style="font-size:.6rem;color:#6a5a3a">${upg.description}</div>
        <div style="font-size:.55rem;color:#4a5a3a">Niveau ${level}/${upg.maxLevel}</div>
      </div>
      <button onclick="buyPlayerUpgrade('${upg.type}')"
              ${maxed ? 'disabled' : ''}
              class="buy-btn" style="font-size:.55rem">
        ${maxed ? '✅ MAX' : cost + ' 💰'}
      </button>
    `;
    container.appendChild(el);
  }
}


function initGlobalQuests() {
  for (const q of GLOBAL_QUESTS) {
    if (!gameState.globalQuests[q.id]) gameState.globalQuests[q.id] = { completed:false, claimed:false };
  }
}
function initSecretQuests() {
  for (const q of SECRET_QUESTS) {
    if (!gameState.secretQuests[q.id]) gameState.secretQuests[q.id] = { completed:false, claimed:false };
  }
}


function unlockAchievement(id) {
  if (!gameState.achievements) gameState.achievements = {};
  if (gameState.achievements[id]) return;
  gameState.achievements[id] = { id, unlockedAt: Date.now() };
  const ach = ACHIEVEMENTS ? ACHIEVEMENTS.find(a => a.id === id) : null;
  showNotification(ach ? `🏆 ${ach.name}` : `🏆 Succès débloqué : ${id}`, 'achievement');
}
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

            updateGoldDisplay();
            saveGameState();
            updateAchievementsDisplay();
        }
    } catch (error) {
        console.error('Failed to claim achievement reward:', error);
        showGoldToast(0, "Erreur lors de la réclamation");
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

// ⚠️ initGlobalQuests not found

// ⚠️ initSecretQuests not found

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

function checkQuests() {
    updateQuestProgress('steam_total', 0);
    updateQuestProgress('artisan_total', 0);
    updateQuestProgress('evolution_count', 0);
    updateQuestProgress('replica_count', 0);
    updateQuestProgress('max_boost', gameState.maxBoostReached);
    updateQuestProgress('conglomerate_total', 0);
    updateQuestProgress('all_upgrades_max', 0);
}

function triggerCoinExplosion(x, y) {
  // Animation coins désactivée — stub silencieux
}
function claimQuest(questId) {
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
            addGold(quest.reward.gold);
            showGoldToast(quest.reward.gold, `🎯 Quête terminée: ${quest.name}`);

            const questElement = $(`[data-quest="${questId}"]`);
            if (questElement) {
                triggerCoinExplosion(questElement);
            }

            updateGoldDisplay();
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

// ⚠️ updatePlayerShop not found

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

function hidePlayerShop() {
    const modal = $('#playerShopModal');
    if (modal) modal.remove();
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

async function refreshGoldDisplay() {
    if (!goldSystemEnabled) {
        showGoldToast(0, "Connectez-vous pour accéder au système d\'or");
        return;
    }
    try {
        await refreshGold();
        updateGoldDisplay();
    } catch (error) {
        console.error('Gold refresh error:', error);
        showGoldToast(0, "Erreur de connexion au système d\'or");
    }
}


// ═══════════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════════

function saveGameState() {
  try {
    localStorage.setItem('steamClickerSave', JSON.stringify({ ...gameState, lastSave: Date.now() }));
  } catch(e) { console.warn('Save failed', e); }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem('steamClickerSave');
    if (!raw) return;
    const saved = JSON.parse(raw);
    // Migration compat
    if (typeof saved.materials !== 'object' || saved.materials === null) saved.materials = {};
    if (!saved.gearChains) saved.gearChains = {};
    if (!saved.units)      saved.units = {};
    if (!saved.pendingGears) saved.pendingGears = {};
    if (!saved.chain)      saved.chain = [];
    if (!saved.connections) saved.connections = [];
    if (!saved.blueprints) saved.blueprints = {};
    if (saved.phase === undefined) saved.phase = 1;
    if (!saved.currentMachineStyle) saved.currentMachineStyle = null;
    // Offline production
    const offlineTime = Math.min((Date.now() - (saved.lastSave||Date.now())) / 1000, 7200);
    gameState = { ...gameState, ...saved };
    if (offlineTime > 60 && gameState.steamPerSecond > 0) {
      const gain = Math.floor(gameState.steamPerSecond * offlineTime * 0.6);
      gameState.steam      += gain;
      gameState.steamTotal += gain;
      setTimeout(() => showToast(`⏰ Production hors-ligne : +${formatNumber(gain)} vapeur`, '#5b9bd5'), 1000);
    }
  } catch(e) { console.warn('Load failed', e); }
}

// ═══════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════

function gameLoop() {
  if (total > 0) {
    gameState.steam      += total;
    gameState.steamTotal += total;
    updateDisplay();
    if (Math.random() < 0.05) checkQuests();
  }

  // Accumulation fractionnelle des engrenages (unités Phase 2)
  if (gameState.phase >= 2) {
    const unitEff = 1 + (gameState.playerUpgrades.unit_efficiency||0)*0.15;
    for (const [id, count] of Object.entries(gameState.units)) {
      if (!count) continue;
      const unit = UNIT_TYPES.find(u => u.id === parseInt(id));
      if (!unit) continue;
      const gearType = GEAR_TYPES.find(g => g.id === unit.unitGearType);
      if (!gearType) continue;
      if (!gameState.pendingGears[unit.unitGearType]) gameState.pendingGears[unit.unitGearType] = 0;
      gameState.pendingGears[unit.unitGearType] += unit.gearPerSec * count * unitEff;
      if (gameState.pendingGears[unit.unitGearType] >= 1) {
        const whole = Math.floor(gameState.pendingGears[unit.unitGearType]);
        gameState.pendingGears[unit.unitGearType] -= whole;
        gameState.gears[unit.unitGearType] = (gameState.gears[unit.unitGearType]||0) + whole;
        if (!gameState.materials) gameState.materials = {};
        if (gearType.material) gameState.materials[gearType.material] = (gameState.materials[gearType.material]||0) + whole;
        // Check chaîne à 99
        if ((gameState.gears[unit.unitGearType]||0) >= 99 && !gameState.gearChains[gearType.tier]) {
          gameState.gearChains[gearType.tier] = true;
          showToast(`🔗 Chaîne — ${gearType.name} ×1.5 !`, '#cd7f32');
        }
        calculateProduction();
      }
    }
  }

  checkPhaseUnlocks();
  decayBoost();

  if (Math.random() < 0.1) checkAchievements();
  if (Math.random() < 0.02) saveGameState();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

async function initAuthentication() {
  isAuthenticated = true;
  goldSystemEnabled = true;
  safeSetText('#authStatus', getDisplayName());
  safeSetStyle('#authStatus', 'color', '#90EE90');
  safeSetText('#goldSystemStatus', 'Local');
  safeSetStyle('#goldSystemStatus', 'color', '#90EE90');
  safeSetText('#username-display', getDisplayName());
  const aw = $('#authWarning'); if (aw) aw.classList.add('hidden');
  return true;
}

async function init() {
  console.log('🏭 STEAM Clicker 2.0 — init');
  loadGameState();
  await initAuthentication();
  calculateProduction();
  updateDisplay();
  updateAllShops();
  updatePhaseUI();

  // Événements
  const gear = $('#centralGear, #mainGear, #gearClick');
  if (gear) {
    gear.addEventListener('click', handleClick);
    gear.addEventListener('wheel', e => { e.preventDefault(); handleWheel(e.deltaY); }, { passive: false });
  }
  // Molette sur toute la page (option)
  document.addEventListener('wheel', e => {
    if (e.target.closest('#gearZone, #centralMachine, #mainMachineArea'))
      handleWheel(e.deltaY);
  }, { passive: true });

  // Tabs de phases
  $$('.phase-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const ph = parseInt(tab.dataset.phase||'1');
      if (gameState.phase < ph) return;
      $$('.phase-tab').forEach(t => t.classList.remove('active'));
      $$('.phase-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`.phase-panel[data-phase="${ph}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // Init quêtes
  initDailyQuests();
  initGlobalQuests();
  initSecretQuests();

  // Loops
  setInterval(gameLoop, 1000);
  setInterval(decayBoost, 200);
  setInterval(updateGoldDisplay, 5000);

  // Expose globals
  window.buyGear        = buyGear;
  window.buyUnit        = buyUnit;
  window.openPrestigeModal   = openPrestigeModal;
  window.closePrestigeModal  = closePrestigeModal;
  window.chooseMachine       = chooseMachine;
  window.openConnectionModal = openConnectionModal;
  window.closeConnectionModal= closeConnectionModal;
  window.chooseConnection    = chooseConnection;
  window.refundAllItems      = refundAllItems;
  window.resetGame           = resetGame;
  window.saveGame            = saveGameState;
  window.toggleRightPanel    = toggleRightPanel;
  window.showAchievementsModal = showAchievementsModal;
  window.hideAchievementsModal = hideAchievementsModal;
  window.openPlayerShop      = openPlayerShop;
  window.hidePlayerShop      = hidePlayerShop;
  window.buyPlayerUpgrade    = buyPlayerUpgrade;
  window.switchQuestTab      = switchQuestTab;
  window.claimQuest          = claimQuest;
  window.claimAchievement    = claimAchievement;
  window.reconnectAuth       = () => console.log('Mode local');
  window.refreshAllDisplays  = async () => { calculateProduction(); updateDisplay(); updateAllShops(); };

  initManivelleEvents();
  console.log(`✅ Phase ${gameState.phase} | Prestige ${gameState.prestigeCount} | ${formatNumber(gameState.steamPerSecond)}/s`);
}


// ═══ FONCTIONS RÉCUPÉRÉES ════════════════════════════════
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

function saveUIState() {
    try {
        localStorage.setItem('steamClickerUI', JSON.stringify(uiState));
    } catch (error) {
        console.warn('Failed to save UI state:', error);
    }
}

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


async function refreshAllDisplays() {
  calculateProduction();
  updateDisplay();
  updateAllShops();
}



// ═══════════════════════════════════════════════════════════
// MANIVELLE — rotation visuelle + interaction
// ═══════════════════════════════════════════════════════════

let gearRotation  = 0;
let crankRotation = 0;

function tickGearVisual() {
  const speed = Math.min(6, Math.log10(Math.max(1, prod)) * 0.7);
  gearRotation = (gearRotation + speed) % 360;
  const gear = document.getElementById('mainGear');
  if (gear) gear.style.transform = `rotate(${gearRotation}deg)`;
}

function setCrankVisual(angleDeg) {
  crankRotation = Math.max(-200, Math.min(200, angleDeg));
  const wrap = document.getElementById('manivelleHandle');
  if (wrap) wrap.style.transform = `rotate(${crankRotation}deg)`;
  const maxB = getMaxBoost();
  calculateProduction();
  updateBoostDisplay();
  updateManivelleUI();
}

function updateManivelleUI() {
  const max = getMaxBoost();
  const fill = document.getElementById('manivelleBoostFill');
  const txt  = document.getElementById('manivelleBoostPct');
  if (fill) {
    fill.style.height = Math.min(100, (pct / max) * 100) + '%';
    fill.classList.toggle('boosted', pct > max * 0.6);
  }
  if (txt) txt.textContent = Math.round(pct) + '%';
}

function startCrank(e) {
  e.preventDefault();
  handleClick();
  const newAngle = crankRotation + 22;
  setCrankVisual(newAngle > 200 ? -180 : newAngle);
  setTimeout(() => setCrankVisual(crankRotation - 8), 90);
}

function initManivelleEvents() {
  // Molette sur la zone machine
  document.addEventListener('wheel', (e) => {
    const zone = document.getElementById('machineZone');
    if (!zone || !e.target.closest('#machineZone')) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -18 : 18;
    setCrankVisual(crankRotation + delta);
    handleClick();
  }, { passive: false });

  // Loop visuel 60fps
  setInterval(tickGearVisual, 16);
}

// Décroissance manivelle (override decayBoost)
const _origDecayBoost = decayBoost;
decayBoost = function() {
  _origDecayBoost();
  if (Math.abs(crankRotation) > 1) {
    crankRotation += (targetAngle - crankRotation) * 0.08;
    const wrap = document.getElementById('manivelleHandle');
    if (wrap) wrap.style.transform = `rotate(${crankRotation}deg)`;
  }
  updateManivelleUI();
};

document.addEventListener('DOMContentLoaded', () => init());

