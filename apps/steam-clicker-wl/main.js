/* ═══════════════════════════════════════════════════════════
   S.T.E.A.M. Clicker — main.js
   ═══════════════════════════════════════════════════════════ */
'use strict';

// ── CONSTANTES ─────────────────────────────────────────────
const STORAGE_KEY    = 'steamClickerSave';
const EVOLUTION_COST = 10;
const BOOST_DECAY_MS = 800;
const MILESTONES     = [1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e12];
// Rayon orbital (px) par tier — container 420px → rayon max 200px
const TIER_RING_RADII = [100, 120, 140, 158, 174, 188, 200];

const GEAR_TYPES = [
  {id:1,name:'Engrenage Bronze',     cost:100,            production:1,   color:'#cd7f32',icon:'🔩'},
  {id:2,name:'Engrenage Fer',        cost:1_000,          production:5,   color:'#708090',icon:'⚙️'},
  {id:3,name:'Engrenage Acier',      cost:10_000,         production:20,  color:'#4682b4',icon:'⚒️'},
  {id:4,name:'Turbine Titanium',     cost:1_000_000,      production:100, color:'#c0c0c0',icon:'🛞'},
  {id:5,name:'Générateur Aether',    cost:10_000_000,     production:500, color:'#9370db',icon:'🌀'},
  {id:6,name:'Réacteur Plasma',      cost:1_000_000_000,  production:1000,color:'#ff69b4',icon:'⚡'},
  {id:7,name:'Processeur Quantique', cost:100_000_000_000,production:2500,color:'#00ffff',icon:'💠'},
];
const ARTISAN_TYPES = [
  {id:1,name:'Apprenti Vapeur',     baseCost:50_000_000,     gearCostType:1,gearCostAmount:3,production:100,  icon:'👨‍🔧'},
  {id:2,name:'Forgeron Maître',     baseCost:500_000_000,    gearCostType:2,gearCostAmount:3,production:500,  icon:'🔨'},
  {id:3,name:'Ingénieur Turbine',   baseCost:5_000_000_000,  gearCostType:3,gearCostAmount:3,production:2000, icon:'⚡'},
  {id:4,name:'Technicien Quantique',baseCost:50_000_000_000, gearCostType:4,gearCostAmount:3,production:10000,icon:'🧬'},
];
const GOLD_RATES = [
  {id:1,steamCost:10_000_000,         goldReward:1,      name:'Conversion Basique'},
  {id:2,steamCost:100_000_000,        goldReward:12,     name:'Conversion Groupée'},
  {id:3,steamCost:1_000_000_000,      goldReward:150,    name:'Conversion Premium'},
  {id:4,steamCost:10_000_000_000,     goldReward:2000,   name:'Conversion VIP'},
  {id:5,steamCost:1_000_000_000_000,  goldReward:250000, name:'Conversion Gobelin'},
];
const QUESTS = {
  daily:[
    {id:'d_connect', name:'Connexion Quotidienne',desc:"Ouvrir le jeu aujourd'hui", icon:'🔐',reward:50, req:s=>true},
    {id:'d_click100',name:'Manivelle Active',      desc:'100 clics',                 icon:'👆',reward:30, req:s=>s.totalClicks>=100},
    {id:'d_steam10k',name:'Production Journalière',desc:'10 000 vapeur générée',     icon:'💨',reward:80, req:s=>(s.dailyStats?.steamToday||0)>=10000},
    {id:'d_boost150',name:'Boost Supérieur',       desc:'Atteindre 150% de boost',   icon:'🔥',reward:120,req:s=>s.maxBoostReached>=150},
  ],
  global:[
    {id:'g_1m',     name:'Million de Vapeur', desc:'1M vapeur totale',     icon:'🌟',reward:250,req:s=>s.steamTotal>=1_000_000},
    {id:'g_art10',  name:'Équipe Complète',   desc:'10 artisans',           icon:'👥',reward:100,req:s=>Object.values(s.artisans||{}).reduce((a,b)=>a+b,0)>=10},
    {id:'g_rings25',name:'Seigneur Orbitaux', desc:'25 anneaux orbitaux',   icon:'💍',reward:500,req:s=>Object.values(s.rings||{}).reduce((a,b)=>a+b,0)>=25},
  ],
  secret:[
    {id:'s_click10k',name:'Légende du Clic', desc:'10 000 clics',           icon:'🔥',reward:300,req:s=>s.totalClicks>=10000},
    {id:'s_boost200',name:'Démon de Vitesse',desc:'Atteindre 200% de boost',icon:'⚡',reward:400,req:s=>s.maxBoostReached>=200},
  ],
};
const ACH_DEF = [
  {id:'steam_1k',  name:'Premier Souffle',       desc:'1 000 vapeur',         icon:'💨',reward:1,    req:s=>s.steamTotal>=1_000},
  {id:'steam_10k', name:'Apprenti Ingénieur',    desc:'10 000 vapeur',        icon:'⚙️',reward:5,    req:s=>s.steamTotal>=10_000},
  {id:'steam_100k',name:'Maître Mécanicien',     desc:'100 000 vapeur',       icon:'🔧',reward:25,   req:s=>s.steamTotal>=100_000},
  {id:'steam_1m',  name:'Baron de la Vapeur',    desc:'1M vapeur',            icon:'👑',reward:150,  req:s=>s.steamTotal>=1_000_000},
  {id:'steam_10m', name:'Seigneur des Machines', desc:'10M vapeur',           icon:'🏰',reward:800,  req:s=>s.steamTotal>=10_000_000},
  {id:'steam_100m',name:'Empereur Industriel',   desc:'100M vapeur',          icon:'🌟',reward:5000, req:s=>s.steamTotal>=100_000_000},
  {id:'first_gear',name:'Premier Mécanisme',     desc:'1 engrenage',          icon:'⚙️',reward:2,    req:s=>(s.gears?.[1]||0)>=1},
  {id:'gear_t7',   name:'Maître Quantique',      desc:'Processeur quantique', icon:'🌀',reward:1000, req:s=>(s.gears?.[7]||0)>=1},
  {id:'first_ring',name:'Premier Anneau',        desc:'1 anneau orbital',     icon:'💍',reward:20,   req:s=>Object.values(s.rings||{}).reduce((a,b)=>a+b,0)>=1},
  {id:'click_1k',  name:'Maître du Clic',        desc:'1 000 clics',          icon:'👆',reward:10,   req:s=>s.totalClicks>=1_000},
  {id:'click_10k', name:'Légende du Clic',       desc:'10 000 clics',         icon:'🔥',reward:500,  req:s=>s.totalClicks>=10_000},
  {id:'boost_150', name:'Manivelle Express',     desc:'150% de boost',        icon:'⚡',reward:50,   req:s=>s.maxBoostReached>=150},
  {id:'boost_200', name:'Démon de Vitesse',      desc:'200% de boost',        icon:'🌪️',reward:500,  req:s=>s.maxBoostReached>=200},
  {id:'ring_5',    name:'Seigneur Orbital',      desc:'5 anneaux',            icon:'💍',reward:100,  req:s=>Object.values(s.rings||{}).reduce((a,b)=>a+b,0)>=5},
  {id:'ring_25',   name:'Souverain Orbital',     desc:'25 anneaux',           icon:'💎',reward:1000, req:s=>Object.values(s.rings||{}).reduce((a,b)=>a+b,0)>=25},
  {id:'evo_1',     name:'Première Évolution',    desc:'1 évolution',          icon:'🔄',reward:50,   req:s=>s.totalEvolutions>=1},
  {id:'evo_25',    name:'Expert Évolution',      desc:'25 évolutions',        icon:'⛓️',reward:1000, req:s=>s.totalEvolutions>=25},
  {id:'artisan_1', name:'Premier Apprenti',      desc:'1 artisan',            icon:'👨‍🔧',reward:15,  req:s=>Object.values(s.artisans||{}).reduce((a,b)=>a+b,0)>=1},
  {id:'artisan_10',name:'Maître de Guilde',      desc:'10 artisans',          icon:'👥',reward:100,  req:s=>Object.values(s.artisans||{}).reduce((a,b)=>a+b,0)>=10},
  {id:'gold_100',  name:"Collectionneur d'Or",   desc:"100 pièces d'or",      icon:'💰',reward:20,   req:s=>s.gold>=100},
];

// ── STATE ───────────────────────────────────────────────────
const state = {
  steam:0,steamTotal:0,steamPerSecond:0,steamPerSecondBoost:0,
  materials:0,gold:0,
  gears:{},artisans:{},rings:{},gearEvolutions:{},
  totalEvolutions:0,totalClicks:0,totalResets:0,
  clickBoost:0,maxBoostReached:0,lastClickTime:0,
  playerUpgrades:{click_mult:0,transmission:0,efficiency:0,luck:0},
  mode:'etabli',lastSave:Date.now(),
  achievements:{unlocked:[],claimed:[]},recentAchievements:[],
  questsClaimed:[],questsCompleted:0,
  lastDailyReset:null,dailyStats:{steamToday:0,clicksToday:0},
  bulk:1,showTab:'gears',
  leftCollapsed:false,rightCollapsed:false,firstClick:false,
};
GEAR_TYPES.forEach(g=>{
  state.gears[g.id]=0; state.rings[g.id]=0;
  state.gearEvolutions[g.id]={auto:true};
});
ARTISAN_TYPES.forEach(a=>{ state.artisans[a.id]=0; });

// ── HELPERS ─────────────────────────────────────────────────
function fmt(n){
  if(!isFinite(n)||n<0)return'0';
  const s=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc'];
  let i=0,v=n;
  while(v>=1000&&i<s.length-1){v/=1000;i++}
  return i===0?Math.floor(n).toLocaleString('fr'):v.toFixed(v>=100?0:v>=10?1:2)+s[i];
}
const $=id=>document.getElementById(id);

// ── SAVE / LOAD ─────────────────────────────────────────────
function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  toast('💾 Sauvegardé');
}
function load(){
  try{
    const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    Object.assign(state,s);
    GEAR_TYPES.forEach(g=>{
      state.gears[g.id]??=0; state.rings[g.id]??=0;
      state.gearEvolutions[g.id]??={auto:true};
    });
    ARTISAN_TYPES.forEach(a=>{ state.artisans[a.id]??=0; });
    state.achievements??={unlocked:[],claimed:[]};
    state.recentAchievements??=[];
    state.questsClaimed??=[];
    state.dailyStats??={steamToday:0,clicksToday:0};
    state.playerUpgrades??={click_mult:0,transmission:0,efficiency:0,luck:0};
    const today=new Date().toDateString();
    if(state.lastDailyReset!==today){
      state.lastDailyReset=today;
      state.dailyStats={steamToday:0,clicksToday:0};
    }
  }catch(e){}
}
function exportSave(){
  const b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b); a.download='steam_save.json'; a.click();
  URL.revokeObjectURL(a.href);
}
function importSave(file){
  const r=new FileReader();
  r.onload=()=>{
    try{ Object.assign(state,JSON.parse(r.result)); save(); fullRefresh(); toast('✅ Import réussi'); }
    catch(e){ toast('❌ Import invalide'); }
  };
  r.readAsText(file);
}
function reset(){
  if(!confirm('Réinitialiser la partie ? Cette action est irréversible.'))return;
  const totalResets=state.totalResets+1;
  localStorage.removeItem(STORAGE_KEY);
  GEAR_TYPES.forEach(g=>{state.gears[g.id]=0;state.rings[g.id]=0;state.gearEvolutions[g.id]={auto:true};});
  ARTISAN_TYPES.forEach(a=>{state.artisans[a.id]=0;});
  Object.assign(state,{
    steam:0,steamTotal:0,steamPerSecond:0,steamPerSecondBoost:0,
    materials:0,gold:0,totalEvolutions:0,totalClicks:0,
    clickBoost:0,maxBoostReached:0,lastClickTime:0,
    achievements:{unlocked:[],claimed:[]},recentAchievements:[],
    questsClaimed:[],questsCompleted:0,
    dailyStats:{steamToday:0,clicksToday:0},
    playerUpgrades:{click_mult:0,transmission:0,efficiency:0,luck:0},
    totalResets,firstClick:false,
  });
  save(); fullRefresh(); toast('🔄 Réinitialisation effectuée');
}
function refundAll(){
  let gain=0;
  GEAR_TYPES.forEach(g=>{
    gain+=(state.gears[g.id]||0)*g.cost*.5;
    gain+=(state.rings[g.id]||0)*g.cost*.2;
    state.gears[g.id]=0; state.rings[g.id]=0;
  });
  ARTISAN_TYPES.forEach(a=>{
    gain+=(state.artisans[a.id]||0)*a.baseCost*.5;
    state.artisans[a.id]=0;
  });
  state.steam+=gain; state.steamTotal+=gain;
  recalc(); save(); fullRefresh();
  toast('💸 Remboursement: +'+fmt(gain)+' vapeur');
}

// ── MATHS ────────────────────────────────────────────────────
const artisanMult=id=>{
  const n=state.artisans[id]||0;
  const bro=Math.floor(n/9),dist=Math.floor(bro/3),cong=Math.floor(dist/3);
  return Math.pow(3,bro)*Math.pow(5,dist)*Math.pow(10,cong);
};
const ringMult  =id=> 1+(state.rings[id]||0)*.25;
const boostMult =()=> 1+state.clickBoost/100;
const gearUnit  =g=>  g.production*ringMult(g.id);
const gearBoosted=g=> gearUnit(g)*boostMult();
const gearTotal  =g=> gearBoosted(g)*(state.gears[g.id]||0)*artisanMult(g.id);
const totalRings   =()=>Object.values(state.rings).reduce((a,b)=>a+b,0);
const totalArtisans=()=>Object.values(state.artisans).reduce((a,b)=>a+b,0);
const totalGears   =()=>GEAR_TYPES.reduce((s,g)=>s+(state.gears[g.id]||0),0);

function recalc(){
  state.steamPerSecond     =GEAR_TYPES.reduce((s,g)=>s+gearTotal(g),0);
  state.steamPerSecondBoost=state.steamPerSecond*boostMult();
}
const gearCostN=(gid,n)=>{
  const base=GEAR_TYPES.find(g=>g.id===gid); let c=0;
  for(let i=0;i<n;i++) c+=Math.ceil(base.cost*Math.pow(1.15,(state.gears[gid]||0)+i));
  return c;
};
const maxBuyGear=gid=>{
  const base=GEAR_TYPES.find(g=>g.id===gid);
  return Math.max(0,Math.floor(
    Math.log(1+state.steam*.15/(base.cost*Math.pow(1.15,state.gears[gid]||0)))/Math.log(1.15)
  ));
};

// ═══════════════════════════════════════════════════════════
// SÉPARATION ANIMATION / SHOP
//
//  LOOP (rAF)  → tick() + renderStats() + renderGearLayers()
//                ← 60 fps, JAMAIS de renderShop/renderWorkbench
//
//  SHOP        → renderShop() + renderWorkbench()
//                appelés UNIQUEMENT sur :
//                  • achat / action utilisateur
//                  • setInterval 1 s (mise à jour prix/dispo)
//                  • fullRefresh() (load, reset, refund)
// ═══════════════════════════════════════════════════════════

// ── TICK (60 fps) ────────────────────────────────────────────
function tick(){
  const dt=0.016;
  const prod=state.steamPerSecond*dt;
  state.steam+=prod; state.steamTotal+=prod;
  state.dailyStats.steamToday=(state.dailyStats.steamToday||0)+prod;

  if(state.clickBoost>0&&Date.now()-state.lastClickTime>BOOST_DECAY_MS)
    state.clickBoost=Math.max(0,state.clickBoost-15*dt*3);
  state.maxBoostReached=Math.max(state.maxBoostReached,state.clickBoost);

  // Auto-évolution : 10 engrenages → 1 anneau
  GEAR_TYPES.forEach(g=>{
    if(!state.gearEvolutions[g.id]?.auto)return;
    const evo=Math.floor((state.gears[g.id]||0)/EVOLUTION_COST);
    if(evo>0){
      state.gears[g.id]-=evo*EVOLUTION_COST;
      state.rings[g.id]=(state.rings[g.id]||0)+evo;
      state.totalEvolutions+=evo;
    }
  });
  recalc();
  checkAchievements();
}

// ── SHOP (rebuild complet, appelé hors loop) ─────────────────
function renderShop(){
  const list=$('shopList');
  if(!list)return;
  // Sauvegarde scroll
  const scrollTop=list.scrollTop;
  list.innerHTML='';
  if(state.showTab==='gears')
    GEAR_TYPES.forEach(g=>list.appendChild(buildGearItem(g)));
  else if(state.showTab==='artisans')
    ARTISAN_TYPES.forEach(a=>list.appendChild(buildArtisanItem(a)));
  else if(state.showTab==='structures')
    ARTISAN_TYPES.forEach(a=>{ if(state.artisans[a.id]>0)list.appendChild(buildStructItem(a)); });
  else
    GOLD_RATES.forEach(r=>list.appendChild(buildGoldItem(r)));
  // Restaure scroll
  list.scrollTop=scrollTop;
}

function buildGearItem(g){
  const n=state.gears[g.id]||0;
  const bulk=state.bulk==='max'?Math.max(1,maxBuyGear(g.id)):state.bulk;
  const cost=gearCostN(g.id,bulk);
  const canBuy=state.steam>=cost&&bulk>0;
  const auto=state.gearEvolutions[g.id]?.auto;
  const rings=state.rings[g.id]||0;
  const remainder=n%EVOLUTION_COST;
  const pct=Math.round(remainder/EVOLUTION_COST*100);

  const ringDots=rings>0
    ?Array.from({length:Math.min(rings,6)},()=>`<div class="shop-prog-ring-dot" style="--gc:${g.color}"></div>`).join('')
      +(rings>6?`<span class="shop-prog-ring-extra">+${rings-6}</span>`:'')
    :'';

  const el=document.createElement('div');
  el.className='shop-item'+(canBuy?'':' locked');
  el.innerHTML=`
    <div class="ico">${g.icon}</div>
    <div class="meta">
      <div class="n">${g.name} <span class="badge">${fmt(n)}</span></div>
      <div class="d">🔩 Base: ${fmt(gearUnit(g))}/s · Boost: ${fmt(gearBoosted(g))}/s</div>
      <div class="s">Total: ${fmt(gearTotal(g))}/s · Coût: ${fmt(cost)} 💨</div>
    </div>
    <div class="shop-prog">
      <span class="shop-prog-label">${remainder}/${EVOLUTION_COST} → anneau</span>
      <div class="shop-prog-bar">
        <div class="shop-prog-fill" style="width:${pct}%;background:linear-gradient(90deg,${g.color}88,${g.color})"></div>
      </div>
      <div class="shop-prog-rings">${ringDots||'<span style="color:rgba(240,221,176,.25);font-size:.65rem">—</span>'}</div>
    </div>
    <div class="item-footer">
      <button class="pill buy"          data-buy="${g.id}"  ${canBuy?'':'disabled'}>Acheter ×${bulk||1}</button>
      <button class="pill ${auto?'on':''}" data-auto="${g.id}">Auto ${auto?'ON':'OFF'}</button>
      <button class="pill"              data-conv="${g.id}">Manuel (${Math.floor(n/EVOLUTION_COST)})</button>
    </div>`;
  return el;
}
function buildArtisanItem(a){
  const n=state.artisans[a.id]||0;
  const bulk=state.bulk==='max'?1:state.bulk;
  const cost=a.baseCost*bulk, gNeed=a.gearCostAmount*bulk;
  const canBuy=state.steam>=cost&&(state.gears[a.gearCostType]||0)>=gNeed;
  const mult=artisanMult(a.id);
  const el=document.createElement('div');
  el.className='shop-item'+(canBuy?'':' locked');
  el.innerHTML=`
    <div class="ico">${a.icon}</div>
    <div class="meta">
      <div class="n">${a.name} <span class="badge">${fmt(n)}</span></div>
      <div class="d">Mult: ×${fmt(mult)} · Prod: ${fmt(a.production*n*mult)}/s</div>
      <div class="s">Coût: ${fmt(cost)} 💨 + ${gNeed} eng. T${a.gearCostType}</div>
    </div>
    <div class="item-footer">
      <button class="pill buy" data-art="${a.id}" ${canBuy?'':'disabled'}>Embaucher ×${bulk}</button>
    </div>`;
  return el;
}
function buildStructItem(a){
  const n=state.artisans[a.id]||0;
  const bro=Math.floor(n/9),dist=Math.floor(bro/3),cong=Math.floor(dist/3);
  const el=document.createElement('div'); el.className='shop-item';
  el.innerHTML=`
    <div class="ico">${a.icon}</div>
    <div class="meta">
      <div class="n">${a.name} — Tier ${a.id}</div>
      <div class="d">Artisans: ${fmt(n)} · Mult: ×${fmt(artisanMult(a.id))}</div>
      <div class="s">Confréries: ${fmt(bro)} · Quartiers: ${fmt(dist)} · Conglomérats: ${fmt(cong)}</div>
    </div>`;
  return el;
}
function buildGoldItem(r){
  const canBuy=state.steam>=r.steamCost;
  const el=document.createElement('div');
  el.className='shop-item'+(canBuy?'':' locked');
  el.innerHTML=`
    <div class="ico">💰</div>
    <div class="meta">
      <div class="n">${r.name}</div>
      <div class="d">${fmt(r.steamCost)} vapeur → ${fmt(r.goldReward)} or</div>
    </div>
    <div class="item-footer">
      <button class="pill buy" data-gold="${r.id}" ${canBuy?'':'disabled'}>Échanger</button>
    </div>`;
  return el;
}

// ── WORKBENCH (rebuild, appelé hors loop) ───────────────────
function renderWorkbench(){
  const container=$('gearProgress');
  const emptyMsg  =$('wbEmpty');
  if(!container)return;
  container.innerHTML='';
  let anyActive=false;

  GEAR_TYPES.forEach(g=>{
    const total=state.gears[g.id]||0;
    const rings=state.rings[g.id]||0;
    if(total===0&&rings===0)return;
    anyActive=true;
    const remainder=total%EVOLUTION_COST;

    const slots=Array.from({length:EVOLUTION_COST},(_,i)=>
      `<div class="gr-slot${i<remainder?' filled':''}" style="--gc:${g.color}"></div>`
    ).join('');

    const maxDots=8;
    const dots=rings>0
      ?Array.from({length:Math.min(rings,maxDots)},()=>`<div class="gr-ring-dot" style="--gc:${g.color}"></div>`).join('')
        +(rings>maxDots?`<span class="gr-ring-extra">+${rings-maxDots}</span>`:'')
      :'';

    const row=document.createElement('div');
    row.className='gear-row';
    row.innerHTML=`
      <span class="gr-icon">${g.icon}</span>
      <span class="gr-name">${g.name.split(' ').slice(1).join(' ')||g.name}</span>
      <div class="gr-slots">${slots}</div>
      <span class="gr-count">${remainder}/${EVOLUTION_COST}</span>
      <div class="gr-rings">${dots}</div>`;
    container.appendChild(row);
  });

  if(emptyMsg) emptyMsg.style.display=anyActive?'none':'block';
}

// ═══════════════════════════════════════════════════════════
// ANIMATION ORRERY — 60 fps, indépendant du shop
//
//  Zone 0  r < 75px         →  Engrenage principal (click cible)
//  Zone 1  r = tierR - 18px →  Slots actifs 0-9 (10 points par tier)
//                               ⚙ rempli  /  ○ vide
//  Zone 2  r = tierR        →  1 anneau orbital par tier
//                               épaisseur + lueur ∝ nb d'anneaux
//  Zone 3  badge ×N         →  si tier a > 1 anneau
// ═══════════════════════════════════════════════════════════
let gearRot=0;
function renderGearLayers(){
  const speed=1+state.clickBoost/100+state.steamPerSecond/500;
  gearRot=(gearRot+.5*speed)%360;
  $('mainGear').style.transform=`rotate(${gearRot}deg)`;

  const ringsEl=$('rings');    ringsEl.innerHTML='';
  const pyrEl  =$('pyramids'); pyrEl.innerHTML='';
  const artEl  =$('artisansLayer'); if(artEl) artEl.innerHTML='';

  GEAR_TYPES.forEach(g=>{
    const tierIdx = g.id-1;
    const ringR   = TIER_RING_RADII[tierIdx]; // rayon anneau
    const slotR   = ringR-18;                 // rayon slots actifs
    const rings   = state.rings[g.id]||0;
    const active  = (state.gears[g.id]||0)%EVOLUTION_COST; // 0-9

    // ── Zone 1 : slots actifs ──────────────────────────────
    if(active>0){
      for(let s=0;s<EVOLUTION_COST;s++){
        const a=(s/EVOLUTION_COST)*Math.PI*2 - Math.PI/2;
        const d=document.createElement('div');
        d.className='gear-orbit-slot '+(s<active?'active':'empty');
        d.style.cssText=`left:calc(50% + ${Math.cos(a)*slotR}px);top:calc(50% + ${Math.sin(a)*slotR}px);--gc:${g.color}`;
        pyrEl.appendChild(d);
      }
    }

    // ── Zone 2 : anneau orbital ────────────────────────────
    if(rings>0){
      const thickness=Math.min(2+Math.floor(rings/3),9);
      const glow=Math.min(4+rings*2,30);
      const d=document.createElement('div'); d.className='ring';
      d.style.cssText=`width:${ringR*2}px;height:${ringR*2}px;border-color:${g.color};border-width:${thickness}px;--spd:${9+tierIdx*1.5}s;filter:drop-shadow(0 0 ${glow}px ${g.color})`;
      // Zone 3 : badge ×N
      if(rings>1){
        const b=document.createElement('div'); b.className='ring-badge';
        b.style.cssText=`--gc:${g.color};border-color:${g.color};color:${g.color}`;
        b.textContent='×'+rings; d.appendChild(b);
      }
      ringsEl.appendChild(d);
    }
  });

  // Artisans (atelier uniquement)
  if(artEl&&state.mode==='workshop'){
    const pos=['pos-1','pos-2','pos-3','pos-4','pos-5','pos-6','pos-7','pos-8'];
    ARTISAN_TYPES.forEach((a,i)=>{
      if(!state.artisans[a.id])return;
      const d=document.createElement('div');
      d.className='artisan-group '+pos[i];
      d.innerHTML=`<div class="ai">${a.icon}</div><div class="an">${a.name}</div><div class="as">${fmt(state.artisans[a.id])} · ×${fmt(artisanMult(a.id))}</div>`;
      artEl.appendChild(d);
    });
  }
}

// ── STATS (60 fps, HUD seulement) ───────────────────────────
function renderStats(){
  $('steamCounter').textContent        =fmt(state.steam);
  $('steamRateTotal').textContent      =fmt(state.steamPerSecond);
  $('steamPerSecondBoost').textContent =fmt(state.steamPerSecondBoost);
  $('materialCount').textContent       =fmt(state.materials);
  $('goldCounter').textContent         =fmt(state.gold);
  $('steamTotalDisplay').textContent   =fmt(state.steamTotal);
  $('gearCount').textContent           =fmt(totalGears());
  $('artisanCount').textContent        =fmt(totalArtisans());
  $('ringCountDisplay').textContent    =fmt(totalRings());
  $('currentBoostDisplay').textContent ='+'+Math.floor(state.clickBoost)+'%';
  $('goldTotalDisplay').textContent    =fmt(state.gold);
  $('boostFill').style.width           =Math.min(100,state.clickBoost/3)+'%';
  $('boostPct').textContent            =Math.floor(state.clickBoost)+'%';
  $('workshopMode').classList.toggle('locked',state.steamTotal<10_000_000);

  const target=MILESTONES.find(v=>state.steamTotal<v)||MILESTONES.at(-1);
  const prev  =MILESTONES[Math.max(0,MILESTONES.indexOf(target)-1)]||0;
  $('nextMilestone').textContent=fmt(target);
  $('milestoneProgress').style.width=Math.min(100,((state.steamTotal-prev)/(target-prev))*100)+'%';

  const rec=$('recentAchievements');
  rec.innerHTML=state.recentAchievements.length
    ?state.recentAchievements.slice(0,5).map(a=>
        `<div class="recent-item"><span>${a.icon||'🏆'}</span><span>${a.name}</span><span style="color:var(--c-gold);margin-left:auto">+${a.reward}💰</span></div>`
      ).join('')
    :'<span class="muted small">Aucun succès récent</span>';
}

// ── ACHIEVEMENTS ─────────────────────────────────────────────
function checkAchievements(){
  ACH_DEF.forEach(a=>{
    if(!state.achievements.unlocked.includes(a.id)&&a.req(state)){
      state.achievements.unlocked.push(a.id);
      state.achievements.claimed.push(a.id);
      state.gold+=a.reward;
      state.recentAchievements.unshift({...a});
      state.recentAchievements=state.recentAchievements.slice(0,6);
      toast(`🏆 ${a.name} · +${a.reward} 💰`);
      spawnCoins(window.innerWidth/2,window.innerHeight/2);
    }
  });
}
function renderAchievements(){
  const g=$('achievementGrid'); if(!g)return;
  g.innerHTML=ACH_DEF.map(a=>{
    const unl=state.achievements.unlocked.includes(a.id);
    const clm=state.achievements.claimed.includes(a.id);
    return `<div class="ach-card ${clm?'claimed':''} ${!unl?'locked':''}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      <span class="badge">${clm?'✅ Réclamé':unl?a.reward+' 💰':'🔒 Verrouillé'}</span>
    </div>`;
  }).join('');
}
function renderQuests(type='daily'){
  const g=$('questGrid'); if(!g)return;
  g.innerHTML=(QUESTS[type]||[]).map(q=>{
    const done=q.req(state), claimed=state.questsClaimed.includes(q.id);
    return `<div class="ach-card ${done?'claimed':''} ${claimed?'locked':''}">
      <div class="ach-icon">${q.icon}</div>
      <div class="ach-name">${q.name}</div>
      <div class="ach-desc">${q.desc}</div>
      <div style="margin-top:8px">
        <span class="badge" style="display:inline-block;margin-bottom:6px">${done?'✅':'⏳'} ${done?'Complétée':'En cours'}</span><br>
        <button class="pill buy" data-claim-q="${q.id}" data-qt="${type}" ${done&&!claimed?'':'disabled'}>
          ${claimed?'Réclamé':'Réclamer +'+q.reward+' 💰'}
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── VFX ──────────────────────────────────────────────────────
function toast(msg){
  const d=document.createElement('div'); d.className='toast'; d.textContent=msg;
  document.body.appendChild(d);
  setTimeout(()=>{ d.style.transition='all .4s'; d.style.opacity='0'; d.style.transform='translateX(110%)'; setTimeout(()=>d.remove(),400); },2200);
}
function floatText(x,y,t){
  const d=document.createElement('div'); d.className='float'; d.textContent=t;
  d.style.cssText=`left:${x-20}px;top:${y-20}px`;
  document.body.appendChild(d); setTimeout(()=>d.remove(),870);
}
function spawnCoins(cx,cy){
  for(let i=0;i<12;i++){
    const d=document.createElement('div'); d.className='coin';
    const a=Math.random()*Math.PI*2, dist=40+Math.random()*60;
    d.style.cssText=`left:${cx}px;top:${cy}px;--r:${a}rad;--r2:${a+Math.PI}rad;--x:${Math.cos(a)*dist}px;--y:${Math.sin(a)*dist}px;--x2:${Math.cos(a+.3)*(dist+20)}px;--y2:${Math.sin(a+.3)*(dist+20)+20}px;animation-delay:${i*.05}s`;
    document.body.appendChild(d); setTimeout(()=>d.remove(),1100+i*50);
  }
}

// ── MODE ─────────────────────────────────────────────────────
function switchMode(m){
  state.mode=m;
  $('etabliMode').classList.toggle('active',  m==='etabli');
  $('workshopMode').classList.toggle('active',m==='workshop');
  $('gearView').classList.toggle('hidden',    m!=='etabli');
  $('workshopView').classList.toggle('hidden',m!=='workshop');
  $('instruction').classList.toggle('hidden', m==='workshop');
}

// fullRefresh = rebuild complet (load / reset / refund uniquement)
function fullRefresh(){
  recalc(); renderStats(); renderShop(); renderWorkbench(); renderGearLayers();
}

// ═══════════════════════════════════════════════════════════
// LOOP — ANIMATION UNIQUEMENT
// tick + stats HUD + gear animation  →  jamais renderShop
// ═══════════════════════════════════════════════════════════
let frame=0;
function loop(){
  requestAnimationFrame(loop);
  tick(); frame++;
  if(frame%2===0)  renderStats();       // HUD : ~30 fps
  if(frame%3===0)  renderGearLayers();  // animation : ~20 fps
}

// ═══════════════════════════════════════════════════════════
// SHOP TIMER — 1 s, indépendant de la loop d'animation
// Met à jour prix / dispo sans jamais bloquer les clics
// ═══════════════════════════════════════════════════════════
setInterval(()=>{
  renderShop();
  renderWorkbench();
}, 1000);

// ── INTERACTIONS ─────────────────────────────────────────────
$('mainGear').addEventListener('click',e=>{
  state.totalClicks++;
  state.dailyStats.clicksToday=(state.dailyStats.clicksToday||0)+1;
  const gain=Math.max(1,Math.floor(1+state.clickBoost/20));
  state.steam+=gain; state.steamTotal+=gain;
  state.lastClickTime=Date.now();
  state.clickBoost=Math.min(300,state.clickBoost+3);
  if(!state.firstClick){ state.firstClick=true; $('instruction').classList.add('hidden'); }
  floatText(e.clientX,e.clientY,'+'+fmt(gain)+' 💨');
});

$('shopList').addEventListener('click',e=>{
  const btn=e.target.closest('button[data-buy],button[data-art],button[data-gold],button[data-auto],button[data-conv],button[data-claim-q]');
  if(!btn)return;
  const bulk=state.bulk==='max'?null:+state.bulk;

  if(btn.dataset.buy){
    const gid=+btn.dataset.buy;
    const n=state.bulk==='max'?Math.max(1,maxBuyGear(gid)):bulk;
    const cost=gearCostN(gid,n);
    if(state.steam>=cost){
      state.steam-=cost; state.gears[gid]+=n; state.materials+=n;
      toast(GEAR_TYPES.find(g=>g.id===gid).name+' ×'+n);
      recalc(); renderShop(); renderWorkbench();
    }
  }
  else if(btn.dataset.art){
    const aid=+btn.dataset.art, a=ARTISAN_TYPES.find(x=>x.id===aid);
    const n=bulk||1, cost=a.baseCost*n, gNeed=a.gearCostAmount*n;
    if(state.steam>=cost&&(state.gears[a.gearCostType]||0)>=gNeed){
      state.steam-=cost; state.artisans[aid]+=n; state.gears[a.gearCostType]-=gNeed;
      toast(a.name+' ×'+n+' embauché');
      recalc(); renderShop(); renderWorkbench();
    }
  }
  else if(btn.dataset.gold){
    const r=GOLD_RATES.find(x=>x.id===+btn.dataset.gold);
    if(state.steam>=r.steamCost){
      state.steam-=r.steamCost; state.gold+=r.goldReward;
      toast('+'+fmt(r.goldReward)+' 💰');
      spawnCoins(window.innerWidth*.7,88);
      recalc(); renderShop();
    }
  }
  else if(btn.dataset.auto){
    const gid=+btn.dataset.auto;
    state.gearEvolutions[gid].auto=!state.gearEvolutions[gid].auto;
    renderShop();
  }
  else if(btn.dataset.conv){
    const gid=+btn.dataset.conv, n=state.gears[gid]||0;
    const evo=Math.floor(n/EVOLUTION_COST);
    if(evo>0){
      state.gears[gid]-=evo*EVOLUTION_COST;
      state.rings[gid]=(state.rings[gid]||0)+evo;
      state.totalEvolutions+=evo;
      toast('💍 +'+evo+' anneaux Tier '+gid);
      spawnCoins(window.innerWidth/2,window.innerHeight*.6);
      recalc(); renderShop(); renderWorkbench();
    }
  }
  else if(btn.dataset.claimQ){
    const q=[...QUESTS.daily,...QUESTS.global,...QUESTS.secret].find(x=>x.id===btn.dataset.claimQ);
    if(q&&q.req(state)&&!state.questsClaimed.includes(q.id)){
      state.questsClaimed.push(q.id); state.gold+=q.reward; state.questsCompleted++;
      toast('📜 '+q.name+' +'+q.reward+' 💰');
      spawnCoins(window.innerWidth/2,window.innerHeight/2);
      renderQuests(btn.dataset.qt);
    }
  }
});

$('buyFactorBtns').addEventListener('click',e=>{
  const b=e.target.closest('[data-bulk]'); if(!b)return;
  state.bulk=b.dataset.bulk==='max'?'max':+b.dataset.bulk;
  document.querySelectorAll('.bulk-btn').forEach(x=>x.classList.toggle('on',x===b));
  renderShop();
});
$('shopTabs').addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]'); if(!b)return;
  state.showTab=b.dataset.tab;
  document.querySelectorAll('.shopTab').forEach(x=>x.classList.toggle('active',x===b));
  renderShop();
});
$('leftToggle').onclick=()=>{
  state.leftCollapsed=!state.leftCollapsed;
  $('leftPanel').classList.toggle('collapsed',state.leftCollapsed);
  $('leftToggle').textContent=state.leftCollapsed?'▶':'◀';
};
$('rightToggle').onclick=()=>{
  state.rightCollapsed=!state.rightCollapsed;
  $('rightPanel').classList.toggle('collapsed',state.rightCollapsed);
  $('rightToggle').textContent=state.rightCollapsed?'◀':'▶';
};
$('etabliMode').onclick  =()=>switchMode('etabli');
$('workshopMode').onclick=()=>{ if(state.steamTotal>=10_000_000)switchMode('workshop'); };
$('achBtn').onclick  =()=>{ $('achievementModal').classList.remove('hidden'); renderAchievements(); };
$('questBtn').onclick=()=>{ $('questModal').classList.remove('hidden'); renderQuests('daily'); };
$('closeAch').onclick  =()=>$('achievementModal').classList.add('hidden');
$('closeQuest').onclick=()=>$('questModal').classList.add('hidden');
document.querySelectorAll('.qtab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.qtab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); renderQuests(t.dataset.qt);
});
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m)m.classList.add('hidden'); }));
$('saveBtn').onclick   =save;
$('refreshBtn').onclick=()=>{ recalc(); fullRefresh(); };
$('refundBtn').onclick =refundAll;
$('resetBtn').onclick  =reset;
$('exportBtn').onclick =exportSave;
$('importBtn').onclick =()=>$('fileInput').click();
$('fileInput').onchange=e=>{ if(e.target.files[0])importSave(e.target.files[0]); };

let holdM=false;
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='a'){ $('achievementModal').classList.remove('hidden'); renderAchievements(); }
  if(k==='q'){ $('questModal').classList.remove('hidden'); renderQuests('daily'); }
  if(k==='m')holdM=true;
});
document.addEventListener('keyup',e=>{ if(e.key.toLowerCase()==='m')holdM=false; });
window.addEventListener('wheel',e=>{
  if(!holdM)return; e.preventDefault();
  state.clickBoost=Math.max(0,Math.min(300,state.clickBoost+(e.deltaY<0?6:-6)));
  state.lastClickTime=Date.now();
},{passive:false});
window.addEventListener('beforeunload',()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state)));

// ── INIT ─────────────────────────────────────────────────────
load();
fullRefresh();
loop();
setInterval(save, 5000);
