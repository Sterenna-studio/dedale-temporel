(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  /**
   * Goertzel energy at target frequency for a block of samples.
   * Returns power estimate (higher = more energy).
   */
  function goertzelPower(samples, start, length, sampleRate, targetHz) {
    const k = Math.round(0.5 + (length * targetHz) / sampleRate);
    const w = (2 * Math.PI * k) / length;
    const cosine = Math.cos(w);
    const sine = Math.sin(w);
    const coeff = 2 * cosine;

    let q0 = 0, q1 = 0, q2 = 0;
    const end = start + length;
    for (let i = start; i < end; i++) {
      q0 = coeff * q1 - q2 + samples[i];
      q2 = q1;
      q1 = q0;
    }
    const real = q1 - q2 * cosine;
    const imag = q2 * sine;
    return real * real + imag * imag;
  }

  return { goertzelPower };
});
