const { encodeWavPCM16 } = require('../src/audio/wav');

test('WAV encoder writes RIFF/WAVE header', () => {
  const samples = new Float32Array(44100);
  const buf = encodeWavPCM16(samples, 44100);
  const view = new DataView(buf);

  function read4(off){
    return String.fromCharCode(view.getUint8(off), view.getUint8(off+1), view.getUint8(off+2), view.getUint8(off+3));
  }
  expect(read4(0)).toBe('RIFF');
  expect(read4(8)).toBe('WAVE');
  expect(read4(12)).toBe('fmt ');
  expect(read4(36)).toBe('data');
});
