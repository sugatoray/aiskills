// Tests for the banner (docs/banner/), built by src/scripts/create-banner.mjs
// from src/scripts/banner-template.html and docs/banner/config.yaml, the same
// way sugatoray/callai builds its banner in src/tools/banner/.
//
//   npm run banner        rebuild docs/banner/aiskills-banner.html
//   npm run banner:check  exit 1 if it is out of date
//   npm run banner:png    also render docs/banner/banner_2x.png (needs Playwright)
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";

import { PKG_SRC, REPO_ROOT, tempDir } from "./helpers.mjs";
import { SKILLS_CLI_VERSION } from "../scripts/installer.mjs";
import { createHash } from "node:crypto";
import { THEMES, DEFAULT_THEME, bannerSkinCss } from "../scripts/themes.mjs";

/** The tEXt chunks of a PNG, as { keyword: text }. */
function pngText(buf) {
  const out = {};
  for (let i = 8; i < buf.length; ) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString("ascii", i + 4, i + 8);
    if (type === "tEXt") {
      const body = buf.subarray(i + 8, i + 8 + len);
      const nul = body.indexOf(0);
      out[body.toString("latin1", 0, nul)] = body.toString("latin1", nul + 1);
    }
    i += 12 + len;
  }
  return out;
}

const BUILDER = join(PKG_SRC, "src", "scripts", "create-banner.mjs");
const BANNER_DIR = join(PKG_SRC, "docs", "banner");
const PAGE = join(BANNER_DIR, "aiskills-banner.html");
const PNG = join(BANNER_DIR, "banner_2x.png");
const pkg = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
const load = () => import(pathToFileURL(BUILDER).href);

/** The banner's own markup, between the markers. */
const bannerMarkup = (html) => html.split("<!-- banner:html:start -->")[1].split("<!-- banner:html:end -->")[0];

describe("config.yaml", () => {
  test("is read as double-quoted strings and lists of them, with comments", async () => {
    const { parseConfig } = await load();
    const cfg = parseConfig('# c\na: "x"\nb: "say \\"hi\\""\n\nlist:\n  - "one"\n  - "two"\n');
    assert.deepEqual(cfg, { a: "x", b: 'say "hi"', list: ["one", "two"] });
  });

  test("an unquoted value or an unknown line is an error, with its line number", async () => {
    const { parseConfig } = await load();
    assert.throws(() => parseConfig('a: "x"\nb: y\n'), /line 2: .*double-quoted/);
    assert.throws(() => parseConfig("  - \"orphan\"\n"), /line 1/);
  });
});

describe("values", () => {
  test('"auto" values come from package.json, the bundled skills and the pinned skills CLI', async () => {
    const { resolveValues, readConfig } = await load();
    const v = resolveValues(readConfig());
    assert.equal(v.package_name, pkg.name);
    assert.equal(v.package_version, pkg.version);
    assert.equal(v.node_requires, "≥ " + pkg.engines.node.replace(/^>=\s*/, ""));
    assert.equal(v.license, pkg.license);
    assert.equal(v.repo_url, "https://github.com/sugatoray/aiskills");
    assert.equal(v.skills_cli_version, SKILLS_CLI_VERSION);
    const market = JSON.parse(readFileSync(join(REPO_ROOT, ".claude-plugin", "marketplace.json"), "utf8"));
    const local = market.plugins.filter((p) => typeof p.source === "string");
    assert.deepEqual(v.groups, local.map((p) => p.name.replace(/-skills$/, "")));
    assert.equal(v.groups_count, String(local.length));
    assert.equal(v.skills_count, "13");
    assert.equal(v.version_label, `v${pkg.version}`);
    assert.equal(v.counts_label, `13 skills · ${local.length} groups`);
  });

  test("the banner's theme is Lights Out by default, and must be a known theme", async () => {
    const { resolveValues, readConfig } = await load();
    assert.equal(readConfig().theme, DEFAULT_THEME);
    assert.equal(resolveValues(readConfig()).theme, "lightsout");
    assert.equal(resolveValues(readConfig(), { set: { theme: "paper" } }).theme, "paper");
    assert.throws(() => resolveValues(readConfig(), { set: { theme: "nope" } }), /unknown theme: nope/);
  });

  test("--package-version and --set override the config", async () => {
    const { resolveValues, readConfig } = await load();
    const v = resolveValues(readConfig(), { packageVersion: "9.9.9", set: { tagline: "Hello", groups: "a,b" } });
    assert.equal(v.version_label, "v9.9.9");
    assert.equal(v.tagline, "Hello");
    assert.deepEqual(v.groups, ["a", "b"]);
  });

  test("an unknown --set key is an error", async () => {
    const { resolveValues, readConfig } = await load();
    assert.throws(() => resolveValues(readConfig(), { set: { nope: "x" } }), /unknown key: nope/);
  });
});

describe("render", () => {
  test("fills every placeholder and escapes HTML in values", async () => {
    const { resolveValues, readConfig, render } = await load();
    const html = render(resolveValues(readConfig(), { set: { tagline: "<b>&</b>" } }));
    assert.ok(!/\{\{\s*\w+\s*\}\}/.test(html), "a placeholder was left");
    assert.ok(html.includes("&lt;b&gt;&amp;&lt;/b&gt;"));
    assert.match(html, /^<!doctype html>/);
  });

  test("the banner shows the version, counts, install command, groups and the real CLI output", async () => {
    const { resolveValues, readConfig, render } = await load();
    const v = resolveValues(readConfig());
    const banner = bannerMarkup(render(v));
    assert.ok(banner.includes(`<b>v${pkg.version}</b>`));
    assert.ok(banner.includes("13 skills · 6 groups"));
    assert.ok(banner.includes(`npm install -g ${pkg.name}`));
    for (const g of v.groups) assert.ok(banner.includes(`<span class="pill">${g}</span>`), g);
    assert.ok(banner.includes(`skills@${SKILLS_CLI_VERSION} add`), "pinned skills version in the demo");
    assert.ok(banner.includes("[aiskills] bundled: scrolls-help, … (7)"), "real bundled line for the scrolls group");
    assert.ok(banner.includes("github.com/sugatoray/aiskills"));
  });

  test("the page opens in the configured theme, with a gear menu of every theme in its toolbar", async () => {
    const { resolveValues, readConfig, render } = await load();
    const html = render(resolveValues(readConfig()));
    assert.match(html, /<html lang="en" data-skin="lightsout">/);
    const toolbar = html.slice(html.indexOf('<div class="toolbar"'), html.indexOf('<p class="hint">'));
    assert.match(toolbar, /<button class="btn ghost skin-btn" id="skinBtn"[^>]*aria-haspopup="menu"[^>]*>/);
    const items = [...html.matchAll(/role="menuitemradio" data-skin="([a-z]+)"/g)].map((m) => m[1]);
    assert.deepEqual(items, THEMES.map((t) => t.id));
    const css = html.split("banner:css:start")[1].split("banner:css:end")[0];
    assert.ok(css.includes(bannerSkinCss().trim()), "theme CSS sits between the banner:css markers, so the docs page gets it");
    const other = render(resolveValues(readConfig(), { set: { theme: "paper" } }));
    assert.match(other, /<html lang="en" data-skin="paper">/);
  });

  test("docs/banner/aiskills-banner.html is up to date (run: npm run banner)", async () => {
    const res = spawnSync(process.execPath, [BUILDER, "--check"], { encoding: "utf8" });
    assert.equal(res.status, 0, res.stdout + res.stderr);
  });

  test("--check fails, and writes nothing, when the page is stale", async () => {
    const dir = tempDir();
    try {
      const out = join(dir, "page.html");
      const res = spawnSync(process.execPath, [BUILDER, "--check", "--out", out], { encoding: "utf8" });
      assert.equal(res.status, 1);
      assert.match(res.stderr, /out of date/);
      assert.ok(!existsSync(out));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("where the banner is used", () => {
  test("the package README opens with the PNG, by an absolute URL that npm can show", () => {
    const first = readFileSync(join(PKG_SRC, "README.md"), "utf8").split("\n")[0];
    const m = /^!\[([^\]]+)\]\((https:\/\/raw\.githubusercontent\.com\/sugatoray\/aiskills\/master\/(.+))\)$/.exec(first);
    assert.ok(m, `README.md line 1: ${first}`);
    assert.ok(m[1].startsWith("aiskills: "), "alt text");
    assert.ok(existsSync(join(REPO_ROOT, m[3])), `${m[3]} doesn't exist in the repo`);
    assert.equal(join(REPO_ROOT, m[3]), PNG);
  });

  test("banner_2x.png records the theme and the page it was rendered from (run: npm run banner:png)", () => {
    const text = pngText(readFileSync(PNG));
    assert.equal(text["aiskills:theme"], DEFAULT_THEME);
    const sha = createHash("sha256").update(readFileSync(PAGE)).digest("hex");
    assert.equal(text["aiskills:page-sha256"], sha, "banner_2x.png is older than aiskills-banner.html: run npm run banner:png");
  });

  test("banner_2x.png is a 2560x1280 PNG", () => {
    const buf = readFileSync(PNG);
    assert.equal(buf.toString("ascii", 1, 4), "PNG");
    assert.equal(buf.readUInt32BE(16), 2560);
    assert.equal(buf.readUInt32BE(20), 1280);
  });

  test("nothing about the banner ships in the npm package", () => {
    assert.ok(!pkg.files.some((f) => /banner|^docs/.test(f)), pkg.files.join(", "));
  });
});

// ------------------------------------------------------------ in a browser

const require = createRequire(import.meta.url);
let playwright = null;
try {
  playwright = require("playwright");
} catch {}
const online = await fetch("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js", { method: "HEAD" })
  .then((r) => r.ok)
  .catch(() => false);
const noBrowser = !playwright ? "playwright not installed" : !online ? "cdn.jsdelivr.net unreachable" : false;

describe("the banner page in a browser", { skip: noBrowser }, () => {
  const open = async (fn, query = "") => {
    const browser = await playwright.chromium.launch();
    try {
      const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => d.accept());
      await page.goto(pathToFileURL(PAGE).href + query, { waitUntil: "networkidle" });
      await fn(page);
      assert.deepEqual(errors, [], "script errors");
    } finally {
      await browser.close();
    }
  };

  test("edits are saved in the browser, kept after a reload, and Reset restores the original", () =>
    open(async (p) => {
      await p.click("#editToggle");
      assert.equal(await p.locator("#banner [contenteditable=true]").count(), 13);
      await p.locator("#banner .tagline").evaluate((el) => (el.textContent = "Edited."));
      await p.locator("#pills .pill").last().click();
      await p.keyboard.press("End");
      await p.keyboard.press("Enter");
      await p.keyboard.type("extra");
      await p.click("#editToggle");
      assert.equal(await p.locator("#pills .pill").count(), 7);
      await p.reload({ waitUntil: "networkidle" });
      assert.equal(await p.textContent("#banner .tagline"), "Edited.");
      await p.click("#resetBtn");
      assert.notEqual(await p.textContent("#banner .tagline"), "Edited.");
      assert.equal(await p.locator("#pills .pill").count(), 6);
    }));

  test("ink that can't be read on a background can't be chosen", () =>
    open(async (p) => {
      const disabled = () => p.$$eval("#inkSeg button", (bs) => bs.filter((b) => b.disabled).map((b) => b.dataset.ink).join(",") || "none");
      await p.click('#inkSeg [data-ink="light"]');
      await p.click('#bgSeg [data-bg="white"]');
      assert.equal(await disabled(), "light");
      assert.equal(await p.$eval('#inkSeg [aria-pressed="true"]', (b) => b.dataset.ink), "auto");
      await p.click('#bgSeg [data-bg="black"]');
      assert.equal(await disabled(), "dark");
      await p.click('#bgSeg [data-bg="transparent"]');
      assert.equal(await disabled(), "none");
    }));

  test("every allowed background and ink keeps text contrast at 4.5:1 or more", () =>
    open(async (p) => {
      const looks = [["as-is", "light", "rgb(13,21,23)"], ["white", "dark", "rgb(255,255,255)"], ["black", "light", "rgb(0,0,0)"],
                     ["transparent", "light", "rgb(13,21,23)"], ["transparent", "dark", "rgb(255,255,255)"]];
      for (const [bg, ink, under] of looks) {
        const [low, what] = await p.evaluate(({ bg, ink, under }) => {
          const banner = document.getElementById("banner");
          banner.classList.remove("bg-white", "bg-black", "bg-transparent", "ink-dark");
          if (bg !== "as-is") banner.classList.add("bg-" + bg);
          if (ink === "dark") banner.classList.add("ink-dark");
          const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
          const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const ratio = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((m, n) => n - m); return (h + 0.05) / (l + 0.05); };
          const bgOf = (el) => { for (let e = el; e && e !== banner.parentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.5) return c; } return parse(under); };
          let low = 99, what = "";
          for (const el of banner.querySelectorAll("*")) {
            if (!el.offsetParent || el.closest(".mark, .grad") || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            const r = ratio(parse(getComputedStyle(el).color), bgOf(el));
            if (r < low) { low = r; what = el.className || el.tagName; }
          }
          return [low, what];
        }, { bg, ink, under });
        assert.ok(low >= 4.5, `${bg} + ${ink} ink: ${low.toFixed(2)}:1 (${what})`);
      }
    }));

  test("the gear menu switches the banner's theme, and ?export&skin= picks one", async () => {
    await open(async (p) => {
      const bg = () => p.$eval("#banner", (el) => getComputedStyle(el).getPropertyValue("--bg").trim());
      assert.equal(await p.getAttribute("html", "data-skin"), "lightsout");
      assert.equal(await bg(), "#000000");
      assert.equal(await p.isVisible("#skinMenu"), false);
      await p.click("#skinBtn");
      assert.equal(await p.isVisible("#skinMenu"), true);
      await p.click('#skinMenu [data-skin="paper"]');
      assert.equal(await p.getAttribute("html", "data-skin"), "paper");
      assert.equal(await bg(), "#17120e");
      assert.equal(await p.isVisible("#skinMenu"), false);
      await p.reload({ waitUntil: "networkidle" });
      assert.equal(await p.getAttribute("html", "data-skin"), "paper", "the choice is remembered");
    });
    await open(async (p) => {
      assert.equal(await p.getAttribute("html", "data-skin"), "blueprint");
    }, "?export&skin=blueprint");
  });

  test("every theme keeps banner text at 4.5:1 or more on each allowed background", () =>
    open(async (p) => {
      const low = [];
      for (const t of THEMES) {
        for (const [bg, ink, under] of [["as-is", "light", null], ["white", "dark", "rgb(255,255,255)"], ["black", "light", "rgb(0,0,0)"], ["transparent", "dark", "rgb(255,255,255)"]]) {
          const r = await p.evaluate(({ skin, bg, ink, under }) => {
            document.documentElement.setAttribute("data-skin", skin);
            const banner = document.getElementById("banner");
            banner.classList.remove("bg-white", "bg-black", "bg-transparent", "ink-dark");
            if (bg !== "as-is") banner.classList.add("bg-" + bg);
            if (ink === "dark") banner.classList.add("ink-dark");
            const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
            const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
            const ratio = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((m, n) => n - m); return (h + 0.05) / (l + 0.05); };
            const base = under ?? getComputedStyle(banner).backgroundColor;
            const bgOf = (el) => { for (let e = el; e && e !== banner.parentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.5) return c; } return parse(base); };
            let low = 99, what = "";
            for (const el of banner.querySelectorAll("*")) {
              if (!el.offsetParent || el.closest(".mark, .grad") || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
              const v = ratio(parse(getComputedStyle(el).color), bgOf(el));
              if (v < low) { low = v; what = el.className || el.tagName; }
            }
            return [low, what];
          }, { skin: t.id, bg, ink, under });
          if (r[0] < 4.5) low.push(`${t.id} ${bg}/${ink}: ${r[0].toFixed(2)} (${r[1]})`);
        }
      }
      assert.deepEqual(low, []);
    }));

  test("PNG export renders at the chosen size, transparent files say their ink", () =>
    open(async (p) => {
      const dims = async (bg, scale, ink) => {
        const data = await p.evaluate(([b, s, i]) => window.aiskillsBanner.render(b, s, i), [bg, scale, ink]);
        const buf = Buffer.from(data.split(",")[1], "base64");
        return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      };
      assert.deepEqual(await dims("as-is", 1, "auto"), [1280, 640]);
      assert.deepEqual(await dims("transparent", 2, "dark"), [2560, 1280]);
      assert.equal(await p.evaluate(() => window.aiskillsBanner.fileName("transparent", 2, "dark")), "aiskills-banner-transparent-dark-ink@2x.png");
      assert.match(await p.textContent("#exportAllBtn"), /Export all 15/);
    }));

  test("?export shows only the banner, at 1280x640", () =>
    open(async (p) => {
      assert.equal(await p.$eval(".toolbar", (el) => getComputedStyle(el).display), "none");
      const box = await p.locator("#banner").boundingBox();
      assert.deepEqual([box.width, box.height], [1280, 640]);
    }, "?export"));
});
