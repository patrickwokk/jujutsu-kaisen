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

  // Fusion: Gama then Nue within window → Seiteishirazu
  await page.waitForFunction(() => window.__jjk.fusions >= 1, null, { timeout: 15000 });
  const fusionName = await page.textContent('#signName');
  assert.ok(fusionName.includes("WELL'S UNKNOWN ABYSS"),
    `expected fusion card, got "${fusionName}"`);
  console.log('✓ Seiteishirazu fusion triggered');

  // Gojo domain: 3 consecutive holds → overlay
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

  // ── Live mode: activation must degrade gracefully when the model
  //    can't load (e.g. offline). On a normal machine the model loads
  //    and this branch reports ACTIVE instead — both are acceptable. ──
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.click('#startBtn');
  await page.waitForFunction(() => {
    const t = document.getElementById('statusPill').textContent;
    return t.includes('SCANNING') || t.includes('FAILED') || t.includes('DENIED');
  }, null, { timeout: 60000 });
  const liveStatus = await page.$eval('#statusPill', (el) => el.textContent);
  console.log('✓ live mode resolved to a terminal state:', liveStatus);

  const realErrors = pageErrors.filter((e) => !/Failed to fetch|NetworkError|ERR_/i.test(e));
  assert.deepStrictEqual(realErrors, [], `page JS errors: ${realErrors.join('\n')}`);

  await browser.close();
  console.log('\nALL E2E CHECKS PASSED');
}

main().catch((e) => { console.error(e); process.exit(1); });
