// Tests for the single-page HTML docs (docs/docsite/index.html), built from
// the Markdown pages by src/scripts/build-docs-html.mjs (npm run docs:html).
//
// The bundle must hold every page and diagram, be up to date, and, when a
// browser is available, render every page and resolve every link in it.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { PKG_SRC, tempDir } from "./helpers.mjs";

const DOCS = join(PKG_SRC, "docs", "docsite");
const OUT = join(DOCS, "index.html");
const BUILDER = join(PKG_SRC, "src", "scripts", "build-docs-html.mjs");
const { version } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));

const load = () => import(pathToFileURL(BUILDER).href);

/** The JSON data embedded in a built page. */
function data(html) {
  const m = /const DATA = (\{.*?\});\n/s.exec(html);
  assert.ok(m, "docs data not embedded");
  return JSON.parse(m[1].replaceAll("<\\/", "</"));
}

/** Every *.md under <dir>, as posix paths relative to it. */
function mdPages(dir, rel = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? mdPages(join(dir, e.name), rel + e.name + "/") : e.name.endsWith(".md") ? [rel + e.name] : [],
  );
}

describe("build-docs-html", () => {
  test("docs/docsite/index.html is up to date (run: npm run docs:html)", async () => {
    const { build } = await load();
    assert.ok(existsSync(OUT), "docs/docsite/index.html is missing");
    assert.equal(readFileSync(OUT, "utf8"), build(DOCS).html, "index.html is stale: run npm run docs:html");
  });

  test("the bundle holds every page and every diagram, in tabs that follow the landing page", async () => {
    const { build } = await load();
    const d = data(build(DOCS).html);
    assert.deepEqual(d.pages.map((p) => p.path).sort(), mdPages(DOCS).sort());
    assert.deepEqual(
      Object.keys(d.images).sort(),
      readdirSync(join(DOCS, "images")).filter((f) => f.endsWith(".svg")).map((f) => `images/${f}`).sort(),
    );
    for (const uri of Object.values(d.images)) assert.match(uri, /^data:image\/svg\+xml;base64,/);
    assert.deepEqual(d.tabs.map((t) => t.id), ["home", "getting-started", "skills", "tutorial", "guides", "concepts", "reference", "faq"]);
    for (const p of d.pages) assert.equal(p.md, readFileSync(join(DOCS, p.path), "utf8"), `${p.path} changed in the bundle`);
  });

  test("the page is a complete HTML document with the version filled in", async () => {
    const { build } = await load();
    const { html } = build(DOCS);
    assert.match(html, /^<!doctype html>\n<html lang="en" data-skin="[a-z]+">/);
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    assert.ok(html.includes(`v${version}`), "version missing");
    for (const ph of ["{{VERSION}}", "{{REPO}}", "/*__DOCS_DATA__*/"]) assert.ok(!html.includes(ph), `${ph} was left unfilled`);
    assert.equal(html.split("<script").length, html.split("</script>").length);
    assert.match(html, /<title>aiskills documentation<\/title>/);
  });

  test("links to files outside the docs point at GitHub on --ref (default master)", async () => {
    const { build } = await load();
    assert.equal(
      data(build(DOCS).html).repoBase,
      "https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/docs/docsite/",
    );
    assert.equal(
      data(build(DOCS, { ref: "some-branch" }).html).treeBase,
      "https://github.com/sugatoray/aiskills/tree/some-branch/src/packages/aiskills/docs/docsite/",
    );
  });

  test("a page not linked from a section of README.md is an error", async () => {
    const { build } = await load();
    const dir = tempDir();
    try {
      mkdirSync(join(dir, "images"));
      writeFileSync(join(dir, "README.md"), "# Lib\n\nIntro.\n\n### Guides\n\n- [A](a.md): a\n");
      writeFileSync(join(dir, "a.md"), "# A\n");
      writeFileSync(join(dir, "orphan.md"), "# Orphan\n");
      assert.throws(() => build(dir), /pages not linked from a section of README\.md: orphan\.md/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the landing page opens with the banner, without its editing features (as in callai)", async () => {
    const { build } = await load();
    const { html } = build(DOCS);
    const d = data(html);
    const banner = d.banner;
    assert.ok(banner && banner.trimStart().startsWith('<div id="banner">'), "banner markup missing");
    assert.ok(banner.includes(`<b>v${version}</b>`), "banner shows the package version");
    assert.ok(!/data-edit|contenteditable|id="pills"/.test(banner), "editing hooks left in the banner");
    assert.ok(!banner.includes("<h1") && banner.includes('<div class="name">'), "the wordmark must not be a page heading");
    assert.ok(html.includes("#banner .terminal"), "banner CSS missing");
    assert.ok(!html.includes("#banner.editing") && !html.includes("html.bare"), "editor CSS leaked into the docs page");
    assert.ok(d.bannerLabel.startsWith("aiskills: "), "banner label");
    const home = d.pages.find((p) => p.id === "home");
    assert.equal(home.md, readFileSync(join(DOCS, "README.md"), "utf8"), "the Markdown landing page is unchanged");
  });

  test("the page opens in the default theme and has a gear menu with every theme (top right)", async () => {
    const { build } = await load();
    const { THEMES, DEFAULT_THEME, fontsHref, themeById } = await import(pathToFileURL(join(PKG_SRC, "src", "scripts", "themes.mjs")).href);
    const { html } = build(DOCS);
    assert.match(html, new RegExp(`<html lang="en" data-skin="${DEFAULT_THEME}">`));
    const header = html.slice(html.indexOf('<header class="top">'), html.indexOf("</header>"));
    const gear = /<button class="icon-btn skin-btn" id="skin-btn"[^>]*>/.exec(header)?.[0] ?? "";
    assert.ok(gear, "gear button missing from the header");
    for (const attr of ['aria-label="Choose a theme"', 'aria-haspopup="menu"', 'aria-controls="skin-menu"', 'aria-expanded="false"']) assert.ok(gear.includes(attr), attr);
    assert.ok(header.indexOf('id="skin-btn"') < header.indexOf('id="theme-btn"'), "gear sits before the light/dark button");
    const menu = html.slice(html.indexOf('id="skin-menu"'), html.indexOf("</div>", html.indexOf('id="skin-menu"')) + 400);
    const items = [...html.matchAll(/role="menuitemradio" data-skin="([a-z]+)"/g)].map((m) => m[1]);
    assert.deepEqual(items, THEMES.map((t) => t.id));
    assert.ok(menu.includes('role="menu"'));
    assert.ok(html.includes(fontsHref(themeById(DEFAULT_THEME))), "the default theme's fonts load up front");
    assert.ok(html.indexOf("aiskills-docs-skin") < html.indexOf("</head>"), "the saved theme is applied in <head>, before the page paints");
    for (const t of THEMES.filter((x) => x.id !== "teal")) assert.ok(html.includes(`:root[data-skin="${t.id}"]`), `${t.id} CSS missing`);
  });

  test("--no-banner leaves the banner out", async () => {
    const { build } = await load();
    const { html } = build(DOCS, { banner: null });
    assert.equal(data(html).banner, null);
    assert.ok(!html.includes("#banner .terminal") && !html.includes("/*__BANNER_CSS__*/"));
  });

  test("a banner page without the markers is an error", async () => {
    const { build } = await load();
    const dir = tempDir();
    try {
      const plain = join(dir, "plain.html");
      writeFileSync(plain, "<html><body><div id='banner'></div></body></html>");
      assert.throws(() => build(DOCS, { banner: plain }), /banner:html:start/);
      assert.throws(() => build(DOCS, { banner: join(dir, "missing.html") }), /banner page not found/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the command-line entry point writes the file", async () => {
    const { main } = await load();
    const dir = tempDir();
    try {
      const out = join(dir, "x", "docs.html");
      main([DOCS, "--out", out, "--ref", "v0"]);
      assert.equal(data(readFileSync(out, "utf8")).repoBase.includes("/blob/v0/"), true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ------------------------------------------------------------ in a browser

const require = createRequire(import.meta.url);
let playwright = null;
try {
  playwright = require("playwright");
} catch {}
const online = await fetch("https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js", { method: "HEAD" })
  .then((r) => r.ok)
  .catch(() => false);
const noBrowser = !playwright ? "playwright not installed" : !online ? "cdnjs.cloudflare.com unreachable" : false;

describe("index.html in a browser", { skip: noBrowser }, () => {
  test("every page renders, and every link goes to a page and heading that exist", async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(pathToFileURL(OUT).href);
      await page.waitForSelector("#doc h1");
      const ids = await page.evaluate(() => DATA.pages.map((p) => p.id));
      const repoBase = await page.evaluate(() => DATA.repoBase);
      const problems = [];
      const anchorsOf = new Map();
      const links = [];
      for (const id of ids) {
        await page.evaluate((h) => (location.hash = h), id);
        await page.waitForFunction((h) => document.title && document.querySelector("#doc h1") && location.hash === "#" + h, id);
        const info = await page.evaluate(() => ({
          h1: document.querySelector("#doc h1")?.textContent ?? "",
          anchors: [...document.querySelectorAll("#doc [id]")].map((e) => e.id),
          imgs: [...document.querySelectorAll("#doc img")].map((i) => i.src.slice(0, 30)),
          links: [...document.querySelectorAll("#doc a[href]:not(.anchor)")].map((a) => ({
            href: a.getAttribute("href"),
            anchor: a.dataset.anchor ?? null,
            text: a.textContent,
          })),
          tab: document.querySelector('.tab[aria-selected="true"]')?.textContent ?? "",
        }));
        if (!info.h1) problems.push(`${id}: no title rendered`);
        if (!info.tab) problems.push(`${id}: no tab selected`);
        for (const src of info.imgs) if (!src.startsWith("data:image/svg+xml")) problems.push(`${id}: image not embedded: ${src}`);
        anchorsOf.set(id, new Set(info.anchors));
        for (const l of info.links) links.push({ from: id, ...l });
      }
      for (const l of links) {
        if (l.href.startsWith("#")) {
          const target = l.href.slice(1);
          if (!anchorsOf.has(target)) problems.push(`${l.from}: link to unknown page ${l.href} (${l.text})`);
          else if (l.anchor && !anchorsOf.get(target).has(l.anchor)) problems.push(`${l.from}: no heading #${l.anchor} on ${target} (${l.text})`);
        } else if (l.href.startsWith(repoBase) && /\.md(#|$)/.test(l.href)) {
          problems.push(`${l.from}: link to a docs page that isn't in the bundle: ${l.href} (${l.text})`);
        } else if (!/^https:\/\//.test(l.href)) {
          problems.push(`${l.from}: link neither in the page nor to https: ${l.href}`);
        }
      }
      const outside = links.filter((l) => l.href.includes("github.com/sugatoray/aiskills/blob/"));
      assert.ok(
        outside.some((l) => l.href === "https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md"),
        "the CHANGELOG link should point at GitHub",
      );
      assert.deepEqual(errors, [], "script errors");
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
    }
  });

  test("the banner shows on the landing page only, scaled to the column", async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      await page.goto(pathToFileURL(OUT).href + "#home");
      await page.waitForSelector("#doc h1");
      const hero = await page.locator("#hero").boundingBox();
      const doc = await page.locator("#doc").boundingBox();
      assert.ok(hero && hero.width > 300 && hero.width <= doc.width + 1, `hero ${hero?.width} vs column ${doc.width}`);
      assert.ok(Math.abs(hero.width / hero.height - 2) < 0.02, "2:1 banner");
      const banner = await page.locator("#hero #banner").boundingBox();
      const inner = await page.$eval("#hero", (el) => el.clientWidth); // inside its 1px border
      assert.ok(Math.abs(banner.width - inner) < 1, `banner ${banner.width} scaled to the hero's inner width ${inner}`);
      await page.evaluate(() => (location.hash = "reference-cli"));
      await page.waitForFunction(() => document.title.startsWith("CLI reference"));
      assert.equal(await page.locator("#hero").isVisible(), false, "banner hidden on other pages");
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await phone.goto(pathToFileURL(OUT).href + "#home");
      await phone.waitForSelector("#doc h1");
      assert.ok((await phone.evaluate(() => document.documentElement.scrollWidth)) <= 390, "no sideways scroll on a phone");
    } finally {
      await browser.close();
    }
  });

  test("the gear menu switches themes, remembers the choice, and loads the theme's fonts", async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: "dark" });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(pathToFileURL(OUT).href + "#home");
      await page.waitForSelector("#doc h1");
      const vars = () => page.evaluate(() => ({
        skin: document.documentElement.getAttribute("data-skin"),
        bg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
        font: getComputedStyle(document.querySelector(".doc h1")).fontFamily.split(",")[0].replace(/"/g, ""),
      }));
      assert.deepEqual(await vars(), { skin: "lightsout", bg: "#000000", font: "Geist" }, "Lights Out by default");
      assert.equal(await page.isVisible("#skin-menu"), false);
      await page.click("#skin-btn");
      assert.equal(await page.isVisible("#skin-menu"), true);
      assert.equal(await page.getAttribute("#skin-btn", "aria-expanded"), "true");
      assert.equal(await page.getAttribute('#skin-menu [data-skin="lightsout"]', "aria-checked"), "true");
      await page.click('#skin-menu [data-skin="grimoire"]');
      assert.equal(await page.isVisible("#skin-menu"), false, "choosing closes the menu");
      assert.equal(await page.evaluate(() => document.activeElement.id), "skin-btn", "focus returns to the gear");
      assert.equal((await vars()).skin, "grimoire");
      assert.equal(await page.locator('link[data-skin-fonts="grimoire"]').count(), 1, "Grimoire's fonts are loaded on demand");
      await page.waitForFunction(() => document.fonts.check('16px "Space Grotesk"'), null, { timeout: 15000 });
      await page.reload();
      await page.waitForSelector("#doc h1");
      assert.equal((await vars()).skin, "grimoire", "the choice is remembered");
      // Keyboard: Escape closes, arrows move between themes.
      await page.focus("#skin-btn");
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement.dataset.skin), "grimoire", "focus starts on the current theme");
      await page.keyboard.press("ArrowDown");
      assert.equal(await page.evaluate(() => document.activeElement.dataset.skin), "signal");
      await page.keyboard.press("Escape");
      assert.equal(await page.isVisible("#skin-menu"), false);
      // A click outside closes it too.
      await page.click("#skin-btn");
      await page.mouse.click(700, 600);
      assert.equal(await page.isVisible("#skin-menu"), false);
      // A saved name that isn't a theme falls back to the default.
      await page.evaluate(() => localStorage.setItem("aiskills-docs-skin", "bogus"));
      await page.reload();
      await page.waitForSelector("#doc h1");
      assert.equal((await vars()).skin, "lightsout");
      assert.deepEqual(errors, []);
      // On a phone the menu stays on screen.
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await phone.goto(pathToFileURL(OUT).href + "#home");
      await phone.waitForSelector("#doc h1");
      await phone.click("#skin-btn");
      const box = await phone.locator("#skin-menu").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 390, `menu ${box.x}..${box.x + box.width} on a 390px screen`);
      assert.ok((await phone.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    } finally {
      await browser.close();
    }
  });

  test("search finds a page, and the theme toggle switches to dark", async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(OUT).href);
      await page.waitForSelector("#doc h1");
      await page.fill("#q", "skillsignore");
      await page.waitForSelector(".results .hit");
      assert.ok((await page.textContent(".results")).includes(".skillsignore"));
      await page.click("#theme-btn");
      assert.equal(await page.getAttribute("html", "data-effective"), "dark");
    } finally {
      await browser.close();
    }
  });
});
