/* Sterenna • S.T.E.A.M. Atelier (beta) */
/* Requirements:
   - Server-side scan writes steam_projects.json (admin action).
   - Local agent profiles (one code = one local save).
   - Easter eggs unlock titles (Konami, Gift catch, Crank explosion).
*/
const CONFIG = {
  projectsJson: "./steam_projects.json",
  titlesJson: "./steam_titles.json",
  audio: {
    src: "./assets/audio/backmusic.mp3",
    volume: 0.5
  },
  external: {
    limoges: "https://steamescape.fr/limoges/"
  },
  local: {
    indexKey: "steam_agent_index_v1",
    agentPrefix: "steam_agent_"
  }
};

const $ = (sel) => document.querySelector(sel);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function now(){ return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}); }

function logEvent(msg){
  const box = $("#eventLog");
  if(!box) return;
  const div = document.createElement("div");
  div.className = "event";
  div.textContent = `[${now()}] ${msg}`;
  box.prepend(div);
  // Keep max 20
  const kids = [...box.children];
  kids.slice(20).forEach(k => k.remove());
}

function randHex4(){
  const x = crypto.getRandomValues(new Uint8Array(2));
  return [...x].map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function validName(s){
  // Allowed: letters (any), digits, space, hyphen, underscore. No accents requested,
  // but we just validate against common ASCII-ish set; keep case as typed.
  return /^[A-Za-z0-9 _-]{1,24}$/.test(s);
}

async function fetchJson(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

/* ---------- Background SVG (procedural) ---------- */
function buildBackgroundSvg(){
  const w = window.innerWidth, h = window.innerHeight;
  // Simple procedural pattern: gears + gauges, animated via CSS inlined.
  const svg = `
  <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true">
    <defs>
      <radialGradient id="g0" cx="30%" cy="20%">
        <stop offset="0" stop-color="rgba(201,163,90,0.22)"/>
        <stop offset="0.55" stop-color="rgba(0,0,0,0.12)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="rgba(255,232,201,0.08)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.25)"/>
      </linearGradient>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M60 0H0V60" fill="none" stroke="rgba(255,232,201,0.06)" stroke-width="1"/>
        <circle cx="0" cy="0" r="1.5" fill="rgba(201,163,90,0.12)"/>
      </pattern>

      <g id="gear">
        <circle r="34" fill="rgba(0,0,0,0.18)" stroke="rgba(255,232,201,0.10)" stroke-width="2"/>
        <circle r="22" fill="rgba(0,0,0,0.10)" stroke="rgba(201,163,90,0.20)" stroke-width="2"/>
        ${Array.from({length:12}).map((_,i)=>{
          const a = (i*30) * Math.PI/180;
          const x = Math.cos(a)*34;
          const y = Math.sin(a)*34;
          return `<rect x="${x-4}" y="${y-10}" width="8" height="20" rx="3" ry="3" fill="rgba(201,163,90,0.14)" transform="rotate(${i*30})"/>`;
        }).join("")}
      </g>

      <g id="gauge">
        <circle r="44" fill="rgba(0,0,0,0.20)" stroke="rgba(255,232,201,0.10)" stroke-width="2"/>
        <path d="M-34 20 A 40 40 0 0 1 34 20" fill="none" stroke="rgba(201,163,90,0.22)" stroke-width="4" stroke-linecap="round"/>
        ${Array.from({length:9}).map((_,i)=>{
          const t = -70 + i*17.5;
          return `<line x1="0" y1="-38" x2="0" y2="-30" stroke="rgba(255,232,201,0.10)" stroke-width="2" transform="rotate(${t})"/>`;
        }).join("")}
        <circle r="6" fill="rgba(201,163,90,0.18)" stroke="rgba(255,232,201,0.10)" stroke-width="2"/>
      </g>
    </defs>

    <rect width="100%" height="100%" fill="url(#grid)"/>
    <rect width="100%" height="100%" fill="url(#g0)"/>

    <g opacity="0.9">
      <g transform="translate(${w*0.14} ${h*0.22})" class="spin-a"><use href="#gear"/></g>
      <g transform="translate(${w*0.26} ${h*0.66}) scale(1.25)" class="spin-b"><use href="#gear"/></g>
      <g transform="translate(${w*0.78} ${h*0.18}) scale(1.10)" class="spin-b"><use href="#gear"/></g>
      <g transform="translate(${w*0.72} ${h*0.70}) scale(1.45)" class="spin-a"><use href="#gear"/></g>

      <g transform="translate(${w*0.50} ${h*0.18})" class="float-a"><use href="#gauge"/></g>
      <g transform="translate(${w*0.08} ${h*0.78}) scale(0.95)" class="float-b"><use href="#gauge"/></g>
      <g transform="translate(${w*0.90} ${h*0.48}) scale(0.85)" class="float-a"><use href="#gauge"/></g>
    </g>

    <style>
      .spin-a { transform-origin: 0 0; animation: spinA 22s linear infinite; }
      .spin-b { transform-origin: 0 0; animation: spinB 16s linear infinite; }
      .float-a{ animation: floatA 9s ease-in-out infinite; }
      .float-b{ animation: floatB 11s ease-in-out infinite; }

      @keyframes spinA { to { transform: translate(var(--tx), var(--ty)) rotate(360deg); } }
      @keyframes spinB { to { transform: translate(var(--tx), var(--ty)) rotate(-360deg); } }
      @keyframes floatA { 50% { transform: translate(var(--tx), var(--ty)) translateY(10px); } }
      @keyframes floatB { 50% { transform: translate(var(--tx), var(--ty)) translateY(-12px); } }
    </style>
  </svg>`;
  // fix CSS variables for each group with inline style by post-processing:
  const container = document.createElement("div");
  container.innerHTML = svg.trim();
  const root = container.querySelector("svg");
  // Apply tx/ty vars for keyframed transforms
  const groups = root.querySelectorAll("g[class]");
  groups.forEach(g=>{
    const m = g.getAttribute("transform");
    const match = /translate\(([^\s]+)\s+([^\)]+)\)/.exec(m || "");
    if(match){
      g.style.setProperty("--tx", match[1] + "px");
      g.style.setProperty("--ty", match[2] + "px");
      g.removeAttribute("transform");
    }
  });
  return container.innerHTML;
}

function mountBackground(){
  const layer = $("#bgLayer") || $("#bg");
  if(!layer) return;
  layer.innerHTML = buildBackgroundSvg();
}
window.addEventListener("resize", () => {
  // Light re-render (debounced)
  clearTimeout(window.__bgT);
  window.__bgT = setTimeout(mountBackground, 250);
});

function setupBgParallax(){
  const bg = $("#bg");
  if(!bg) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  let enabled = matchMedia("(pointer: fine)").matches;
  const ampX = 18;
  const ampY = 12;
  const onMove = (e)=>{
    if(!enabled) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    bg.style.setProperty("--parX", `${Math.round(nx*ampX)}px`);
    bg.style.setProperty("--parY", `${Math.round(ny*ampY)}px`);
  };
  window.addEventListener("mousemove", onMove, {passive:true});
  // reset on touch
  window.addEventListener("touchstart", ()=>{
    enabled = false;
    bg.style.setProperty("--parX", "0px");
    bg.style.setProperty("--parY", "0px");
  }, {passive:true, once:true});
}

/* ---------- Projects ---------- */
let PROJECTS = [];
function renderProjects(list){
  const root = $("#projects");
  root.innerHTML = "";
  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<div class="card-inner">
      <div class="card-title">Aucun atelier trouvé</div>
      <div class="card-desc">Lance un scan via Admin.</div>
    </div>`;
    root.appendChild(empty);
    return;
  }

  for(const p of list){
    const card = document.createElement("div");
    card.className = "card";
    const status = (p.status || "DEV").toUpperCase();
    const badgeClass = status === "STABLE" ? "stable" : "dev";
    const tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map(s=>s.trim()).filter(Boolean) : []);
    const icon = p.icon || "⚙️";
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(icon)} ${escapeHtml(p.title || p.slug)}</div>
          </div>
          <div class="badge ${badgeClass}">${status === "STABLE" ? "Stable" : "En dev"}</div>
        </div>
        <div class="card-desc">${escapeHtml(p.description || "—")}</div>
        <div class="tags">${tags.slice(0,6).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        <div class="card-actions">
          <a class="btn btn-primary" href="./${encodeURIComponent(p.slug)}/">Ouvrir</a>
        </div>
      </div>
    `;
    root.appendChild(card);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function applyProjectFilters(){
  const q = ($("#search").value || "").trim().toLowerCase();
  const st = $("#filterStatus").value;
  let list = [...PROJECTS];

  if(st !== "ALL"){
    list = list.filter(p => (p.status || "DEV").toUpperCase() === st);
  }
  if(q){
    list = list.filter(p=>{
      const tags = Array.isArray(p.tags) ? p.tags.join(" ") : String(p.tags||"");
      return (String(p.title||"").toLowerCase().includes(q)
        || String(p.slug||"").toLowerCase().includes(q)
        || tags.toLowerCase().includes(q));
    });
  }

  list.sort((a,b)=> (a.order??9999) - (b.order??9999) || String(a.slug).localeCompare(String(b.slug)));
  renderProjects(list);
}

async function loadProjects(){
  try{
    PROJECTS = await fetchJson(CONFIG.projectsJson);
  }catch(e){
    PROJECTS = [];
  }
  applyProjectFilters();
}

/* ---------- Titles / Unlocks ---------- */
let TITLES = [];
const RULE_TITLES = [
  { id:"KONAMI", name:"Cryptographe d’Arcade", hint:"Saisis un certain code… ↑↑↓↓←→←→BA", type:"rule" },
  { id:"GIFT", name:"Attrapeur de Cadeaux", hint:"Un cadeau tombe parfois. Clique dessus pour l’attraper.", type:"rule" },
  { id:"BOILER", name:"Briseur de Chaudière", hint:"Tourne la manivelle assez vite pour faire exploser la machine.", type:"rule" },
  { id:"SPARK", name:"Étincelle d’Atelier", hint:"Active l’ambiance et reste sur la page un moment.", type:"rule" },
  { id:"ARCHIVISTE", name:"Archiviste du Panini", hint:"Ouvre l’atelier Panini (si présent).", type:"rule" },
  { id:"ARGENTIQUE", name:"Oeil Argentique", hint:"Ouvre l’atelier Argentique (si présent).", type:"rule" },
  { id:"DECRYPTEUR", name:"Décrypteur Agréé", hint:"Ouvre l’atelier Décrypteur (si présent).", type:"rule" },
  { id:"IMP", name:"Imprimeur de l’Ombre", hint:"Ouvre l’atelier Imp (si présent).", type:"rule" },
  { id:"CATALOGUE", name:"Cartographe d’Ateliers", hint:"Visite 3 ateliers différents.", type:"rule" },
  { id:"SILENCE", name:"Silencieux Mécanique", hint:"Trouve le bouton muet après activation.", type:"rule" },
];

const MANUAL_TITLES_DEFAULT = [
  // 10 global manual examples (editable in admin)
  { id:"TECH", name:"Technicien de Rouage", hint:"Débloqué manuellement.", type:"manual" },
  { id:"OPERATEUR", name:"Opérateur de Mission", hint:"Débloqué manuellement.", type:"manual" },
  { id:"AIGUILLE", name:"Maître des Aiguilles", hint:"Débloqué manuellement.", type:"manual" },
  { id:"CHRONO", name:"Gardien du Chronomètre", hint:"Débloqué manuellement.", type:"manual" },
  { id:"ALCHIMISTE", name:"Alchimiste de Cuivre", hint:"Débloqué manuellement.", type:"manual" },
  { id:"MECANO", name:"Mécano des Brumes", hint:"Débloqué manuellement.", type:"manual" },
  { id:"MAITREJEU", name:"Maître d’Atelier", hint:"Débloqué manuellement.", type:"manual" },
  { id:"CARTER", name:"Inspecteur Carter", hint:"Débloqué manuellement.", type:"manual" },
  { id:"ARCHIVEUR", name:"Archiveur S.T.E.A.M.", hint:"Débloqué manuellement.", type:"manual" },
  { id:"REDACTEUR", name:"Rédacteur de Gazette", hint:"Débloqué manuellement.", type:"manual" },
];

const AFFILIATION_TITLES = {
  LIMOGES: { id:"AFF_LIMOGES", name:"Agent de Limoges", hint:"Débloqué via affiliation.", type:"affiliation" },
  VICHY: { id:"AFF_VICHY", name:"Agent de Vichy", hint:"Débloqué via affiliation.", type:"affiliation" },
  COURNON: { id:"AFF_COURNON", name:"Agent de Cournon", hint:"Débloqué via affiliation.", type:"affiliation" },
};

async function loadTitles(){
  let fileTitles = null;
  try{ fileTitles = await fetchJson(CONFIG.titlesJson); }catch(e){ fileTitles = null; }

  // Merge / fallback
  const manual = (fileTitles?.manual && Array.isArray(fileTitles.manual)) ? fileTitles.manual : MANUAL_TITLES_DEFAULT;
  const rule = RULE_TITLES;
  TITLES = [
    ...Object.values(AFFILIATION_TITLES),
    ...manual,
    ...rule
  ];
}

function getAgentIndex(){
  try{ return JSON.parse(localStorage.getItem(CONFIG.local.indexKey) || "[]"); }catch(e){ return []; }
}
function setAgentIndex(list){
  localStorage.setItem(CONFIG.local.indexKey, JSON.stringify(list));
}
function agentKey(code){ return CONFIG.local.agentPrefix + code; }

function loadAgent(code){
  const raw = localStorage.getItem(agentKey(code));
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}

function saveAgentData(agent){
  localStorage.setItem(agentKey(agent.code), JSON.stringify(agent));
}

function ensureAgent(code){
  let a = loadAgent(code);
  if(!a){
    a = {
      code,
      name: "",
      affiliation: "LIMOGES",
      unlocked: [],
      equippedTitle: null,
      stats: {
        visited: [],
        giftCaught: 0,
        crankExplodes: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveAgentData(a);
  }
  // ensure affiliation unlock
  const aff = AFFILIATION_TITLES[a.affiliation] || AFFILIATION_TITLES.LIMOGES;
  unlockTitle(a, aff.id, false);
  return a;
}

function unlockTitle(agent, titleId, announce=true){
  if(!agent.unlocked.includes(titleId)){
    agent.unlocked.push(titleId);
    agent.updatedAt = Date.now();
    saveAgentData(agent);
    if(announce){
      const t = TITLES.find(x=>x.id===titleId);
      logEvent(`Titre débloqué : ${t ? t.name : titleId}`);
    }
  }
}

function isUnlocked(agent, titleId){
  return agent.unlocked.includes(titleId);
}

function currentTitleName(agent){
  const t = TITLES.find(x=>x.id===agent.equippedTitle);
  return t ? t.name : "Sans titre";
}

function updateHud(agent){
  const name = agent.name?.trim() ? agent.name.trim() : "Agent inconnu";
  const affLabel = ({
    LIMOGES: "Limoges",
    VICHY: "Vichy",
    COURNON: "Cournon"
  })[agent.affiliation] || agent.affiliation;

  const line1 = `${name} • ${affLabel}`;
  const line2 = `${agent.code} — ${currentTitleName(agent)}`;

  $("#hudAgentLine1").textContent = line1;
  $("#hudAgentLine2").textContent = line2;

  const topName = $("#hudAgentTopName");
  const topTitle = $("#hudAgentTopTitle");
  if(topName) topName.textContent = line1;
  if(topTitle) topTitle.textContent = line2;
}

function populateTitleSelect(agent){
  const sel = $("#equippedTitle");
  sel.innerHTML = "";

  const optNone = document.createElement("option");
  optNone.value = "";
  optNone.textContent = "— Sans titre —";
  sel.appendChild(optNone);

  // Show unlocked titles only
  const unlockedTitles = TITLES.filter(t => isUnlocked(agent, t.id));
  unlockedTitles.sort((a,b)=> a.name.localeCompare(b.name));
  for(const t of unlockedTitles){
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.name;
    sel.appendChild(o);
  }

  sel.value = agent.equippedTitle || "";
  $("#titleHint").textContent = sel.value
    ? (TITLES.find(t=>t.id===sel.value)?.hint || "")
    : "Débloque des titres avec les easter eggs, ou via Admin.";
}

function populateAgentSelect(currentCode){
  const sel = $("#agentSelect");
  sel.innerHTML = "";
  const idx = getAgentIndex();

  // sort by most recently updated
  idx.sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));

  for(const it of idx){
    const a = loadAgent(it.code);
    const label = a?.name?.trim()
      ? `${a.name.trim()} (${it.code})`
      : `Profil ${it.code}`;
    const o = document.createElement("option");
    o.value = it.code;
    o.textContent = label;
    sel.appendChild(o);
  }

  // If none exist, create first
  if(idx.length === 0){
    const code = randHex4();
    idx.push({code, updatedAt: Date.now()});
    setAgentIndex(idx);
    ensureAgent(code);
    populateAgentSelect(code);
    return;
  }

  if(currentCode && idx.some(x=>x.code===currentCode)){
    sel.value = currentCode;
  }else{
    sel.value = idx[0].code;
  }
}

function selectAgent(code){
  const agent = ensureAgent(code);

  $("#agentCode").value = agent.code;
  $("#agentName").value = agent.name || "";
  $("#affiliation").value = agent.affiliation || "LIMOGES";

  updateHud(agent);
  populateTitleSelect(agent);
  return agent;
}

function touchIndex(code){
  const idx = getAgentIndex();
  const i = idx.findIndex(x=>x.code===code);
  if(i>=0){
    idx[i].updatedAt = Date.now();
  }else{
    idx.push({code, updatedAt: Date.now()});
  }
  setAgentIndex(idx);
}

function removeFromIndex(code){
  const idx = getAgentIndex().filter(x=>x.code!==code);
  setAgentIndex(idx);
}

/* ---------- Easter eggs logic ---------- */
function setupKonami(agentRef){
  const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let buf = [];
  window.addEventListener("keydown", (e)=>{
    buf.push(e.key);
    buf = buf.slice(-seq.length);
    const ok = seq.every((k,i)=> (buf[i]||"").toLowerCase() === k.toLowerCase());
    if(ok){
      unlockTitle(agentRef(), "KONAMI");
      logEvent("Un mécanisme secret a cliqué derrière la cloison…");
      buf = [];
    }
  });
}

function scheduleGift(agentRef){
  function spawn(){
    const gift = $("#gift");
    gift.hidden = false;
    const x = Math.random() * (window.innerWidth - 60) + 10;
    gift.style.left = `${x}px`;
    gift.style.top = `-60px`;
    gift.style.animation = "none";
    // force reflow
    void gift.offsetWidth;
    const dur = 4 + Math.random()*4;
    gift.style.animation = `fall ${dur}s linear forwards`;
    let caught = false;

    const cleanup = ()=>{
      gift.hidden = true;
      gift.style.animation = "none";
      gift.removeEventListener("click", onClick);
    };

    const onClick = ()=>{
      caught = true;
      cleanup();
      const a = agentRef();
      a.stats.giftCaught = (a.stats.giftCaught||0)+1;
      unlockTitle(a, "GIFT");
      logEvent("🎁 Cadeau attrapé. La brume sent le caramel chaud.");
    };

    gift.addEventListener("click", onClick);

    gift.addEventListener("animationend", ()=>{
      if(!caught) cleanup();
    }, {once:true});
  }

  // random every 35-70 sec
  function loop(){
    const delay = 35000 + Math.random()*35000;
    setTimeout(()=>{
      spawn();
      loop();
    }, delay);
  }
  loop();
}

function setupCrank(agentRef){
  let heat = 0; // 0..1
  let speed = 0; // transient
  let last = performance.now();
  const fill = $("#crankFill");
  const hint = $("#crankHint");
  const btn = $("#crankBtn");

  function tick(t){
    const dt = (t - last) / 1000;
    last = t;
    // decay
    speed = Math.max(0, speed - dt*1.2);
    heat = clamp(heat + speed*dt*0.35 - dt*0.08, 0, 1);
    fill.style.width = `${Math.round(heat*100)}%`;

    if(heat < 0.33) hint.textContent = "Tourne… doucement.";
    else if(heat < 0.66) hint.textContent = "La pression monte.";
    else hint.textContent = "La chaudière hurle…";

    // explode
    if(heat >= 1){
      heat = 0;
      speed = 0;
      fill.style.width = "0%";
      hint.textContent = "💥 Explosion ! (ça sent la suie)";
      btn.classList.add("shake");
      setTimeout(()=>btn.classList.remove("shake"), 450);

      const a = agentRef();
      a.stats.crankExplodes = (a.stats.crankExplodes||0)+1;
      unlockTitle(a, "BOILER");
      saveAgentData(a);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  btn.addEventListener("click", ()=>{
    speed = clamp(speed + 0.22, 0, 2);
  });

  // Mouse wheel control (hover crankBox)
  const box = $("#crankBox");
  let hovering = false;
  if(box){
    box.addEventListener("mouseenter", ()=>{hovering = true;});
    box.addEventListener("mouseleave", ()=>{hovering = false;});
    box.addEventListener("wheel", (e)=>{
      if(!hovering) return;
      e.preventDefault();
      const amt = clamp(Math.abs(e.deltaY) / 120, 0.06, 0.55);
      speed = clamp(speed + amt*0.85, 0, 2);
    }, {passive:false});
  }
}

function setupWorkshopUnlocks(agentRef){
  // Unlock when opening specific workshops & visiting count
  $("#projects").addEventListener("click", (e)=>{
    const a = agentRef();
    const link = e.target.closest("a[href]");
    if(!link) return;
    const href = link.getAttribute("href") || "";
    // slug is ./<slug>/
    const m = /^\.\/([^\/]+)\//.exec(href);
    if(m){
      const slug = decodeURIComponent(m[1]);
      if(!a.stats.visited.includes(slug)){
        a.stats.visited.push(slug);
        saveAgentData(a);
        logEvent(`Atelier consulté : ${slug}`);

        // unlocks by known slugs
        const slugU = slug.toLowerCase();
        if(slugU === "panini") unlockTitle(a, "ARCHIVISTE");
        if(slugU === "argentique") unlockTitle(a, "ARGENTIQUE");
        if(slugU === "decryptpur" || slugU === "decrypteur") unlockTitle(a, "DECRYPTEUR");
        if(slugU === "imp") unlockTitle(a, "IMP");

        if(a.stats.visited.length >= 3) unlockTitle(a, "CATALOGUE");
      }
    }
  });
}

/* ---------- Mini Control Panel (blip/bloup) ---------- */
let __sfxCtx = null;
function sfxCtx(){
  if(__sfxCtx) return __sfxCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  __sfxCtx = new AC();
  return __sfxCtx;
}

function blip(type="blip"){
  const ctx = sfxCtx();
  if(!ctx) return;
  // Browsers may require a user gesture to start; we'll best-effort resume.
  if(ctx.state === "suspended") ctx.resume().catch(()=>{});

  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = (type === "bloup") ? (130 + Math.random()*90) : (420 + Math.random()*240);
  o.type = (type === "bloup") ? "triangle" : "square";
  o.frequency.setValueAtTime(f, t0);
  o.frequency.exponentialRampToValueAtTime(f*0.65, t0 + 0.08);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.14);
}

function buildControlPanelSvg(){
  // Steampunk-ish small panel with 12 buttons + labels
  const btns = [];
  const cols = 4, rows = 3;
  let n = 0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      n++;
      const cx = 42 + c*56;
      const cy = 34 + r*38;
      btns.push(`
        <g class="cp-btn" data-id="B${n}">
          <circle cx="${cx}" cy="${cy}" r="14" fill="rgba(0,0,0,0.22)" stroke="rgba(255,232,201,0.18)" stroke-width="2"/>
          <circle cx="${cx}" cy="${cy}" r="10" fill="rgba(201,163,90,0.16)" stroke="rgba(201,163,90,0.28)" stroke-width="1.5"/>
          <text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="9" fill="rgba(243,232,214,0.78)" font-family="Cinzel, serif">${n}</text>
        </g>
      `);
    }
  }

  return `
  <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="cp_g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(201,163,90,0.14)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.22)"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="238" height="118" rx="18" fill="url(#cp_g)" stroke="rgba(255,232,201,0.12)"/>
    <path d="M18 22 H222" stroke="rgba(255,232,201,0.10)"/>
    <text x="18" y="16" class="cp-small" fill="rgba(243,232,214,0.65)" font-family="Cinzel, serif">PANEL • AUX</text>
    ${btns.join("\n")}
    <g opacity="0.6">
      <circle cx="204" cy="92" r="20" fill="rgba(0,0,0,0.18)" stroke="rgba(255,232,201,0.10)"/>
      <path d="M204 92 L220 86" stroke="rgba(201,163,90,0.35)" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>`;
}

function setupControlPanel(agentRef){
  const host = $("#controlPanel");
  if(!host) return;
  host.innerHTML = `<div class="cp-title">Panneau auxiliaire</div>${buildControlPanelSvg()}`;

  host.addEventListener("click", (e)=>{
    const btn = e.target.closest(".cp-btn");
    if(!btn) return;
    const id = btn.getAttribute("data-id") || "?";
    const type = (Math.random() < 0.42) ? "bloup" : "blip";
    blip(type);
    btn.classList.add("cp-active");
    setTimeout(()=>btn.classList.remove("cp-active"), 150);
    // tiny lore
    if(Math.random() < 0.15) logEvent(`Commande ${id} : ${type.toUpperCase()} ✅`);

    // Example unlock hook (beta): press 1-2-3 quickly unlocks TECH (manual example)
    const a = agentRef();
    a.stats._cpSeq = (a.stats._cpSeq || "") + id.replace(/^B/, "");
    a.stats._cpSeq = a.stats._cpSeq.slice(-6);
    if(/123$/.test(a.stats._cpSeq)){
      unlockTitle(a, "TECH");
      logEvent("🔧 Séquence de test détectée (1-2-3). Titre débloqué.");
    }
    saveAgentData(a);
  });
}

/* ---------- Audio ---------- */
function setupAudio(agentRef){
  const audio = $("#bgm");
  audio.src = CONFIG.audio.src;
  audio.volume = CONFIG.audio.volume;

  const btn = $("#btn-audio");
  const mute = $("#btn-mute");

  const setMuted = (m)=>{
    audio.muted = m;
    mute.querySelector("span:last-child").textContent = m ? "Muet" : "Son";
    if(!m){
      unlockTitle(agentRef(), "SPARK", false); // treat as "ambience used"
    }
  };

  btn.addEventListener("click", async ()=>{
    try{
      await audio.play();
      btn.hidden = true;
      mute.hidden = false;
      setMuted(false);
      logEvent("Ambiance activée.");
      // after 60s, unlock SPARK
      setTimeout(()=>unlockTitle(agentRef(), "SPARK"), 60000);
    }catch(e){
      logEvent("Audio bloqué par le navigateur (clic requis).");
    }
  });

  mute.addEventListener("click", ()=>{
    const next = !audio.muted;
    setMuted(next);
    if(next){
      unlockTitle(agentRef(), "SILENCE");
      logEvent("Silence… les rouages chuchotent.");
    }
  });
}

/* ---------- Kiosk ---------- */
function openKiosk(url){
  // Best-effort kiosk: open a new window with minimal chrome.
  const w = Math.min(1200, screen.width);
  const h = Math.min(800, screen.height);
  const left = Math.max(0, Math.floor((screen.width - w)/2));
  const top = Math.max(0, Math.floor((screen.height - h)/2));
  const features = [
    "noopener",
    "noreferrer",
    "popup=yes",
    "toolbar=0",
    "location=0",
    "status=0",
    "menubar=0",
    "scrollbars=1",
    "resizable=1",
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
  ].join(",");
  const win = window.open(url, "STEAM_KIOSK", features);
  if(win){
    try{ win.focus(); }catch(e){}
  }else{
    // fallback
    window.location.href = url;
  }
}

/* ---------- Boot ---------- */
async function boot(){
  mountBackground();
  setupBgParallax();

  await Promise.all([loadTitles(), loadProjects()]);

  // Agent selection bootstrap
  populateAgentSelect(null);
  let currentCode = $("#agentSelect").value;
  let agent = selectAgent(currentCode);
  touchIndex(agent.code);

  const agentRef = ()=> agent; // mutable ref

  // Mini command panel
  setupControlPanel(agentRef);

  // Wire up agent select
  $("#agentSelect").addEventListener("change", ()=>{
    agent = selectAgent($("#agentSelect").value);
    touchIndex(agent.code);
    populateAgentSelect(agent.code);
    logEvent(`Profil chargé : ${agent.code}`);
  });

  $("#btn-new-code").addEventListener("click", ()=>{
    const code = randHex4();
    ensureAgent(code);
    touchIndex(code);
    populateAgentSelect(code);
    agent = selectAgent(code);
    logEvent(`Nouveau profil créé : ${code}`);
  });

  $("#btn-copy-code").addEventListener("click", async ()=>{
    try{
      await navigator.clipboard.writeText(agent.code);
      logEvent("Code copié.");
    }catch(e){
      logEvent("Impossible de copier (clipboard).");
    }
  });

  $("#btn-save-agent").addEventListener("click", ()=>{
    const name = $("#agentName").value.trim();
    if(name && !validName(name)){
      logEvent("Prénom invalide (caractères spéciaux non autorisés).");
      $("#agentName").focus();
      return;
    }
    agent.name = name;
    agent.affiliation = $("#affiliation").value;
    // ensure affiliation unlock
    unlockTitle(agent, (AFFILIATION_TITLES[agent.affiliation] || AFFILIATION_TITLES.LIMOGES).id, false);
    agent.equippedTitle = $("#equippedTitle").value || null;
    agent.updatedAt = Date.now();
    saveAgentData(agent);
    touchIndex(agent.code);
    populateAgentSelect(agent.code);
    populateTitleSelect(agent);
    updateHud(agent);
    logEvent("Profil sauvegardé.");
  });

  $("#btn-reset-agent").addEventListener("click", ()=>{
    if(!confirm(`Reset du profil ${agent.code} ? (local uniquement)`)) return;
    localStorage.removeItem(agentKey(agent.code));
    removeFromIndex(agent.code);
    logEvent("Profil supprimé.");
    populateAgentSelect(null);
    agent = selectAgent($("#agentSelect").value);
  });

  $("#equippedTitle").addEventListener("change", ()=>{
    const id = $("#equippedTitle").value || null;
    agent.equippedTitle = id;
    agent.updatedAt = Date.now();
    saveAgentData(agent);
    $("#titleHint").textContent = id ? (TITLES.find(t=>t.id===id)?.hint || "") : "—";
    updateHud(agent);
  });

  $("#affiliation").addEventListener("change", ()=>{
    const aff = $("#affiliation").value;
    agent.affiliation = aff;
    unlockTitle(agent, (AFFILIATION_TITLES[aff] || AFFILIATION_TITLES.LIMOGES).id);
    saveAgentData(agent);
    populateTitleSelect(agent);
    updateHud(agent);
  });

  // Project filters
  $("#search").addEventListener("input", applyProjectFilters);
  $("#filterStatus").addEventListener("change", applyProjectFilters);
  $("#btn-refresh").addEventListener("click", loadProjects);

  // Kiosk button
  $("#btn-kiosk").addEventListener("click", ()=>{
    openKiosk(CONFIG.external.limoges);
  });

  // Easter eggs
  setupKonami(agentRef);
  scheduleGift(agentRef);
  setupCrank(agentRef);
  setupWorkshopUnlocks(agentRef);

  // Audio
  setupAudio(agentRef);

  // subtle lore ping
  logEvent("Connexion établie. Les rouages attendent des ordres…");
}

document.addEventListener("DOMContentLoaded", boot);
