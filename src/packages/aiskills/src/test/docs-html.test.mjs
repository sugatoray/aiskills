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
const BUILDER = join(PKG_SRC, "src", "scripts", "docs", "build-docs-html.mjs");
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
    assert.deepEqual(d.tabs.map((t) => t.id), ["home", "getting-started", "skills", "tutorial", "guides", "concepts", "reference", "faq", "license"]);
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

  test("explainer pages ship next to the index, and a docs page introduces and embeds each one", async () => {
    const { build } = await load();
    const d = data(build(DOCS).html);
    assert.deepEqual(d.static, ["explainers/scrolls-explainer.html"], "the HTML pages under docs/docsite/, other than index.html");
    const intro = d.pages.find((p) => p.path === "explainers/scrolls.md");
    assert.ok(intro, "explainers/scrolls.md is a page in the bundle");
    assert.match(intro.md, /<iframe[^>]+data-page="scrolls-explainer\.html"/, "it embeds the explainer");
    assert.doesNotMatch(intro.md, /<iframe[^>]+\ssrc=/, "with no src: a viewer must never request a file that may not be there");
    assert.deepEqual(Object.keys(d.staticHtml ?? {}), d.static, "each one is also embedded, so index.html works on its own");
    assert.equal(
      Buffer.from(d.staticHtml["explainers/scrolls-explainer.html"], "base64").toString("utf8"),
      readFileSync(join(DOCS, "explainers", "scrolls-explainer.html"), "utf8"),
      "embedded as base64 (raw HTML would hold <script> tags inside this page's own <script>)",
    );
    assert.match(intro.md, /\]\(scrolls-explainer\.html\)/, "and links to it full-size");
    const skillsTab = d.tabs.find((t) => t.label === "Skills");
    assert.ok(skillsTab.pages.includes("explainers/scrolls.md"), "listed in the Skills tab");
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
    const { THEMES, DEFAULT_THEME, fontsHref, themeById } = await import(pathToFileURL(join(PKG_SRC, "src", "scripts", "docs", "themes.mjs")).href);
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

  test("only the default theme's fonts load up front; every other theme's (Teal's too) load when chosen", async () => {
    const { build } = await load();
    const { THEMES, DEFAULT_THEME, fontsHref, themeById } = await import(pathToFileURL(join(PKG_SRC, "src", "scripts", "docs", "themes.mjs")).href);
    const { html } = build(DOCS);
    const head = html.slice(0, html.indexOf("</head>"));
    const sheets = [...head.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
    assert.deepEqual(sheets, [fontsHref(themeById(DEFAULT_THEME))]);
    const fonts = JSON.parse(/var FONTS = (\{.*?\}), saved/.exec(head)[1]);
    for (const t of THEMES) assert.equal(fonts[t.id], t.id === DEFAULT_THEME ? "" : fontsHref(t), t.id);
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

describe("build-docs-html: the version menu", () => {
  // The site: dev/ (in development), the root (latest release), v/<version>/ (older releases).
  const ENTRIES = [
    { version: "1.3.0-dev", path: "dev/", kind: "dev" },
    { version: "1.2.0", path: "", kind: "latest" },
    { version: "1.1.0", path: "v/1.1.0/", kind: "older" },
  ];
  const menuFor = (current, base) => ({ current, base, entries: ENTRIES });
  /** The version menu's links, as [href, text, current]. */
  const menu = (html) =>
    [...(/<div class="ver-list">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "").matchAll(/<a href="([^"]+)"( aria-current="page")?>([\s\S]*?)<\/a>/g)].map(
      (m) => [m[1], m[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), Boolean(m[2])],
    );
  const note = (html) => /<div class="channel-note" role="note">([\s\S]*?)<\/div>/.exec(html)?.[1];

  test("by default the header shows package.json's version, with no menu or notice", async () => {
    const { build } = await load();
    const { html } = build(DOCS);
    assert.ok(html.includes(`<span class="brand-ver">v${version}</span>`));
    assert.ok(!html.includes('class="ver-menu"') && !html.includes('class="channel-note"'));
  });

  test("--version sets the version the page shows", async () => {
    const { build } = await load();
    const { html } = build(DOCS, { version: "9.9.9" });
    assert.ok(html.includes('<span class="brand-ver">v9.9.9</span>'));
    if (version !== "9.9.9") assert.ok(!html.includes(`<span class="brand-ver">v${version}</span>`));
  });

  test("the latest release's page (the site root) lists every version and has no notice", async () => {
    const { build } = await load();
    const { html } = build(DOCS, { version: "1.2.0", menu: menuFor("1.2.0", "") });
    assert.match(html, /<details class="ver-menu"><summary class="brand-ver" title="Docs version">v1\.2\.0<\/summary>/);
    assert.deepEqual(menu(html), [
      ["dev/", "1.3.0-dev in development", false],
      ["./", "1.2.0 latest release", true],
      ["v/1.1.0/", "1.1.0 older release", false],
    ]);
    assert.equal(note(html), undefined);
    assert.ok(!html.includes('<span class="brand-ver">'), "the menu replaces the plain badge");
  });

  test("the dev page links up to the root and says it isn't released yet", async () => {
    const { build } = await load();
    const { html } = build(DOCS, { version: "1.3.0-dev", menu: menuFor("1.3.0-dev", "../") });
    assert.match(html, /<summary class="brand-ver" title="Docs version">v1\.3\.0-dev<\/summary>/);
    assert.deepEqual(menu(html), [
      ["../dev/", "1.3.0-dev in development", true],
      ["../", "1.2.0 latest release", false],
      ["../v/1.1.0/", "1.1.0 older release", false],
    ]);
    assert.match(note(html), /<b>1\.3\.0-dev<\/b>, which is not released yet/);
    assert.match(note(html), /<a href="\.\.\/">1\.2\.0 docs<\/a>/);
  });

  test("an older release's page says so and links to the latest", async () => {
    const { build } = await load();
    const { html } = build(DOCS, { version: "1.1.0", menu: menuFor("1.1.0", "../../") });
    assert.deepEqual(menu(html).map((l) => [l[0], l[2]]), [
      ["../../dev/", false],
      ["../../", false],
      ["../../v/1.1.0/", true],
    ]);
    assert.match(note(html), /<b>1\.1\.0<\/b>, an older release/);
    assert.match(note(html), /<a href="\.\.\/\.\.\/">1\.2\.0 docs<\/a>/);
  });

  test("a site without a version in development has no dev entry", async () => {
    const { build } = await load();
    const entries = ENTRIES.filter((e) => e.kind !== "dev");
    const { html } = build(DOCS, { version: "1.2.0", menu: { current: "1.2.0", base: "", entries } });
    assert.deepEqual(menu(html).map((l) => l[0]), ["./", "v/1.1.0/"]);
  });

  test("a bad menu is an error", async () => {
    const { build } = await load();
    assert.throws(() => build(DOCS, { menu: menuFor("9.9.9", "") }), /version menu: 9\.9\.9 is not one of its versions/);
    assert.throws(() => build(DOCS, { menu: { current: "1.2.0", base: "", entries: [{ version: "1.2.0", path: "", kind: "beta" }] } }), /version menu: unknown kind: beta/);
    assert.throws(() => build(DOCS, { menu: { current: "1.1.0", base: "", entries: [ENTRIES[2]] } }), /version menu: needs exactly one latest release/);
  });

  test("the command line takes --version and --menu (JSON)", async () => {
    const { main } = await load();
    const dir = tempDir();
    const err = console.error;
    console.error = () => {};
    try {
      const out = join(dir, "v", "1.1.0", "index.html");
      main([DOCS, "--out", out, "--version", "1.1.0", "--menu", JSON.stringify(menuFor("1.1.0", "../../"))]);
      const html = readFileSync(out, "utf8");
      assert.deepEqual(menu(html).map((l) => l[0]), ["../../dev/", "../../", "../../v/1.1.0/"]);
      assert.ok(html.includes('class="channel-note"'));
      assert.throws(() => main([DOCS, "--out", out, "--menu", "{nope"]), /version menu: --menu is not valid JSON/);
    } finally {
      console.error = err;
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
      const statics = await page.evaluate(() => DATA.static ?? []);
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
            page: a.dataset.page ?? null,
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
        } else if (statics.includes(l.href) || (l.page && statics.includes(l.page))) {
          // an explainer page: next to index.html, or its embedded copy (both checked to load below)
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

  test("the scrolls explainer page embeds the explainer, which loads and plays", async () => {
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(pathToFileURL(OUT).href + "#explainers-scrolls");
      await page.waitForSelector("#doc iframe");
      const frame = page.frameLocator("#doc iframe");
      await frame.locator("#network-flow[data-ready=true]").waitFor();
      assert.equal(await frame.locator(".rf-tab").count(), 9, "Overview plus 8 tabs");
      const box = await page.locator("#doc iframe").boundingBox();
      const doc = await page.locator("#doc").boundingBox();
      assert.ok(box.width > doc.width * 0.95 && box.height >= 600, `iframe ${box.width}x${box.height} fills the column`);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });

  for (const [label, viewport] of [["desktop", { width: 1400, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
    test(`index.html on its own (no explainers/ folder next to it) shows the explainer and opens it full-size, on a ${label}`, async () => {
      // A viewer or preview that only gets index.html: the explainer must come from the bundle itself,
      // and nothing may navigate to (or request) a file next to index.html.
      const dir = tempDir();
      const lone = join(dir, "index.html");
      writeFileSync(lone, readFileSync(OUT));
      const browser = await playwright.chromium.launch();
      try {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        const missing = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("requestfailed", (r) => { if (r.url().startsWith("file:")) missing.push(r.url()); });
        await page.goto(pathToFileURL(lone).href + "#explainers-scrolls");
        await page.waitForSelector("#doc iframe");
        assert.equal(await page.getAttribute("#doc iframe", "src"), null, "no src on the frame");
        await page.frameLocator("#doc iframe").locator("#network-flow[data-ready=true]").waitFor({ timeout: 10000 });
        assert.equal(await page.frameLocator("#doc iframe").locator(".rf-tab").count(), 9, "the embedded explainer loads with all its tabs");
        // "Open the explainer full-size": an overlay in this page, not a navigation.
        const before = page.url();
        await page.click('#doc a:has-text("Open the explainer full-size")');
        await page.waitForSelector(".explainer-overlay iframe");
        assert.equal(page.url(), before, "no navigation");
        assert.equal(context.pages().length, 1, "no new tab");
        const ov = await page.locator(".explainer-overlay").boundingBox();
        assert.ok(Math.abs(ov.width - viewport.width) <= 1 && Math.abs(ov.height - viewport.height) <= 1, `overlay ${ov.width}x${ov.height} fills the screen`);
        await page.frameLocator(".explainer-overlay iframe").locator("#network-flow[data-ready=true]").waitFor({ timeout: 10000 });
        assert.equal(await page.frameLocator(".explainer-overlay iframe").locator(".rf-tab").count(), 9);
        const overflow = await page.frameLocator(".explainer-overlay iframe").locator("body").evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, "the explainer fits the screen width");
        await page.click(".explainer-overlay .explainer-close");
        assert.equal(await page.locator(".explainer-overlay").count(), 0, "✕ closes it");
        await page.click('#doc a:has-text("Open the explainer full-size")');
        await page.waitForSelector(".explainer-overlay");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator(".explainer-overlay").count(), 0, "Esc closes it");
        assert.deepEqual(missing, [], "nothing requested a missing file");
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }

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

describe("the versioned pages in a browser", { skip: noBrowser }, () => {
  test("the menu and the notices switch versions on the same page, and the phone header fits", async () => {
    const { main } = await load();
    const { createServer } = await import("node:http");
    const site = tempDir();
    const entries = [
      { version: "1.3.0-dev", path: "dev/", kind: "dev" },
      { version: "1.2.0", path: "", kind: "latest" },
      { version: "1.1.0", path: "v/1.1.0/", kind: "older" },
    ];
    const err = console.error;
    console.error = () => {};
    try {
      for (const e of entries) {
        const base = "../".repeat(e.path.split("/").filter(Boolean).length);
        main([DOCS, "--out", join(site, e.path, "index.html"), "--version", e.version, "--menu", JSON.stringify({ current: e.version, base, entries })]);
      }
    } finally {
      console.error = err;
    }
    const server = createServer((req, res) => {
      const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = join(site, path.endsWith("/") ? path + "index.html" : path);
      if (!existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": file.endsWith(".html") ? "text/html" : "application/octet-stream" }).end(readFileSync(file));
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await playwright.chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const pick = async (href, url) => {
        await page.click(".ver-menu summary");
        await page.click(`.ver-list a[href="${href}"]`);
        await page.waitForURL(url);
        await page.waitForSelector("#doc h1");
      };
      await page.goto(`${base}/#reference-cli`);
      await page.waitForSelector("#doc h1");
      await pick("dev/", `${base}/dev/#reference-cli`);
      assert.equal(await page.textContent(".ver-menu summary"), "v1.3.0-dev");
      await pick("../v/1.1.0/", `${base}/v/1.1.0/#reference-cli`);
      assert.match(await page.textContent(".channel-note"), /an older release/);
      await page.click(".ver-menu summary");
      await page.keyboard.press("Escape");
      assert.equal(await page.isVisible(".ver-list"), false, "Escape closes the menu");
      await page.click(".channel-note a");
      await page.waitForURL(`${base}/#reference-cli`);
      assert.deepEqual(errors, []);

      const phone = await browser.newPage({ ...playwright.devices["iPhone 13"] });
      for (const url of [`${base}/`, `${base}/dev/`, `${base}/v/1.1.0/`]) {
        await phone.goto(url);
        await phone.waitForSelector("#doc h1");
        const fit = await phone.evaluate(() => {
          const box = (s) => document.querySelector(s).getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            searchEnd: box("#q").right,
            gear: box(".skin-btn").left,
            menu: box(".ver-menu summary").width > 0,
          };
        });
        assert.equal(fit.overflow, 0, `${url}: the page scrolls sideways on a phone`);
        assert.ok(fit.searchEnd <= fit.gear, `${url}: the search box covers the theme button`);
        assert.ok(fit.menu, `${url}: the version button is hidden on a phone`);
      }
    } finally {
      await browser.close();
      server.close();
      rmSync(site, { recursive: true, force: true });
    }
  });
});
