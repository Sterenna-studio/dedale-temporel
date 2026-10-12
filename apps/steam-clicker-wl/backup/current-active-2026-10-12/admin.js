import { state, save } from './storage.js';
import { updateShop } from './shop.js';
import { placeRingGears } from './ui.js';
export function attach(){ const t=document.getElementById('adminToggle'); const a=document.getElementById('admin'); t.onclick=()=>a.style.display=(a.style.display==='block'?'none':'block'); document.addEventListener('keydown',e=>{ if(e.key==='`'||e.key==='~') t.click(); });
document.getElementById('spAddBtn').onclick=()=>{ const v=parseFloat(document.getElementById('goldInput').value||'0')||0; state.steam+=v; updateShop(); };
document.getElementById('omegaBtn').onclick=()=>{ const v=parseFloat(document.getElementById('goldInput').value||'0')||0; state.omega+=v; };
document.getElementById('addGear').onclick=()=>add('gear');document.getElementById('addDrone').onclick=()=>add('drone');document.getElementById('addAuto').onclick=()=>add('auto');document.getElementById('addBoiler').onclick=()=>add('boiler');document.getElementById('addAether').onclick=()=>add('aether');
document.getElementById('resetSave').onclick=()=>{ if(confirm('Reset progress?')){ localStorage.clear(); location.reload(); } };
}
function add(id){ state.rings[id].t1++; placeRingGears(); updateShop(); save(); }
