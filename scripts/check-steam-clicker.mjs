import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, access, writeFile } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const root = fileURLToPath(new URL('../', import.meta.url));
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
  const path = new URL(req.url, 'http://localhost').pathname;
  const relative = path.replace(/^\/steam-clicker\//, '') || 'index.html';
  const file = resolve(root, 'apps/steam-clicker-wl', relative);
  if (!path.startsWith('/steam-clicker/') || !file.startsWith(resolve(root, 'apps/steam-clicker-wl') + '/'.replace('/', process.platform === 'win32' ? '\\' : '/'))) {
    res.writeHead(404).end(); return;
  }
  try {
    const data = await readFile(file);
    res.setHeader('Content-Type', ({'.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json'}[extname(file)] || 'text/html; charset=utf-8'));
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(artifacts, 'chrome-'));
const child = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
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
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  let loads = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Page.loadEventFired') loads++;
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    const handler = pending.get(message.id);
    if (handler) { pending.delete(message.id); clearTimeout(handler.timer);
      message.error ? handler.reject(new Error(JSON.stringify(message.error))) : handler.resolve(message.result); }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
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
    throw new Error(`Condition non remplie: ${expression}`);
  }
  async function reload() {
    const previous = loads;
    await send('Page.reload');
    for (let attempt = 0; loads === previous && attempt < 100; attempt++) await pause(50);
    assert.ok(loads > previous, 'Rechargement termine');
  }
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${origin}/steam-clicker/` });
  await waitFor('document.querySelectorAll("#shopList [data-buy]").length === 7');
  const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
  const saved = async () => { await click('saveBtn'); return evaluate('JSON.parse(localStorage.getItem("steamClickerSave"))'); };
  await click('mainGear');
  assert.ok((await saved()).steam >= 1, 'Clic produit de la vapeur');
  await click('workshopMode');
  assert.equal(await evaluate('document.getElementById("workshopView").classList.contains("hidden")'), true, 'Atelier verrouille avant 10M');
  await click('questBtn');
  await evaluate('document.querySelector("#questGrid button[data-claim-q]:not(:disabled)").click()');
  assert.ok((await saved()).questsCompleted > 0, 'Recompense de quete');
  await click('closeQuest');
  await click('achBtn');
  assert.ok(await evaluate('document.getElementById("achievementGrid").children.length > 0'));
  await click('closeAch');
  const fixture = await send('Page.addScriptToEvaluateOnNewDocument', {source: 'const seed=JSON.parse(localStorage.getItem("steamClickerSave"));seed.steam=20000000;seed.steamTotal=20000000;localStorage.setItem("steamClickerSave",JSON.stringify(seed))'});
  await reload();
  await waitFor('document.querySelectorAll("#shopList [data-buy]").length === 7');
  await send('Page.removeScriptToEvaluateOnNewDocument', {identifier: fixture.identifier});
  await evaluate('document.querySelector("#shopList [data-buy]").click()');
  assert.ok((await saved()).gears[1] >= 1, 'Achat engrenage');
  await click('workshopMode');
  assert.equal(await evaluate('getComputedStyle(document.getElementById("workshopView")).display'), 'flex');
  assert.equal((await saved()).mode, 'workshop');
  await reload();
  await waitFor('document.querySelectorAll("#shopList [data-buy]").length === 7');
  assert.equal(await evaluate('document.getElementById("workshopView").classList.contains("hidden")'), false, 'Mode restaure');
  await click('etabliMode');
  assert.equal(await evaluate('document.getElementById("gearView").classList.contains("hidden")'), false);
  assert.equal((await fetch(`${origin}/steam-clicker/favicon.svg`)).status, 200);
  const desktop = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(artifacts, 'steam-desktop.png'), Buffer.from(desktop.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Pas de debordement mobile');
  assert.ok(await evaluate('document.getElementById("mainGear").getBoundingClientRect().width > 100'), 'Manivelle accessible sur mobile');
  const mobile = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(artifacts, 'steam-mobile.png'), Buffer.from(mobile.data, 'base64'));
  assert.deepEqual(exceptions, []);
  console.log('PASS: demarrage, clic, atelier verrouille/deverrouille, achat, quete, succes, sauvegarde et mode apres rechargement, favicon, aucune exception JS.');
} finally {
  socket?.close();
  child.kill();
  server.closeAllConnections();
  server.close();
}
