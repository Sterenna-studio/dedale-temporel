# SpectroCrypt

Web app **(vanilla JS, no build)** to **encrypt** hidden messages into audio and **decrypt** them back — with a CRT-style **spectrogram** view.

## Features

- **Encrypt**
  - **SpectroGlyph**: embeds the message as a visible “glyph” in the spectrogram (show mode).
  - **FSK**: robust binary transmission (auto-decodable), includes CRC-16 validation.
  - Optional **Hybrid**: SpectroGlyph + a light FSK layer for auto-decode.
- **Decrypt**
  - **From file** (WAV/MP3)
  - **Live microphone mode** (continuous listening)
- **Preset Packs**
  - Machine / Animal / Melodic / Glitch (procedural carriers + secret profile)
- **Export**
  - Generates and downloads a **WAV (PCM16)**

## Run locally

From repo root:

```bash
npm install
npm run serve
```

Then open:

```text
http://localhost:8000/public/
```

> Note: presets are loaded via `fetch()`, so opening `index.html` via `file://` may fail. Use a local server.

## Deploy to sterenna.fr

Upload the **contents of `public/`** to:

```text
sterenna.fr/spectrocrypt/
```

So that `index.html` is reachable at:

```text
https://sterenna.fr/spectrocrypt/
```

Microphone mode requires **HTTPS** (OK on sterenna.fr).

## Tests + Coverage

```bash
npm test
npm run coverage
```

Coverage output is generated in `coverage/`.

## Git push (quick)

```bash
git init
git add .
git commit -m "Initial SpectroCrypt release"
git branch -M main
git remote add origin https://github.com/<YOU>/<REPO>.git
git push -u origin main
```

## Notes / Limitations (V1)

- Preset carriers are rendered with **OfflineAudioContext** (browser-side).
- Live decode is FSK-focused (most robust); SpectroGlyph is primarily a “visual reveal”.
- For best live results: keep speaker volume high and avoid strong echo cancellation.

## Instructables angle (suggestion)

- Demo: generate WAV → play on speaker → decrypt live with mic.
- “Visualize it”: sound → spectrogram patterns + hidden message reveal.
