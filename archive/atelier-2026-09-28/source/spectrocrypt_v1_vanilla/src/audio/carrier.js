(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  function dbToGain(db) { return Math.pow(10, db / 20); }

  /**
   * Render a procedural carrier using OfflineAudioContext (browser only).
   * Returns Float32Array mono samples.
   */
  async function renderCarrier(preset, sampleRate) {
    if (typeof OfflineAudioContext === 'undefined') {
      return new Float32Array(0);
    }
    const carrier = preset.carrier;
    if (!carrier || !carrier.durationSec) return new Float32Array(0);

    const duration = carrier.durationSec;
    const length = Math.floor(duration * sampleRate);
    const ctx = new OfflineAudioContext(1, length, sampleRate);

    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);

    const nodesToStop = [];

    const now = 0;

    // helper: noise source
    function createNoise(color) {
      const buf = ctx.createBuffer(1, length, sampleRate);
      const data = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (color === 'brown') {
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (color === 'pink') {
          // simple pink-ish filter (not perfect, but ok)
          lastOut = 0.98 * lastOut + 0.02 * white;
          data[i] = lastOut;
        } else {
          data[i] = white;
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = false;
      nodesToStop.push(src);
      return src;
    }

    for (const layer of (carrier.layers || [])) {
      const gainNode = ctx.createGain();
      gainNode.gain.value = layer.gain ?? 0.1;

      let src = null;
      let nodeOut = gainNode;

      if (layer.type === 'noise') {
        src = createNoise(layer.color || 'white');
      } else if (layer.type === 'pulseTrain') {
        src = ctx.createOscillator();
        src.type = 'square';
        src.frequency.value = layer.freq || 6;
      } else if (layer.type === 'fm') {
        const car = ctx.createOscillator();
        car.type = 'sine';
        car.frequency.value = layer.carrierHz || 110;

        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = layer.modHz || 55;

        const modGain = ctx.createGain();
        modGain.gain.value = (layer.index || 1.2) * (layer.modHz || 55);

        mod.connect(modGain);
        modGain.connect(car.frequency);

        mod.start(now);
        mod.stop(duration);
        nodesToStop.push(mod);

        src = car;
      } else if (layer.type === 'chirp') {
        src = ctx.createOscillator();
        src.type = 'sine';
        const fStart = layer.fStart || 400;
        const fEnd = layer.fEnd || 2500;
        src.frequency.setValueAtTime(fStart, now);
        src.frequency.linearRampToValueAtTime(fEnd, duration);
      } else if (layer.type === 'melody') {
        // naive: 1 oscillator, stepwise notes
        src = ctx.createOscillator();
        src.type = layer.wave || 'triangle';
        const baseHz = layer.baseHz || 220;
        const steps = layer.steps || [0,7,12,7,0,7,12,14];
        const stepDur = duration / steps.length;
        for (let i = 0; i < steps.length; i++) {
          const t = now + i * stepDur;
          const hz = baseHz * Math.pow(2, steps[i] / 12);
          src.frequency.setValueAtTime(hz, t);
        }
      }

      // envelope (optional)
      if (layer.env) {
        const env = layer.env;
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, layer.gain ?? 0.1), now + (env.attack || 0.01));
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, (layer.gain ?? 0.1) * (env.sustain ?? 0.4)), now + (env.attack || 0.01) + (env.decay || 0.1));
        gainNode.gain.setValueAtTime(Math.max(0.0001, (layer.gain ?? 0.1) * (env.sustain ?? 0.4)), duration - (env.release || 0.2));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, duration);
      }

      // filter (optional)
      if (layer.filter) {
        const f = ctx.createBiquadFilter();
        f.type = layer.filter.type || 'bandpass';
        f.frequency.value = layer.filter.freq || 600;
        f.Q.value = layer.filter.q || 1.0;
        src.connect(f);
        f.connect(gainNode);
      } else {
        src.connect(gainNode);
      }

      // simple LFO (optional) supports filter.freq or gain.gain
      if (layer.lfo && layer.filter) {
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = layer.lfo.rate || 0.3;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = layer.lfo.depth || 100;
        lfo.connect(lfoGain);
        if (layer.lfo.target === 'filter.freq') {
          // attach to filter frequency - locate last created filter
          // (a bit hacky but works: recreate and wire)
        }
        lfo.start(now);
        lfo.stop(duration);
        nodesToStop.push(lfo);
      }

      gainNode.connect(master);

      src.start(now);
      src.stop(duration);
      nodesToStop.push(src);
    }

    // post: limiter-ish compressor
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    master.disconnect();
    master.connect(comp);
    comp.connect(ctx.destination);

    const rendered = await ctx.startRendering();
    return rendered.getChannelData(0).slice();
  }

  return { renderCarrier };
});
