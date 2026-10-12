import { ITEMS } from './config.js';
import { state, save } from './storage.js';
import { buildStage, placeRingGears } from './ui.js';

const id=(x)=>document.getElementById(x);

export function build(){
  const itemsEl=id('items'); itemsEl.innerHTML='';
  ITEMS.forEach((it,idx)=>{
    const el=document.createElement('div'); el.className='item'; el.id=`item-${it.id}`;
    el.innerHTML=`<div class="icon" id="icon-${it.id}"></div>
    <div><div style="font-weight:800">${it.name} <span class="small" id="own-${it.id}">×0</span></div>
    <div class="small">Coût: <span id="cost-${it.id}">-</span> · Couple: <b>${(it.torque).toFixed(0)}</b></div>
    <div class="small">Connexions: <span id="conn-${it.id}">0</span> — <span id="chain-${it.id}" style="color:#e0c074"></span></div></div>
    <div><button id="buy1-${it.id}">Acheter</button><div style="height:6px"></div><button id="buy10-${it.id}">Acheter ×10</button></div>`;
    itemsEl.appendChild(el);
    id(`buy1-${it.id}`).addEventListener('click',()=>buy(it.id,1));
    id(`buy10-${it.id}`).addEventListener('click',(e)=>buy(it.id,e.shiftKey?100:10));
  });
  updateShop(); buildStage(); placeRingGears();
}

export function computeConnectivity(){
  const connected={};
  const order=['gear','drone','auto','boiler','aether'];
  const stage=document.getElementById('stage');
  order.forEach((rid,idx)=>{
    const r=state.rings[rid];
    if(r.chain){ connected[rid]=Math.max(1,r.t1+r.t2); return; }
    if(idx===0){ connected[rid]=r.t1+r.t2; return; }
    const angPrev=stage._rings[idx-1]?._angles||[];
    const angThis=stage._rings[idx]?._angles||[];
    let conn=0; const tol=180/Math.max(angThis.length||1,(angPrev.length?angPrev.length*2:1));
    for(const a of angThis){ let ok=false; for(const b of angPrev){ const d=Math.abs(((a-b+540)%360)-180); if(d<=tol){ ok=true; break; } } if(ok) conn++; }
    connected[rid]=conn;
  });
  order.forEach(rid=>{ const el=id(`conn-${rid}`); if(el) el.textContent=(connected[rid]||0); });
  return connected;
}

export function totalTorque(conn){
  let T=0; const order=['gear','drone','auto','boiler','aether'];
  order.forEach((rid,idx)=>{
    const r=state.rings[rid]; const leverage=1+idx*0.25; const baseTorque=(ITEMS.find(x=>x.id===rid).torque);
    const t1=Math.min(conn[rid]||0,r.t1);
    const t2=Math.max(0,(conn[rid]||0)-r.t1);
    const chainTorque=r.chain? baseTorque*220*leverage : 0;
    T += t1*baseTorque*leverage + t2*(baseTorque*12)*leverage + chainTorque;
  }); return T;
}

function getCost(itemId,count){
  const it=ITEMS.find(x=>x.id===itemId); const r=state.rings[itemId];
  const owned=r.t1 + r.t2*10 + (r.chain?100:0);
  let c=0; for(let k=0;k<count;k++){ c += it.baseCost * Math.pow(it.costMult, owned + k); }
  return c;
}
function fmt(n){ if(n<1000)return n.toFixed(0); const u=['','K','M','B','T','Q']; let i=0; while(n>=1000&&i<u.length-1){n/=1000;i++;} return n.toFixed(2)+u[i]; }

function fusionCheck(itemId){
  const r=state.rings[itemId];
  while(r.t1>=10){ r.t1-=10; r.t2+=1; }
  if(r.t2>=10 && !r.chain){ r.t2-=10; r.chain=true; document.getElementById('modulePanel').style.display='block'; }
}

export function updateShop(){
  ITEMS.forEach(it=>{
    const r=state.rings[it.id]; const own=r.t1 + r.t2 + (r.chain?1:0);
    const ownEl=id(`own-${it.id}`); if(ownEl) ownEl.textContent='×'+own;
    const costEl=id(`cost-${it.id}`); if(costEl) costEl.textContent=fmt(getCost(it.id,1));
    const chainEl=id(`chain-${it.id}`); if(chainEl) chainEl.textContent=r.chain?'Chaîne + modules':'';
    id(`buy1-${it.id}`).disabled = state.steam<getCost(it.id,1);
    id(`buy10-${it.id}`).disabled = state.steam<getCost(it.id,10);
  });
}

export function buy(itemId,count){
  const cost=getCost(itemId,count);
  if(state.steam<cost) return;
  state.steam-=cost;
  state.rings[itemId].t1+=count;
  fusionCheck(itemId);
  placeRingGears(); updateShop(); save();
}
