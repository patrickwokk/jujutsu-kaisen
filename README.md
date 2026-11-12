# Jujutsu Kaisen Hand Sign Detector

A fan-made Jujutsu Kaisen hand sign detector that runs in your browser. Point your webcam at your hand, make a cursed technique sign, and it tells you which one it is.

**Try it:** https://patrickwokk.github.io/jujutsu-kaisen/

It's always going to be a work in progress. The detection still misses a lot, so any help is welcome (see [Contributing](#contributing)).

## How it works

Two things run side by side in your browser:

1. **MediaPipe Hands** tracks the points on your hand and draws the skeleton overlay.
2. **Roboflow inferencejs** loads a trained hand sign model and classifies the sign on your own device with WebGL.

The model downloads once when the page loads. After that every detection runs locally, so your camera feed never leaves your computer. The Roboflow key in `index.html` is a publishable key, which is meant to be used in the browser.

## Hand signs it knows

| Hand sign | Character | Technique |
|-----------|-----------|-----------|
| Gojo Domain Expansion | Gojo Satoru | Unlimited Void (無量空処) |
| Sukuna Domain Expansion | Ryomen Sukuna | Malevolent Shrine (伏魔御廚子) |
| Divine Dogs | Fushiguro Megumi | Ten Shadows Technique: Divine Dogs (玉犬) |
| Nue | Fushiguro Megumi | Ten Shadows Technique: Nue (鵺) |
| Gama | Fushiguro Megumi | Ten Shadows Technique: Gama Toad (蝦蟇) |

The model is [jujutsu-kaisen-hand-signs](https://universe.roboflow.com/jjk-doyjq/jujutsu-kaisen-hand-signs) on Roboflow Universe, trained on 2,354 images.

## Roadmap

- [x] Real-time hand tracking with MediaPipe
- [x] In-browser detection with inferencejs
- [x] Domain Expansion and Ten Shadows signs
- [ ] More reliable detection (the big one)
- [ ] Anime-style UI with cursed energy particle effects
- [ ] Combos, like recognizing Sukuna's Dismantle from a sequence of signs
- [ ] Sound effects when a sign is detected

## Run it locally

Everything lives in `index.html`. To serve it:

```bash
npm run dev
```

Then open http://localhost:3000. Browsers only allow the camera on `localhost` or HTTPS, so opening the file directly won't work.

## Contributing

This is a fan project, and I'm happy for anyone to change it, improve it or build on it. The most useful thing right now is making the detection more reliable, but new signs, effects and fixes are all welcome. Open an issue if you have an idea or found a bug, or send a pull request.

## Credits and license

Fan project, not affiliated with Gege Akutami, Shueisha or MAPPA. Jujutsu Kaisen and its characters belong to their creators.

The code is under the [MIT License](LICENSE).
