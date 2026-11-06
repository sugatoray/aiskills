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
    assert.match(html, /^<!doctype html>\n<html lang="en">/);
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
