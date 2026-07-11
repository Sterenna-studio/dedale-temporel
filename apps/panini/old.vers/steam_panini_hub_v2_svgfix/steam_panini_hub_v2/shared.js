/*
 * Shared helpers for the STEAM Panini hub and pages.
 *
 * This file centralises mission loading, asset URL handling and persistence
 * of the user's state. It is loaded by index.html, poster.html and
 * panini.html so they all operate on the same storage and data model.
 */

// Determine the base path where assets are served. When hosted on OVH
// the files live under /base/panini/, but when opened from file:// or a
// subdirectory the path may differ. We attempt to detect the folder
// containing this file and assume that folder as the base for assets.
function detectBase() {
  // If location.pathname includes /base/panini/ then we know the root.
  const match = location.pathname.match(/^(.*\/base\/panini\/)/);
  if (match) return match[1];
  // Otherwise derive from the current script's directory.
  const parts = location.pathname.split('/');
  parts.pop();
  return parts.join('/') + '/';
}

const BASE_PATH = detectBase();

// Encode each segment of a relative path to produce a safe URL. This is
// important because some mission filenames contain spaces or parentheses,
// which must be percent‑encoded for browsers to resolve correctly.
function encodePath(rel) {
  const clean = String(rel || '').replace(/^\//, '');
  return clean
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

// Build a full URL for a given asset relative to the base path.
function assetUrl(rel) {
  return BASE_PATH + encodePath(rel);
}

// Load mission definitions from missions.json. If fetching fails (for
// example when running from file://), fall back to a script tag with
// id="missions-data" that contains the JSON directly. Returns a
// Promise that resolves to an array of mission objects.
async function loadMissions() {
  const url = assetUrl('missions/missions.json');
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    const json = await res.json();
    // Convert image and back properties into full URLs.
    json.forEach(m => {
      if (m.image) m.imageUrl = assetUrl(m.image);
      if (m.back) m.backUrl = assetUrl('missions/back/' + m.back + '.png');
    });
    return json;
  } catch (err) {
    // Fallback: look for inline JSON in a script tag.
    const script = document.getElementById('missions-data');
    if (script) {
      try {
        const json = JSON.parse(script.textContent.trim());
        json.forEach(m => {
          if (m.image) m.imageUrl = assetUrl(m.image);
          if (m.back) m.backUrl = assetUrl('missions/back/' + m.back + '.png');
        });
        return json;
      } catch (e) {}
    }
    console.error('Failed to load missions.json from', url, err);
    return [];
  }
}

// State persistence. We store a single object under the key
// 'steam_state'. This object holds:
// {
//   name: string,          // agent name
//   unlocked: [id,...],    // list of mission ids the user has unlocked
//   posterAssignments: {}, // mapping slot index -> mission id on poster page
//   paniniAssignments: {}  // mapping slot index -> mission id on panini page
// }

function loadState() {
  try {
    const json = localStorage.getItem('steam_state');
    if (!json) return { name: '', unlocked: [], posterAssignments: {}, paniniAssignments: {} };
    const obj = JSON.parse(json);
    // Provide defaults for missing fields.
    return Object.assign({ name: '', unlocked: [], posterAssignments: {}, paniniAssignments: {} }, obj);
  } catch (e) {
    return { name: '', unlocked: [], posterAssignments: {}, paniniAssignments: {} };
  }
}

function saveState(state) {
  localStorage.setItem('steam_state', JSON.stringify(state));
}

// Unlock a mission given its ID. Returns the mission object if
// successful, or null if not found or already unlocked.
function unlockMission(id, missions, state) {
  const code = String(id || '').trim().toUpperCase();
  if (!code) return null;
  const mission = missions.find(m => m.id.toUpperCase() === code);
  if (!mission) return null;
  if (!state.unlocked.includes(code)) {
    state.unlocked.push(code);
    saveState(state);
  }
  return mission;
}

// Given an image element and a relative path, attempt to load the
// corresponding image. It first uses the encoded URL; if that fails,
// it retries with the raw (unencoded) path. Optionally tries other
// extensions if none is found. If all fail, it falls back to a
// placeholder image.
function tryImageWithFallbacks(imgEl, relPath, opts = {}) {
  const baseRel = String(relPath || '').replace(/^\//, '');
  const encoded = assetUrl(baseRel);
  const raw = BASE_PATH + baseRel;
  const exts = opts.tryExts || ['.png', '.jpg', '.jpeg', '.webp', '.PNG', '.JPG', '.JPEG', '.WEBP'];
  let triedRaw = false;
  let variantIdx = 0;
  function swapExt(p, newExt) {
    return p.replace(/\.[^.]+$/, newExt);
  }
  function nextVariant() {
    if (variantIdx >= exts.length) {
      imgEl.onerror = null;
      imgEl.src = opts.placeholder || assetUrl('assets/steam-logo.png');
      return;
    }
    const ext = exts[variantIdx++];
    imgEl.onerror = nextVariant;
    imgEl.src = assetUrl(swapExt(baseRel, ext));
  }
  imgEl.onerror = () => {
    if (!triedRaw) {
      triedRaw = true;
      imgEl.onerror = nextVariant;
      imgEl.src = raw;
    } else {
      nextVariant();
    }
  };
  imgEl.src = encoded;
}