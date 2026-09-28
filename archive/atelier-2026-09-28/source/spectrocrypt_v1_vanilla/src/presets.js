(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  function validatePreset(p) {
    if (!p || typeof p !== 'object') throw new Error('Preset must be an object');
    if (!p.id || typeof p.id !== 'string') throw new Error('Preset.id missing');
    if (!p.name || typeof p.name !== 'string') throw new Error('Preset.name missing');
    if (!p.secret || typeof p.secret !== 'object') throw new Error('Preset.secret missing');
    if (!p.secret.mode || typeof p.secret.mode !== 'string') throw new Error('Preset.secret.mode missing');
    return true;
  }

  async function loadPresetIndex(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Failed to load preset index');
    return await r.json();
  }

  async function loadPreset(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Failed to load preset: ' + url);
    const p = await r.json();
    validatePreset(p);
    return p;
  }

  return { validatePreset, loadPresetIndex, loadPreset };
});
