const { crc16ccitt } = require('../src/core/crc16');

test('CRC16-CCITT-FALSE known vector', () => {
  const bytes = new TextEncoder().encode('123456789');
  expect(crc16ccitt(bytes)).toBe(0x29B1);
});
