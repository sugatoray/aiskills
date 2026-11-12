// Browser checks for assets/scrolls-explainer.html (development only).
// Run: node tests/browser/check_page.cjs <page.html> [screenshot-dir]
// Needs Node.js and Playwright with a Chromium browser. tests/test_explain.sh
// runs it when both are available and skips it otherwise.
'use strict';
const {chromium} = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const file = process.argv[2];
const shots = process.argv[3];
const ALL_TABS = ['setup', 'session', 'update', 'hide', 'unhide', 'remove', 'restore', 'help'];
// SCROLLS_TABS: the tabs a rebuilt page should have (e.g. after a skill was
// deactivated). The keyboard walk-through below assumes the full set.
const TABS = process.env.SCROLLS_TABS ? process.env.SCROLLS_TABS.split(',') : ALL_TABS;
const FULL = TABS.join() === ALL_TABS.join();
const STEP_MS = 5200;

(async () => {
  if (!file) throw new Error('usage: check_page.cjs <page.html> [screenshot-dir]');
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => { if (!r.url().startsWith('file:')) requests.push(r.url()); });
  await page.clock.install();
  await page.goto('file://' + path.resolve(file));
  await page.waitForSelector('#network-flow[data-ready=true]');
  // The fake clock does not drive CSS transitions; turn them off so positions are final.
  await page.addStyleTag({content: '#network-flow .rf-callout{transition:none!important}'});
  const ok = (m) => console.log('PASS ' + m);

  const state = () => page.evaluate(() => {
    const root = document.querySelector('#network-flow');
    const co = document.querySelector('.rf-callout');
    const board = document.querySelector('.rf-board').getBoundingClientRect();
    const r = co.getBoundingClientRect();
    return {
      scene: root.dataset.scene,
      on: co.classList.contains('on'),
      inside: r.left >= board.left - 1 && r.right <= board.right + 1,
      step: co.querySelector('.rf-co-step').textContent,
      title: co.querySelector('.rf-co-title').textContent,
      pause: document.querySelector('[data-action=pause]').textContent,
      help: document.querySelector('.rf-help').classList.contains('on'),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  const key = async (k) => { await page.keyboard.press(k); await page.clock.runFor(50); };

  const tabs = await page.$$eval('.rf-tab', (t) => t.map((x) => x.dataset.scene));
  assert.deepEqual(tabs, ['all', ...TABS]);
  assert.equal((await state()).on, false);
  ok('tabs in order, Overview first, no callout on Overview');

  for (const width of [1280, 820, 390, 320]) {
    await page.setViewportSize({width, height: 900});
    for (const s of TABS) {
      await page.locator(`button[data-scene=${s}]`).click();
      await page.clock.runFor(300);
      const st = await state();
      assert.ok(st.on, `${width} ${s}: callout shown`);
      assert.ok(st.inside, `${width} ${s}: callout inside the diagram`);
      assert.equal(st.overflow, false, `${width} ${s}: no horizontal scroll`);
      const clipped = await page.$$eval('[data-node]', (ns) => ns
        .filter((n) => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1)
        .map((n) => n.dataset.node));
      assert.deepEqual(clipped, [], `${width}: card text clipped`);
      if (shots && (width === 1280 || width === 390) && ['setup', 'update', 'remove'].includes(s)) {
        await page.screenshot({path: path.join(shots, `${s}-${width}.png`), fullPage: width === 1280});
      }
    }
    ok(`callouts placed at ${width}px`);
  }

  const hint = await page.locator('.rf-keys').textContent();
  assert.ok(hint.includes(`0–${TABS.length}`), `key hint names tabs 0–${TABS.length}: ${hint}`);
  ok('key hint matches the number of tabs');
  if (!FULL) {
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    ok('no runtime errors, no network requests');
    await browser.close();
    return;
  }

  await page.setViewportSize({width: 1280, height: 900});
  await page.locator('button[data-scene=update]').click();
  await page.clock.runFor(300);
  let st = await state();
  assert.match(st.step, /Step 1 \/ 9/);
  assert.equal(st.title, 'Look at git');
  await page.clock.runFor(STEP_MS);
  assert.match((await state()).step, /Step 2 \/ 9/);
  ok('autoplay advances one step every 5.2 s');

  await page.locator('[data-co=next]').click();
  await page.clock.runFor(100);
  assert.match((await state()).step, /Step 3 \/ 9/);
  assert.equal((await state()).pause, 'Resume');
  await page.clock.runFor(STEP_MS * 2);
  assert.match((await state()).step, /Step 3 \/ 9/);
  for (let i = 0; i < 3; i++) await page.locator('[data-co=prev]').click();
  await page.clock.runFor(100);
  assert.match((await state()).step, /Step 9 \/ 9/);
  ok('callout buttons step, pause and wrap');

  // Keyboard
  await key('0'); assert.equal((await state()).scene, 'all');
  await key(']'); assert.equal((await state()).scene, 'setup');
  await key('Home'); await key('ArrowRight');
  assert.match((await state()).step, /Step 2 \/ 10/);
  await page.clock.runFor(STEP_MS * 2);
  assert.match((await state()).step, /Step 2 \/ 10/);
  await key('End'); assert.match((await state()).step, /Step 10 \/ 10/);
  await key('ArrowRight'); assert.match((await state()).step, /Step 1 \/ 10/);
  await key('ArrowLeft'); assert.match((await state()).step, /Step 10 \/ 10/);
  ok('arrows, Home and End step through a tab');
  await key('Space'); assert.equal((await state()).pause, 'Pause');
  await key('p'); assert.equal((await state()).pause, 'Resume');
  await key('r'); assert.match((await state()).step, /Step 1 \/ 10/);
  ok('Space / P pause, R replays');
  await key('6'); assert.equal((await state()).scene, 'remove');
  await key('Shift+ArrowRight'); assert.equal((await state()).scene, 'restore');
  await key('['); await key('['); assert.equal((await state()).scene, 'unhide');
  await key('0'); await key('['); assert.equal((await state()).scene, 'help');
  await key('Control+]'); assert.equal((await state()).scene, 'help');
  ok('digits, [ ], Shift+arrows switch tabs; modifiers are ignored');
  await page.focus('button[data-scene=update]');
  await key('Enter'); assert.equal((await state()).scene, 'update');
  const before = (await state()).pause;
  await key('Space');
  assert.notEqual((await state()).pause, before);
  assert.equal((await state()).scene, 'update');
  ok('Enter presses a focused tab; Space toggles pause only once');
  await key('?'); assert.ok((await state()).help);
  const held = (await state()).step;
  await key('ArrowRight'); assert.equal((await state()).step, held);
  await key('Escape');
  assert.equal((await state()).help, false);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.scene), 'update');
  ok('? opens the shortcut panel, blocks other keys, Esc closes it and returns focus');
  if (shots) { await key('?'); await page.screenshot({path: path.join(shots, 'shortcuts.png')}); await key('Escape'); }

  await page.locator('[data-node=starter]').click();
  assert.match(await page.locator('.rf-detail h3').textContent(), /STARTER/);
  await key('Escape');
  assert.equal(await page.locator('#network-flow').getAttribute('data-selected'), '');
  ok('select a block, Esc clears it');

  await page.setViewportSize({width: 390, height: 800});
  await page.evaluate(() => scrollTo(0, 0));
  await key('7'); await key('ArrowRight'); await key('ArrowRight');
  await page.waitForTimeout(1200); // smooth scrolling runs on real time
  const visible = await page.evaluate(() => {
    const r = document.querySelector('.rf-callout').getBoundingClientRect();
    return r.top >= -1 && r.bottom <= innerHeight + 1;
  });
  assert.ok(visible, 'callout scrolled into view');
  ok('stepping on a phone scrolls the callout into view');

  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.clock.runFor(200);
  assert.ok((await state()).on);
  ok('reduced motion keeps the callout');

  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  ok('no runtime errors, no network requests');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
