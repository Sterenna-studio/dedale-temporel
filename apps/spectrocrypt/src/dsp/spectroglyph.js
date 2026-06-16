(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  function hann(n) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    return w;
  }

  /**
   * Synthesize audio from a bitmap (height bins x width frames).
   * bitmap is Float32Array(width*height) in row-major [y*width + x], values 0..1.
   */
  function synthFromBitmap(bitmap, width, height, opts) {
    const sampleRate = opts.sampleRate || 44100;
    const windowSize = opts.windowSize || 1024;
    const hopSize = opts.hopSize || 256;

    const minHz = opts.minHz || 400;
    const maxHz = opts.maxHz || 8000;
    const amplitude = opts.amplitude ?? 0.9;

    const frames = width;
    const totalSamples = (frames - 1) * hopSize + windowSize;
    const out = new Float32Array(totalSamples);
    const win = hann(windowSize);

    // deterministic phases for bins
    const phases = new Float32Array(height);
    for (let y = 0; y < height; y++) phases[y] = (y * 0.12345) % (2 * Math.PI);

    for (let x = 0; x < frames; x++) {
      const frameStart = x * hopSize;
      // build per-bin magnitudes for this frame (0..1)
      // map y=0 low freq, y=height-1 high freq
      for (let n = 0; n < windowSize; n++) {
        let sample = 0;
        const t = n / sampleRate;
        for (let y = 0; y < height; y++) {
          const mag = bitmap[y * width + x];
          if (mag <= 0.0001) continue;
          const frac = y / (height - 1);
          const freq = minHz + (maxHz - minHz) * frac;
          sample += Math.sin(2 * Math.PI * freq * t + phases[y]) * mag;
        }
        // normalize by active bins count-ish (rough)
        sample *= amplitude / Math.sqrt(height);
        out[frameStart + n] += sample * win[n];
      }
    }

    // normalize + limiter
    let maxAbs = 1e-9;
    for (let i = 0; i < out.length; i++) maxAbs = Math.max(maxAbs, Math.abs(out[i]));
    const g = maxAbs > 0 ? (0.95 / maxAbs) : 1;
    for (let i = 0; i < out.length; i++) out[i] *= g;

    return { samples: out, sampleRate, windowSize, hopSize };
  }

  /**
   * Render text to bitmap using Canvas (browser). For Node, supply your own bitmap.
   * Returns {bitmap,width,height}
   */
  function renderTextToBitmap(text, width, height, opts) {
    const font = (opts && opts.font) || 'bold 22px monospace';
    const padding = (opts && opts.padding) ?? 6;

    if (typeof document === 'undefined') {
      // Node fallback: simple diagonal pattern + text hash
      const bm = new Float32Array(width * height);
      const seed = hashString(text);
      for (let x = 0; x < width; x++) {
        const y = (x + seed) % height;
        bm[y * width + x] = 1;
      }
      return { bitmap: bm, width, height };
    }

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = 'white';
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // multiline support
    const lines = String(text).split('\n').slice(0, 4);
    const lineH = Math.max(10, Math.floor((height - 2*padding) / lines.length));
    for (let i = 0; i < lines.length; i++) {
      const y = padding + i * lineH + Math.floor(lineH/2);
      ctx.fillText(lines[i], Math.floor(width/2), y);
    }

    const img = ctx.getImageData(0,0,width,height).data;
    const bm = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const v = img[idx]; // red channel
        bm[y * width + x] = v / 255;
      }
    }
    return { bitmap: bm, width, height };
  }

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h >>> 0;
  }

  return { synthFromBitmap, renderTextToBitmap };
});
