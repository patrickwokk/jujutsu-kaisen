# Jujutsu Kaisen Hand Sign Detector

A fan-made Jujutsu Kaisen hand sign detector that runs in your browser. Point your webcam at your hands, make a cursed technique seal from the series, and it tells you which one it is. Hold a domain seal long enough and you expand your domain.

**Try it:** https://patrickwokk.github.io/jujutsu-kaisen/

It's always going to be a work in progress. The detection still misses a lot, so any help is welcome (see [Contributing](#contributing)).

## Hand signs it knows

| Sign | Character | Technique |
|------|-----------|-----------|
| Gojo's seal | Gojo Satoru | Domain Expansion: Unlimited Void (無量空処) |
| Sukuna's seal | Ryomen Sukuna | Domain Expansion: Malevolent Shrine (伏魔御廚子) |
| Divine Dogs | Fushiguro Megumi | Ten Shadows: Divine Dogs (玉犬) |
| Nue | Fushiguro Megumi | Ten Shadows: Nue (鵺) |
| Toad | Fushiguro Megumi | Ten Shadows: Toad (蝦蟇) |

## What happens when you make one

- Every sign shows a card with its kanji, name and a bit of lore, plus a burst of particles in the character's color.
- **Domain Expansion:** hold Gojo's or Sukuna's seal steady for about 2 seconds to play the domain cinematic with sound.
- **The Well's Unknown Abyss (不知井底):** make Toad and Nue within 8 seconds of each other and they fuse, like Megumi does against Todo.
- **Divine Dogs:** a wolf leaps out over the page.

To see the effects without a camera, use the demo link under the button, or add `?demo=1` to the end of the address.

## How it works

Two things run side by side in your browser:

1. **MediaPipe Hands** tracks both hands and draws the skeleton overlay.
2. **Roboflow inferencejs** loads the trained model and classifies the sign on your own device.

The model downloads once when the page loads. After that every detection runs locally, so your camera feed never leaves your computer. The Roboflow key in `index.html` is a publishable key, which is meant to be used in the browser.

The model is [jujutsu-kaisen-hand-signs](https://universe.roboflow.com/jjk-doyjq/jujutsu-kaisen-hand-signs) on Roboflow Universe, trained on 2,354 images.

## Making detection better

This is where help counts the most. A few things worth knowing:

- The bar over the camera shows the model's best guess and its confidence, even below the 30% trigger threshold (`confThreshold` in `index.html`). That tells you whether a sign is barely missing or not recognized at all.
- inferencejs throws away every prediction under 50% unless you tell it otherwise, so the app asks for everything from 15% up (`ENGINE_MIN_CONF`) and decides for itself.
- A sign the model is at least 50% sure of counts right away. A weaker one has to show up two frames in a row first (`INSTANT_CONF`, `CONFIRM_FRAMES`), so one shaky frame can't set off a sign.
- Frames are mirrored before detection (`MIRROR_INFERENCE`), because the training images are mirrored compared to a raw webcam.
- `CLASS_BIAS` evens out the model's habits. It over-predicts Gojo's seal and under-predicts Sukuna's and Divine Dogs.
- If a sign isn't recognized at all, the model needs more training data for it. Turn off horizontal flip augmentation when you train, because the seals are left and right specific. After retraining, bump `RF_VERSION` in `index.html`.

## Run it locally

```bash
npm run dev
```

Then open http://localhost:3000 and click **Activate Cursed Vision**. Browsers only allow the camera on `localhost` or HTTPS.

The end-to-end test runs the demo in a headless browser (needs Playwright):

```bash
npx http-server . -p 3111 &
BASE_URL=http://127.0.0.1:3111 npm test
```

## Hosting

It's a static site, so GitHub Pages works as is. On Vercel you can also set a `ROBOFLOW_PUBLISHABLE_KEY` environment variable, and `api/key.js` will hand that key to the page instead of the built-in one.

## Contributing

This is a fan project, and I'm happy for anyone to change it, improve it or build on it. The most useful thing right now is making the detection more reliable, but new signs, effects and fixes are all welcome. Open an issue if you have an idea or found a bug, or send a pull request.

## Credits and license

Fan project, not affiliated with Gege Akutami, Shueisha or MAPPA. Jujutsu Kaisen and its characters belong to their creators.

The code is under the [MIT License](LICENSE).
