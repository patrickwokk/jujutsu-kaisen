# Jujutsu Kaisen Hand Sign Detector

A real-time, browser-based Jujutsu Kaisen hand sign recognition app. Point your webcam at your hand, pull a cursed technique sign, and the app identifies it instantly.

## What This Project Does

The app uses two technologies working in tandem:
1. **MediaPipe Hands** — tracks landmarks on the user's hand in real time via webcam
2. **Roboflow inferencejs** — loads the trained JJK hand sign model directly into the browser via WebGL and classifies the sign locally on the user's device

Because inferencejs runs the model client-side using WebGL, there are no API calls made per detection. The Roboflow API key is only used once on page load to pull down the model weights. After that, everything runs offline on the visitor's machine.

## Tech Stack

- **MediaPipe Hands** (via CDN) — real-time hand landmark detection and skeleton overlay
- **Roboflow inferencejs** (via CDN) — WebGL-accelerated in-browser model inference
- **Roboflow model** — `jujutsu-kaisen-hand-signs/1` (99.5% mAP, 99.8% precision, 100% recall, trained on 2,354 images)

## Known Hand Signs

The model recognizes the following five hand signs from the [trained dataset](https://universe.roboflow.com/jjk-doyjq/jujutsu-kaisen-hand-signs):

| Hand Sign | Character | Technique |
|-----------|-----------|-----------|
| Gojo Domain Expansion | Gojo Satoru | Unlimited Void (無量空処) |
| Sukuna Domain Expansion | Ryomen Sukuna | Malevolent Shrine (伏魔御廚子) |
| Divine Dogs | Fushiguro Megumi | Ten Shadows Technique — Divine Dogs (玉犬) |
| Nue | Fushiguro Megumi | Ten Shadows Technique — Nue (鵺) |
| Gama | Fushiguro Megumi | Ten Shadows Technique — Gama Toad (蝦蟇) |

## Project Goals

- [x] Real-time webcam hand detection using MediaPipe
- [x] In-browser model inference using inferencejs
- [ ] Anime-themed UI with cursed energy particle effects
- [x] Detect JJK hand signs including Domain Expansion and Ten Shadows Technique
- [ ] Vercel serverless proxy to hide API key in production (optional improvement)
- [ ] Sequence detection — recognize multi-sign combos like Sukuna's Dismantle
- [ ] Sound effects on sign detection

## File Structure

```
/
├── index.html        # Single-file app (HTML + CSS + JS)
├── README.md
└── vercel.json       # Optional: for Vercel proxy deployment
```

## Key Implementation Notes for Claude Code

- The inferencejs library is loaded via CDN: `https://cdn.roboflow.com/0.2.26/roboflow.js`
- Initialize with: `roboflow.auth({ publishable_key: 'YOUR_KEY' }).load({ model: 'jujutsu-kaisen-hand-signs', version: 1 })`
- MediaPipe and inferencejs run concurrently — MediaPipe draws the skeleton overlay on a canvas, inferencejs runs inference on the raw video feed
- The detection loop should throttle to ~1 detection per 800ms to avoid overwhelming the model
- API key input should be saved to localStorage so visitors only enter it once
- The UI is dark-themed (near-black background), anime/JJK aesthetic with crimson and gold accents, Cinzel font for headings
- Each detected sign should display its kanji character, English name, and a short lore description
- Particle burst effects should fire on each new detection, color-coded by character (Sukuna = red, Gojo = blue, Megumi = green)
