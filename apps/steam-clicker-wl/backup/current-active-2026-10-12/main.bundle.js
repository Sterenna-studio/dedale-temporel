
(function(){
  'use strict';

  // =================== Config ===================
  var SAVE_KEY='steam_clicker_v6_noesm';
  var CONV_RATE_SP=100000;
  var PHYS={baseInertia:1400,frictionBase:0.45,frictionTempK:0.002,wheelImpulse:22,clickImpulse:90,spsPerOmega:0.08,negPenalty:0.8,pressureK:0.006,tempK:0.02,pressureToTempK:0.0009,coolingK:0.015,maxOmegaGauge:1600};
  var ITEMS=[
    {id:'gear',name:'Gears',ring:0,baseCost:15,costMult:1.15,torque:12,color:'steel'},
    {id:'drone',name:'Copper Drones',ring:1,baseCost:120,costMult:1.16,torque:30,color:'copper'},
    {id:'auto',name:'Temporal Automatons',ring:2,baseCost:950,costMult:1.17,torque:85,color:'bronze'},
    {id:'boiler',name:'Pressure Boilers',ring:3,baseCost:5200,costMult:1.18,torque:220,color:'brass'},
    {id:'aether',name:'Aether Condensers',ring:4,baseCost:33000,costMult:1.19,torque:620,color:'aether'}
  ];
  var MATERIALS={steel:['#6d6d73','#44464c','#222429'],copper:['#c96f3b','#9a4e2c','#4b2a1c'],bronze:['#b58a3a','#8a6a21','#3e2c12'],brass:['#e0c074','#b98a2e','#5e4617'],gold:['#f8e391','#d4ad3d','#6a5216'],titanium:['#8ea6c1','#596a85','#2b3747'],aether:['#7fe3ff','#3aa6c9','#1a3a48']};
  var SIZES_BASE=[54,42,38,36,34];

  // =================== State ===================
  var state={plate:1,steam:0,omega:0,spin:0,pressure:0,temperature:20,lastTime:performance.now(),blueprints:0,prestigeMult:1,hasZoomedOut:false,rings:{gear:{t1:0,t2:0,chain:false,module:null},drone:{t1:0,t2:0,chain:false,module:null},auto:{t1:0,t2:0,chain:false,module:null},boiler:{t1:0,t2:0,chain:false,module:null},aether:{t1:0,t2:0,chain:false,module:null}},offsets:[0,18,36,54,72],debug:false,overdrive:false,overdriveTime:0,overdriveTempMax:100};

  function load(){try{var s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s){ for(var k in s){ state[k]=s[k]; } }}catch(e){}}
  function save(){localStorage.setItem(SAVE_KEY, JSON.stringify(state));}

  // =================== SVG & UI Helpers ===================
  function stage(){ return document.getElementById('stage'); }
  function svgEl(n,a){ a=a||{}; var e=document.createElementNS('http://www.w3.org/2000/svg',n); for(var k in a){ e.setAttribute(k,a[k]); } return e; }
  function ensureDefs(){ var d=stage().querySelector('defs'); if(!d){ d=svgEl('defs'); stage().appendChild(d); } return d; }
  function tierColors(base,t){ var mat=MATERIALS[base]||MATERIALS.steel; var map={steel:'copper',copper:'bronze',bronze:'brass',brass:'gold',gold:'titanium',titanium:'aether',aether:'aether'}; return t===2?(MATERIALS[map[base]]||mat):mat; }
  function gearPath(cx,cy,r,te){ var p=svgEl('path',{fill:'#1e140c'}); var th=(Math.PI*2)/te; var tooth=th*0.6; var gap=th-tooth; var d=''; for(var i=0;i<te;i++){ var a=i*th, a2=a+tooth, aM=a+tooth/2; var x1=cx+Math.cos(a)*r, y1=cy+Math.sin(a)*r; var x2=cx+Math.cos(a2)*r, y2=cy+Math.sin(a2)*r; var xg=cx+Math.cos(a2+gap)*r, yg=cy+Math.sin(a2+gap)*r; var xM=cx+Math.cos(aM)*(r+r*0.16), yM=cy+Math.sin(aM)*(r+r*0.16); d+=(i===0?('M '+x1+' '+y1):(' L '+x1+' '+y1))+' L '+xM+' '+yM+' L '+x2+' '+y2+' L '+xg+' '+yg; } d+=' Z'; p.setAttribute('d',d); p.setAttribute('stroke','#000'); p.setAttribute('stroke-width', r*0.02); return p; }
  function makeGear(cx,cy,r,te,c){ var g=svgEl('g'); var gradId='grad_'+Math.random().toString(36).slice(2); var defs=ensureDefs(); var lg=svgEl('linearGradient',{id:gradId,x1:'0',y1:'0',x2:'1',y2:'1'}); lg.appendChild(svgEl('stop',{offset:'0%','stop-color':c[0]})); lg.appendChild(svgEl('stop',{offset:'60%','stop-color':c[1]})); lg.appendChild(svgEl('stop',{offset:'100%','stop-color':c[2]})); defs.appendChild(lg); var toothed=gearPath(cx,cy,r,te); var face=svgEl('circle',{cx:cx,cy:cy,r:r*0.6,fill:'url(#'+gradId+')',stroke:'#2a1b0f','stroke-width':r*0.08}); g.appendChild(toothed); g.appendChild(face); g.appendChild(svgEl('circle',{cx:cx,cy:cy,r:r*0.1,fill:'#24160c',stroke:'#000','stroke-width':r*0.04})); return g; }
  function setVB(){ var r=stage().getBoundingClientRect(); stage().setAttribute('viewBox','0 0 '+r.width+' '+r.height); }
  function metrics(){ var r=stage().getBoundingClientRect(); var w=r.width, h=r.height; var m=Math.min(w,h); var gap=Math.max(36, Math.floor(m*0.06)); var mainR=Math.max(90, Math.min(160, Math.floor(m*0.22))); return {w:w,h:h,cx:w/2,cy:h/2+6,mainR:mainR,gap:gap}; }
  var M=null;

  function buildStage(){
    stage().innerHTML=''; setVB(); M=metrics(); var cx=M.cx, cy=M.cy;
    var defs=ensureDefs(); var wood=svgEl('radialGradient',{id:'woodTex',cx:'50%',cy:'50%'});
    wood.appendChild(svgEl('stop',{offset:'0%','stop-color':'#3a2718'}));
    wood.appendChild(svgEl('stop',{offset:'50%','stop-color':'#2b1d12'}));
    wood.appendChild(svgEl('stop',{offset:'100%','stop-color':'#1e140d'}));
    defs.appendChild(wood);
    stage().appendChild(svgEl('circle',{cx:cx,cy:cy,r:M.mainR+M.gap*5+90,fill:'url(#woodTex)'}));
    var main=makeGear(cx,cy,M.mainR,28,tierColors('brass',2));
    main.style.transformOrigin=cx+'px '+cy+'px';
    stage().appendChild(main);
    stage()._main=main; stage()._center={cx:cx,cy:cy}; stage()._mainR=M.mainR; stage()._ringGap=M.gap;
    stage()._connLayer=svgEl('g'); stage().appendChild(stage()._connLayer);
    stage()._rings=[]; stage()._chains=[];
    for(var i=0;i<5;i++){ var g=svgEl('g'); stage().appendChild(g); stage()._rings.push(g); var ch=svgEl('g'); stage().appendChild(ch); stage()._chains.push(ch); }
    stage().appendChild(svgEl('ellipse',{cx:cx, cy:cy-20, rx:M.mainR+M.gap*5+60, ry:M.mainR+M.gap*5-10, fill:'rgba(255,255,255,0.02)'}));
  }

  function placeRingGears(){
    var cx=stage()._center.cx, cy=stage()._center.cy;
    stage()._connLayer.innerHTML=''; stage()._chains.forEach(function(g){ g.innerHTML=''; }); stage()._rings.forEach(function(g){ g.innerHTML=''; });
    var sizeScale=Math.max(0.8, Math.min(1.3, M.mainR/120));
    var ids=['gear','drone','auto','boiler','aether'];
    for(var idx=0; idx<ids.length; idx++){
      var id=ids[idx];
      var r=state.rings[id];
      var ringR = stage()._mainR + stage()._ringGap*(idx+1);
      var base=SIZES_BASE[idx];
      var size=base*sizeScale;
      var g=stage()._rings[idx];
      var colors=tierColors(['steel','copper','bronze','brass','aether'][idx],1);
      if(r.chain){
        var ch=stage()._chains[idx];
        var c=svgEl('circle',{cx:cx,cy:cy,r:ringR,fill:'none',stroke:colors[1],'stroke-width':size*0.4,'stroke-dasharray':'18 18','stroke-linecap':'round',opacity:0.85});
        ch.appendChild(c); ch._circle=c;
      }else{
        var total=r.t1+r.t2; var start=state.offsets[idx]; var angles=[];
        for(var i=0;i<total;i++){
          var a=start+(360/Math.max(total,1))*i; angles.push(a);
          var rad=a*Math.PI/180; var x=cx+ringR*Math.cos(rad), y=cy+ringR*Math.sin(rad);
          var tier=(i<r.t2)?2:1;
          var gear=makeGear(x,y, tier===2?size*1.1:size, 10+idx*2+(tier===2?2:0), tierColors(['steel','copper','bronze','brass','aether'][idx], tier));
          gear.style.transformOrigin=x+'px '+y+'px'; g.appendChild(gear);
        }
        g._angles=angles;
      }
    }
    // connections
    for(var k=1;k<5;k++){
      var prev=stage()._rings[k-1]; var curr=stage()._rings[k];
      var angPrev=prev._angles||[]; var angThis=curr._angles||[];
      var tol = 180/Math.max(angThis.length||1, (angPrev.length?angPrev.length*2:1));
      for(var ia=0; ia<angThis.length; ia++){
        var a=angThis[ia]; var nearest=null, best=999;
        for(var ib=0; ib<angPrev.length; ib++){
          var b=angPrev[ib];
          var d=Math.abs(((a-b+540)%360)-180);
          if(d<best){best=d; nearest=b;}
        }
        if(nearest!==null){
          var rIn=stage()._mainR+stage()._ringGap*(k), rOut=stage()._mainR+stage()._ringGap*(k+1);
          var ra=a*Math.PI/180, rb=nearest*Math.PI/180;
          var x1=stage()._center.cx+rOut*Math.cos(ra), y1=stage()._center.cy+rOut*Math.sin(ra);
          var x2=stage()._center.cx+rIn*Math.cos(rb), y2=stage()._center.cy+rIn*Math.sin(rb);
          var ok = best<=tol;
          var line=svgEl('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke: (ok?'#9ad484':'#d48a8a'), 'stroke-width':3, opacity: (ok ? 0.6 : 0.25)});
          stage()._connLayer.appendChild(line);
        }
      }
    }
  }

  function fmt(n){ if(n<1000) return n.toFixed(0); var u=['','K','M','B','T','Q']; var i=0; while(n>=1000 && i<u.length-1){ n/=1000; i++; } return n.toFixed(2)+u[i]; }

  // =================== Shop & Connectivity ===================
  function computeConnectivity(){
    var connected={}; var order=['gear','drone','auto','boiler','aether'];
    for(var i=0;i<order.length;i++){
      var rid=order[i]; var r=state.rings[rid];
      if(r.chain){ connected[rid]=Math.max(1, r.t1+r.t2); continue; }
      if(i===0){ connected[rid]=r.t1+r.t2; continue; }
      var angPrev=stage()._rings[i-1]? (stage()._rings[i-1]._angles||[]) : [];
      var angThis=stage()._rings[i]? (stage()._rings[i]._angles||[]) : [];
      var conn=0; var tol=180/Math.max(angThis.length||1, (angPrev.length?angPrev.length*2:1));
      for(var aIdx=0;aIdx<angThis.length;aIdx++){
        var a=angThis[aIdx]; var ok=false;
        for(var bIdx=0;bIdx<angPrev.length;bIdx++){
          var b=angPrev[bIdx];
          var d=Math.abs(((a-b+540)%360)-180);
          if(d<=tol){ ok=true; break; }
        }
        if(ok) conn++;
      }
      connected[rid]=conn;
    }
    for(var j=0;j<order.length;j++){ var el=document.getElementById('conn-'+order[j]); if(el){ el.textContent = (connected[order[j]]||0); } }
    return connected;
  }

  function totalTorque(conn){
    var T=0; var order=['gear','drone','auto','boiler','aether'];
    for(var i=0;i<order.length;i++){
      var rid=order[i]; var r=state.rings[rid]; var leverage=1+i*0.25;
      var baseTorque=0; for(var ii=0;ii<ITEMS.length;ii++){ if(ITEMS[ii].id===rid){ baseTorque=ITEMS[ii].torque; break; } }
      var c=(conn[rid]||0);
      var t1 = Math.min(c, r.t1);
      var t2 = Math.max(0, c - r.t1);
      var chainTorque = r.chain ? baseTorque*220*leverage : 0;
      T += t1*baseTorque*leverage + t2*(baseTorque*12)*leverage + chainTorque;
    }
    return T;
  }

  function getCost(itemId,count){
    var it=null; for(var i=0;i<ITEMS.length;i++){ if(ITEMS[i].id===itemId){ it=ITEMS[i]; break; } }
    var r=state.rings[itemId];
    var owned=r.t1 + r.t2*10 + (r.chain?100:0);
    var c=0; for(var k=0;k<count;k++){ c += it.baseCost * Math.pow(it.costMult, owned + k); }
    return c;
  }

  function fusionCheck(itemId){
    var r=state.rings[itemId];
    while(r.t1>=10){ r.t1-=10; r.t2+=1; }
    if(r.t2>=10 && !r.chain){ r.t2-=10; r.chain=true; var mp=document.getElementById('modulePanel'); if(mp) mp.style.display='block'; }
  }

  function updateShop(){
    for(var i=0;i<ITEMS.length;i++){
      var it=ITEMS[i];
      var r=state.rings[it.id]; var own=r.t1 + r.t2 + (r.chain?1:0);
      var ownEl=document.getElementById('own-'+it.id); if(ownEl) ownEl.textContent='×'+own;
      var costEl=document.getElementById('cost-'+it.id); if(costEl) costEl.textContent=fmt(getCost(it.id,1));
      var chainEl=document.getElementById('chain-'+it.id); if(chainEl) chainEl.textContent = r.chain ? 'Chaîne + modules' : '';
      var b1=document.getElementById('buy1-'+it.id); if(b1) b1.disabled = (state.steam < getCost(it.id,1));
      var b10=document.getElementById('buy10-'+it.id); if(b10) b10.disabled = (state.steam < getCost(it.id,10));
    }
  }

  function buy(itemId,count){
    var cost=getCost(itemId,count);
    if(state.steam < cost) return;
    state.steam -= cost;
    state.rings[itemId].t1 += count;
    fusionCheck(itemId);
    placeRingGears(); updateShop(); save();
  }

  function buildShop(){
    var itemsEl=document.getElementById('items'); itemsEl.innerHTML='';
    for(var i=0;i<ITEMS.length;i++){
      var it=ITEMS[i];
      var el=document.createElement('div'); el.className='item'; el.id='item-'+it.id;
      el.innerHTML = '<div class="icon" id="icon-'+it.id+'"></div>' +
      '<div><div style="font-weight:800">'+it.name+' <span class="small" id="own-'+it.id+'">×0</span></div>' +
      '<div class="small">Coût: <span id="cost-'+it.id+'">-</span> · Couple: <b>'+it.torque.toFixed(0)+'</b></div>' +
      '<div class="small">Connexions: <span id="conn-'+it.id+'">0</span> — <span id="chain-'+it.id+'" style="color:#e0c074"></span></div></div>' +
      '<div><button id="buy1-'+it.id+'">Acheter</button><div style="height:6px"></div><button id="buy10-'+it.id+'">Acheter ×10</button></div>';
      itemsEl.appendChild(el);
      (function(id){
        document.getElementById('buy1-'+id).addEventListener('click', function(){ buy(id,1); });
        document.getElementById('buy10-'+id).addEventListener('click', function(e){ buy(id, e && e.shiftKey ? 100 : 10); });
      })(it.id);
    }
    updateShop(); buildStage(); placeRingGears();
  }

  // =================== Physics ===================
  function physicsStep(dt){
    var conn=computeConnectivity();
    var T=totalTorque(conn);
    var friction=(PHYS.frictionBase)*(1+PHYS.frictionTempK*(state.temperature-20));
    var a=(T/PHYS.baseInertia) - friction*(state.omega/1200);
    state.omega += a*dt;
    state.pressure += (Math.abs(state.omega)*PHYS.pressureK - PHYS.coolingK)*dt; if(state.pressure<0) state.pressure=0;
    state.temperature += (Math.abs(state.omega)*PHYS.tempK + state.pressure*PHYS.pressureToTempK - PHYS.coolingK)*dt; if(state.temperature<0) state.temperature=0;
    var sps=Math.abs(state.omega)*PHYS.spsPerOmega*(state.omega>=0?1:PHYS.negPenalty);
    state.steam += sps*dt;
    return {sps:sps};
  }
  function applyClickImpulse(){ state.omega += PHYS.clickImpulse; }
  function applyWheelImpulse(delta,mag,mult){ state.omega += delta * PHYS.wheelImpulse * (0.5+mag) * (mult||1); }

  // =================== HUD & Inputs ===================
  function updateHUD(prod){
    var sps = (prod && prod.sps) ? prod.sps : 0;
    var steamEl=document.getElementById('steamCount');
    var spsEl=document.getElementById('spsText');
    var omEl=document.getElementById('omegaText');
    var tEl=document.getElementById('tempText');
    var pEl=document.getElementById('pressText');
    if(steamEl) steamEl.textContent = fmt(state.steam);
    if(spsEl) spsEl.textContent = sps.toFixed(2);
    if(omEl) omEl.textContent = state.omega.toFixed(1);
    if(tEl) tEl.textContent = state.temperature.toFixed(1);
    if(pEl) pEl.textContent = state.pressure.toFixed(1);
    var pct=Math.min(1, Math.abs(state.omega)/1600);
    var ang=pct*Math.PI;
    var x=12+46-46*Math.cos(ang), y=38-46*Math.sin(ang);
    var g=document.getElementById('gaugeArc'); if(g) g.setAttribute('d','M12,38 A46,46 0 0,1 '+x.toFixed(2)+','+y.toFixed(2));
  }

  function spinRings(now){
    var ids=['gear','drone','auto','boiler','aether'];
    for(var i=0;i<ids.length;i++){
      var g=stage()._rings[i]; if(!g) continue;
      var n=g.children.length;
      var dir=(i%2===0?1:-1);
      for(var k=0;k<n;k++){
        var child=g.children[k];
        var speed=(1+i*0.5+(k/n)*0.6)*40;
        var angle=(now/1000)*speed*dir;
        child.style.transform='rotate('+angle+'deg)';
      }
      var ch=stage()._chains[i];
      if(ch && ch._circle){
        var off=(now/1000)*160*(state.omega>=0?1:-1);
        ch._circle.style.strokeDashoffset=off;
      }
    }
  }

  function bindMainGearClick(){ if(stage()._main){ stage()._main.addEventListener('click', applyClickImpulse); } }
  function bindWheel(){
    var center=document.getElementById('center');
    center.addEventListener('wheel', function(e){
      e.preventDefault();
      var delta = Math.sign(-e.deltaY);
      var mag = Math.min(3, Math.abs(e.deltaY)/120);
      var mult = e.ctrlKey ? 2 : 1;
      applyWheelImpulse(delta, mag, mult);
      if(state.omega < -200){
        var s=document.createElement('div'); s.className='negSpark'; s.style.left='50%'; s.style.top='50%';
        s.style.setProperty('--dx', (Math.random()*120-60)+'px');
        s.style.setProperty('--dy', (-40-Math.random()*60)+'px');
        stage().parentElement.appendChild(s); setTimeout(function(){ s.remove(); }, 600);
      }
    }, {passive:false});
  }

  // =================== Conversion & Gold (dynamic ESM import) ===================
  var econ=null, supa=null;
  function refreshConvertButton(){
    var btn=document.getElementById('convertBtn');
    var info=document.getElementById('convertInfo');
    var can=state.steam>=CONV_RATE_SP;
    if(btn) btn.disabled = !can;
    if(info) info.textContent = can ? 'Prêt à convertir.' : ('Encore '+(CONV_RATE_SP-state.steam).toFixed(0)+' SP');
  }
  function convertToGold(){
    if(state.steam < CONV_RATE_SP) return;
    state.steam -= CONV_RATE_SP;
    if(econ && typeof econ.addGold === 'function'){
      Promise.resolve(econ.addGold(1)).then(function(){
        if(econ && typeof econ.refreshGold === 'function'){
          econ.refreshGold().then(function(g){
            var ge=document.getElementById('goldCount'); if(ge) ge.textContent=g;
          });
        }
      });
    }
  }

  // =================== Boot ===================
  function buildAdmin(){
    var adminToggle=document.getElementById('adminToggle'); var admin=document.getElementById('admin');
    adminToggle.onclick=function(){ admin.style.display=(admin.style.display==='block'?'none':'block'); };
    document.addEventListener('keydown', function(e){ if(e.key==='`'||e.key==='~'){ adminToggle.click(); }});
    document.getElementById('spAddBtn').onclick=function(){ var v=parseFloat(document.getElementById('goldInput').value||'0')||0; state.steam+=v; updateShop(); };
    document.getElementById('omegaBtn').onclick=function(){ var v=parseFloat(document.getElementById('goldInput').value||'0')||0; state.omega+=v; };
    document.getElementById('addGear').onclick=function(){ state.rings.gear.t1++; placeRingGears(); updateShop(); save(); };
    document.getElementById('addDrone').onclick=function(){ state.rings.drone.t1++; placeRingGears(); updateShop(); save(); };
    document.getElementById('addAuto').onclick=function(){ state.rings.auto.t1++; placeRingGears(); updateShop(); save(); };
    document.getElementById('addBoiler').onclick=function(){ state.rings.boiler.t1++; placeRingGears(); updateShop(); save(); };
    document.getElementById('addAether').onclick=function(){ state.rings.aether.t1++; placeRingGears(); updateShop(); save(); };
    document.getElementById('resetSave').onclick=function(){ if(confirm('Reset progress?')){ localStorage.clear(); location.reload(); } };
  }

  function boot(){
    // dynamic ESM import for shared modules
    Promise.resolve().then(function(){ return import('/lab/shared/supabaseData.js'); }).then(function(mod){ supa=mod; }, function(){ console.warn('supabaseData.js import failed'); }).then(function(){
      return import('/lab/shared/economy.js').then(function(mod){ econ=mod; }, function(){ console.warn('economy.js import failed'); });
    }).then(function(){
      if(supa && typeof supa.initSession==='function') return supa.initSession();
    }).then(function(){
      if(supa && typeof supa.initPlayer==='function') return supa.initPlayer();
    }).then(function(){
      if(supa && typeof supa.refreshPlayer==='function') return supa.refreshPlayer();
    }).then(function(){
      if(econ && typeof econ.refreshGold==='function'){
        return econ.refreshGold().then(function(g){
          var ge=document.getElementById('goldCount'); if(ge) ge.textContent=g;
        });
      }
    }).finally(function(){
      // Game init
      load();
      buildStage(); placeRingGears(); buildShop();
      bindMainGearClick(); bindWheel(); buildAdmin();
      var btn=document.getElementById('convertBtn'); if(btn) btn.addEventListener('click', convertToGold);

      var last=performance.now();
      function loop(now){
        var dt=(now-last)/1000; last=now;
        var prod=physicsStep(dt);
        updateShop(); updateHUD(prod); spinRings(now); refreshConvertButton();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

      window.addEventListener('beforeunload', save);
      window.addEventListener('resize', function(){
        var prev=stage()._center? {cx:stage()._center.cx, cy:stage()._center.cy} : null;
        buildStage(); placeRingGears();
        if(prev){
          var dx=(prev.cx-stage()._center.cx), dy=(prev.cy-stage()._center.cy);
          stage().style.transform='translate('+dx+'px,'+dy+'px)';
          requestAnimationFrame(function(){ stage().style.transform='translate(0,0)'; });
        }
      });
    });
  }

  if(document.readyState!=='loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);

})();