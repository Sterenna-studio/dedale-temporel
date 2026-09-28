(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  function hannWindow(n) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    return w;
  }

  // Radix-2 FFT (in-place) adapted from user's existing project
  function fftRadix2(re, im) {
    const n = re.length;
    const levels = Math.log2(n);
    if (Math.floor(levels) !== levels) throw new Error('fftRadix2: size must be power of 2');

    // bit reversal
    for (let i = 0; i < n; i++) {
      let j = 0;
      for (let bit = 0; bit < levels; bit++) j = (j << 1) | ((i >>> bit) & 1);
      if (j > i) {
        const tr = re[i]; re[i] = re[j]; re[j] = tr;
        const ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }

    // Cooley-Tukey
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >>> 1;
      const tableStep = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += tableStep) {
          const l = j + half;
          const angle = (-2 * Math.PI * k) / n;
          const wr = Math.cos(angle);
          const wi = Math.sin(angle);
          const tr = wr * re[l] - wi * im[l];
          const ti = wr * im[l] + wi * re[l];
          re[l] = re[j] - tr;
          im[l] = im[j] - ti;
          re[j] = re[j] + tr;
          im[j] = im[j] + ti;
        }
      }
    }
  }

  /**
   * Compute spectrogram (magnitude, log-scaled) for Float32Array mono samples.
   * Returns: { width, height, sampleRate, data(Float32Array), maxDb, minDb }
   */
  function computeSpectrogramFromSamples(samples, sampleRate, opts) {
    const windowSize = (opts && opts.windowSize) || 1024;
    const hopSize = (opts && opts.hopSize) || 256;

    const win = hannWindow(windowSize);
    const height = windowSize / 2;
    const frames = Math.max(0, Math.floor((samples.length - windowSize) / hopSize) + 1);
    const data = new Float32Array(frames * height);

    let minDb = Infinity;
    let maxDb = -Infinity;

    const re = new Float32Array(windowSize);
    const im = new Float32Array(windowSize);

    for (let frame = 0; frame < frames; frame++) {
      const start = frame * hopSize;

      for (let i = 0; i < windowSize; i++) {
        re[i] = (samples[start + i] || 0) * win[i];
        im[i] = 0;
      }

      fftRadix2(re, im);

      for (let k = 0; k < height; k++) {
        const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) + 1e-12;
        const db = 20 * Math.log10(mag);
        data[frame * height + k] = db;
        if (db < minDb) minDb = db;
        if (db > maxDb) maxDb = db;
      }
    }

    return { width: frames, height, sampleRate, data, minDb, maxDb, windowSize, hopSize };
  }

  /**
   * Convenience: AudioBuffer -> spectrogram (mono mixdown).
   */
  function computeSpectrogramFromAudioBuffer(audioBuffer, opts) {
    const sr = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const channels = audioBuffer.numberOfChannels;
    const mono = new Float32Array(length);
    if (channels === 1) mono.set(audioBuffer.getChannelData(0));
    else {
      for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let ch = 0; ch < channels; ch++) sum += audioBuffer.getChannelData(ch)[i];
        mono[i] = sum / channels;
      }
    }
    return computeSpectrogramFromSamples(mono, sr, opts);
  }

  return { computeSpectrogramFromSamples, computeSpectrogramFromAudioBuffer, fftRadix2 };
});
