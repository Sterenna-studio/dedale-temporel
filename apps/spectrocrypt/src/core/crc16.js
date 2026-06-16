(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else {
    root.SpectroCrypt = root.SpectroCrypt || {};
    Object.assign(root.SpectroCrypt, factory(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  /**
   * CRC-16/CCITT-FALSE
   * poly 0x1021, init 0xFFFF, xorout 0x0000, refin=false, refout=false
   */
  function crc16ccitt(bytes) {
    let crc = 0xFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc ^= (bytes[i] & 0xFF) << 8;
      for (let b = 0; b < 8; b++) {
        if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        else crc = (crc << 1) & 0xFFFF;
      }
    }
    return crc & 0xFFFF;
  }

  return { crc16ccitt };
});
