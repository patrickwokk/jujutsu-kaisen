# Jujutsu Kaisen Hand Sign Detector

A real-time, browser-based Jujutsu Kaisen hand sign recognition app. Point your webcam at your hands, form a cursed technique seal from the series, and the app identifies it instantly — hold a Domain Expansion seal to expand your domain.

## What This Project Does

The app uses two technologies working in tandem:
1. **MediaPipe Hands** — tracks landmarks on both hands in real time via webcam (skeleton overlay)
2. **Roboflow inferencejs** — loads the trained JJK hand sign model directly into the browser and classifies the sign locally on the user's device

Because inferencejs runs the model client-side (TensorFlow.js in a web worker), there are no API calls made per detection. The Roboflow publishable key is only used once on page load to pull down the model weights. After that, everything runs on the visitor's machine — no account or key entry needed.

## Tech Stack

- **MediaPipe Hands** (via CDN) — real-time two-hand landmark detection and skeleton overlay
- **Roboflow inferencejs 1.2.3** (via CDN) — in-browser model inference (`InferenceEngine` + `CVImage`; the bundle is self-contained, TF.js included)
- **Roboflow model** — `jujutsu-kaisen-hand-signs/1` (99.5% mAP, 99.8% precision, 100% recall, trained on 2,354 images)
- **WebAudio** — synthesized sound effects, no audio assets

## Known Hand Signs

The model recognizes the following five hand signs from the [trained dataset](https://universe.roboflow.com/jjk-doyjq/jujutsu-kaisen-hand-signs). All five are real seals from the series; kanji, romaji and lore are verified against the [Jujutsu Kaisen Wiki](https://jujutsu-kaisen.fandom.com/) and Japanese sources.

| Model label | Technique | Kanji | Romaji | Character |
|---|---|---|---|---|
| `gojo` | Unlimited Void | 無量空処 | Muryōkūsho | Gojo Satoru |
| `sukuna` | Malevolent Shrine | 伏魔御廚子 | Fukuma Mizushi | Ryomen Sukuna |
| `wolf` | Ten Shadows — Divine Dogs | 玉犬 | Gyokuken | Fushiguro Megumi |
| `nue` | Ten Shadows — Nue | 鵺 | Nue | Fushiguro Megumi |
| `toad` | Ten Shadows — Toad | 蝦蟇 | Gama | Fushiguro Megumi |

The app maps these raw labels onto full technique entries via the `CLASS_ALIASES` table in `index.html` — if you retrain with different label spellings, update that table.

### Special interactions (canon)

- **Domain Expansion (領域展開, Ryōiki Tenkai)** — in the series, expanding a domain requires forming the user's unique seal (Gojo's derives from Taishakuten/Indra, Sukuna's from Enmaten/Yama). Hold either domain seal steady for ~2.5 s and the app plays the full Domain Expansion cinematic.
- **The Well's Unknown Abyss (不知井底, Seiteishirazu)** — Megumi's own extension technique: weaving the shadows of Toad and Nue in succession fuses them into winged toads (first used vs Aoi Todo, Kyoto Goodwill Event). Form Toad and Nue within 8 s of each other to trigger the fusion.

## Project Goals

- [x] Real-time webcam hand detection using MediaPipe
- [x] In-browser model inference using inferencejs
- [x] Anime-themed UI with cursed energy particle effects
- [x] Detect JJK hand signs including Domain Expansion and Ten Shadows Technique
- [x] Vercel serverless proxy to hide API key in production (optional improvement)
- [x] Sequence detection — recognize multi-sign combos (canon-accurate: Toad + Nue → Seiteishirazu)
- [x] Sound effects on sign detection

## File Structure

```
/
├── index.html        # Single-file app (HTML + CSS + JS)
├── api/key.js        # Optional Vercel function: serves the key from an env var
├── test/e2e.cjs      # Playwright end-to-end smoke test
├── vercel.json       # Vercel static deployment config
└── README.md
```

## Run Locally

```bash
npm run dev            # serves on http://localhost:3000 (npx http-server)
```

Then open <http://localhost:3000> and click **Activate Cursed Vision**. Camera access requires `localhost` or HTTPS.

**Demo mode** — open <http://localhost:3000/?demo=1> to preview every effect (detection cards, the Seiteishirazu fusion, both Domain Expansion cinematics) with simulated signs: no camera, model download, or Roboflow access needed.

**End-to-end test** (needs `playwright`):

```bash
npx http-server . -p 3111 &
BASE_URL=http://127.0.0.1:3111 node test/e2e.cjs
```

## Improving Detection Accuracy

- **Always-on resonance readout** — the bar over the camera shows the model's current best guess and confidence *even below the trigger threshold*, so you can tell "predicted at 35%, threshold too high" apart from "not predicted at all".
- The trigger threshold is fixed at **30%** (`confThreshold` in `index.html`), tuned from real-camera testing.

Note: inference always runs on horizontally-mirrored frames (`MIRROR_INFERENCE` in `index.html`) — real-camera testing showed the training images are mirrored relative to the raw webcam frame, and all signs detect better flipped. If you retrain with unmirrored data, set that constant to `false`.

The `CLASS_BIAS` table in `index.html` rebalances per-class confidence (the current model over-predicts Gojo's seal and under-predicts Sukuna's): Gojo's confidence is weighted ×0.85 and Sukuna's ×1.30 for ranking and trigger checks, while the displayed % stays raw. Tune or remove these after retraining.

If a sign is genuinely not being predicted, the fix is more training data:

1. Open the [Roboflow project](https://universe.roboflow.com/jjk-doyjq/jujutsu-kaisen-hand-signs) → **Upload** 30–100+ new images per weak class (vary lighting, background, distance, and ideally people).
2. Annotate them, then **Generate** a new dataset version. ⚠️ **Disable the horizontal-flip augmentation** — JJK seals are chiral, and flip augmentation teaches the model mirrored signs, causing exactly the confusion the 🪞 toggle works around.
3. Train the new version, then bump `RF_VERSION` in `index.html` (e.g. `1` → `2`).

## Deploy to Vercel

The site is fully static — import the repo into Vercel and deploy. Optionally set a `ROBOFLOW_PUBLISHABLE_KEY` environment variable: the `api/key.js` function serves it to the client at runtime (the client falls back to its embedded key otherwise). Note the publishable key is browser-safe by design — it only authorizes the one-time model weight download, not per-detection billing.

## Key Implementation Notes

- inferencejs is loaded via CDN: `https://cdn.jsdelivr.net/npm/inferencejs@1.2.3/dist/inference.js` (UMD global `window.inferencejs`)
- Initialize with: `const engine = new InferenceEngine(); const workerId = await engine.startWorker('jujutsu-kaisen-hand-signs', 1, PUBLISHABLE_KEY)`
- Detect with: `await engine.infer(workerId, new CVImage(videoElement))` → `[{ class, confidence, bbox, color }]`; note `bbox.x/y` is the box **center**
- MediaPipe and inferencejs run concurrently — MediaPipe (2-hand mode; most JJK seals are two-handed) draws the skeleton overlay on a canvas, inferencejs runs inference on the raw video feed
- The detection loop throttles to ~1 detection per 800ms to avoid overwhelming the model
- The UI is dark-themed (near-black background), anime/JJK aesthetic with crimson and gold accents, Cinzel font for headings
- Each detected sign displays its kanji, romaji, English name, character attribution, and series-accurate lore
- Particle burst effects fire on each new detection, color-coded by character (Sukuna = red, Gojo = blue, Megumi = green)
- Unofficial fan project — Jujutsu Kaisen © Gege Akutami / Shueisha
