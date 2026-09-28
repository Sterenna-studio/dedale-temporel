const { synthFromBitmap } = require('../src/dsp/spectroglyph');

test('SpectroGlyph synth produces bounded non-zero audio', () => {
  const width = 64, height = 64;
  const bm = new Float32Array(width * height);
  for (let x = 0; x < width; x++) {
    const y = x % height;
    bm[y * width + x] = 1.0; // diagonal
  }
  const r = synthFromBitmap(bm, width, height, { sampleRate: 44100, windowSize: 512, hopSize: 128, minHz: 500, maxHz: 5000, amplitude: 1.0 });
  let maxAbs = 0;
  let sumAbs = 0;
  for (let i = 0; i < r.samples.length; i++) {
    const a = Math.abs(r.samples[i]);
    sumAbs += a;
    if (a > maxAbs) maxAbs = a;
  }
  expect(maxAbs).toBeLessThanOrEqual(1.0);
  expect(sumAbs).toBeGreaterThan(0.5);
});
