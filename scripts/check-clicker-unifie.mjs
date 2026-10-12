import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, access } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const root = fileURLToPath(new URL('../', import.meta.url));
const appRoot = resolve(root, 'apps/steam-clicker-wl');
const artifacts = join(root, '.artifacts');
await mkdir(artifacts, { recursive: true });
const candidates = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
let executable;
for (const candidate of candidates) {
  try { await access(candidate); executable = candidate; break; } catch {}
}
assert.ok(executable, 'Chrome requis : renseigner CHROME_PATH');

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let relative = pathname.replace(/^\/steam-clicker\//, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const file = resolve(appRoot, relative);
  const rootPrefix = appRoot + (process.platform === 'win32' ? '\\' : '/');
  if (!pathname.startsWith('/steam-clicker/') || (file !== appRoot && !file.startsWith(rootPrefix))) {
    res.writeHead(404).end(); return;
  }
  try {
    const data = await readFile(file);
    res.setHeader('Content-Type', ({'.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json', '.mp3':'audio/mpeg'}[extname(file)] || 'text/html; charset=utf-8'));
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = await mkdtemp(join(artifacts, 'chrome-unifie-'));
const child = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
{ windowsHide: true, stdio: 'ignore' });
let childError;
child.on('error', error => { childError = error; });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (childError) throw childError;
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await pause(100); }
  }
  assert.ok(port, 'Chrome CDP indisponible');
  const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    const handler = pending.get(message.id);
    if (handler) {
      pending.delete(message.id); clearTimeout(handler.timer);
      message.error ? handler.reject(new Error(JSON.stringify(message.error))) : handler.resolve(message.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('CDP timeout: ' + method)); }, 10000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await pause(50);
    }
    throw new Error('Condition non remplie: ' + expression);
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/steam-clicker/unifie/' });
  await waitFor('document.querySelector("#gearContainer") && document.querySelector("#mainGear")');
  await evaluate("(() => { const state = JSON.parse(localStorage.getItem('steamClickerSave') || '{}'); state.gears = Object.fromEntries(Array.from({length: 7}, (_, i) => [i + 1, 3])); state.rings = Object.fromEntries(Array.from({length: 7}, (_, i) => [i + 1, 1])); state.mode = 'etabli'; localStorage.setItem('steamClickerSave', JSON.stringify(state)); })()");
  await send('Page.reload');
  await waitFor('document.querySelectorAll("#gearPyramids .pyramid-gear").length === 21');

  async function assertGearBounds(label) {
    const geometry = await evaluate("(() => { const stage = document.querySelector('#gearContainer').getBoundingClientRect(); const gears = [...document.querySelectorAll('#gearPyramids .pyramid-gear')].map(el => el.getBoundingClientRect()); const rings = [...document.querySelectorAll('#gearRings .gear-ring')].map(el => el.getBoundingClientRect()); const tolerance = 1; return {stage: {left: stage.left, top: stage.top, right: stage.right, bottom: stage.bottom}, gearBounds: {left: Math.min(...gears.map(r => r.left)), top: Math.min(...gears.map(r => r.top)), right: Math.max(...gears.map(r => r.right)), bottom: Math.max(...gears.map(r => r.bottom))}, gears: gears.length, rings: rings.length, gearsInside: gears.every(r => r.left >= stage.left - tolerance && r.right <= stage.right + tolerance && r.top >= stage.top - tolerance && r.bottom <= stage.bottom + tolerance), ringsInside: rings.every(r => r.left >= stage.left - tolerance && r.right <= stage.right + tolerance && r.top >= stage.top - tolerance && r.bottom <= stage.bottom + tolerance)}; })()");
    assert.equal(geometry.gears, 21, label + ': 21 engrenages rendus');
    assert.equal(geometry.rings, 7, label + ': 7 anneaux rendus');
    assert.ok(geometry.gearsInside, label + ': engrenages dans la scène ' + JSON.stringify(geometry));
    assert.ok(geometry.ringsInside, label + ': anneaux dans la scène ' + JSON.stringify(geometry));
  }

  await assertGearBounds('bureau');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("(() => { const stage = document.querySelector('#gearContainer'); stage.style.setProperty('width', '351px', 'important'); stage.style.setProperty('height', '351px', 'important'); stage.style.setProperty('flex', '0 0 351px', 'important'); })()");
  await pause(200);
  await waitFor('document.querySelectorAll("#gearRings .gear-ring").length === 7');
  await assertGearBounds('mobile');
  const keys = await evaluate('Object.keys(localStorage).sort()');
  assert.ok(keys.includes('steamClickerSave'), 'Sauvegarde propre à la variante');
  assert.deepEqual(exceptions, []);
  console.log('PASS: route unifiee, placement bureau/mobile, sauvegarde separee, aucune exception JavaScript.');
} finally {
  socket?.close();
  child.kill();
  server.closeAllConnections();
  server.close();
}
