/* Admin • scan + création rapide de portes/projets */
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

const ADMIN_CODE = 'REDACTED_ARCHIVE_ADMIN_CODE';
let authCode = '';

/* background (mini) */
function buildBackgroundSvg(){
  return `
  <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="70%">
        <stop offset="0" stop-color="rgba(201,163,90,0.10)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <g opacity="0.45" fill="none" stroke="rgba(255,232,201,0.12)">
      <circle cx="260" cy="210" r="120"/>
      <circle cx="980" cy="560" r="180"/>
      <circle cx="860" cy="180" r="90"/>
    </g>
  </svg>`;
}
function mountBackground(){
  const layer = document.querySelector('#bgLayer');
  if(layer) layer.innerHTML = buildBackgroundSvg();
}
function setupBgParallax(){
  const bg = document.querySelector('#bg');
  if(!bg) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  let enabled = matchMedia('(pointer: fine)').matches;
  window.addEventListener('mousemove', (e)=>{
    if(!enabled) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    bg.style.setProperty('--parX', `${Math.round(nx*18)}px`);
    bg.style.setProperty('--parY', `${Math.round(ny*12)}px`);
  }, {passive:true});
  window.addEventListener('touchstart', ()=>{ enabled=false; bg.style.setProperty('--parX','0px'); bg.style.setProperty('--parY','0px'); }, {passive:true, once:true});
}

function log(msg){
  const el = $('#adminLog');
  if(!el) return;
  const ts = new Date().toLocaleTimeString();
  el.textContent = `[${ts}] ${msg}\n` + el.textContent;
}

async function api(path, opts={}){
  const headers = Object.assign({
    'X-Admin-Code': authCode
  }, opts.headers || {});
  const res = await fetch(path, Object.assign({}, opts, {headers}));
  const txt = await res.text();
  let data=null;
  try{ data = JSON.parse(txt); }catch{ data = {ok:false,error:'BAD_JSON', raw:txt}; }
  if(!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

async function loadJsonToTextareas(){
  const p = await fetch('./steam_projects.json').then(r=>r.text());
  const d = await fetch('./steam_doors.json').then(r=>r.text());
  $('#taProjects').value = p.trim();
  $('#taDoors').value = d.trim();
}

function renderScanResult(scan){
  const host = $('#scanResults');
  host.innerHTML='';
  const folders = scan.folders || [];
  const projSet = new Set(scan.projects_folders||[]);
  const doorSet = new Set(scan.doors_folders||[]);

  folders.forEach(f=>{
    const row = document.createElement('div');
    row.className='scan-row';
    const status = [
      projSet.has(f) ? '✅ projet' : '— projet',
      doorSet.has(f) ? '🚪 porte' : '— porte'
    ].join(' • ');
    row.innerHTML = `
      <div class="scan-left">
        <div class="scan-folder">${f}</div>
        <div class="muted">${status}</div>
      </div>
      <div class="scan-actions">
        <button class="btn" data-add="project" data-folder="${f}">+ Projet</button>
        <button class="btn" data-add="door" data-folder="${f}">+ Porte</button>
        <button class="btn" data-add="both" data-folder="${f}">+ Les deux</button>
      </div>
    `;
    host.appendChild(row);
  });

  host.addEventListener('click', async (e)=>{
    const b = e.target.closest('button[data-add]');
    if(!b) return;
    const kind = b.dataset.add;
    const folder = b.dataset.folder;
    try{
      await api('./api/add_entry.php', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:`folder=${encodeURIComponent(folder)}&kind=${encodeURIComponent(kind)}`
      });
      log(`Ajout ${kind} pour ${folder}`);
      await doScan();
      await loadJsonToTextareas();
    }catch(err){
      log('❌ ' + err.message);
    }
  }, {once:true});
}

async function doScan(){
  const scan = await api('./api/scan_folders.php');
  renderScanResult(scan);
  log(`Scan OK • ${scan.folders?.length||0} dossier(s)`);
}

function setup(){
  mountBackground();
  setupBgParallax();
  $('#btnLogin').addEventListener('click', async ()=>{
    authCode = ($('#adminCode').value || '').trim();
    if(!authCode){ log('⚠ Entre le code admin'); return; }
    try{
      await doScan();
      await loadJsonToTextareas();
      $('#authBox').classList.add('hidden');
      $('#adminPanel').classList.remove('hidden');
      log('🔓 Auth OK');
    }catch(err){
      log('❌ ' + err.message);
    }
  });

  $('#btnScan').addEventListener('click', async ()=>{
    try{ await doScan(); }catch(err){ log('❌ '+err.message); }
  });

  $('#btnSaveProjects').addEventListener('click', async ()=>{
    try{
      await api('./api/save_projects.php', {method:'POST', body:$('#taProjects').value});
      log('✔ projets sauvés');
      await doScan();
    }catch(err){ log('❌ '+err.message); }
  });

  $('#btnSaveDoors').addEventListener('click', async ()=>{
    try{
      await api('./api/save_doors.php', {method:'POST', body:$('#taDoors').value});
      log('✔ portes sauvées');
      await doScan();
    }catch(err){ log('❌ '+err.message); }
  });

  // prefill for convenience
  $('#adminCode').value = ADMIN_CODE;
}

setup();
