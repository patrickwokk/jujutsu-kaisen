// End-to-end smoke test for the JJK Hand Sign Detector.
//
// Runs the app in headless Chromium with a fake webcam and exercises the full
// UI pipeline in demo mode (?demo=1): detection cards, the Toad+Nue fusion,
// and both Domain Expansion overlays — no Roboflow model or real camera needed.
//
// Usage:
//   npx http-server . -p 3111 &   # or any static server
//   BASE_URL=http://127.0.0.1:3111 node test/e2e.cjs
//
// Requires playwright (`npm i -D playwright` or a global install).

const assert = require('node:assert');

async function main() {
  const { chromium } = require('playwright');
  const base = process.env.BASE_URL || 'http://127.0.0.1:3111';
  const browser = await chromium.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // ── Demo mode: full pipeline without camera/model ──
  await page.goto(base + '/?demo=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#startBtn');

  const chipCount = await page.$$eval('.sign-chip', (els) => els.length);
  assert.strictEqual(chipCount, 5, `expected 5 sign chips, got ${chipCount}`);
  const comboPanels = await page.$$eval('.combo-panel', (els) => els.length);
  assert.strictEqual(comboPanels, 1, `expected 1 combo panel, got ${comboPanels}`);

  await page.click('#startBtn');
  await page.waitForFunction(
    () => document.getElementById('statusPill').textContent.includes('DEMO'),
    null, { timeout: 5000 });

  // First detection card (Divine Dogs at demo step 1)
  await page.waitForFunction(
    () => document.getElementById('resultContent').style.display === 'flex',
    null, { timeout: 10000 });
  console.log('✓ detection card shown');

  // Divine Dogs detection triggers the strike clip (playback itself needs
  // an H.264-capable browser; the trigger counter must fire regardless)
  await page.waitForFunction(() => window.__jjk.dogs >= 1, null, { timeout: 10000 });
  console.log('✓ Divine Dogs strike triggered');

  // Fusion: Gama then Nue within window → Seiteishirazu
  await page.waitForFunction(() => window.__jjk.fusions >= 1, null, { timeout: 15000 });
  const fusionName = await page.textContent('#signName');
  assert.ok(fusionName.includes("WELL'S UNKNOWN ABYSS"),
    `expected fusion card, got "${fusionName}"`);
  console.log('✓ Seiteishirazu fusion triggered');

  // Gojo domain: seal held for the full hold time → overlay
  await page.waitForFunction(() => window.__jjk.domains >= 1, null, { timeout: 20000 });
  await page.waitForSelector('.domain-overlay.show', { timeout: 5000 });
  const gojoDomain = await page.textContent('#domainName');
  assert.strictEqual(gojoDomain, 'UNLIMITED VOID');
  console.log('✓ Gojo Domain Expansion overlay:', gojoDomain);

  // Sukuna domain follows in the script
  await page.waitForFunction(() => window.__jjk.domains >= 2, null, { timeout: 20000 });
  const sukunaDomain = await page.textContent('#domainName');
  assert.strictEqual(sukunaDomain, 'MALEVOLENT SHRINE');
  console.log('✓ Sukuna Domain Expansion overlay:', sukunaDomain);

  // Deactivate cleanly
  await page.click('#startBtn');
  await page.waitForFunction(
    () => document.getElementById('statusPill').textContent === 'INACTIVE',
    null, { timeout: 5000 });
  console.log('✓ deactivate returns to idle');

  // ── Detection rules: feed hand-written predictions straight into the
  //    app (no camera, no model) and check when a sign counts ──
  await page.goto(base + '/?demo=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#startBtn');
  const feed = (cls, confidence) => page.evaluate(([c, conf]) => {
    handlePredictions(c ? [{ class: c, confidence: conf, bbox: { x: 320, y: 240, width: 200, height: 200 } }] : []);
    return { detections: window.__jjk.detections, domains: window.__jjk.domains, card: document.getElementById('signName').textContent };
  }, [cls, confidence]);
  const sleep = (ms) => page.waitForTimeout(ms);

  // a weak read of a new sign must repeat before it counts
  let r = await feed('sukuna', 0.25);
  assert.strictEqual(r.detections, 0, 'one weak frame must not fire');
  r = await feed('sukuna', 0.25);
  assert.strictEqual(r.detections, 1, 'two weak frames in a row must fire');
  assert.strictEqual(r.card, 'MALEVOLENT SHRINE');
  console.log('✓ weak sign needs two frames in a row');

  // a weak read that is interrupted starts over
  r = await feed('nue', 0.35);
  r = await feed(null);
  r = await feed('nue', 0.35);
  assert.strictEqual(r.card, 'MALEVOLENT SHRINE', 'interrupted weak sign must not fire');
  r = await feed('nue', 0.35);
  assert.strictEqual(r.card, 'NUE');
  console.log('✓ interrupted weak sign starts over');

  // a confident read counts at once
  r = await feed('wolf', 0.62);
  assert.strictEqual(r.card, 'DIVINE DOGS');
  console.log('✓ confident sign fires on the first frame');

  // below the weighted threshold nothing counts, however often it repeats
  // (Gojo's weight is 0.80, so 35% scores 0.28, under the 0.30 threshold)
  const before = r.detections;
  for (let i = 0; i < 4; i++) r = await feed('gojo', 0.35);
  assert.strictEqual(r.detections, before, 'sub-threshold frames must never fire');
  assert.strictEqual(r.card, 'DIVINE DOGS');
  console.log('✓ sub-threshold guesses never fire');

  // a domain needs the seal held for the full hold time; one dropped frame
  // in the middle pauses the charge but does not break it
  const holdStart = Date.now();
  r = await feed('gojo', 0.9);
  while (Date.now() - holdStart < 1500) {
    await sleep(250);
    r = await feed(Date.now() - holdStart > 700 && Date.now() - holdStart < 1000 ? null : 'gojo', 0.9);
    assert.strictEqual(r.domains, 0, 'domain must not expand before the hold time');
  }
  await page.waitForFunction(() => {
    handlePredictions([{ class: 'gojo', confidence: 0.9, bbox: { x: 320, y: 240, width: 200, height: 200 } }]);
    return window.__jjk.domains === 1;
  }, null, { timeout: 3000, polling: 250 });
  const held = Date.now() - holdStart;
  assert.ok(held >= 2000, `domain expanded after only ${held} ms`);
  console.log(`✓ domain expands after the seal is held (${held} ms)`);

  // letting go breaks a hold: the charge bar goes away
  await sleep(4800);  // let the Gojo cinematic finish
  r = await feed('sukuna', 0.9);
  await sleep(300);
  r = await feed('sukuna', 0.9);
  assert.ok(await page.$eval('#domainCharge', (el) => el.classList.contains('show')), 'charge bar should show while holding');
  await sleep(1100);
  r = await feed(null);
  assert.ok(!(await page.$eval('#domainCharge', (el) => el.classList.contains('show'))), 'charge bar should clear after letting go');
  assert.strictEqual(r.domains, 1);
  console.log('✓ letting go breaks the hold');

  // ── Live mode: activation must degrade gracefully when the model
  //    can't load (e.g. offline). On a normal machine the model loads
  //    and this branch reports ACTIVE instead — both are acceptable. ──
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.click('#startBtn');
  await page.waitForFunction(() => {
    const t = document.getElementById('statusPill').textContent;
    return t.includes('SCANNING') || t.includes('FAILED') || t.includes('CAMERA');
  }, null, { timeout: 60000 });
  const liveStatus = await page.$eval('#statusPill', (el) => el.textContent);
  console.log('✓ live mode resolved to a terminal state:', liveStatus);

  const realErrors = pageErrors.filter((e) => !/Failed to fetch|NetworkError|ERR_/i.test(e));
  assert.deepStrictEqual(realErrors, [], `page JS errors: ${realErrors.join('\n')}`);

  await browser.close();
  console.log('\nALL E2E CHECKS PASSED');
}

main().catch((e) => { console.error(e); process.exit(1); });
