
(() => {
  "use strict";

  // ===== Config =====
  const SHOW_RECT_BADGES = false;         // RX hidden
  const COLLISION_TINT_ENABLED = false;   // collision tint OFF by default (avoid loops)
  const LEVEL_COUNT = 8;

  const SNAP_DIST = 36;
  const BAD_SNAP_DIST = 30;

  const FRICTION = 0.90;         // inertia damping
  const MIN_SPEED = 0.03;        // stop threshold
  const MAX_SPEED = 2.2;         // clamp throw speed (px/ms)
  const COLLIDE_TINT_COOLDOWN = 160; // ms

  // ===== DOM =====
  const playArea = document.getElementById("playArea");
  const statusEl = document.getElementById("status");
  const btnReset = document.getElementById("btnReset");
  const btnTheme = document.getElementById("btnTheme");
  const btnMusic = document.getElementById("btnMusic");

  const symbolPad = document.getElementById("symbolPad");
  const entryEl = document.getElementById("entry");
  const btnBack = document.getElementById("btnBack");
  const btnClear = document.getElementById("btnClear");
  const resultEl = document.getElementById("result");
  const lineProgressEl = document.getElementById("lineProgress");
  const lineSymbolsEl = document.getElementById("lineSymbols");

  // ===== Helpers =====
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nowMs = () => performance.now();

  function setStatus(msg){
    if (statusEl) statusEl.textContent = msg;
  }

  function isMobileLayout(){
    return window.matchMedia("(max-width: 920px)").matches;
  }

  // ===== Audio =====
  class AudioManager{
    constructor(){
      this.enabled = true;
      this.musicOn = false;
      this.lastTint = 0;

      this.sounds = {
        backmusic: new Audio("assets/sounds/backmusic.mp3"),
        tint: new Audio("assets/sounds/tint.mp3"),
        bonk: new Audio("assets/sounds/bonk.mp3"),
        cling: new Audio("assets/sounds/cling.mp3"),
        succes: new Audio("assets/sounds/succes.mp3"),
      };

      this.sounds.backmusic.loop = true;
      this.sounds.backmusic.volume = 0.55;

      this.sounds.tint.volume = 0.45;
      this.sounds.bonk.volume = 0.70;
      this.sounds.cling.volume = 0.70;
      this.sounds.succes.volume = 0.80;
    }

    async toggleMusic(){
      this.musicOn = !this.musicOn;
      if (!this.enabled) return;

      try{
        if (this.musicOn){
          await this.sounds.backmusic.play();
        } else {
          this.sounds.backmusic.pause();
          this.sounds.backmusic.currentTime = 0;
        }
      }catch(_e){}
      btnMusic.textContent = this.musicOn ? "🔊 Musique" : "🔇 Musique";
    }

    play(name){
      if (!this.enabled) return;
      const a = this.sounds[name];
      if (!a) return;
      try{
        a.currentTime = 0;
        a.play();
      }catch(_e){}
    }

    playTintThrottled(){
      if (!COLLISION_TINT_ENABLED) return;
      const t = nowMs();
      if (t - this.lastTint < COLLIDE_TINT_COOLDOWN) return;
      this.lastTint = t;
      this.play("tint");
    }
  }
  const audio = new AudioManager();

  // ===== SVG Utils =====
  function svgEl(tag, attrs={}){
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  }
  function pathEl(d, opacity=1, strokeOnly=false){
    return svgEl("path", {
      d,
      fill: strokeOnly ? "none" : `rgba(0,0,0,${0.18*opacity})`,
      stroke: `rgba(0,0,0,${0.55*opacity})`,
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
  }
  function circleEl(cx,cy,r,opacity=1){
    return svgEl("circle", {
      cx, cy, r,
      fill: `rgba(0,0,0,${0.15*opacity})`,
      stroke: `rgba(0,0,0,${0.55*opacity})`,
      "stroke-width": 3
    });
  }

  function multilineText(text, x, y, maxCharsPerLine, lineHeight, attrs, maxLines=3){
    const t = svgEl("text", Object.assign({
      x, y,
      "text-anchor": "middle",
      fill: "rgba(0,0,0,.78)",
      "font-size": 12,
      "font-weight": 900
    }, attrs || {}));

    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = "";
    for (const w of words){
      const next = cur ? (cur + " " + w) : w;
      if (next.length > maxCharsPerLine && cur){
        lines.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);

    lines.slice(0, maxLines).forEach((ln, i) => {
      const ts = svgEl("tspan", { x, dy: i===0 ? 0 : lineHeight });
      ts.textContent = ln;
      t.appendChild(ts);
    });

    return t;
  }

  // ===== Symbols (8) =====
  const SYMBOLS = [
    { id:0, name:"Étoile", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.50} ${y+s*.05} L ${x+s*.62} ${y+s*.38} L ${x+s*.96} ${y+s*.38} L ${x+s*.68} ${y+s*.58} L ${x+s*.78} ${y+s*.92} L ${x+s*.50} ${y+s*.72} L ${x+s*.22} ${y+s*.92} L ${x+s*.32} ${y+s*.58} L ${x+s*.04} ${y+s*.38} L ${x+s*.38} ${y+s*.38} Z`, o)); } },
    { id:1, name:"Trèfle", draw(g,x,y,s,o=1){ g.appendChild(circleEl(x+s*.33,y+s*.36,s*.16,o)); g.appendChild(circleEl(x+s*.67,y+s*.36,s*.16,o)); g.appendChild(circleEl(x+s*.50,y+s*.60,s*.18,o)); g.appendChild(pathEl(`M ${x+s*.50} ${y+s*.62} C ${x+s*.46} ${y+s*.74}, ${x+s*.44} ${y+s*.84}, ${x+s*.50} ${y+s*.95} C ${x+s*.56} ${y+s*.84}, ${x+s*.54} ${y+s*.74}, ${x+s*.50} ${y+s*.62} Z`, o)); } },
    { id:2, name:"Spirale", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.72} ${y+s*.30} C ${x+s*.58} ${y+s*.12}, ${x+s*.28} ${y+s*.18}, ${x+s*.30} ${y+s*.46} C ${x+s*.32} ${y+s*.76}, ${x+s*.70} ${y+s*.78}, ${x+s*.70} ${y+s*.54} C ${x+s*.70} ${y+s*.40}, ${x+s*.50} ${y+s*.40}, ${x+s*.50} ${y+s*.54} C ${x+s*.50} ${y+s*.66}, ${x+s*.64} ${y+s*.66}, ${x+s*.64} ${y+s*.54}`, o, true)); } },
    { id:3, name:"Rune", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.25} ${y+s*.15} V ${y+s*.90} M ${x+s*.25} ${y+s*.20} L ${x+s*.75} ${y+s*.55} L ${x+s*.25} ${y+s*.55} L ${x+s*.75} ${y+s*.90}`, o, true)); } },
    { id:4, name:"Croix", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.50} ${y+s*.10} V ${y+s*.90} M ${x+s*.10} ${y+s*.50} H ${x+s*.90}`, o, true)); } },
    { id:5, name:"Œil", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.10} ${y+s*.55} C ${x+s*.25} ${y+s*.25}, ${x+s*.75} ${y+s*.25}, ${x+s*.90} ${y+s*.55} C ${x+s*.75} ${y+s*.85}, ${x+s*.25} ${y+s*.85}, ${x+s*.10} ${y+s*.55} Z`, o)); g.appendChild(circleEl(x+s*.50,y+s*.55,s*.12,o)); } },
    { id:6, name:"Goutte", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.50} ${y+s*.10} C ${x+s*.30} ${y+s*.38}, ${x+s*.24} ${y+s*.52}, ${x+s*.24} ${y+s*.64} C ${x+s*.24} ${y+s*.82}, ${x+s*.36} ${y+s*.92}, ${x+s*.50} ${y+s*.92} C ${x+s*.64} ${y+s*.92}, ${x+s*.76} ${y+s*.82}, ${x+s*.76} ${y+s*.64} C ${x+s*.76} ${y+s*.52}, ${x+s*.70} ${y+s*.38}, ${x+s*.50} ${y+s*.10} Z`, o)); } },
    { id:7, name:"Hex", draw(g,x,y,s,o=1){ g.appendChild(pathEl(`M ${x+s*.50} ${y+s*.10} L ${x+s*.78} ${y+s*.26} L ${x+s*.78} ${y+s*.58} L ${x+s*.50} ${y+s*.74} L ${x+s*.22} ${y+s*.58} L ${x+s*.22} ${y+s*.26} Z`, o)); } },
  ];

  // ===== Connectors =====
  const CONNECTOR_D = {
    C1: `M 0 0 C 0.10 0, 0.12 0.18, 0.22 0.18 C 0.30 0.18, 0.30 0.06, 0.38 0.06 C 0.46 0.06, 0.48 0.22, 0.58 0.22 C 0.70 0.22, 0.70 0, 0.85 0 C 0.93 0, 0.95 0, 1 0`,
    C2: `M 0 0 C 0.12 0, 0.18 0.22, 0.30 0.22 C 0.42 0.22, 0.36 0.10, 0.50 0.10 C 0.64 0.10, 0.60 0.26, 0.44 0.28 C 0.32 0.30, 0.62 0.30, 0.76 0.20 C 0.88 0.12, 0.90 0, 1 0`,
    C3: `M 0 0 C 0.10 0, 0.12 0.10, 0.20 0.10 C 0.28 0.10, 0.26 0.22, 0.34 0.22 C 0.42 0.22, 0.40 0.34, 0.48 0.34 C 0.56 0.34, 0.54 0.18, 0.62 0.18 C 0.70 0.18, 0.68 0.28, 0.76 0.28 C 0.86 0.28, 0.88 0, 1 0`,
    C4: `M 0 0 C 0.14 0, 0.18 0.26, 0.34 0.26 C 0.48 0.26, 0.44 0.06, 0.56 0.06 C 0.66 0.06, 0.64 0.30, 0.78 0.30 C 0.92 0.30, 0.90 0, 1 0`,
    C5: `M 0 0 C 0.10 0, 0.12 0.20, 0.22 0.20 C 0.30 0.20, 0.30 0.08, 0.38 0.08 C 0.46 0.08, 0.46 0.26, 0.56 0.26 C 0.66 0.26, 0.64 0.12, 0.72 0.12 C 0.80 0.12, 0.80 0.22, 0.88 0.22 C 0.96 0.22, 0.94 0, 1 0`,
    C6: `M 0 0 C 0.12 0, 0.18 0.26, 0.32 0.26 C 0.46 0.26, 0.46 0.18, 0.52 0.18 C 0.56 0.18, 0.56 0.30, 0.50 0.30 C 0.44 0.30, 0.58 0.34, 0.70 0.26 C 0.84 0.16, 0.86 0, 1 0`,
    C7: `M 0 0 C 0.10 0, 0.16 0.16, 0.24 0.16 C 0.32 0.16, 0.30 0.34, 0.38 0.34 C 0.46 0.34, 0.44 0.12, 0.52 0.12 C 0.60 0.12, 0.58 0.32, 0.68 0.32 C 0.78 0.32, 0.74 0.14, 0.84 0.14 C 0.92 0.14, 0.92 0, 1 0`,
    C8: `M 0 0 C 0.10 0, 0.16 0.28, 0.30 0.28 C 0.44 0.28, 0.38 0.10, 0.52 0.10 C 0.66 0.10, 0.60 0.28, 0.74 0.28 C 0.88 0.28, 0.90 0, 1 0`,
  };

  let _uid = 1;
  const uid = (p="id") => `${p}_${_uid++}`;

  function connectorGroupAndPath(type, w, h, ori, attrs){
    const d = CONNECTOR_D[type];
    const g = svgEl("g");
    const p = svgEl("path", Object.assign({
      d,
      transform: `scale(${w} ${h})`,
      "vector-effect": "non-scaling-stroke",
    }, attrs || {}));

    if (ori === "down"){ g.appendChild(p); return g; }
    if (ori === "up"){
      g.setAttribute("transform", `translate(${w} ${h}) rotate(180)`);
      g.appendChild(p); return g;
    }
    if (ori === "right"){
      g.setAttribute("transform", `translate(0 ${w}) rotate(-90)`);
      g.appendChild(p); return g;
    }
    if (ori === "left"){
      g.setAttribute("transform", `translate(${h} 0) rotate(90)`);
      g.appendChild(p); return g;
    }

    g.appendChild(p);
    return g;
  }

  function addMaleTab(svg, type, x, y, w, h, ori){
    const outer = svgEl("g", { transform:`translate(${x} ${y})` });
    outer.appendChild(connectorGroupAndPath(type, w, h, ori, {
      fill: "#ded7c8",
      stroke: "rgba(0,0,0,.65)",
      "stroke-width": 2
    }));
    svg.appendChild(outer);
  }

  function addHoleMask(defs, type, x, y, w, h, ori, maskW, maskH){
    const id = uid("mask");
    const mask = svgEl("mask", { id, maskUnits:"userSpaceOnUse", x:0, y:0, width:maskW, height:maskH });
    mask.appendChild(svgEl("rect", { x:0, y:0, width:maskW, height:maskH, fill:"white" }));

    const outer = svgEl("g", { transform:`translate(${x} ${y})` });
    outer.appendChild(connectorGroupAndPath(type, w, h, ori, { fill:"black", stroke:"none" }));
    mask.appendChild(outer);
    defs.appendChild(mask);
    return id;
  }

  function addHoleStroke(svg, type, x, y, w, h, ori){
    const outer = svgEl("g", { transform:`translate(${x} ${y})` });
    outer.appendChild(connectorGroupAndPath(type, w, h, ori, {
      fill:"none",
      stroke:"rgba(0,0,0,.45)",
      "stroke-width": 2
    }));
    svg.appendChild(outer);
  }

  // ===== Narrative content =====
  // Each pair is a "page fragment" (top/bottom or left/right) for a 1900s medical Christmas advent printing run.
  const TERM_A = [
    "Calendrier médical de l’Avent — Pansements stériles, format de poche",
    "Noël à l’hôpital : compresses, gaze fine & rubans de maintien",
    "Encre noire pharmaceutique — spéciale registres & ordonnances",
    "Offre saisonnière : thermomètres & étuis, garantie atelier",
    "Catalogue : instruments de cabinet, acier poli, livraison rapide",
    "Annonce discrète : somnifère végétal — Dr. M. (usage prudent)",
    "Avis : hommes en noir — cure de jouvence ‘miracle’ (rumeur…) ",
    "Dernière page : sceau de contrôle & signature de l’imprimerie",
  ];

  const TERM_B = [
    "Remise de décembre — ‘un lot = un sourire’ (éditions sanitaires)",
    "Fêtes & services : étiquettes de flacons, typographie soignée",
    "Tampon de Noël : “Bon pour le soin” — série limitée",
    "Papier ivoire — bords nets, prêt pour reliure médicale",
    "Encarts : notices, posologies, avertissements (sans surcharge)",
    "Tisane calmante & sommeil doux — infusion à base de plantes",
    "Rencontre à la sortie : “Lang & Cie” propose un contrat…",
    "Gerhard Lang, München 1908 — livres médicaux & almanachs",
  ];

  // ===== Level data =====
  const level = [];
  for (let i=0;i<LEVEL_COUNT;i++){
    level.push({
      id: `R${i+1}`,
      termA: TERM_A[i] || `Page ${i+1} — Haut`,
      termB: TERM_B[i] || `Page ${i+1} — Bas`,
      leftKey: i===0 ? null : i,
      rightKey: i===LEVEL_COUNT-1 ? null : i+1,
      sym: i,
    });
  }

  // ===== SVG Builders =====
  function buildHalfSVG(rect, part){
    const mobile = isMobileLayout();
    const HALF_W = mobile ? 310 : 260;
    const HALF_H = 140;

    const svg = svgEl("svg", { width:HALF_W, height:HALF_H, viewBox:`0 0 ${HALF_W} ${HALF_H}` });
    svg.setAttribute("overflow","visible");
    const defs = svgEl("defs");
    svg.appendChild(defs);

    const connW = 110;
    const connH = 70;
    let maskId = null;
    let holeStroke = null;

    const internalType = rect._internalType;

    if (!mobile){
      if (part === 1){
        const x = (HALF_W - connW)/2;
        const y = 0;
        maskId = addHoleMask(defs, internalType, x, y, connW, connH, "down", HALF_W, HALF_H);
        holeStroke = { type: internalType, x, y, w: connW, h: connH, ori:"down" };
      }
    } else {
      if (part === 1){
        const x = 0;
        const y = (HALF_H - connW)/2;
        maskId = addHoleMask(defs, internalType, x, y, connW, connH, "right", HALF_W, HALF_H);
        holeStroke = { type: internalType, x, y, w: connW, h: connH, ori:"right" };
      }
    }

    const content = svgEl("g", maskId ? { mask:`url(#${maskId})` } : {});
    svg.appendChild(content);

    // paper
    content.appendChild(svgEl("rect", { x:0,y:0,width:HALF_W,height:HALF_H, rx:14, ry:14, fill:"var(--paper)" }));
    // faint printing lines
    content.appendChild(svgEl("path", {
      d:`M 12 22 H ${HALF_W-12} M 12 40 H ${HALF_W-12} M 12 58 H ${HALF_W-12} M 12 76 H ${HALF_W-12} M 12 94 H ${HALF_W-12}`,
      stroke:"rgba(0,0,0,.08)", "stroke-width":2, fill:"none", "stroke-linecap":"round"
    }));

    // centered band (taller for multiline)
    const bandW = HALF_W - 28;
    const bandH = 44;
    const bandX = (HALF_W - bandW)/2;
    const bandY = (HALF_H - bandH)/2;
    content.appendChild(svgEl("rect", { x:bandX, y:bandY, width:bandW, height:bandH, rx:14, fill:"rgba(0,0,0,.10)" }));

    const txt = (part === 0 ? rect.termA : rect.termB);
    const t = multilineText(txt, HALF_W/2, bandY+18, mobile ? 28 : 24, 14, { "font-size": 11 }, 2);
    content.appendChild(t);


    // outline
    svg.appendChild(svgEl("rect", { x:0,y:0,width:HALF_W,height:HALF_H, rx:14, ry:14, fill:"none", stroke:"var(--outline)", "stroke-width":2 }));

    if (holeStroke){
      addHoleStroke(svg, holeStroke.type, holeStroke.x, holeStroke.y, holeStroke.w, holeStroke.h, holeStroke.ori);
    }

    // male tab
    if (!mobile){
      if (part === 0){
        const x = (HALF_W - connW)/2;
        const y = HALF_H;
        addMaleTab(svg, internalType, x, y, connW, connH, "down");
      }
    } else {
      if (part === 0){
        const x = HALF_W;
        const y = (HALF_H - connW)/2;
        addMaleTab(svg, internalType, x, y, connW, connH, "right");
      }
    }

    return svg;
  }

  function buildRectSVG(rect, engravedDone, opts={}){
    const mobile = isMobileLayout();
    const HALF_W = mobile ? 310 : 260;
    const HALF_H = 140;

    const rectW = mobile ? (HALF_W*2) : HALF_W;
    const rectH = mobile ? HALF_H : (HALF_H*2);

    const showLeft = opts.showLeft !== false;
    const showRight = opts.showRight !== false;
    const showMarkers = opts.showMarkers !== false;

    const svg = svgEl("svg", { width:rectW, height:rectH, viewBox:`0 0 ${rectW} ${rectH}` });
    svg.setAttribute("overflow","visible");

    const defs = svgEl("defs");
    svg.appendChild(defs);

    const connW = 110;
    const connH = 70;

    // left hole (chain)
    let maskId = null;
    let holeStroke = null;

    if (!mobile){
      if (showLeft && rect.leftKey != null){
        const type = `C${rect.leftKey}`;
        const x = 0;
        const y = (rectH - connW)/2;
        maskId = addHoleMask(defs, type, x, y, connW, connH, "right", rectW, rectH);
        holeStroke = { type, x, y, w: connW, h: connH, ori:"right" };
      }
    } else {
      if (showLeft && rect.leftKey != null){
        const type = `C${rect.leftKey}`;
        const x = (rectW - connW)/2;
        const y = 0;
        maskId = addHoleMask(defs, type, x, y, connW, connH, "down", rectW, rectH);
        holeStroke = { type, x, y, w: connW, h: connH, ori:"down" };
      }
    }

    const content = svgEl("g", maskId ? { mask:`url(#${maskId})` } : {});
    svg.appendChild(content);

    content.appendChild(svgEl("rect", { x:0,y:0,width:rectW,height:rectH, rx:14, ry:14, fill:"var(--paper)" }));

    // split dash
    if (!mobile){
      content.appendChild(svgEl("path", { d:`M 10 ${rectH/2} H ${rectW-10}`, stroke:"rgba(0,0,0,.10)", "stroke-width":2, "stroke-dasharray":"4 6" }));
    } else {
      content.appendChild(svgEl("path", { d:`M ${rectW/2} 10 V ${rectH-10}`, stroke:"rgba(0,0,0,.10)", "stroke-width":2, "stroke-dasharray":"4 6" }));
    }


    // label bands (séparés pour éviter toute superposition)
    const bandW = rectW - 28;
    const bandH = 52;

    if (!mobile){
      // Haut
      const bandX = (rectW - bandW)/2;
      const bandYTop = (rectH/4) - (bandH/2);
      content.appendChild(svgEl("rect", { x:bandX, y:bandYTop, width:bandW, height:bandH, rx:14, fill:"rgba(0,0,0,.10)" }));
      const tTop = multilineText(rect.termA, rectW/2, bandYTop+18, 36, 14, { "font-size": 11 }, 2);
      content.appendChild(tTop);

      // Bas
      const bandYBot = (rectH*3/4) - (bandH/2);
      content.appendChild(svgEl("rect", { x:bandX, y:bandYBot, width:bandW, height:bandH, rx:14, fill:"rgba(0,0,0,.10)" }));
      const tBot = multilineText(rect.termB, rectW/2, bandYBot+18, 36, 14, { "font-size": 11, "font-weight": 800, fill:"rgba(0,0,0,.72)" }, 2);
      content.appendChild(tBot);
    } else {
      // Mobile: gauche / droite
      const bandW2 = (rectW/2) - 20;
      const bandXLeft = 10;
      const bandXRight = rectW/2 + 10;
      const bandY = (rectH - bandH)/2;

      content.appendChild(svgEl("rect", { x:bandXLeft, y:bandY, width:bandW2, height:bandH, rx:14, fill:"rgba(0,0,0,.10)" }));
      const tLeft = multilineText(rect.termA, rectW/4, bandY+18, 22, 14, { "font-size": 11 }, 2);
      content.appendChild(tLeft);

      content.appendChild(svgEl("rect", { x:bandXRight, y:bandY, width:bandW2, height:bandH, rx:14, fill:"rgba(0,0,0,.10)" }));
      const tRight = multilineText(rect.termB, rectW*3/4, bandY+18, 22, 14, { "font-size": 11, "font-weight": 800, fill:"rgba(0,0,0,.72)" }, 2);
      content.appendChild(tRight);
    }


    // START/END
    if (showMarkers && !mobile){
      if (rect.leftKey == null){
        content.appendChild(svgEl("path", { d:`M 10 18 H 44`, stroke:"rgba(165,139,76,.75)", "stroke-width":3, "stroke-linecap":"round" }));
        const t = svgEl("text", { x:52, y:22, fill:"rgba(165,139,76,.85)", "font-size":12, "font-weight":900 });
        t.textContent = "DÉBUT";
        content.appendChild(t);
      }
      if (rect.rightKey == null){
        content.appendChild(svgEl("path", { d:`M ${rectW-44} 18 H ${rectW-10}`, stroke:"rgba(47,156,90,.85)", "stroke-width":3, "stroke-linecap":"round" }));
        const t = svgEl("text", { x:rectW-52, y:22, fill:"rgba(47,156,90,.90)", "font-size":12, "font-weight":900, "text-anchor":"end" });
        t.textContent = "FIN";
        content.appendChild(t);
      }
    } else if (showMarkers) {
      if (rect.leftKey == null){
        content.appendChild(svgEl("path", { d:`M 18 10 V 38`, stroke:"rgba(165,139,76,.75)", "stroke-width":3, "stroke-linecap":"round" }));
        const t = svgEl("text", { x:26, y:26, fill:"rgba(165,139,76,.85)", "font-size":12, "font-weight":900 });
        t.textContent = "DÉBUT";
        content.appendChild(t);
      }
      if (rect.rightKey == null){
        content.appendChild(svgEl("path", { d:`M 18 ${rectH-38} V ${rectH-10}`, stroke:"rgba(47,156,90,.85)", "stroke-width":3, "stroke-linecap":"round" }));
        const t = svgEl("text", { x:26, y:rectH-18, fill:"rgba(47,156,90,.90)", "font-size":12, "font-weight":900 });
        t.textContent = "FIN";
        content.appendChild(t);
      }
    }

    // Engraving symbol: animate only once; afterwards show solid
    if (engravedDone){
      const g = svgEl("g", { opacity:"1" });
      SYMBOLS[rect.sym].draw(g, rectW/2-56, rectH/2-56, 112, 0.85);
      const sh = g.cloneNode(true);
      sh.setAttribute("transform","translate(1.2 1.2)");
      sh.setAttribute("opacity","0.55");
      content.appendChild(sh);
      content.appendChild(g);
    } else {
      const maskId2 = uid("revealMask");
      const mask2 = svgEl("mask", { id: maskId2, maskUnits:"userSpaceOnUse", x:0,y:0,width:rectW,height:rectH });
      mask2.appendChild(svgEl("rect", { x:0,y:0,width:rectW,height:rectH, fill:"black" }));
      const reveal = svgEl("rect", { x:0, y:0, width:rectW, height:rectH, fill:"white", class:"reveal" });
      mask2.appendChild(reveal);
      defs.appendChild(mask2);

      const engraveGroup = svgEl("g", { class:"engraveGroup", mask:`url(#${maskId2})` });
      const symG = svgEl("g");
      SYMBOLS[rect.sym].draw(symG, rectW/2-56, rectH/2-56, 112, 0.85);
      const shadow = symG.cloneNode(true);
      shadow.setAttribute("transform","translate(1.2 1.2)");
      shadow.setAttribute("opacity","0.55");
      engraveGroup.appendChild(shadow);
      engraveGroup.appendChild(symG);
      content.appendChild(engraveGroup);
    }


    // outline
    svg.appendChild(svgEl("rect", { x:0,y:0,width:rectW,height:rectH, rx:14, ry:14, fill:"none", stroke:"var(--outline)", "stroke-width":2 }));
    if (showLeft && holeStroke){
      addHoleStroke(svg, holeStroke.type, holeStroke.x, holeStroke.y, holeStroke.w, holeStroke.h, holeStroke.ori);
    }

    // right male (chain)
    if (!mobile){
      if (showRight && rect.rightKey != null){
        const type = `C${rect.rightKey}`;
        const x = rectW;
        const y = (rectH - connW)/2;
        addMaleTab(svg, type, x, y, connW, connH, "right");
      }
    } else {
      if (showRight && rect.rightKey != null){
        const type = `C${rect.rightKey}`;
        const x = (rectW - connW)/2;
        const y = rectH;
        addMaleTab(svg, type, x, y, connW, connH, "down");
      }
    }

    return svg;
  }

  // ===== Piece state =====
  const phys = new Map(); // el -> {x,y,vx,vy,dragging,lastMoveT,lastMoveX,lastMoveY}
  const overlapPairs = new Set(); // for collision tint edge-trigger

  // ===== Chain fusion helpers =====
  function parseSeq(str, fallback=[]){
    try{ return JSON.parse(str); }catch(_e){ return fallback; }
  }
  function getLeftKey(el){ return el.dataset.leftKey ? Number(el.dataset.leftKey) : null; }
  function getRightKey(el){ return el.dataset.rightKey ? Number(el.dataset.rightKey) : null; }
  function getSymSeq(el){
    if (el.dataset.syms) return parseSeq(el.dataset.syms, []);
    if (el.dataset.sym != null) return [Number(el.dataset.sym)];
    return [];
  }
  function getSegs(el){
    if (el.dataset.segs) return parseSeq(el.dataset.segs, []);
    if (el.dataset.rid) return [el.dataset.rid];
    return [];
  }

  function buildClusterContent(segs){
    // segs: array of rid in order
    const mobile = isMobileLayout();
    const wrap = document.createElement("div");
    wrap.className = "clusterWrap";
    wrap.style.display = "flex";
    wrap.style.flexDirection = mobile ? "column" : "row";
    wrap.style.gap = "0px";

    for (let i=0;i<segs.length;i++){
      const rid = segs[i];
      const rect = level.find(r => r.id === rid);
      const seg = document.createElement("div");
      seg.className = "clusterSeg";
      // hide internal connectors/markers
      const showLeft = (i === 0);
      const showRight = (i === segs.length - 1);
      seg.appendChild(buildRectSVG(rect, true, { showLeft, showRight, showMarkers: true }));
      wrap.appendChild(seg);
    }
    return wrap;
  }

  function makeCluster(segs, x, y){
    const first = level.find(r => r.id === segs[0]);
    const last = level.find(r => r.id === segs[segs.length-1]);

    const el = document.createElement("div");
    el.className = "piece cluster engrave snapGood";
    el.dataset.kind = "cluster";
    el.dataset.segs = JSON.stringify(segs);
    el.dataset.syms = JSON.stringify(segs.map(rid => level.find(r => r.id===rid).sym));
    el.dataset.leftKey = first.leftKey == null ? "" : String(first.leftKey);
    el.dataset.rightKey = last.rightKey == null ? "" : String(last.rightKey);
    el._pid = uid("p");

    el.appendChild(buildClusterContent(segs));
    playArea.appendChild(el);

    phys.set(el, { x, y, vx:0, vy:0, dragging:false, lastMoveT:0, lastMoveX:0, lastMoveY:0 });
    setPos(el, x, y);
    clampInside(el);
    attachDrag(el);
    return el;
  }

  function fuseChain(aEl, bEl){
    // Determine order based on matching keys at snap-time positions (they should already be aligned)
    const aLeft = getLeftKey(aEl), aRight = getRightKey(aEl);
    const bLeft = getLeftKey(bEl), bRight = getRightKey(bEl);

    const aSegs = getSegs(aEl);
    const bSegs = getSegs(bEl);

    let segs = null;

    if (aRight != null && bLeft != null && aRight === bLeft){
      segs = aSegs.concat(bSegs);
    } else if (bRight != null && aLeft != null && bRight === aLeft){
      segs = bSegs.concat(aSegs);
    } else {
      return null; // not a valid chain connection
    }

    const pa = getPos(aEl), pb = getPos(bEl);
    const x = Math.min(pa.x, pb.x);
    const y = Math.min(pa.y, pb.y);

    removePiece(aEl);
    removePiece(bEl);

    return makeCluster(segs, x, y);
  }


  function pxToNum(v){ return Number(String(v).replace("px","")) || 0; }

  function setPos(el, x, y){
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const s = phys.get(el);
    if (s){ s.x = x; s.y = y; }
  }

  function getPos(el){
    const s = phys.get(el);
    if (s) return {x:s.x, y:s.y};
    return {x:pxToNum(el.style.left), y:pxToNum(el.style.top)};
  }

  function playBounds(){
    const r = playArea.getBoundingClientRect();
    return { w:r.width, h:r.height };
  }

  function clampInside(el){
    const { w, h } = playBounds();
    const r = el.getBoundingClientRect();
    const pr = playArea.getBoundingClientRect();
    const ew = r.width, eh = r.height;
    const p = getPos(el);
    const x = clamp(p.x, 0, Math.max(0, w - ew));
    const y = clamp(p.y, 0, Math.max(0, h - eh));
    setPos(el, x, y);
  }

  function rectFromEl(el){
    const r = el.getBoundingClientRect();
    const pr = playArea.getBoundingClientRect();
    return { x: r.left - pr.left, y:r.top - pr.top, w:r.width, h:r.height };
  }

  function overlapRatio(a, b){
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    const iw = Math.max(0, x2 - x1);
    const ih = Math.max(0, y2 - y1);
    const inter = iw * ih;
    if (inter <= 0) return 0;
    const minArea = Math.min(a.w*a.h, b.w*b.h);
    return inter / minArea;
  }

  function enforceCollisions(){
    // Superposition autorisée. Tint collision optionnel : UNE FOIS par contact.
    const els = Array.from(phys.keys());
    const alive = new Set();

    for (let i=0;i<els.length;i++){
      for (let j=i+1;j<els.length;j++){
        const A = els[i], B = els[j];
        const ra = rectFromEl(A), rb = rectFromEl(B);
        const ratio = overlapRatio(ra, rb);
        const k = (String(A._pid) < String(B._pid)) ? (A._pid + "|" + B._pid) : (B._pid + "|" + A._pid);

        if (ratio > 0.12){
          alive.add(k);
          if (COLLISION_TINT_ENABLED && !overlapPairs.has(k)){
            overlapPairs.add(k);
            audio.playTintThrottled();
          }
        } else if (ratio < 0.06){
          overlapPairs.delete(k);
        } else {
          if (overlapPairs.has(k)) alive.add(k);
        }
      }
    }

    for (const k of Array.from(overlapPairs)){
      if (!alive.has(k)) overlapPairs.delete(k);
    }
  }

  // ===== Snap logic =====
  function getSize(el){
    const r = el.getBoundingClientRect();
    return { w:r.width, h:r.height };
  }

  function snapTargetsFor(el){
    const kind = el.dataset.kind;

    // ---- Half pieces -> form a pair
    if (kind === "half"){
      const mobile = isMobileLayout();
      const rid = el.dataset.rid;
      const part = Number(el.dataset.part);
      const internal = el.dataset.internal;

      const otherPart = part === 0 ? 1 : 0;
      const other = Array.from(phys.keys()).find(o =>
        o !== el &&
        o.dataset.kind === "half" &&
        o.dataset.rid === rid &&
        Number(o.dataset.part) === otherPart &&
        o.dataset.internal === internal
      );
      if (!other) return [];

      const s = getSize(el);
      const pOther = getPos(other);

      let wantX = pOther.x;
      let wantY = pOther.y;

      if (!mobile){
        // pair in height
        wantY = (part === 0) ? (pOther.y - s.h) : (pOther.y + s.h);
      } else {
        // pair in width
        wantX = (part === 0) ? (pOther.x - s.w) : (pOther.x + s.w);
      }

      return [{ target: other, wantX, wantY, type:"pair" }];
    }

    // ---- Rect pieces -> form the chain
    if (kind === "rect" || kind === "cluster"){
      const mobile = isMobileLayout();
      const p = getPos(el);
      const s = getSize(el);

      const leftKey = el.dataset.leftKey ? Number(el.dataset.leftKey) : null;
      const rightKey = el.dataset.rightKey ? Number(el.dataset.rightKey) : null;

      let best = null;
      for (const other of Array.from(phys.keys())){
        if (other === el) continue;
        if (other.dataset.kind !== "rect" && other.dataset.kind !== "cluster") continue;

        const oLeft = other.dataset.leftKey ? Number(other.dataset.leftKey) : null;
        const oRight = other.dataset.rightKey ? Number(other.dataset.rightKey) : null;
        const op = getPos(other);
        const os = getSize(other);

        // el attaches on the left of other: el.rightKey == other.leftKey
        if (rightKey != null && oLeft != null && rightKey === oLeft){
          const wantX = mobile ? op.x : (op.x - s.w);
          const wantY = mobile ? (op.y - s.h) : op.y;
          const d = Math.hypot(p.x - wantX, p.y - wantY);
          if (!best || d < best.d) best = { target: other, wantX, wantY, d, type:"chain" };
        }

        // el attaches on the right of other: el.leftKey == other.rightKey
        if (leftKey != null && oRight != null && leftKey === oRight){
          const wantX = mobile ? op.x : (op.x + os.w);
          const wantY = mobile ? (op.y + os.h) : op.y;
          const d = Math.hypot(p.x - wantX, p.y - wantY);
          if (!best || d < best.d) best = { target: other, wantX, wantY, d, type:"chain" };
        }
      }
      return best ? [best] : [];
    }

    return [];
  }

  function badSnapNearby(el){
    const kind = el.dataset.kind;
    const mobile = isMobileLayout();

    // ---- Half pieces: keep existing "near but wrong" bonk
    if (kind === "half"){
      const part = Number(el.dataset.part);
      const a = rectFromEl(el);
      const candidates = Array.from(phys.keys()).filter(o => o!==el && o.dataset.kind==="half");
      let best = null;

      for (const c of candidates){
        const b = rectFromEl(c);

        if (!mobile){
          const dy1 = Math.abs((a.y + a.h) - b.y);
          const dy2 = Math.abs((b.y + b.h) - a.y);
          const dx = Math.abs(a.x - b.x);
          const dy = Math.min(dy1, dy2);
          const d = Math.hypot(dx, dy);

          if (d < BAD_SNAP_DIST){
            const good = (el.dataset.rid === c.dataset.rid) && (el.dataset.internal === c.dataset.internal) && (Number(c.dataset.part) !== part);
            if (!good) best = (!best || d < best.d) ? { other:c, d } : best;
          }
        } else {
          const dx1 = Math.abs((a.x + a.w) - b.x);
          const dx2 = Math.abs((b.x + b.w) - a.x);
          const dy = Math.abs(a.y - b.y);
          const dx = Math.min(dx1, dx2);
          const d = Math.hypot(dx, dy);

          if (d < BAD_SNAP_DIST){
            const good = (el.dataset.rid === c.dataset.rid) && (el.dataset.internal === c.dataset.internal) && (Number(c.dataset.part) !== part);
            if (!good) best = (!best || d < best.d) ? { other:c, d } : best;
          }
        }
      }
      return best;
    }

    // ---- Rect pieces: bonk if near an attach position but keys don't match
    if (kind === "rect" || kind === "cluster"){
      const p = getPos(el);
      const s = getSize(el);
      const leftKey = el.dataset.leftKey ? Number(el.dataset.leftKey) : null;
      const rightKey = el.dataset.rightKey ? Number(el.dataset.rightKey) : null;

      let best = null;
      for (const other of Array.from(phys.keys())){
        if (other === el) continue;
        if (other.dataset.kind !== "rect" && other.dataset.kind !== "cluster") continue;

        const oLeft = other.dataset.leftKey ? Number(other.dataset.leftKey) : null;
        const oRight = other.dataset.rightKey ? Number(other.dataset.rightKey) : null;
        const op = getPos(other);
        const os = getSize(other);

        // candidate: el should be left of other
        const wantX1 = mobile ? op.x : (op.x - s.w);
        const wantY1 = mobile ? (op.y - s.h) : op.y;
        const d1 = Math.hypot(p.x - wantX1, p.y - wantY1);

        if (d1 < BAD_SNAP_DIST){
          const good = (rightKey != null && oLeft != null && rightKey === oLeft);
          if (!good) best = (!best || d1 < best.d) ? { other, d: d1 } : best;
        }

        // candidate: el should be right/below of other
        const wantX2 = mobile ? op.x : (op.x + os.w);
        const wantY2 = mobile ? (op.y + os.h) : op.y;
        const d2 = Math.hypot(p.x - wantX2, p.y - wantY2);

        if (d2 < BAD_SNAP_DIST){
          const good = (leftKey != null && oRight != null && leftKey === oRight);
          if (!good) best = (!best || d2 < best.d) ? { other, d: d2 } : best;
        }
      }
      return best ? { other: best.other, d: best.d } : null;
    }

    return null;
  }

  function distanceTo(el, x, y){
    const p = getPos(el);
    return Math.hypot(p.x - x, p.y - y);
  }

  function trySnap(el){
    const targets = snapTargetsFor(el);
    if (targets.length){
      const t = targets[0];
      const d = distanceTo(el, t.wantX, t.wantY);
      if (d <= SNAP_DIST){
        if (t.type === "pair"){
          snapAssemble(el, t.target, t.wantX, t.wantY);
        } else {
          snapChain(el, t.target, t.wantX, t.wantY);
        }
        return true;
      }
    }

    const bad = badSnapNearby(el);
    if (bad){
      bonkRepel(el, bad.other);
      return true;
    }
    return false;
  }


  function snapChain(movedEl, otherEl, wantX, wantY){
    audio.play("cling");
    showBubble("CLING", movedEl, "cling");

    movedEl.classList.remove("snapGood");
    otherEl.classList.remove("snapGood");
    void movedEl.offsetWidth;
    movedEl.classList.add("snapGood");
    otherEl.classList.add("snapGood");

    const movedState = phys.get(movedEl);
    if (movedState){ movedState.vx = 0; movedState.vy = 0; }

    animateTo(movedEl, wantX, wantY, 150, () => {
      clampInside(movedEl);
      clampInside(otherEl);

      const fused = fuseChain(movedEl, otherEl);
      if (!fused){
        // should not happen if target was valid, but fallback
        updateLineState();
        setStatus("Chaîne ajustée.");
        return;
      }

      updateLineState();
      setStatus("Fusion de chaîne.");
    });
  }



  function showBubble(text, el, kind="bonk"){
    const b = document.createElement("div");
    b.className = "bubble bubbleShow";
    b.textContent = text;

    const r = el.getBoundingClientRect();
    const pr = playArea.getBoundingClientRect();
    const x = (r.left - pr.left) + r.width/2 - 26;
    const y = (r.top - pr.top) - 6;

    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.style.color = kind === "bonk" ? "rgba(255,240,220,.95)" : "rgba(220,255,240,.95)";
    playArea.appendChild(b);
    setTimeout(() => b.remove(), 600);
  }

  function bonkRepel(aEl, bEl){
    audio.play("bonk");
    showBubble("BONK", aEl, "bonk");
    showBubble("BONK", bEl, "bonk");

    aEl.classList.remove("bonk");
    bEl.classList.remove("bonk");
    void aEl.offsetWidth;
    aEl.classList.add("bonk");
    bEl.classList.add("bonk");

    const a = phys.get(aEl), b = phys.get(bEl);
    if (!a || !b) return;

    const ra = rectFromEl(aEl), rb = rectFromEl(bEl);
    const ax = ra.x + ra.w/2, bx = rb.x + rb.w/2;
    const ay = ra.y + ra.h/2, by = rb.y + rb.h/2;
    let dx = ax - bx;
    let dy = ay - by;
    const len = Math.max(1e-6, Math.hypot(dx,dy));
    dx /= len; dy /= len;

    const impulse = 1.6;
    a.vx += dx * impulse;
    a.vy += dy * impulse;
    b.vx -= dx * impulse;
    b.vy -= dy * impulse;

    setStatus("Mauvais accrochage.");
  }

  function animateTo(el, x, y, ms=170, onDone=null){
    const from = getPos(el);
    const t0 = nowMs();
    const dur = ms;

    const step = () => {
      const t = nowMs();
      const u = clamp((t - t0) / dur, 0, 1);
      const ease = 1 - Math.pow(1 - u, 3);
      const nx = from.x + (x - from.x) * ease;
      const ny = from.y + (y - from.y) * ease;
      setPos(el, nx, ny);
      if (u < 1){
        requestAnimationFrame(step);
      } else {
        setPos(el, x, y);
        const s = phys.get(el);
        if (s){ s.vx = 0; s.vy = 0; }
        if (onDone) onDone();
      }
    };
    requestAnimationFrame(step);
  }

  function snapAssemble(movedEl, otherEl, wantX, wantY){
    audio.play("cling");
    setStatus("Cling… assemblage.");

    const movedState = phys.get(movedEl);
    if (movedState){ movedState.vx = 0; movedState.vy = 0; }
    const otherState = phys.get(otherEl);
    if (otherState){ otherState.vx = 0; otherState.vy = 0; }

    animateTo(movedEl, wantX, wantY, 170, () => {
      clampInside(movedEl);
      clampInside(otherEl);

      const aPart = Number(movedEl.dataset.part);
      const bPart = Number(otherEl.dataset.part);
      const part0El = (aPart === 0) ? movedEl : otherEl;
      const part1El = (aPart === 1) ? movedEl : otherEl;

      const rid = part0El.dataset.rid;
      const rect = level.find(r => r.id === rid);
      fuseRectangle(rect, part0El, part1El);
    });
  }

  // ===== Chain & code entry =====
  let unlockedSequence = null;
  const entry = [];
  let entryLockedUntil = 0;
  const CODE_OK = "GLM-1908-IMPR";

  function symbolIcon(id, size=28){
    const s = size;
    const svg = svgEl("svg", { width:s, height:s, viewBox:`0 0 ${s} ${s}` });
    const g = svgEl("g");
    const pad = 2;
    const scale = (s - pad*2);
    SYMBOLS[id].draw(g, pad, pad, scale, 0.85);
    svg.appendChild(g);
    return svg;
  }

  function refreshEntry(){
    entryEl.innerHTML = "";
    for (const sid of entry){
      entryEl.appendChild(symbolIcon(sid, 22));
    }
  }

  function readChainNodes(){
    const nodes = Array.from(phys.keys()).filter(el => (el.dataset.kind === "rect" || el.dataset.kind === "cluster"));
    if (!nodes.length) return [];

    const leftMap = new Map();
    for (const el of nodes){
      const lk = getLeftKey(el);
      if (lk != null) leftMap.set(lk, el);
    }

    const start = nodes.find(el => getLeftKey(el) == null);
    if (!start) return [];

    const chain = [start];
    let cur = start;
    const visited = new Set([start]);

    while (true){
      const rk = getRightKey(cur);
      if (rk == null) break;
      const next = leftMap.get(rk);
      if (!next || visited.has(next)) break;
      chain.push(next);
      visited.add(next);
      cur = next;
    }

    return chain;
  }

  function expandChainSymbols(chainNodes){
    const seq = [];
    for (const node of chainNodes){
      seq.push(...getSymSeq(node));
    }
    return seq;
  }

  function updateLineState(){
    const nodes = readChainNodes();
    const seq = expandChainSymbols(nodes);

    lineProgressEl.textContent = `${seq.length} / ${LEVEL_COUNT}`;

    lineSymbolsEl.innerHTML = "";
    for (const sid of seq){
      lineSymbolsEl.appendChild(symbolIcon(sid, 22));
    }

    if (seq.length === LEVEL_COUNT){
      unlockedSequence = seq.slice();
      audio.play("succes");
      setStatus("Ligne complète ! Entre la suite de symboles.");
      resultEl.textContent = "Ligne complète. Tape la suite sur le panneau.";
    }
  }

  function checkEntry(){
    if (!unlockedSequence){
      resultEl.textContent = "Complète d’abord la ligne.";
      return;
    }
    if (entry.length < unlockedSequence.length){
      resultEl.textContent = `${entry.length} / ${unlockedSequence.length}`;
      return;
    }
    const ok = entry.length === unlockedSequence.length && entry.every((v,i)=> v===unlockedSequence[i]);
    if (ok){
      resultEl.textContent = `✅ Code d’identification : ${CODE_OK}`;
      setStatus("Code déverrouillé.");
      audio.play("succes");
    } else {
      resultEl.textContent = "❌ Mauvaise suite. Réessaie.";
      setStatus("Mauvaise suite.");
      audio.play("bonk");
      entry.length = 0;
      refreshEntry();
      entryLockedUntil = nowMs() + 1000;
      symbolPad.classList.add("padLocked");
      setTimeout(() => symbolPad.classList.remove("padLocked"), 1000);
    }
  }

  function setupPad(){
    symbolPad.innerHTML = "";
    for (let i=0;i<SYMBOLS.length;i++){
      const b = document.createElement("button");
      b.className = "symBtn";
      b.type = "button";
      b.appendChild(symbolIcon(i, 28));
      b.addEventListener("click", () => {
        if (nowMs() < entryLockedUntil) return;
        entry.push(i);
        refreshEntry();
        checkEntry();
      });
      symbolPad.appendChild(b);
    }

    btnBack.onclick = () => { entry.pop(); refreshEntry(); checkEntry(); };
    btnClear.onclick = () => {
      entry.length = 0;
      refreshEntry();
      resultEl.textContent = "";
      setStatus("Entrée effacée.");
    };
  }

  // ===== Drag + inertia =====
  function bringToFront(el){
    el.style.zIndex = String(1000 + Math.floor(nowMs()));
  }

  function attachDrag(el){
    const state = phys.get(el);
    if (!state) return;

    let pointerId = null;
    let startX=0, startY=0;
    let baseX=0, baseY=0;

    el.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      pointerId = ev.pointerId;

      const p = getPos(el);
      startX = ev.clientX;
      startY = ev.clientY;
      baseX = p.x;
      baseY = p.y;

      state.dragging = true;
      state.vx = 0;
      state.vy = 0;
      state.lastMoveT = nowMs();
      state.lastMoveX = startX;
      state.lastMoveY = startY;

      bringToFront(el);
    });

    el.addEventListener("pointermove", (ev) => {
      if (pointerId !== ev.pointerId) return;
      if (!state.dragging) return;

      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const nx = baseX + dx;
      const ny = baseY + dy;
      setPos(el, nx, ny);
      clampInside(el);

      const t = nowMs();
      const dt = Math.max(1, t - state.lastMoveT);
      const vx = (ev.clientX - state.lastMoveX) / dt;
      const vy = (ev.clientY - state.lastMoveY) / dt;
      state.vx = clamp(vx, -MAX_SPEED, MAX_SPEED);
      state.vy = clamp(vy, -MAX_SPEED, MAX_SPEED);
      state.lastMoveT = t;
      state.lastMoveX = ev.clientX;
      state.lastMoveY = ev.clientY;

      enforceCollisions();
    });

    el.addEventListener("pointerup", (ev) => {
      if (pointerId !== ev.pointerId) return;
      pointerId = null;
      state.dragging = false;
      trySnap(el);
    });

    el.addEventListener("pointercancel", () => {
      pointerId = null;
      state.dragging = false;
    });
  }

  function stepPhysics(){
    for (const [el, s] of phys.entries()){
      if (s.dragging) continue;

      if (Math.abs(s.vx) > MIN_SPEED || Math.abs(s.vy) > MIN_SPEED){
        s.x += s.vx * 16;
        s.y += s.vy * 16;
        s.vx *= FRICTION;
        s.vy *= FRICTION;

        setPos(el, s.x, s.y);
        clampInside(el);
      } else {
        s.vx = 0; s.vy = 0;
      }
    }

    enforceCollisions();
    requestAnimationFrame(stepPhysics);
  }

  // ===== Fuse / rebuild =====
  function removePiece(el){
    phys.delete(el);
    el.remove();
  }

  function fuseRectangle(rect, halfA, halfB){
    const pa = getPos(halfA);
    const pb = getPos(halfB);
    const x = Math.min(pa.x, pb.x);
    const y = Math.min(pa.y, pb.y);

    removePiece(halfA);
    removePiece(halfB);

    const el = document.createElement("div");
    el.className = "piece rect engrave snapGood";
    el.dataset.kind = "rect";
    el.dataset.rid = rect.id;
    el.dataset.leftKey = rect.leftKey == null ? "" : String(rect.leftKey);
    el.dataset.rightKey = rect.rightKey == null ? "" : String(rect.rightKey);
    el.dataset.sym = String(rect.sym);
    el.dataset.syms = JSON.stringify([rect.sym]);
    el.dataset.engraved = "1";
    el._pid = uid("p");

    el.appendChild(buildRectSVG(rect, false));
    playArea.appendChild(el);

    phys.set(el, { x, y, vx:0, vy:0, dragging:false, lastMoveT:0, lastMoveX:0, lastMoveY:0 });
    setPos(el, x, y);
    clampInside(el);
    attachDrag(el);

    if (SHOW_RECT_BADGES){
      const b = document.createElement("div");
      b.className = "badge";
      b.textContent = rect.id;
      el.appendChild(b);
    }


    updateLineState();
  }

  function rebuildPieceSVG(el){
    const kind = el.dataset.kind;
    if (kind === "half"){
      const rid = el.dataset.rid;
      const rect = level.find(r => r.id === rid);
      if (!rect) return;
      rect._internalType = rect._internalType || el.dataset.internal || `C${rect.leftKey || rect.rightKey || 1}`;
      const part = Number(el.dataset.part);
      el.innerHTML = "";
      el.appendChild(buildHalfSVG(rect, part));
      return;
    }

    if (kind === "rect"){
      const rid = el.dataset.rid;
      const rect = level.find(r => r.id === rid);
      if (!rect) return;
      rect._internalType = rect._internalType || `C${rect.leftKey || rect.rightKey || 1}`;
      el.innerHTML = "";
      el.appendChild(buildRectSVG(rect, true, { showLeft:true, showRight:true, showMarkers:true }));
      return;
    }

    if (kind === "cluster"){
      const segs = getSegs(el);
      el.innerHTML = "";
      el.appendChild(buildClusterContent(segs));
      // keep keys in sync
      const first = level.find(r => r.id === segs[0]);
      const last = level.find(r => r.id === segs[segs.length-1]);
      el.dataset.leftKey = first.leftKey == null ? "" : String(first.leftKey);
      el.dataset.rightKey = last.rightKey == null ? "" : String(last.rightKey);
      el.dataset.syms = JSON.stringify(segs.map(rid => level.find(r => r.id===rid).sym));
      return;
    }
  }

  function rebuildAll(){
    // update internal connector cache
    for (const r of level){
      r._internalType = r._internalType || `C${r.leftKey || r.rightKey || 1}`;
    }

    for (const el of Array.from(phys.keys())){
      rebuildPieceSVG(el);
      clampInside(el);
    }
    updateLineState();
  }

  // ===== Init / Reset =====
  function clearAll(){
    for (const el of Array.from(phys.keys())) el.remove();
    phys.clear();
    overlapPairs.clear();

    entry.length = 0;
    unlockedSequence = null;
    refreshEntry();
    resultEl.textContent = "";
    lineSymbolsEl.innerHTML = "";
    lineProgressEl.textContent = `0 / ${LEVEL_COUNT}`;
  }

  function spawnPieces(){
    const mobile = isMobileLayout();
    const HALF_W = mobile ? 310 : 260;
    const HALF_H = 140;

    const bounds = playBounds();

    for (const rect of level){
      rect._internalType = rect._internalType || `C${rect.leftKey || rect.rightKey || 1}`;

      for (let part=0; part<2; part++){
        const el = document.createElement("div");
        el.className = "piece";
        el.dataset.kind = "half";
        el.dataset.rid = rect.id;
        el.dataset.part = String(part);
        el.dataset.internal = rect._internalType;
        el.dataset.sym = String(rect.sym);
    el.dataset.syms = JSON.stringify([rect.sym]);
        el._pid = uid("p");

        el.appendChild(buildHalfSVG(rect, part));
        playArea.appendChild(el);

        const x = Math.random() * Math.max(0, (bounds.w - HALF_W));
        const y = Math.random() * Math.max(0, (bounds.h - HALF_H));

        phys.set(el, { x, y, vx:0, vy:0, dragging:false, lastMoveT:0, lastMoveX:0, lastMoveY:0 });
        setPos(el, x, y);
        clampInside(el);
        attachDrag(el);
      }
    }

    setStatus("Pièces prêtes.");
  }

  function reset(){
    clearAll();
    spawnPieces();
    setupPad();
    updateLineState();
  }

  // ===== Theme =====
  function setThemeMunich(on){
    document.body.classList.toggle("theme-munich", on);
    document.body.classList.toggle("theme-dark", !on);
    btnTheme.textContent = on ? "Style : Sombre" : "Style : Munich 1908";
  }
  let munich = false;

  btnTheme.addEventListener("click", () => { munich = !munich; setThemeMunich(munich); rebuildAll(); });
  btnMusic.addEventListener("click", () => audio.toggleMusic());
  btnReset.addEventListener("click", reset);

  // IMPORTANT: Do NOT reset on resize/zoom. Keep state until reset.
  let resizeT = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      // Rebuild SVG sizes + clamp inside, without changing game state
      rebuildAll();
      setStatus("Ajusté à l’affichage (sans reset).");
    }, 140);
  });

  // Start
  setThemeMunich(false);
  setupPad();
  reset();
  requestAnimationFrame(stepPhysics);
})();
