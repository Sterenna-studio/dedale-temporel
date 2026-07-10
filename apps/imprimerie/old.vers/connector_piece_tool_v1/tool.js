import CONNECTORS from './tool_connectors.js';

const selType = document.getElementById('selType');
const selSex = document.getElementById('selSex');
const selOri = document.getElementById('selOri');
const inpW = document.getElementById('inpW');
const inpH = document.getElementById('inpH');
const inpStroke = document.getElementById('inpStroke');

const preview = document.getElementById('preview');
const out = document.getElementById('out');

const btnCopyPath = document.getElementById('btnCopyPath');
const btnCopySvg = document.getElementById('btnCopySvg');
const btnDownload = document.getElementById('btnDownload');

const grid = document.getElementById('grid');

for (const k of Object.keys(CONNECTORS)) {
  const opt = document.createElement('option');
  opt.value = k;
  opt.textContent = k;
  selType.appendChild(opt);
}

function makeSvg({type, sex, ori, w, h, strokeW}) {
  const d = CONNECTORS[type];

  // We render into a 100x100 viewBox then scale via width/height attrs.
  const vbW = 100, vbH = 100;
  const bandW = 80, bandH = 26;

  // Base: male-down from a baseline (normalized path protrudes down from y=0).
  let base = `translate(${(vbW-bandW)/2} ${(vbH/2)}) scale(${bandW} ${bandH})`;
  let fill = 'rgba(232,226,214,0.95)';
  let stroke = 'rgba(0,0,0,0.65)';

  if (sex === 'female') {
    // Mirror so it becomes a notch
    fill = 'rgba(15,17,22,0.22)';
    stroke = 'rgba(0,0,0,0.55)';
    base = `translate(${(vbW-bandW)/2} ${(vbH/2)+bandH}) scale(${bandW} ${bandH}) scale(1 -1)`;
  }

  let rot = 0;
  if (ori === 'down') rot = 0;
  if (ori === 'up') rot = 180;
  if (ori === 'left') rot = -90;
  if (ori === 'right') rot = 90;

  const rotate = rot ? ` rotate(${rot} 50 50)` : '';
  const transform = base + rotate;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}">
  <rect x="0" y="0" width="${vbW}" height="${vbH}" rx="12" fill="rgba(0,0,0,.06)"/>
  <path d="${d}" transform="${transform}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" vector-effect="non-scaling-stroke"/>
</svg>`;
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    flash('Copié ✅');
  }catch{
    flash('Copie impossible (navigateur).');
  }
}
function flash(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position='fixed';
  el.style.left='50%';
  el.style.top='14px';
  el.style.transform='translateX(-50%)';
  el.style.padding='10px 12px';
  el.style.borderRadius='12px';
  el.style.background='rgba(0,0,0,.55)';
  el.style.border='1px solid rgba(255,255,255,.14)';
  el.style.color='rgba(255,255,255,.9)';
  el.style.zIndex='9999';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 900);
}

function render(){
  const type = selType.value;
  const sex = selSex.value;
  const ori = selOri.value;
  const w = Math.max(40, Number(inpW.value||220));
  const h = Math.max(20, Number(inpH.value||120));
  const strokeW = Math.max(0.5, Number(inpStroke.value||2));
  const svg = makeSvg({type, sex, ori, w, h, strokeW});
  preview.innerHTML = svg;
  out.textContent = svg;
}

btnCopyPath.addEventListener('click', () => copyText(CONNECTORS[selType.value]));
btnCopySvg.addEventListener('click', () => copyText(out.textContent));
btnDownload.addEventListener('click', () => {
  const blob = new Blob([out.textContent], {type:'image/svg+xml'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${selType.value}_${selSex.value}_${selOri.value}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
});

for (const el of [selType, selSex, selOri, inpW, inpH, inpStroke]) {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
}

function renderGrid(){
  grid.innerHTML = '';
  for (const k of Object.keys(CONNECTORS)){
    const item = document.createElement('div');
    item.className = 'item';
    const t = document.createElement('div');
    t.className = 't';
    t.textContent = `${k} (mâle↓ / femelle↑)`;
    item.appendChild(t);

    const wrap = document.createElement('div');
    wrap.style.display='grid';
    wrap.style.gridTemplateColumns='1fr 1fr';
    wrap.style.gap='8px';

    const male = makeSvg({type:k, sex:'male', ori:'down', w:140, h:70, strokeW:2});
    const fem  = makeSvg({type:k, sex:'female', ori:'up', w:140, h:70, strokeW:2});

    const d1 = document.createElement('div'); d1.innerHTML = male;
    const d2 = document.createElement('div'); d2.innerHTML = fem;
    wrap.appendChild(d1); wrap.appendChild(d2);

    item.appendChild(wrap);
    grid.appendChild(item);
  }
}
renderGrid();
render();
