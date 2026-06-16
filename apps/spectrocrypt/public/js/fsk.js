(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  "use strict";

  const crc16ccitt = (typeof require === 'function')
    ? require('../core/crc16.js').crc16ccitt
    : root.SpectroCrypt.crc16ccitt;

  const goertzelPower = (typeof require === 'function')
    ? require('./goertzel.js').goertzelPower
    : root.SpectroCrypt.goertzelPower;

  function bytesToBits(bytes) {
    const bits = [];
    for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1);
    return bits;
  }

  function bitsToBytes(bits) {
    const bytes = [];
    for (let i = 0; i + 7 < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] & 1);
      bytes.push(b & 0xFF);
    }
    return new Uint8Array(bytes);
  }

  function buildFrameBytes(message) {
    const enc = new TextEncoder();
    const payload = enc.encode(message);
    if (payload.length > 255) throw new Error('Message too long (max 255 bytes UTF-8).');

    const version = 1;
    const len = payload.length & 0xFF;

    const header = new Uint8Array([version, len]);
    const crc = crc16ccitt(concatBytes(header, payload));
    const frame = concatBytes(
      // preamble: 0xAA x 8
      new Uint8Array([0xAA,0xAA,0xAA,0xAA,0xAA,0xAA,0xAA,0xAA]),
      // sync word
      new Uint8Array([0x2D, 0xD4]),
      header,
      payload,
      new Uint8Array([(crc >>> 8) & 0xFF, crc & 0xFF])
    );
    return frame;
  }

  function concatBytes(...parts) {
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }

  function repeatBits(bits, n) {
    if (n <= 1) return bits;
    const out = [];
    for (const b of bits) for (let i = 0; i < n; i++) out.push(b);
    return out;
  }

  function majorityVote(bits, n) {
    if (n <= 1) return bits;
    const out = [];
    for (let i = 0; i + (n - 1) < bits.length; i += n) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += bits[i + j] ? 1 : 0;
      out.push(sum >= Math.ceil(n / 2) ? 1 : 0);
    }
    return out;
  }

  function generateFskSamplesFromBits(bits, opts) {
    const sampleRate = opts.sampleRate || 44100;
    const symbolRate = opts.symbolRate || 40;
    const f0 = opts.f0 || 1450;
    const f1 = opts.f1 || 1750;
    const amplitude = opts.amplitude ?? 0.6;

    const symbolSamples = Math.max(8, Math.round(sampleRate / symbolRate));
    const totalSamples = symbolSamples * bits.length;
    const out = new Float32Array(totalSamples);

    // smooth transitions with short fade (avoid clicks)
    const fadeSamples = Math.max(1, Math.round(sampleRate * 0.002)); // ~2ms
    let phase = 0;

    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i] ? 1 : 0;
      const freq = bit ? f1 : f0;
      const omega = (2 * Math.PI * freq) / sampleRate;
      const base = i * symbolSamples;

      for (let n = 0; n < symbolSamples; n++) {
        let env = 1.0;
        if (n < fadeSamples) env *= (n / fadeSamples);
        if (n > symbolSamples - fadeSamples) env *= ((symbolSamples - n) / fadeSamples);
        out[base + n] = Math.sin(phase) * amplitude * env;
        phase += omega;
        if (phase > 1e9) phase %= (2 * Math.PI);
      }
    }
    return { samples: out, sampleRate, symbolSamples };
  }

  function encodeFsk(message, opts) {
    const redundancy = opts.redundancy || 1;
    const frameBytes = buildFrameBytes(message);
    let bits = bytesToBits(frameBytes);
    bits = repeatBits(bits, redundancy);
    return generateFskSamplesFromBits(bits, opts);
  }

  function findBitPattern(haystack, needle) {
    if (needle.length === 0) return -1;
    outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) continue outer;
      }
      return i;
    }
    return -1;
  }

  function decodeFsk(samples, sampleRate, opts) {
    const symbolRate = opts.symbolRate || 40;
    const f0 = opts.f0 || 1450;
    const f1 = opts.f1 || 1750;
    const redundancy = opts.redundancy || 1;

    const symbolSamples = Math.max(8, Math.round(sampleRate / symbolRate));
    const maxSymbols = Math.floor(samples.length / symbolSamples);

    // Build expected preamble+sync bit pattern
    const preamble = new Uint8Array([0xAA,0xAA,0xAA,0xAA,0xAA,0xAA,0xAA,0xAA, 0x2D, 0xD4]);
    const needleBits = bytesToBits(preamble);

    // try multiple offsets for symbol alignment
    const offsetCandidates = [];
    const step = Math.max(1, Math.floor(symbolSamples / 8));
    for (let o = 0; o < symbolSamples; o += step) offsetCandidates.push(o);

    for (const offset of offsetCandidates) {
      const bits = [];

      for (let s = 0; s < maxSymbols - 1; s++) {
        const start = offset + s * symbolSamples;
        if (start + symbolSamples > samples.length) break;
        const p0 = goertzelPower(samples, start, symbolSamples, sampleRate, f0);
        const p1 = goertzelPower(samples, start, symbolSamples, sampleRate, f1);
        bits.push(p1 > p0 ? 1 : 0);
      }

      const voted = majorityVote(bits, redundancy);
      const idx = findBitPattern(voted, needleBits);
      if (idx < 0) continue;

      const after = voted.slice(idx + needleBits.length);
      const bytes = bitsToBytes(after);
      if (bytes.length < 4) continue;

      const version = bytes[0];
      const len = bytes[1];
      if (version !== 1) continue;
      if (bytes.length < 2 + len + 2) continue;

      const payload = bytes.slice(2, 2 + len);
      const crcHi = bytes[2 + len];
      const crcLo = bytes[2 + len + 1];
      const gotCrc = ((crcHi << 8) | crcLo) & 0xFFFF;
      const calcCrc = crc16ccitt(concatBytes(new Uint8Array([version, len]), payload));

      if (gotCrc !== calcCrc) continue;

      const dec = new TextDecoder();
      return {
        ok: true,
        message: dec.decode(payload),
        params: { symbolRate, f0, f1, redundancy },
        alignmentOffset: offset
      };
    }

    return { ok: false, message: null };
  }

  function decodeFskAuto(samples, sampleRate, profiles) {
    // profiles: array of {symbolRate,f0,f1,redundancy,name?}
    let best = null;
    for (const p of profiles) {
      const res = decodeFsk(samples, sampleRate, p);
      if (res.ok) return res;
      if (!best) best = res;
    }
    return best || { ok: false, message: null };
  }

  return {
    encodeFsk,
    decodeFsk,
    decodeFskAuto,
    _internals: { buildFrameBytes, bytesToBits, bitsToBytes, repeatBits, majorityVote }
  };
});
