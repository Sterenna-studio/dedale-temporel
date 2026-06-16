const { encodeFsk, decodeFskAuto } = require('../src/dsp/fsk');

test('FSK auto-decode finds matching profile', () => {
  const msg = 'HELLO';
  const enc = encodeFsk(msg, { sampleRate: 48000, symbolRate: 50, f0: 1500, f1: 1900, redundancy: 1, amplitude: 0.7 });

  const profiles = [
    { symbolRate: 40, f0: 1450, f1: 1750, redundancy: 3 },
    { symbolRate: 50, f0: 1500, f1: 1900, redundancy: 1 },
    { symbolRate: 40, f0: 1650, f1: 2050, redundancy: 3 },
  ];

  const res = decodeFskAuto(enc.samples, enc.sampleRate, profiles);
  expect(res.ok).toBe(true);
  expect(res.message).toBe(msg);
});
