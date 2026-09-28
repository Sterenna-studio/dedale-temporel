(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /**
   * Encode mono Float32Array [-1..1] to 16-bit PCM WAV ArrayBuffer.
   */
  function encodeWavPCM16(monoSamples, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = monoSamples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);            // PCM chunk size
    view.setUint16(20, 1, true);             // audio format PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < monoSamples.length; i++, offset += 2) {
      const s = clamp(monoSamples[i], -1, 1);
      const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, int16, true);
    }
    return buffer;
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  return { encodeWavPCM16 };
});
