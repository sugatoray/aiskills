// Browser checks for assets/example-viewer.html (development only).
// Run: node tests/browser/check_example_viewer.cjs <page.html> [screenshot-dir]
// Needs Node.js and Playwright with a Chromium browser. tests/test_example_viewer.sh
// runs it when both are available and skips it otherwise.
//
// marked is loaded from cdnjs when the network allows it. With
// VIEWER_OFFLINE=1 every outside request is blocked, to check the plain-text
// fallback.
'use strict';
const {chromium} = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const file = process.argv[2];
const shots = process.argv[3];
const OFFLINE = process.env.VIEWER_OFFLINE === '1';
const examplesDir = path.join(path.dirname(path.resolve(file)), 'examples');
const NUMS = fs.readdirSync(examplesDir).filter((f) => /^example_\d{3}\.md$/.test(f)).sort()
  .map((f) => f.slice(8, 11));

(async () => {
  if (!file) throw new Error('usage: check_example_viewer.cjs <page.html> [screenshot-dir]');
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  if (OFFLINE) await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = 'file://' + path.resolve(file);
  const ok = (m) => console.log('PASS ' + m);
  const visible = () => page.evaluate(() =>
    [...document.querySelectorAll('section.tab')].filter((s) => !s.hidden).map((s) => s.id));
  const selected = () => page.evaluate(() =>
    [...document.querySelectorAll('nav.tabs a[aria-selected="true"]')].map((a) => a.dataset.tab));
  const expectTab = async (tab, msg) => {
    assert.deepEqual(await visible(), ['tab-' + tab], msg + ': visible panel');
    assert.deepEqual(await selected(), [tab], msg + ': selected tab');
    assert.equal(new URL(page.url()).hash, '#' + tab, msg + ': hash');
    ok(msg);
  };

  await page.goto(url);
  await page.waitForSelector('body[data-ready=true]');
  await expectTab('index', 'opens on the Index tab');

  if (OFFLINE) {
    const pre = await page.locator('#tab-index .doc pre.fallback').count();
    assert.equal(pre, 1, 'without marked, the index shows as plain text');
    ok('without marked, the index shows as plain text');
    await page.click('nav.tabs a[data-tab="example-021"]');
    await expectTab('example-021', 'without marked, tabs still switch');
    assert.deepEqual(errors, [], 'no page errors offline');
    ok('no page errors offline');
    await browser.close();
    return;
  }

  // Index rendered: its table has one row per example.
  const rows = await page.locator('#tab-index .doc table tbody tr').count();
  assert.equal(rows, NUMS.length, 'the index table has one row per example');
  ok(`the index table renders with ${rows} rows`);

  // Premise and Caveats: one "Note" box per example, holding both headings and their lists.
  const notes = await page.evaluate(() => [...document.querySelectorAll('section.tab')].map((s) => {
    const boxes = [...s.querySelectorAll('.doc .pc')];
    const outside = [...s.querySelectorAll('.doc h3')].filter((h) => /^(Premise|Caveats)$/.test(h.textContent.trim()) && !h.closest('.pc')).length;
    const b = boxes[0];
    return {id: s.id, boxes: boxes.length, outside,
      label: b ? b.querySelector('.pc-label')?.textContent : null,
      kids: b ? [...b.children].map((c) => c.tagName + (c.tagName === 'H3' ? ':' + c.textContent.trim() : '')) : []};
  }));
  const idx = notes.find((n) => n.id === 'tab-index');
  assert.equal(idx.boxes, 0, 'the index has no Note box');
  for (const n of notes.filter((x) => x.id !== 'tab-index')) {
    assert.equal(n.boxes, 1, `${n.id}: one Note box`);
    assert.equal(n.outside, 0, `${n.id}: no Premise/Caveats heading outside the box`);
    assert.equal(n.label, 'Note', `${n.id}: the box is labelled Note`);
    assert.deepEqual(n.kids, ['SPAN', 'H3:Premise', 'UL', 'H3:Caveats', 'UL'], `${n.id}: box contents`);
  }
  ok(`every example (${NUMS.length}) has one Note box with its Premise and Caveats`);
  const tint = await page.evaluate(() => {
    const b = document.querySelector('#tab-example-001 .pc');
    return [getComputedStyle(b).backgroundColor, getComputedStyle(b.closest('.doc')).backgroundColor];
  });
  assert.notEqual(tint[0], tint[1], 'the Note box is tinted');
  ok('the Note box is tinted against the page');

  // Tabs switch, and a hash opens a tab directly.
  await page.click('nav.tabs a[data-tab="example-021"]');
  await expectTab('example-021', 'clicking a tab shows that example');
  const h1 = await page.locator('#tab-example-021 .doc h1').first().textContent();
  assert.match(h1, /Example-21: Read the old text back/);
  ok('the example renders with its title');

  // Links between files stay in the page.
  await page.click('#tab-example-021 .doc a:text("← All examples")');
  await expectTab('index', 'the back-link opens the Index tab');
  await page.click('#tab-index .doc table a[data-src="examples/example_007.md"] >> nth=0');
  await expectTab('example-007', 'an index link to examples/example_007.md opens its tab');
  await page.click('nav.tabs a[data-tab="example-021"]');
  await page.click('#tab-example-021 .doc a:text("Example-01")');
  await expectTab('example-001', 'a Starts from link opens the example it names');

  // Previous / Next.
  await page.click('#tab-example-001 [data-step="next"]');
  await expectTab('example-002', 'Next opens the next example');
  await page.click('#tab-example-002 [data-step="prev"]');
  await expectTab('example-001', 'Previous opens the one before');
  assert.equal(await page.locator('#tab-example-001 [data-step="prev"]').isDisabled(), true);
  const last = 'example-' + NUMS[NUMS.length - 1];
  await page.click(`nav.tabs a[data-tab="${last}"]`);
  assert.equal(await page.locator(`#tab-${last} [data-step="next"]`).isDisabled(), true);
  ok('Previous is off on the first example, Next on the last');

  // Jump to.
  await page.selectOption('#jump', 'example-015');
  await expectTab('example-015', 'Jump to opens the chosen example');
  assert.equal(await page.inputValue('#jump'), 'example-015');
  ok('Jump to follows the open tab');

  // Rendered / Markdown: the raw view is the file, byte for byte.
  await page.click('[data-view="raw"]');
  const raw = await page.locator('#tab-example-015 pre.raw').textContent();
  assert.equal(raw, fs.readFileSync(path.join(examplesDir, 'example_015.md'), 'utf8'));
  assert.equal(await page.locator('#tab-example-015 .doc').isHidden(), true);
  ok('Markdown shows the file exactly');
  await page.click('nav.tabs a[data-tab="example-016"]');
  assert.equal(await page.locator('#tab-example-016 pre.raw').isVisible(), true);
  ok('the view choice stays when the tab changes');
  await page.click('[data-view="rendered"]');
  assert.equal(await page.locator('#tab-example-016 .doc').isVisible(), true);
  ok('Rendered switches back');

  // Back and forward follow the hash.
  await page.goBack();
  await expectTab('example-015', 'Back returns to the previous tab');

  // Load with a hash.
  await page.goto(url + '#example-010');
  await page.waitForSelector('body[data-ready=true]');
  await expectTab('example-010', 'a #example-010 address opens that tab');
  if (shots) await page.screenshot({path: path.join(shots, 'desktop.png')});

  // Phone width: no horizontal page scroll.
  await page.setViewportSize({width: 375, height: 800});
  for (const tab of ['index', 'example-001', 'example-021']) {
    await page.click(`nav.tabs a[data-tab="${tab}"]`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `${tab}: page is ${over}px wider than a phone screen`);
  }
  ok('no horizontal page scroll at 375px');
  if (shots) await page.screenshot({path: path.join(shots, 'phone.png')});

  // Dark mode changes the colors.
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({colorScheme: 'light'});
  const light = await bg();
  await page.emulateMedia({colorScheme: 'dark'});
  const dark = await bg();
  assert.equal(light, 'rgb(255, 255, 255)', 'light background is Lights Out white');
  assert.equal(dark, 'rgb(0, 0, 0)', 'dark background is Lights Out black');
  ok('Lights Out colors: white in light mode, black in dark mode');
  const bar = await page.evaluate(() => getComputedStyle(document.querySelector('nav.tabs a[aria-selected="true"]'), '::after').backgroundColor);
  assert.equal(bar, 'rgb(29, 155, 240)', 'the open tab has the dark-mode accent bar (#1d9bf0)');
  ok('the open tab has the accent bar');

  assert.deepEqual(errors, [], 'no page errors');
  ok('no page errors');

  // Embedded as the docsite embeds it: an <iframe srcdoc> with no address of its own.
  // History calls throw there, and a bare "#tab" link would resolve against the host page.
  const host = await ctx.newPage();
  const hostErrors = [];
  host.on('pageerror', (e) => hostErrors.push(e.message));
  const hostFile = path.join(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'viewer-host-')), 'host.html');
  fs.writeFileSync(hostFile, '<!doctype html><title>host</title><body></body>');
  await host.goto('file://' + hostFile + '#host');
  await host.evaluate((html) => {
    document.body.innerHTML = '';
    const f = document.createElement('iframe');
    f.style.cssText = 'width:1200px;height:800px';
    f.srcdoc = html;
    document.body.append(f);
  }, fs.readFileSync(path.resolve(file), 'utf8'));
  const fr = host.frameLocator('iframe');
  await fr.locator('body[data-ready=true]').waitFor({timeout: 10000});
  const shown = () => fr.locator('section.tab:not([hidden])').getAttribute('id');
  await fr.locator('nav.tabs a[data-tab="example-021"]').click();
  assert.equal(await shown(), 'tab-example-021', 'in a frame: a tab opens');
  await fr.locator('#tab-example-021 .doc a:text("← All examples")').click();
  assert.equal(await shown(), 'tab-index', 'in a frame: the back-link opens the Index');
  await fr.locator('#tab-index .doc table a[data-src="examples/example_007.md"] >> nth=0').click();
  assert.equal(await shown(), 'tab-example-007', 'in a frame: an index link opens its example');
  await fr.locator('#tab-example-007 [data-step="next"]').click();
  await fr.locator('#jump').selectOption('example-015');
  assert.equal(await shown(), 'tab-example-015', 'in a frame: Next and Jump to work');
  assert.equal(await fr.locator('body[data-ready=true]').count(), 1, 'in a frame: the viewer never navigated away');
  assert.equal(new URL(host.url()).hash, '#host', 'in a frame: the host page keeps its address');
  assert.deepEqual(hostErrors, [], 'in a frame: no page errors');
  ok('embedded in an <iframe srcdoc> (as in the docsite): tabs, links, Next and Jump to work');
  await browser.close();
})().catch((e) => { console.error('FAIL ' + e.message); process.exit(1); });
