(function () {
  "use strict";

  const SC = window.SpectroCrypt;

  // DOM
  const $ = (id) => document.getElementById(id);

  const tabs = {
    encrypt: $('tabEncrypt'),
    decrypt: $('tabDecrypt'),
  };
  const panels = {
    encrypt: $('panelEncrypt'),
    decrypt: $('panelDecrypt'),
  };

  function setTab(name) {
    for (const k of Object.keys(tabs)) {
      tabs[k].classList.toggle('active', k === name);
      panels[k].classList.toggle('hidden', k !== name);
    }
  }

  tabs.encrypt.addEventListener('click', () => setTab('encrypt'));
  tabs.decrypt.addEventListener('click', () => setTab('decrypt'));

  // Presets
  let presetIndex = null;
  let currentPreset = null;
  let profiles = [];

  async function loadPresets() {
    presetIndex = await SC.loadPresetIndex('./presets/index.json');
    const list = $('presetList');
    list.innerHTML = '';
    profiles = [];

    for (const item of presetIndex.presets) {
      const card = document.createElement('button');
      card.className = 'presetCard';
      card.innerHTML = `<div class="presetName">${escapeHtml(item.name)}</div>
                        <div class="presetTags">${(item.tags||[]).join(' · ')}</div>`;
      card.addEventListener('click', async () => {
        currentPreset = await SC.loadPreset(item.path);
        $('currentPreset').textContent = currentPreset.name;
        if (currentPreset.secret && currentPreset.secret.mode === 'FSK') {
          profiles.push({
            name: currentPreset.name,
            symbolRate: currentPreset.secret.symbolRate || 40,
            f0: currentPreset.secret.f0 || 1450,
            f1: currentPreset.secret.f1 || 1750,
            redundancy: currentPreset.secret.redundancy || 1
          });
        }
      });
      list.appendChild(card);
    }

    // Load first preset automatically
    if (presetIndex.presets.length) {
      currentPreset = await SC.loadPreset(presetIndex.presets[0].path);
      $('currentPreset').textContent = currentPreset.name;
    }
  }

  // Spectrogram rendering on CRT
  const canvas = $('crtCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const viewState = {
    brightness: 0,
    contrast: 1.0,
    gamma: 1.0,
    invert: false,
    zoom: 1.0,
  };

  function applyKnob(id, key, min, max, step) {
    const el = $(id);
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      viewState[key] = v;
      $('val_' + id).textContent = String(v);
      if (lastSpectro) drawSpectrogram(lastSpectro);
    });
    // init label
    $('val_' + id).textContent = el.value;
  }

  applyKnob('kBrightness', 'brightness', -1, 1, 0.05);
  applyKnob('kContrast', 'contrast', 0.2, 3, 0.05);
  applyKnob('kGamma', 'gamma', 0.2, 3, 0.05);
  $('kInvert').addEventListener('change', (e) => {
    viewState.invert = !!e.target.checked;
    if (lastSpectro) drawSpectrogram(lastSpectro);
  });

  let lastSpectro = null;

  function drawSpectrogram(spec) {
    lastSpectro = spec;
    const w = canvas.width;
    const h = canvas.height;

    const img = ctx.createImageData(w, h);
    const d = img.data;

    // map spectrogram (frames x bins) onto canvas (nearest)
    for (let y = 0; y < h; y++) {
      const bin = Math.floor((y / h) * spec.height);
      for (let x = 0; x < w; x++) {
        const frame = Math.floor((x / w) * spec.width);
        const db = spec.data[frame * spec.height + (spec.height - 1 - bin)]; // flip to show low at bottom
        let v = (db - spec.minDb) / (spec.maxDb - spec.minDb + 1e-9); // 0..1
        // post
        v = Math.pow(v, 1 / Math.max(0.001, viewState.gamma));
        v = (v - 0.5) * viewState.contrast + 0.5 + viewState.brightness;
        v = Math.max(0, Math.min(1, v));
        if (viewState.invert) v = 1 - v;

        const c = Math.floor(v * 255);
        const idx = (y * w + x) * 4;
        d[idx] = c; d[idx+1] = c; d[idx+2] = c; d[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Encrypt: generate
  $('btnGenerate').addEventListener('click', async () => {
    const msg = $('secretMessage').value || 'HELLO';
    const mode = $('secretMode').value;
    const durationSec = parseFloat($('durationSec').value || '6');
    const sampleRate = 44100;

    $('genStatus').textContent = 'Generating...';

    let carrier = new Float32Array(0);
    try {
      if (currentPreset && currentPreset.carrier) {
        const preset = JSON.parse(JSON.stringify(currentPreset));
        preset.carrier.durationSec = durationSec;
        carrier = await SC.renderCarrier(preset, sampleRate);
      }
    } catch (e) {
      console.warn('Carrier render failed:', e);
    }

    let secretSamples = new Float32Array(Math.max(carrier.length, Math.floor(durationSec * sampleRate)));
    if (mode === 'FSK') {
      const r = SC.encodeFsk(msg, {
        sampleRate,
        symbolRate: currentPreset?.secret?.symbolRate || 40,
        f0: currentPreset?.secret?.f0 || 1450,
        f1: currentPreset?.secret?.f1 || 1750,
        redundancy: currentPreset?.secret?.redundancy || 1,
        amplitude: 0.8
      });
      secretSamples = r.samples;
    } else {
      // SpectroGlyph: bitmap width derived from frames (duration)
      const windowSize = 1024, hopSize = 256;
      const frames = Math.max(64, Math.floor((durationSec * sampleRate) / hopSize));
      const bins = 256;
      const bmp = SC.renderTextToBitmap(msg, frames, bins, { font: 'bold 32px monospace' });
      const r = SC.synthFromBitmap(bmp.bitmap, bmp.width, bmp.height, {
        sampleRate, windowSize, hopSize, minHz: 500, maxHz: 9000, amplitude: 1.0
      });
      secretSamples = r.samples;

      // optional: overlay FSK lightly for auto-decode
      if ($('hybridFsk').checked) {
        const fsk = SC.encodeFsk(msg, {
          sampleRate,
          symbolRate: currentPreset?.secret?.symbolRate || 40,
          f0: currentPreset?.secret?.f0 || 1450,
          f1: currentPreset?.secret?.f1 || 1750,
          redundancy: currentPreset?.secret?.redundancy || 1,
          amplitude: 0.25
        }).samples;
        secretSamples = mix(secretSamples, fsk, 1, 1);
      }
    }

    const mixSecret = parseFloat($('secretGain').value || '0.25');
    const mixCarrier = parseFloat($('carrierGain').value || '1.0');

    const final = mix(carrier, secretSamples, mixCarrier, mixSecret);
    const wav = SC.encodeWavPCM16(final, sampleRate);
    const blob = new Blob([wav], { type: 'audio/wav' });

    // preview audio
    const url = URL.createObjectURL(blob);
    $('audioPreview').src = url;
    $('btnDownload').href = url;
    $('btnDownload').download = `spectrocrypt_${mode.toLowerCase()}.wav`;

    // spectrogram preview
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const arr = await blob.arrayBuffer();
      const buf = await ac.decodeAudioData(arr);
      const spec = SC.computeSpectrogramFromAudioBuffer(buf, { windowSize: 1024, hopSize: 256 });
      drawSpectrogram(spec);
      $('genStatus').textContent = 'Done.';
      $('metaInfo').textContent = `SR ${buf.sampleRate} Hz · ${spec.width} frames`;
      ac.close();
    } catch (e) {
      $('genStatus').textContent = 'Done (spectrogram preview failed).';
      console.warn(e);
    }
  });

  // Decrypt: file
  $('fileDecrypt').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    $('decStatus').textContent = 'Decoding...';
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const arr = await file.arrayBuffer();
    const buf = await ac.decodeAudioData(arr);
    const mono = mixdownToMono(buf);

    // spectrogram
    const spec = SC.computeSpectrogramFromAudioBuffer(buf, { windowSize: 1024, hopSize: 256 });
    drawSpectrogram(spec);

    // decode
    const res = SC.decodeFskAuto(mono, buf.sampleRate, profiles.length ? profiles : defaultProfiles());
    $('decodedMessage').textContent = res.ok ? res.message : '(not found)';
    $('decStatus').textContent = res.ok ? `OK (offset ${res.alignmentOffset})` : 'No valid frame (CRC failed or not FSK).';
    $('metaInfo').textContent = `SR ${buf.sampleRate} Hz · ${spec.width} frames`;

    ac.close();
  });

  // Decrypt: live mic
  let live = { running: false, ctx: null, stream: null, proc: null, ring: null, ringWrite: 0, analyser: null, lastMsg: null, lastDecodeAt: 0 };

  $('btnMic').addEventListener('click', async () => {
    if (live.running) {
      stopMic();
      return;
    }
    await startMic();
  });

  function defaultProfiles() {
    return [
      { name: 'FSK 40 1450/1750', symbolRate: 40, f0: 1450, f1: 1750, redundancy: 1 },
      { name: 'FSK 40 1450/1750 x3', symbolRate: 40, f0: 1450, f1: 1750, redundancy: 3 },
      { name: 'FSK 50 1500/1900', symbolRate: 50, f0: 1500, f1: 1900, redundancy: 1 }
    ];
  }

  async function startMic() {
    $('btnMic').textContent = 'Stop Mic';
    $('decStatus').textContent = 'Requesting microphone...';

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(stream);

    const analyser = ac.createAnalyser();
    analyser.fftSize = 2048;

    const proc = ac.createScriptProcessor(4096, 1, 1);
    const ringSeconds = 10;
    const ring = new Float32Array(Math.floor(ringSeconds * ac.sampleRate));
    let ringWrite = 0;

    src.connect(analyser);
    analyser.connect(proc);
    proc.connect(ac.destination); // required in some browsers, volume is zeroed by default routing

    proc.onaudioprocess = (ev) => {
      const input = ev.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        ring[ringWrite] = input[i];
        ringWrite = (ringWrite + 1) % ring.length;
      }
      live.ringWrite = ringWrite;
    };

    live = { running: true, ctx: ac, stream, proc, ring, ringWrite, analyser, lastMsg: null, lastDecodeAt: 0 };

    $('decStatus').textContent = 'Mic live. Listening...';

    // Start waterfall spectrogram draw + periodic decode
    requestAnimationFrame(drawLiveWaterfall);
    setTimeout(periodicDecode, 500);
  }

  function stopMic() {
    $('btnMic').textContent = 'Start Mic';
    $('decStatus').textContent = 'Mic stopped.';
    try {
      if (live.proc) live.proc.disconnect();
      if (live.analyser) live.analyser.disconnect();
      if (live.stream) live.stream.getTracks().forEach(t => t.stop());
      if (live.ctx) live.ctx.close();
    } catch (e) {}
    live.running = false;
  }

  function periodicDecode() {
    if (!live.running) return;
    const now = performance.now();
    if (now - live.lastDecodeAt > 900) { // ~1s
      live.lastDecodeAt = now;
      const tailSec = 6;
      const samples = readRingTail(live.ring, live.ringWrite, Math.floor(tailSec * live.ctx.sampleRate));
      const res = SC.decodeFskAuto(samples, live.ctx.sampleRate, profiles.length ? profiles : defaultProfiles());
      if (res.ok && res.message && res.message !== live.lastMsg) {
        live.lastMsg = res.message;
        $('decodedMessage').textContent = res.message;
        $('decStatus').textContent = 'Mic: OK (decoded)';
      }
    }
    setTimeout(periodicDecode, 300);
  }

  // Live waterfall: draw current FFT column into canvas
  const liveCol = new Float32Array(2048/2);
  function drawLiveWaterfall() {
    if (!live.running) return;
    const w = canvas.width, h = canvas.height;

    const freqData = new Float32Array(live.analyser.frequencyBinCount);
    live.analyser.getFloatFrequencyData(freqData);

    // scroll left by 1px
    const img = ctx.getImageData(1, 0, w - 1, h);
    ctx.putImageData(img, 0, 0);

    // draw new column at right
    for (let y = 0; y < h; y++) {
      const bin = Math.floor((y / h) * freqData.length);
      let v = (freqData[freqData.length - 1 - bin] + 120) / 120; // -120..0 => 0..1
      v = Math.max(0, Math.min(1, v));
      v = Math.pow(v, 1 / Math.max(0.001, viewState.gamma));
      v = (v - 0.5) * viewState.contrast + 0.5 + viewState.brightness;
      v = Math.max(0, Math.min(1, v));
      if (viewState.invert) v = 1 - v;
      const c = Math.floor(v * 255);
      ctx.fillStyle = `rgb(${c},${c},${c})`;
      ctx.fillRect(w - 1, y, 1, 1);
    }

    requestAnimationFrame(drawLiveWaterfall);
  }

  function mixdownToMono(buf) {
    const len = buf.length;
    const ch = buf.numberOfChannels;
    const mono = new Float32Array(len);
    if (ch === 1) mono.set(buf.getChannelData(0));
    else {
      for (let i = 0; i < len; i++) {
        let s = 0;
        for (let c = 0; c < ch; c++) s += buf.getChannelData(c)[i];
        mono[i] = s / ch;
      }
    }
    return mono;
  }

  function readRingTail(ring, writeIndex, n) {
    const out = new Float32Array(n);
    const start = (writeIndex - n + ring.length) % ring.length;
    for (let i = 0; i < n; i++) out[i] = ring[(start + i) % ring.length];
    return out;
  }

  function mix(a, b, ga, gb) {
    const n = Math.max(a.length, b.length);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const va = (i < a.length ? a[i] : 0) * ga;
      const vb = (i < b.length ? b[i] : 0) * gb;
      out[i] = va + vb;
    }
    // limiter
    let maxAbs = 1e-9;
    for (let i = 0; i < out.length; i++) maxAbs = Math.max(maxAbs, Math.abs(out[i]));
    if (maxAbs > 1) {
      const g = 0.98 / maxAbs;
      for (let i = 0; i < out.length; i++) out[i] *= g;
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  // bootstrap
  loadPresets().catch(err => {
    console.error(err);
    $('genStatus').textContent = 'Failed to load presets (run with a local server).';
  });

  setTab('encrypt');
})();
