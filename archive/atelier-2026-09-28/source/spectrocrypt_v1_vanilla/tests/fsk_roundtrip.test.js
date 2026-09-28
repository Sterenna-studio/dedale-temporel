const { encodeFsk, decodeFsk } = require('../src/dsp/fsk');

test('FSK encode -> decode roundtrip', () => {
  const msg = 'CODE-STEAM-42';
  const enc = encodeFsk(msg, { sampleRate: 44100, symbolRate: 40, f0: 1450, f1: 1750, redundancy: 3, amplitude: 0.8 });
  const res = decodeFsk(enc.samples, enc.sampleRate, { symbolRate: 40, f0: 1450, f1: 1750, redundancy: 3 });
  expect(res.ok).toBe(true);
  expect(res.message).toBe(msg);
});
