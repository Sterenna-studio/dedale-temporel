/*
 * script.js - version complète
 *
 * Gère :
 * - chargement audio, FFT, spectrogramme
 * - réglages visuels (potards)
 * - zoom + curseur (posX/posY) avec souris rétro
 * - boutons de décodage (invert, grayscale, flipY)
 * - boutons "fun" (drop, melody, leds, spin, power, print)
 * - animation d'analyse sur le moniteur
 * - Konami code -> mode "connaissance de la machine"
 */

// État global
const state = {
  brightness: 0,
  contrast: 1.0,
  gamma: 1.0,
  invert: false,
  grayscale: false,
  flipY: false,
  zoom: 1.0,
  posX: 0.5,
  posY: 0.5,
  knowledgeMode: false,
  powerOn: true
};

let audioContext = null;
let spectrogram = null; // {data, width, height, sampleRate}
let scanning = false;
let latestBuffer = null;

// Canvas principal + offscreen
const canvas = document.getElementById("spectroCanvas");
const ctx = canvas.getContext("2d");
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");

// Elements DOM
const monitorInner = document.getElementById("monitorInner");
const monitorFrame = document.getElementById("monitorFrame");
const analysisOverlay = document.getElementById("analysisOverlay");
const machineLights = document.getElementById("machineLights");
const retroMouse = document.getElementById("retroMouse");
const overlayCorner = document.getElementById("overlayCorner");
const printButton = document.getElementById("printButton");
const knowledgePopup = document.getElementById("knowledgePopup");
const closeKnowledgePopup = document.getElementById("closeKnowledgePopup");

// AudioContext utilitaire
function getAudioContext() {
  if (!audioContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      alert("AudioContext non supporté.");
      return null;
    }
    audioContext = new AC();
  }
  return audioContext;
}

// FFT radix-2
function fftRadix2(re, im) {
  const n = re.length;
  const levels = Math.log2(n);
  if (Math.floor(levels) !== levels) throw new Error("fftRadix2: taille non puissance de 2");
  // bit-reversal
  for (let i = 0; i < n; i++) {
    let j = 0;
    for (let bit = 0; bit < levels; bit++) {
      j = (j << 1) | ((i >>> bit) & 1);
    }
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Cooley-Tukey
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >>> 1;
    const theta = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) {
      for (let j = 0; j < half; j++) {
        const k = i + j;
        const l = k + half;
        const cos = Math.cos(theta * j);
        const sin = Math.sin(theta * j);
        const xr = re[l];
        const xi = im[l];
        const tr = cos * xr - sin * xi;
        const ti = sin * xr + cos * xi;
        re[l] = re[k] - tr;
        im[l] = im[k] - ti;
        re[k] += tr;
        im[k] += ti;
      }
    }
  }
}

// Calcul du spectrogramme (sans pondération d'amplitude)
function computeSpectrogram(buffer) {
  let sr = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const length = buffer.length;

  // mono
  let mono = new Float32Array(length);
  if (channels === 1) {
    mono.set(buffer.getChannelData(0));
  } else {
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) sum += buffer.getChannelData(ch)[i];
      mono[i] = sum / channels;
    }
  }

  // downsample vers ~22050Hz
  const targetSr = 22050;
  if (sr > targetSr * 1.5) {
    const step = Math.floor(sr / targetSr);
    const newLen = Math.floor(length / step);
    const down = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) down[i] = mono[i * step];
    mono = down;
    sr = sr / step;
  }

  // STFT
  const windowSize = 1024;
  const hopSize = 256;
  const numFrames = Math.floor((mono.length - windowSize) / hopSize) + 1;
  const numBins = windowSize / 2;
  const width = numFrames;
  const height = numBins;
  const data = new Float32Array(width * height);

  // Hann
  const win = new Float32Array(windowSize);
  for (let n = 0; n < windowSize; n++) {
    win[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (windowSize - 1)));
  }
  const re = new Float32Array(windowSize);
  const im = new Float32Array(windowSize);

  let min = Infinity;
  let max = -Infinity;

  for (let frame = 0; frame < numFrames; frame++) {
    const offset = frame * hopSize;
    for (let i = 0; i < windowSize; i++) {
      re[i] = mono[offset + i] * win[i];
      im[i] = 0;
    }
    fftRadix2(re, im);
    for (let b = 0; b < numBins; b++) {
      const xr = re[b];
      const xi = im[b];
      const mag = Math.sqrt(xr * xr + xi * xi);
      const val = Math.log10(mag + 1e-12);
      const idx = b * width + frame;
      data[idx] = val;
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }

  const range = max - min || 1;
  for (let i = 0; i < data.length; i++) {
    data[i] = (data[i] - min) / range;
  }

  return { data, width, height, sampleRate: sr };
}

// Rendu du spectrogramme
function render() {
  const viewW = 480;
  const viewH = 270;

  canvas.width = viewW;
  canvas.height = viewH;

  ctx.clearRect(0, 0, viewW, viewH);

  // Moniteur éteint
  if (!state.powerOn) {
    ctx.fillStyle = "#020806";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = "rgba(0, 40, 0, 0.6)";
    ctx.font = '12px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("MONITEUR ÉTEINT", viewW / 2, viewH / 2);
    return;
  }

  if (!spectrogram) {
    ctx.fillStyle = "#082015";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = "rgba(180, 240, 210, 0.8)";
    ctx.font = '12px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("Charge un fichier audio pour commencer.", viewW / 2, viewH / 2);
    return;
  }

  const { data, width, height } = spectrogram;

  // Prépare offscreen image
  offCanvas.width = width;
  offCanvas.height = height;
  const imgData = offCtx.createImageData(width, height);
  const d = imgData.data;
  const brightness = state.brightness / 100;
  const contrast = state.contrast;
  const gamma = state.gamma;
  const invert = state.invert;
  const gray = state.grayscale;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let c = data[idx];

      // brightness
      c += brightness;
      // contrast
      c = (c - 0.5) * contrast + 0.5;
      // gamma
      const ig = 1 / (gamma || 1);
      c = c < 0 ? 0 : c > 1 ? 1 : Math.pow(c, ig);

      if (invert) c = 1 - c;
      c = c < 0 ? 0 : c > 1 ? 1 : c;

      let r, g, b;
      if (gray) {
        r = g = b = c;
      } else {
        // teinte verte/émeraude
        r = c * 0.4;
        g = c * 1.0;
        b = c * 0.7;
      }

      const i4 = idx * 4;
      d[i4] = Math.round(r * 255);
      d[i4 + 1] = Math.round(g * 255);
      d[i4 + 2] = Math.round(b * 255);
      d[i4 + 3] = 255;
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // Zoom + pan
  const zoom = state.zoom;
  const posX = state.posX - 0.5; // -0.5 .. 0.5
  const posY = state.posY - 0.5;

  ctx.save();

  // flip Y (fréquences inversées)
  if (state.flipY) {
    ctx.translate(0, viewH);
    ctx.scale(1, -1);
  }

  // Translate + scale
  ctx.translate(viewW / 2 - posX * viewW, viewH / 2 - posY * viewH);
  ctx.scale(zoom, zoom);
  ctx.drawImage(offCanvas, -width / 2, -height / 2);
  ctx.restore();
}

// Potards (molette + slider invisible)
function initKnob(knobId, inputId, stateProp, min, max, mapper) {
  const knob = document.getElementById(knobId);
  const pointer = knob.querySelector(".pointer");
  const input = document.getElementById(inputId);

  function updatePointer(val) {
    const v = parseFloat(val);
    const angle = ((v - min) / (max - min)) * 270 - 135;
    pointer.style.transform = `rotate(${angle}deg)`;

    if (mapper) {
      mapper(v);
    }

    if (!scanning) render();
  }

  // init
  updatePointer(input.value);

  input.addEventListener("input", (e) => {
    updatePointer(e.target.value);
  });

  knob.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const step = 2;
    let val = parseFloat(input.value);
    val += delta * step;
    if (val < min) val = min;
    if (val > max) val = max;
    input.value = val;
    updatePointer(val);
  });
}

// Mise à jour de la souris rétro
function updateRetroMouse() {
  if (!retroMouse) return;
  const frame = document.querySelector(".monitor-screen-frame");
  if (!frame) return;
  const rect = frame.getBoundingClientRect();

  const x = state.posX * rect.width;
  const y = state.posY * rect.height;

  retroMouse.style.left = `${x - 5}px`;
  retroMouse.style.top = `${y - 7}px`;
}

// Légende (checkbox non cliquables)
function updateLegend() {
  const invertEl = document.getElementById("legendInvert");
  const grayEl = document.getElementById("legendGrayscale");
  const flipEl = document.getElementById("legendFlipY");
  if (invertEl) invertEl.checked = !!state.invert;
  if (grayEl) grayEl.checked = !!state.grayscale;
  if (flipEl) flipEl.checked = !!state.flipY;
}

// Boutons de décodage (invert, grayscale, flipY)
function setupToggleBtn(id, prop) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener("click", () => {
    state[prop] = !state[prop];
    btn.classList.toggle("active", state[prop]);
    updateLegend();
    if (!scanning) render();
  });
}

// Boutons fun
function initFunButtons() {
  const panel = document.getElementById("funButtons");
  if (!panel) return;
  let dropCounter = 0;

  panel.querySelectorAll(".fun-btn").forEach((btn) => {
    const fun = btn.dataset.fun;
    btn.addEventListener("click", () => {
      btn.classList.add("active");
      setTimeout(() => btn.classList.remove("active"), 200);

      switch (fun) {
        case "drop":
          dropCounter++;
          if (dropCounter >= 3) {
            panel.classList.add("falling");
          }
          break;

        case "melody":
          playMelody();
          break;

        case "leds":
          toggleLeds();
          break;

        case "spin":
          toggleSpin();
          break;

        case "power":
          togglePower();
          break;

        case "print":
          triggerPrint();
          break;
      }
    });
  });
}

// Mélodie simple
function playMelody() {
  const ac = getAudioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ac.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.3);
}

// LEDs fun
function toggleLeds() {
  if (!machineLights) return;
  machineLights.classList.toggle("led-active");
}

// SPIN moniteur
function toggleSpin() {
  if (!monitorFrame) return;
  monitorFrame.classList.toggle("spin");
}

// POWER moniteur
function togglePower() {
  state.powerOn = !state.powerOn;
  if (monitorInner) {
    monitorInner.classList.toggle("off", !state.powerOn);
  }
  render();
}

// Impression : anim + export JPG
function triggerPrint() {
  if (!spectrogram || !state.powerOn) return;

  // Capture du canvas
  const dataURL = canvas.toDataURL("image/jpeg", 0.9);

  // Animation papier
  const slot = document.querySelector(".print-slot");
  if (slot) {
    const img = document.createElement("img");
    img.src = dataURL;
    img.className = "print-paper";
    slot.appendChild(img);
    img.addEventListener("animationend", () => {
      slot.removeChild(img);
    });
  }

  // Téléchargement
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "spectrogram_print.jpg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* Gestion fichier audio */

document.getElementById("fileInput").addEventListener("change", function (evt) {
  const file = evt.target.files[0];
  const fileInfo = document.getElementById("fileInfo");
  if (!file) {
    fileInfo.textContent = "(aucun fichier chargé)";
    spectrogram = null;
    render();
    return;
  }
  fileInfo.textContent = `${file.name} (${Math.round(file.size / 1024)} Ko)`;

  const reader = new FileReader();
  reader.onload = function (e) {
    const arrayBuffer = e.target.result;
    const ac = getAudioContext();
    if (!ac) return;

    scanning = true;
    if (analysisOverlay) analysisOverlay.classList.remove("hidden");

    ac.decodeAudioData(arrayBuffer)
      .then((buffer) => {
        latestBuffer = buffer;
        setTimeout(() => {
          spectrogram = computeSpectrogram(buffer);
          scanning = false;
          if (analysisOverlay) analysisOverlay.classList.add("hidden");
          render();
          if (overlayCorner && spectrogram) {
            overlayCorner.textContent = `SR: ${spectrogram.sampleRate} Hz • Frames: ${spectrogram.width}`;
          }
        }, 2000);
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors du décodage audio.");
        scanning = false;
        if (analysisOverlay) analysisOverlay.classList.add("hidden");
      });
  };
  reader.readAsArrayBuffer(file);
});

/* Konami code => connaissance de la machine */

const konamiSequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyA",
  "KeyB"
];
let konamiPosition = 0;

window.addEventListener("keydown", (e) => {
  const key = e.code;
  if (key === konamiSequence[konamiPosition]) {
    konamiPosition++;
    if (konamiPosition === konamiSequence.length) {
      konamiPosition = 0;
      unlockKnowledge();
    }
  } else {
    konamiPosition = 0;
  }
});

function unlockKnowledge() {
  if (state.knowledgeMode) return;
  state.knowledgeMode = true;
  document.body.classList.add("knowledge-mode");
  if (knowledgePopup) knowledgePopup.classList.remove("hidden");
}

if (closeKnowledgePopup) {
  closeKnowledgePopup.addEventListener("click", () => {
    if (knowledgePopup) knowledgePopup.classList.add("hidden");
  });
}

/* Initialisation globale */

window.addEventListener("DOMContentLoaded", () => {
  // Potards
  initKnob("brightnessKnob", "brightness", "brightness", -100, 100, (v) => {
    state.brightness = v;
  });
  initKnob("contrastKnob", "contrast", "contrast", 50, 250, (v) => {
    state.contrast = v / 100;
  });
  initKnob("gammaKnob", "gamma", "gamma", 50, 250, (v) => {
    state.gamma = v / 100;
  });
  initKnob("zoomKnob", "zoom", "zoom", 50, 250, (v) => {
    state.zoom = v / 100; // 0.5 à 2.5
  });
  initKnob("posXKnob", "posX", "posX", 0, 100, (v) => {
    state.posX = v / 100;
    updateRetroMouse();
  });
  initKnob("posYKnob", "posY", "posY", 0, 100, (v) => {
    state.posY = v / 100;
    updateRetroMouse();
  });

  // Boutons de décodage
  setupToggleBtn("btnInvert", "invert");
  setupToggleBtn("btnGrayscale", "grayscale");
  setupToggleBtn("btnFlipY", "flipY");

  // Sync légende initiale
  updateLegend();

  // Bouton print principal
  if (printButton) {
    printButton.addEventListener("click", triggerPrint);
  }

  // Boutons fun
  initFunButtons();

  // Premier rendu
  render();
  updateRetroMouse();
});
