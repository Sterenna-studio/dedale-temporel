// Imprimerie Médicale — Puzzle (offline, no deps)
// v5: app.js rebuild from scratch (no syntax errors), male tabs protrude, female is a real hole.
(() => {
  'use strict';

  // ---- DOM ----
  const board = document.getElementById('board');
  const btnShuffle = document.getElementById('btnShuffle');
  const btnReset   = document.getElementById('btnReset');
  const btnHint    = document.getElementById('btnHint');
  const panelHint  = document.getElementById('panelHint');
  const statBuilt  = document.getElementById('statBuilt');
  const statChain  = document.getElementById('statChain');
  const successCard = document.getElementById('successCard');
  const successCode = document.getElementById('successCode');

  // ---- Layout constants ----
  const HALF_W = 210;
  const HALF_H = 105;
  const SNAP = 22;           // snap distance (px)
  const CHAIN_SNAP = 26;     // snap distance for plate chaining
  const GAP = 16;            // gap between plates in chain
  const CLAMP_PAD = 22;      // keep pieces away from edges (helps keep tabs on-screen)
  const TAB_W = 110;
  const TAB_H = 70;

  // Toggle UI decorations
  const SHOW_HALF_BADGES = false; // "R1 • 1/2"
  const SHOW_HALF_MARKS  = false; // symbol name on halves
  const SHOW_RECT_BADGES = true;  // "R1"

  // ---- Utils ----
  function isMobileLayout(){
    return window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
  }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by){
    const dx = ax - bx, dy = ay - by;
    return Math.hypot(dx, dy);
  }
  function boardRect(){ return board.getBoundingClientRect(); }
  function svgEl(tag, attrs){
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs){
      for (const k of Object.keys(attrs)) el.setAttribute(k, String(attrs[k]));
    }
    return el;
  }

  // ---- Connector paths (normalized: x in [0..1], baseline y=0, protrusion toward +Y) ----
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
  function uid(prefix){ _uid += 1; return `${prefix}_${_uid}`; }

  function connectorGroupAndPath(type, w, h, ori, attrs){
    const d = CONNECTOR_D[type];

    // We build transforms so that:
    // - baseline is at the "attachment edge"
    // - protrusion goes into +Y (down/up) or +X (right) / -X (left)
    const g = svgEl('g');

    // scale first (path is normalized 0..1 on X, 0..~0.34 on Y)
    const p = svgEl('path', Object.assign({
      d,
      transform: `scale(${w} ${h})`,
      'vector-effect': 'non-scaling-stroke',
    }, attrs || {}));

    if (ori === 'down'){
      // no-op
      g.appendChild(p);
      return g;
    }

    if (ori === 'up'){
      // flip 180° around (0,0) then translate into + space
      g.setAttribute('transform', `translate(${w} ${h}) rotate(180)`);
      g.appendChild(p);
      return g;
    }

    if (ori === 'right'){
      // rotate clockwise so baseline becomes vertical at x=0, protrusion to +X
      // after rotate(-90), bbox is in negative Y => translate by (0, w)
      g.setAttribute('transform', `translate(0 ${w}) rotate(-90)`);
      g.appendChild(p);
      return g;
    }

    if (ori === 'left'){
      // rotate ccw so protrusion to -X
      // after rotate(90), bbox is in negative X => translate by (h, 0)
      g.setAttribute('transform', `translate(${h} 0) rotate(90)`);
      g.appendChild(p);
      return g;
    }

    g.appendChild(p);
    return g;
  }

  function addMaleTab(svg, type, x, y, w, h, ori){
    const gOuter = svgEl('g', { transform:`translate(${x} ${y})` });
    const g = connectorGroupAndPath(type, w, h, ori, {
      fill: '#ded7c8',
      stroke: 'rgba(0,0,0,.65)',
      'stroke-width': 2,
    });
    gOuter.appendChild(g);
    svg.appendChild(gOuter);
  }

  function addHoleMask(defs, type, x, y, w, h, ori, maskW, maskH){
    const id = uid('mask');
    const mask = svgEl('mask', { id, maskUnits:'userSpaceOnUse', x:0, y:0, width:maskW, height:maskH });
    mask.appendChild(svgEl('rect', { x:0, y:0, width:maskW, height:maskH, fill:'white' }));

    const gOuter = svgEl('g', { transform:`translate(${x} ${y})` });
    const g = connectorGroupAndPath(type, w, h, ori, { fill:'black', stroke:'none' });
    gOuter.appendChild(g);
    mask.appendChild(gOuter);

    defs.appendChild(mask);
    return id;
  }

  function addHoleStroke(svg, type, x, y, w, h, ori){
    const gOuter = svgEl('g', { transform:`translate(${x} ${y})` });
    const g = connectorGroupAndPath(type, w, h, ori, {
      fill:'none',
      stroke:'rgba(0,0,0,.45)',
      'stroke-width': 2,
    });
    gOuter.appendChild(g);
    svg.appendChild(gOuter);
  }

  // ---- Symbol library (icons used for the final code) ----
  function strokeStyle(opacity){
    return { fill:'none', stroke:'rgba(0,0,0,.78)', 'stroke-width':3, 'stroke-linecap':'round', 'stroke-linejoin':'round', opacity };
  }
  function plus(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const t = s/2;
    g.appendChild(svgEl('path', { d: `M ${x+t} ${y+10} V ${y+s-10} M ${x+10} ${y+t} H ${x+s-10}`, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function triangle(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const d = `M ${x+s/2} ${y+10} L ${x+s-12} ${y+s-12} L ${x+12} ${y+s-12} Z`;
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function ring(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    g.appendChild(svgEl('circle', { cx:x+s/2, cy:y+s/2, r:s/2-12, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function diamond(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const d = `M ${x+s/2} ${y+8} L ${x+s-8} ${y+s/2} L ${x+s/2} ${y+s-8} L ${x+8} ${y+s/2} Z`;
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function hex(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const cx = x+s/2, cy=y+s/2, r=s/2-10;
    const pts = [];
    for (let i=0;i<6;i++){
      const a = -Math.PI/2 + i*Math.PI/3;
      pts.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
    }
    const d = "M " + pts.map(p=>`${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function crescent(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const cx = x+s/2, cy=y+s/2, r=s/2-10;
    const d = `M ${cx+r} ${cy} A ${r} ${r} 0 1 1 ${cx-r} ${cy} A ${r*0.55} ${r*0.55} 0 1 0 ${cx+r*0.15} ${cy} Z`;
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity), fill:'rgba(0,0,0,.08)' }));
    svg.appendChild(g);
  }
  function wave(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const d = `M ${x+8} ${y+s*0.55} C ${x+s*0.25} ${y+s*0.25}, ${x+s*0.35} ${y+s*0.85}, ${x+s*0.55} ${y+s*0.55} C ${x+s*0.75} ${y+s*0.25}, ${x+s*0.85} ${y+s*0.85}, ${x+s-8} ${y+s*0.55}`;
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }
  function star(svg,x,y,s,opacity){
    const g = svgEl('g', { opacity });
    const cx=x+s/2, cy=y+s/2;
    const R=s/2-10, r=R*0.45;
    const pts=[];
    for (let i=0;i<10;i++){
      const ang = -Math.PI/2 + i*Math.PI/5;
      const rr = (i%2===0)?R:r;
      pts.push([cx+rr*Math.cos(ang), cy+rr*Math.sin(ang)]);
    }
    const d = "M " + pts.map(p=>`${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";
    g.appendChild(svgEl('path', { d, ...strokeStyle(opacity) }));
    svg.appendChild(g);
  }

  const SYMBOLS = {
    S1: { name: "CROIX",    draw: (svg,x,y,s,a) => plus(svg,x,y,s,a) },
    S2: { name: "TRIANGLE", draw: (svg,x,y,s,a) => triangle(svg,x,y,s,a) },
    S3: { name: "ANNEAU",   draw: (svg,x,y,s,a) => ring(svg,x,y,s,a) },
    S4: { name: "LOSANGE",  draw: (svg,x,y,s,a) => diamond(svg,x,y,s,a) },
    S5: { name: "HEX",      draw: (svg,x,y,s,a) => hex(svg,x,y,s,a) },
    S6: { name: "LUNE",     draw: (svg,x,y,s,a) => crescent(svg,x,y,s,a) },
    S7: { name: "ÉTOILE",   draw: (svg,x,y,s,a) => star(svg,x,y,s,a) },
    S8: { name: "ONDE",     draw: (svg,x,y,s,a) => wave(svg,x,y,s,a) },
  };

  // ---- Level data ----
  const level = {
    id: "imprimerie_noel_1900_symbols_v5",
    rectangles: [
      { id:"R1", sym:"S1", label:"FORMULA / Ordonnance",          internal:"C1", leftKey:null, rightKey:1 },
      { id:"R2", sym:"S2", label:"EXTRACTUM / Preparation",       internal:"C2", leftKey:1,    rightKey:2 },
      { id:"R3", sym:"S3", label:"TINCTURA / Solution",           internal:"C3", leftKey:2,    rightKey:3 },
      { id:"R4", sym:"S4", label:"ELIXIR / Special Noel",         internal:"C4", leftKey:3,    rightKey:4 },
      { id:"R5", sym:"S5", label:"SERUM / Controle Qualite",      internal:"C5", leftKey:4,    rightKey:5 },
      { id:"R6", sym:"S6", label:"BANDES / Etiquettes",           internal:"C6", leftKey:5,    rightKey:6 },
      { id:"R7", sym:"S7", label:"SCELLES / Cachets",             internal:"C7", leftKey:6,    rightKey:7 },
      { id:"R8", sym:"S8", label:"RAPPORT / Livraison",           internal:"C8", leftKey:7,    rightKey:null },
    ]
  };

  // ---- Rendering: halves and plates ----
  function buildHalfSVG(rect, part){
    const mobile = isMobileLayout();
    const svg = svgEl('svg', { width: HALF_W, height: HALF_H, viewBox:`0 0 ${HALF_W} ${HALF_H}` });
    svg.setAttribute('overflow', 'visible');

    const defs = svgEl('defs');
    svg.appendChild(defs);

    const paperFill = '#e8e2d6';

    // female hole is on part=1 (bottom/right)
    let maskId = null;
    let hole = null;

    if (!mobile){
      if (part === 1){
        // hole at top edge, indentation into the piece (down)
        const x = (HALF_W - TAB_W)/2;
        const y = 0;
        maskId = addHoleMask(defs, rect.internal, x, y, TAB_W, TAB_H, 'down', HALF_W, HALF_H);
        hole = { type: rect.internal, x, y, w:TAB_W, h:TAB_H, ori:'down' };
      }
    } else {
      if (part === 1){
        // hole at left edge, indentation into the piece (right)
        const x = 0;
        const y = (HALF_H - TAB_W)/2;
        maskId = addHoleMask(defs, rect.internal, x, y, TAB_W, TAB_H, 'right', HALF_W, HALF_H);
        hole = { type: rect.internal, x, y, w:TAB_W, h:TAB_H, ori:'right' };
      }
    }

    const content = svgEl('g', maskId ? { mask:`url(#${maskId})` } : {});
    svg.appendChild(content);

    // paper base (masked so the hole is really transparent)
    content.appendChild(svgEl('rect', { x:0,y:0,width:HALF_W,height:HALF_H, rx:14, ry:14, fill:paperFill }));
    content.appendChild(svgEl('path', {
      d:`M 12 22 H ${HALF_W-12} M 12 40 H ${HALF_W-12} M 12 58 H ${HALF_W-12} M 12 76 H ${HALF_W-12} M 12 94 H ${HALF_W-12}`,
      stroke:'rgba(0,0,0,.08)', 'stroke-width':2, fill:'none', 'stroke-linecap':'round'
    }));

    
// centered label band
    const bandW = HALF_W - 34;
    const bandH = 26;
    const bandX = (HALF_W - bandW)/2;
    const bandY = (HALF_H - bandH)/2;
    content.appendChild(svgEl('rect', { x:bandX, y:bandY, width:bandW, height:bandH, rx:13, fill:'rgba(0,0,0,.10)' }));
    const t = svgEl('text', { x:HALF_W/2, y:bandY+18, 'text-anchor':'middle', fill:'rgba(0,0,0,.72)', 'font-size':12, 'font-weight':900 });
    t.textContent = rect.label;
    content.appendChild(t);

    // symbol stamps (kept)
    // seal
    const sealX = (part === 0) ? HALF_W-68 : 12;
    content.appendChild(svgEl('rect', { x:sealX, y:10, width:56, height:20, rx:6, fill:'none', stroke:'rgba(156,47,47,.55)', 'stroke-width':2, opacity:0.55 }));
    const sealTxt = svgEl('text', { x:sealX+28, y:25, 'text-anchor':'middle', fill:'rgba(156,47,47,.55)', 'font-size':11, 'font-weight':800, opacity:0.55 });
    sealTxt.textContent = (part === 0) ? "NOEL" : "OK";
    content.appendChild(sealTxt);

    // outline stroke
    svg.appendChild(svgEl('rect', { x:0,y:0,width:HALF_W,height:HALF_H, rx:14, ry:14, fill:'none', stroke:'rgba(0,0,0,.65)', 'stroke-width':2 }));

    // hole stroke
    if (hole) addHoleStroke(svg, hole.type, hole.x, hole.y, hole.w, hole.h, hole.ori);

    // male tab protrusion: part=0 (top/left)
    if (!mobile){
      if (part === 0){
        const x = (HALF_W - TAB_W)/2;
        const y = HALF_H; // baseline at bottom edge, protrude down
        addMaleTab(svg, rect.internal, x, y, TAB_W, TAB_H, 'down');
      }
    } else {
      if (part === 0){
        const x = HALF_W; // baseline at right edge, protrude right
        const y = (HALF_H - TAB_W)/2;
        addMaleTab(svg, rect.internal, x, y, TAB_W, TAB_H, 'right');
      }
    }

    return svg;
  }

  function buildRectSVG(rect){
    const mobile = isMobileLayout();
    const rectW = mobile ? (HALF_W*2) : HALF_W;
    const rectH = mobile ? HALF_H : (HALF_H*2);
    const svg = svgEl('svg', { width:rectW, height:rectH, viewBox:`0 0 ${rectW} ${rectH}` });
    svg.setAttribute('overflow', 'visible');

    const defs = svgEl('defs');
    svg.appendChild(defs);

    const paperFill = '#e8e2d6';

    // female external hole if leftKey exists
    let maskId = null;
    let hole = null;

    if (!mobile){
      if (rect.leftKey != null){
        const type = `C${rect.leftKey}`;
        const x = 0;
        const y = (rectH - TAB_W)/2;
        maskId = addHoleMask(defs, type, x, y, TAB_W, TAB_H, 'right', rectW, rectH);
        hole = { type, x, y, w:TAB_W, h:TAB_H, ori:'right' };
      }
    } else {
      if (rect.leftKey != null){
        const type = `C${rect.leftKey}`;
        const x = (rectW - TAB_W)/2;
        const y = 0;
        maskId = addHoleMask(defs, type, x, y, TAB_W, TAB_H, 'down', rectW, rectH);
        hole = { type, x, y, w:TAB_W, h:TAB_H, ori:'down' };
      }
    }

    const content = svgEl('g', maskId ? { mask:`url(#${maskId})` } : {});
    svg.appendChild(content);

    content.appendChild(svgEl('rect', { x:0,y:0,width:rectW,height:rectH, rx:14, ry:14, fill:paperFill }));

    // middle cut hint (dashed)
    if (!mobile){
      content.appendChild(svgEl('path', { d:`M 10 ${rectH/2} H ${rectW-10}`, stroke:'rgba(0,0,0,.10)', 'stroke-width':2, 'stroke-dasharray':'4 6' }));
    } else {
      content.appendChild(svgEl('path', { d:`M ${rectW/2} 10 V ${rectH-10}`, stroke:'rgba(0,0,0,.10)', 'stroke-width':2, 'stroke-dasharray':'4 6' }));
    }

    // centered label
    const bandW = rectW - 32;
    const bandH = 26;
    const bandX = (rectW - bandW)/2;
    const bandY = (rectH - bandH)/2;
    content.appendChild(svgEl('rect', { x:bandX, y:bandY, width:bandW, height:bandH, rx:13, fill:'rgba(0,0,0,.10)' }));
    const label = svgEl('text', { x:rectW/2, y:bandY+18, 'text-anchor':'middle', fill:'rgba(0,0,0,.78)', 'font-size':12, 'font-weight':900 });
    label.textContent = rect.label;
    content.appendChild(label);

    // START/END tags
    if (!mobile){
      if (rect.leftKey == null){
        content.appendChild(svgEl('path', { d:`M 10 18 H 40`, stroke:'rgba(165,139,76,.75)', 'stroke-width':3, 'stroke-linecap':'round' }));
        const t = svgEl('text', { x:48, y:22, fill:'rgba(165,139,76,.85)', 'font-size':12, 'font-weight':800 });
        t.textContent = "START";
        content.appendChild(t);
      }
      if (rect.rightKey == null){
        content.appendChild(svgEl('path', { d:`M ${rectW-40} 18 H ${rectW-10}`, stroke:'rgba(47,156,90,.85)', 'stroke-width':3, 'stroke-linecap':'round' }));
        const t = svgEl('text', { x:rectW-48, y:22, fill:'rgba(47,156,90,.90)', 'font-size':12, 'font-weight':900, 'text-anchor':'end' });
        t.textContent = "END";
        content.appendChild(t);
      }
    } else {
      if (rect.leftKey == null){
        content.appendChild(svgEl('path', { d:`M 18 10 V 34`, stroke:'rgba(165,139,76,.75)', 'stroke-width':3, 'stroke-linecap':'round' }));
        const t = svgEl('text', { x:26, y:24, fill:'rgba(165,139,76,.85)', 'font-size':12, 'font-weight':800 });
        t.textContent = "START";
        content.appendChild(t);
      }
      if (rect.rightKey == null){
        content.appendChild(svgEl('path', { d:`M 18 ${rectH-34} V ${rectH-10}`, stroke:'rgba(47,156,90,.85)', 'stroke-width':3, 'stroke-linecap':'round' }));
        const t = svgEl('text', { x:26, y:rectH-18, fill:'rgba(47,156,90,.90)', 'font-size':12, 'font-weight':900 });
        t.textContent = "END";
        content.appendChild(t);
      }
    }

    // symbols + seal
    SYMBOLS[rect.sym].draw(content, rectW/2-52, rectH/2-68, 104, 0.48);
    SYMBOLS[rect.sym].draw(content, rectW-46, rectH-46, 34, 0.65);

    content.appendChild(svgEl('rect', { x:rectW/2-44, y:10, width:88, height:26, rx:8, fill:'none', stroke:'rgba(156,47,47,.70)', 'stroke-width':2 }));
    const sealTxt = svgEl('text', { x:rectW/2, y:28, 'text-anchor':'middle', fill:'rgba(156,47,47,.70)', 'font-size':12, 'font-weight':900 });
    sealTxt.textContent = "NOEL OK";
    content.appendChild(sealTxt);

    // outline
    svg.appendChild(svgEl('rect', { x:0,y:0,width:rectW,height:rectH, rx:14, ry:14, fill:'none', stroke:'rgba(0,0,0,.75)', 'stroke-width':2 }));

    // hole stroke
    if (hole) addHoleStroke(svg, hole.type, hole.x, hole.y, hole.w, hole.h, hole.ori);

    // male external tab if rightKey exists
    if (!mobile){
      if (rect.rightKey != null){
        const type = `C${rect.rightKey}`;
        const x = rectW;
        const y = (rectH - TAB_W)/2;
        addMaleTab(svg, type, x, y, TAB_W, TAB_H, 'right');
      }
    } else {
      if (rect.rightKey != null){
        const type = `C${rect.rightKey}`;
        const x = (rectW - TAB_W)/2;
        const y = rectH;
        addMaleTab(svg, type, x, y, TAB_W, TAB_H, 'down');
      }
    }

    return svg;
  }

  // ---- Model state ----
  /** @type {Map<string, any>} rectId -> {id,sym,label,internal,leftKey,rightKey} */
  const rectById = new Map();
  /** halves list */
  let halves = []; // {id, rectId, part, el}
  /** plates list */
  let plates = []; // {id, rectId, el}

  function clearBoard(){
    board.innerHTML = '';
    halves = [];
    plates = [];
    rectById.clear();
    hideSuccess();
  }

  function hideSuccess(){
    if (successCard) successCard.hidden = true;
    if (successCode) successCode.innerHTML = '';
  }

  function updateStats(){
    statBuilt.textContent = String(plates.length);
    const chain = computeChain();
    statChain.textContent = String(chain.length);
    if (plates.length === level.rectangles.length && chain.length === level.rectangles.length){
      showSuccess(chain.map(r => r.sym));
    } else {
      hideSuccess();
    }
  }

  function showSuccess(symIds){
    if (!successCard || !successCode) return;
    successCode.innerHTML = '';
    for (const sid of symIds){
      const wrap = document.createElement('div');
      wrap.className = 'sym';
      const s = svgEl('svg', { width:28, height:28, viewBox:'0 0 100 100' });
      SYMBOLS[sid].draw(s, 10, 10, 80, 1);
      wrap.appendChild(s);
      successCode.appendChild(wrap);
    }
    successCard.hidden = false;
  }

  // ---- Placement helpers ----
  function setPos(el, x, y){
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  }
  function getPos(el){
    return {
      x: parseFloat(el.style.left || '0'),
      y: parseFloat(el.style.top  || '0')
    };
  }
  function clampElement(el, x, y){
    const br = boardRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const minX = CLAMP_PAD;
    const minY = CLAMP_PAD;
    const maxX = Math.max(minX, br.width  - w - CLAMP_PAD);
    const maxY = Math.max(minY, br.height - h - CLAMP_PAD);
    return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  }

  function randomPosFor(el, tries){
    const br = boardRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const minX = CLAMP_PAD;
    const minY = CLAMP_PAD;
    const maxX = Math.max(minX, br.width  - w - CLAMP_PAD);
    const maxY = Math.max(minY, br.height - h - CLAMP_PAD);
    for (let i=0;i<(tries||60);i++){
      const x = minX + Math.random()*(maxX-minX);
      const y = minY + Math.random()*(maxY-minY);
      return { x, y };
    }
    return { x:minX, y:minY };
  }

  // ---- Drag system ----
  let drag = null; // {el, type:'half'|'plate', id, startX,startY, offX,offY, pointerId}

  function bringToFront(el){
    const z = 10 + Math.floor(Math.random()*100000);
    el.style.zIndex = String(z);
  }

  function onPointerDown(ev){
    const target = ev.currentTarget;
    if (!target) return;
    ev.preventDefault();
    const br = boardRect();
    const p = getPos(target);

    drag = {
      el: target,
      type: target.dataset.kind,
      id: target.dataset.id,
      startX: p.x,
      startY: p.y,
      offX: ev.clientX - br.left - p.x,
      offY: ev.clientY - br.top  - p.y,
      pointerId: ev.pointerId
    };
    bringToFront(target);
    target.setPointerCapture(ev.pointerId);

    // moving a plate breaks its snap connections
    if (drag.type === 'plate'){
      target.dataset.snapped = '0';
    }
  }

  function onPointerMove(ev){
    if (!drag || ev.pointerId !== drag.pointerId) return;
    ev.preventDefault();

    const br = boardRect();
    const x = (ev.clientX - br.left) - drag.offX;
    const y = (ev.clientY - br.top)  - drag.offY;
    const cl = clampElement(drag.el, x, y);
    setPos(drag.el, cl.x, cl.y);
  }

  function onPointerUp(ev){
    if (!drag || ev.pointerId !== drag.pointerId) return;
    ev.preventDefault();

    const el = drag.el;
    try {
      if (drag.type === 'half'){
        tryFuseHalf(el);
      } else if (drag.type === 'plate'){
        trySnapPlate(el);
      }
    } finally {
      drag = null;
      updateStats();
    }
  }

  function makeDraggable(el){
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }

  // ---- Create elements ----
  function createHalf(rect, part){
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.kind = 'half';
    el.dataset.rectId = rect.id;
    el.dataset.part = String(part);
    el.dataset.id = `${rect.id}_${part}`;
    el.appendChild(buildHalfSVG(rect, part));

    if (SHOW_HALF_BADGES){
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = `${rect.id} • ${part===0 ? '1/2' : '2/2'}`;
      el.appendChild(badge);
    }
    if (SHOW_HALF_MARKS){
      const mark = document.createElement('div');
      mark.className = 'halfMark';
      mark.textContent = SYMBOLS[rect.sym].name;
      el.appendChild(mark);
    }

    makeDraggable(el);
    board.appendChild(el);
    return el;
  }

  function createPlate(rect){
    const el = document.createElement('div');
    el.className = 'rect';
    el.dataset.kind = 'plate';
    el.dataset.id = rect.id;
    el.dataset.rectId = rect.id;
    el.dataset.snapped = '0';
    el.appendChild(buildRectSVG(rect));

    if (SHOW_RECT_BADGES){
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = rect.id;
      el.appendChild(badge);
    }

    makeDraggable(el);
    board.appendChild(el);
    return el;
  }

  // ---- Puzzle logic: fuse halves ----
  function halfByEl(el){
    return {
      rectId: el.dataset.rectId,
      part: parseInt(el.dataset.part, 10)
    };
  }

  function findOtherHalf(rectId, part){
    const otherPart = part === 0 ? 1 : 0;
    return halves.find(h => h.rectId === rectId && h.part === otherPart) || null;
  }

  function tryFuseHalf(el){
    const mobile = isMobileLayout();
    const info = halfByEl(el);
    const other = findOtherHalf(info.rectId, info.part);
    if (!other) return;

    const a = el;
    const b = other.el;
    const pa = getPos(a);
    const pb = getPos(b);

    // required relative alignment (desktop: stacked; mobile: side-by-side)
    let ok = false;
    let targetAX = pa.x, targetAY = pa.y;

    if (!mobile){
      // part 0 should be above part 1
      const topEl = (info.part === 0) ? a : b;
      const botEl = (info.part === 0) ? b : a;
      const pt = getPos(topEl);
      const pb2 = getPos(botEl);
      const dx = Math.abs(pb2.x - pt.x);
      const dy = Math.abs(pb2.y - (pt.y + HALF_H));
      ok = (dx <= SNAP && dy <= SNAP);

      if (ok){
        targetAX = pt.x;
        targetAY = pt.y;
      }
    } else {
      // part 0 should be left of part 1
      const leftEl = (info.part === 0) ? a : b;
      const rightEl = (info.part === 0) ? b : a;
      const pl = getPos(leftEl);
      const pr = getPos(rightEl);
      const dx = Math.abs(pr.x - (pl.x + HALF_W));
      const dy = Math.abs(pr.y - pl.y);
      ok = (dx <= SNAP && dy <= SNAP);

      if (ok){
        targetAX = pl.x;
        targetAY = pl.y;
      }
    }

    if (!ok) return;

    // Fuse: remove both halves, add plate
    const rect = rectById.get(info.rectId);
    if (!rect) return;

    // compute clamped final position
    const plateEl = createPlate(rect);
    // initial measure requires DOM in place; set after
    const cl = clampElement(plateEl, targetAX, targetAY);
    setPos(plateEl, cl.x, cl.y);

    // remove halves elements
    a.remove();
    b.remove();
    halves = halves.filter(h => h.el !== a && h.el !== b);

    // register plate
    plates.push({ id: rect.id, rectId: rect.id, el: plateEl });

    panelHint.textContent = "Bien ! Maintenant relie les plaques (connecteurs externes) jusqu’à END.";
  }

  // ---- Puzzle logic: chain plates ----
  function plateData(el){
    const rectId = el.dataset.rectId;
    return rectById.get(rectId);
  }

  function trySnapPlate(el){
    const mobile = isMobileLayout();
    const self = plateData(el);
    if (!self) return;

    const rectW = mobile ? (HALF_W*2) : HALF_W;
    const rectH = mobile ? HALF_H : (HALF_H*2);

    // attempt to snap to any other plate based on key match and relative position
    const pSelf = getPos(el);

    let best = null;

    for (const p of plates){
      if (p.el === el) continue;
      const other = plateData(p.el);
      if (!other) continue;

      const pOther = getPos(p.el);

      if (!mobile){
        // other to the right of self (self.rightKey -> other.leftKey)
        if (self.rightKey != null && other.leftKey != null && self.rightKey === other.leftKey){
          const expectedX = pSelf.x + rectW + GAP;
          const expectedY = pSelf.y;
          const d = dist(pOther.x, pOther.y, expectedX, expectedY);
          if (d <= CHAIN_SNAP && (!best || d < best.d)){
            best = { moveEl: p.el, x: expectedX, y: expectedY, d };
          }
        }
        // other to the left of self (other.rightKey -> self.leftKey)
        if (self.leftKey != null && other.rightKey != null && self.leftKey === other.rightKey){
          const expectedX = pSelf.x - (rectW + GAP);
          const expectedY = pSelf.y;
          const d = dist(pOther.x, pOther.y, expectedX, expectedY);
          if (d <= CHAIN_SNAP && (!best || d < best.d)){
            best = { moveEl: p.el, x: expectedX, y: expectedY, d };
          }
        }
      } else {
        // mobile: chain vertically (self.rightKey -> other.leftKey) means other below self
        if (self.rightKey != null && other.leftKey != null && self.rightKey === other.leftKey){
          const expectedX = pSelf.x;
          const expectedY = pSelf.y + rectH + GAP;
          const d = dist(pOther.x, pOther.y, expectedX, expectedY);
          if (d <= CHAIN_SNAP && (!best || d < best.d)){
            best = { moveEl: p.el, x: expectedX, y: expectedY, d };
          }
        }
        // other above self
        if (self.leftKey != null && other.rightKey != null && self.leftKey === other.rightKey){
          const expectedX = pSelf.x;
          const expectedY = pSelf.y - (rectH + GAP);
          const d = dist(pOther.x, pOther.y, expectedX, expectedY);
          if (d <= CHAIN_SNAP && (!best || d < best.d)){
            best = { moveEl: p.el, x: expectedX, y: expectedY, d };
          }
        }
      }
    }

    if (best){
      // snap the other element (the one it's supposed to align with)
      const cl = clampElement(best.moveEl, best.x, best.y);
      setPos(best.moveEl, cl.x, cl.y);
      best.moveEl.dataset.snapped = '1';
      el.dataset.snapped = '1';
      panelHint.textContent = "Continue : START → … → END. (Sur mobile : de haut en bas.)";
    }
  }

  function computeChain(){
    // returns ordered list of rect objects in chain if aligned, else partial from START
    const mobile = isMobileLayout();
    const rectW = mobile ? (HALF_W*2) : HALF_W;
    const rectH = mobile ? HALF_H : (HALF_H*2);

    // map id->plate el
    const plateElById = new Map();
    for (const p of plates) plateElById.set(p.rectId, p.el);

    // find START plate (leftKey null)
    let startRect = null;
    for (const r of level.rectangles){
      if (r.leftKey == null && plateElById.has(r.id)){
        startRect = rectById.get(r.id);
        break;
      }
    }
    if (!startRect) return [];

    const ordered = [startRect];
    let cur = startRect;

    for (let i=0;i<level.rectangles.length+1;i++){
      if (cur.rightKey == null) break; // END
      // find next rect by key
      const next = level.rectangles.find(rr => rr.leftKey === cur.rightKey);
      if (!next) break;
      if (!plateElById.has(next.id)) break;

      // verify snapped position
      const elCur = plateElById.get(cur.id);
      const elNext = plateElById.get(next.id);
      const pc = getPos(elCur);
      const pn = getPos(elNext);

      const ex = mobile ? pc.x : (pc.x + rectW + GAP);
      const ey = mobile ? (pc.y + rectH + GAP) : pc.y;

      const ok = dist(pn.x, pn.y, ex, ey) <= CHAIN_SNAP;
      if (!ok) break;

      const nextRect = rectById.get(next.id);
      ordered.push(nextRect);
      cur = nextRect;
    }

    return ordered;
  }

  // ---- Controls ----
  function shuffleAll(){
    hideSuccess();
    // shuffle positions for all pieces currently on board
    const els = Array.from(board.querySelectorAll('.piece, .rect'));
    for (const el of els){
      const p = randomPosFor(el, 1);
      const cl = clampElement(el, p.x, p.y);
      setPos(el, cl.x, cl.y);
      bringToFront(el);
      el.classList.remove('hintPulse');
    }
    panelHint.textContent = "Pièces mélangées. Repars de START et reconstitue le tirage.";
    updateStats();
  }

  function hint(){
    hideSuccess();
    // Prefer hinting an unbuilt rectangle
    const built = new Set(plates.map(p => p.rectId));
    const unbuilt = level.rectangles.filter(r => !built.has(r.id));
    if (unbuilt.length > 0){
      const r = unbuilt[Math.floor(Math.random()*unbuilt.length)];
      const ha = halves.find(h => h.rectId === r.id && h.part === 0);
      const hb = halves.find(h => h.rectId === r.id && h.part === 1);
      if (ha && hb){
        ha.el.classList.add('hintPulse');
        hb.el.classList.add('hintPulse');
        setTimeout(() => { ha.el && ha.el.classList.remove('hintPulse'); hb.el && hb.el.classList.remove('hintPulse'); }, 1600);
        panelHint.textContent = "Indice : ces 2 moitiés vont ensemble. Aligne-les puis lâche pour fusionner.";
        return;
      }
    }
    // else hint chain: pulse START plate if exists
    const startPlate = plates.find(p => {
      const r = rectById.get(p.rectId);
      return r && r.leftKey == null;
    });
    if (startPlate){
      startPlate.el.classList.add('hintPulse');
      setTimeout(() => startPlate.el && startPlate.el.classList.remove('hintPulse'), 1600);
      panelHint.textContent = "Indice : repars de START et aligne les plaques dans l’ordre.";
    } else {
      panelHint.textContent = "Indice : fusionne d’abord les moitiés (connecteur interne).";
    }
  }

  function reset(){
    clearBoard();

    // Register rects
    for (const r of level.rectangles){
      rectById.set(r.id, { ...r });
    }

    // Create halves (two per rect)
    for (const r of level.rectangles){
      const elA = createHalf(r, 0);
      const elB = createHalf(r, 1);

      // initial random positions
      const pA = randomPosFor(elA, 1);
      const pB = randomPosFor(elB, 1);
      setPos(elA, pA.x, pA.y);
      setPos(elB, pB.x, pB.y);

      halves.push({ id:`${r.id}_0`, rectId:r.id, part:0, el: elA });
      halves.push({ id:`${r.id}_1`, rectId:r.id, part:1, el: elB });
    }

    panelHint.textContent = "Assemble les moitiés (connecteur interne), puis relie les plaques (connecteurs externes).";
    updateStats();
  }

  // ---- Event wiring ----
  window.addEventListener('resize', () => {
    // Keep all elements clamped after resize/orientation changes
    const els = Array.from(board.querySelectorAll('.piece, .rect'));
    for (const el of els){
      const p = getPos(el);
      const cl = clampElement(el, p.x, p.y);
      setPos(el, cl.x, cl.y);
    }
    updateStats();
  });

  btnShuffle && btnShuffle.addEventListener('click', shuffleAll);
  btnReset && btnReset.addEventListener('click', reset);
  btnHint && btnHint.addEventListener('click', hint);

  // ---- Boot ----
  reset();

})();