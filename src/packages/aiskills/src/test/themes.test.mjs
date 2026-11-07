// Tests for the shared themes (src/scripts/themes.mjs), used by both the docs
// page (docs/docsite/index.html, gear menu at the top right) and the banner
// page (docs/banner/aiskills-banner.html, gear menu in its toolbar).
import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";

import { PKG_SRC } from "./helpers.mjs";

const load = () => import(pathToFileURL(join(PKG_SRC, "src", "scripts", "docs", "themes.mjs")).href);

const TOKENS = ["bg", "surface", "surface2", "fg", "muted", "line", "accent", "accentSoft", "accentFg", "codeBg", "codeFg", "kw", "str", "num", "com", "attr", "fn"];
const IDS = ["lightsout", "teal", "paper", "phosphor", "grimoire", "signal", "frost", "dusk", "blueprint", "matcha", "rose"];

/** WCAG contrast ratio of two #rrggbb colours. */
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("themes", () => {
  test("there are 11 themes in a fixed order, and Lights Out, the default, comes first", async () => {
    const { THEMES, DEFAULT_THEME, themeById } = await load();
    assert.deepEqual(THEMES.map((t) => t.id), IDS);
    assert.equal(DEFAULT_THEME, "lightsout");
    assert.equal(THEMES[0].id, DEFAULT_THEME, "the default is listed first, so the menu opens at the top");
    assert.equal(themeById("lightsout").name, "Lights Out");
    assert.equal(themeById("nope"), null);
    for (const t of THEMES) {
      assert.ok(t.name && t.blurb, `${t.id}: name and blurb`);
      assert.equal(t.swatch.length, 3, `${t.id}: swatch`);
      for (const c of t.swatch) assert.match(c, /^#[0-9a-f]{6}$/i, `${t.id}: swatch colour ${c}`);
    }
  });

  test("every theme but Teal (the base design) defines every token for light and dark", async () => {
    const { THEMES } = await load();
    for (const t of THEMES.filter((x) => x.id !== "teal")) {
      for (const mode of ["light", "dark"]) {
        assert.deepEqual(Object.keys(t[mode]).sort(), [...TOKENS].sort(), `${t.id} ${mode}`);
        for (const [k, v] of Object.entries(t[mode])) assert.match(v, /^#[0-9a-f]{6}$/i, `${t.id} ${mode} ${k}`);
      }
      for (const k of ["bg", "a", "b", "term", "line", "darkInkA", "darkInkB"]) assert.match(t.banner[k], /^#[0-9a-f]{6}$/i, `${t.id} banner ${k}`);
    }
  });

  test("text, links and buttons reach 4.5:1 in every theme and mode (code comments 3:1)", async () => {
    const { THEMES } = await load();
    const low = [];
    for (const t of THEMES.filter((x) => x.id !== "teal")) {
      for (const mode of ["light", "dark"]) {
        const c = t[mode];
        const pairs = [["fg", "bg"], ["muted", "bg"], ["muted", "surface"], ["accent", "bg"], ["accent", "accentSoft"], ["codeFg", "codeBg"], ["accentFg", "accent"]];
        for (const [a, b] of pairs) if (contrast(c[a], c[b]) < 4.5) low.push(`${t.id} ${mode} ${a}/${b} ${contrast(c[a], c[b]).toFixed(2)}`);
        if (contrast(c.com, c.codeBg) < 3) low.push(`${t.id} ${mode} com/codeBg`);
      }
      // The banner's dark-ink accents are used on white.
      for (const k of ["darkInkA", "darkInkB"]) if (contrast(t.banner[k], "#ffffff") < 4.5) low.push(`${t.id} banner ${k} on white`);
      if (contrast(t.banner.a, t.banner.term) < 4.5) low.push(`${t.id} banner prompt on terminal`);
    }
    assert.deepEqual(low, []);
  });

  test("each theme's fonts come from Google Fonts", async () => {
    const { THEMES, fontsHref } = await load();
    for (const t of THEMES) {
      const href = fontsHref(t);
      assert.match(href, /^https:\/\/fonts\.googleapis\.com\/css2\?family=.+&display=swap$/, t.id);
      const display = t.fonts.display.split(",")[0].replace(/"/g, "");
      assert.ok(href.includes("family=" + display.replace(/ /g, "+")), `${t.id}: ${display} in ${href}`);
    }
  });
});

describe("generated CSS", () => {
  test("the page CSS has a light and a dark rule for each theme but Teal, plus Lights Out's own styles", async () => {
    const { THEMES, pageSkinCss } = await load();
    const css = pageSkinCss();
    for (const t of THEMES.filter((x) => x.id !== "teal")) {
      assert.ok(css.includes(`:root[data-skin="${t.id}"]:not([data-effective="dark"]) {`), `${t.id} light`);
      assert.ok(css.includes(`:root[data-skin="${t.id}"][data-effective="dark"] {`), `${t.id} dark`);
    }
    assert.ok(css.includes(':root[data-skin="lightsout"] .tab[aria-selected="true"]::after'), "Lights Out tab indicator");
    assert.ok(!css.includes('data-skin="teal"'), "Teal is the base design and needs no rules");
  });

  test("the banner CSS only styles the banner, and keeps dark ink readable", async () => {
    const { THEMES, bannerSkinCss } = await load();
    const css = bannerSkinCss();
    const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1].trim()).filter((s) => !s.startsWith("/*"));
    assert.ok(selectors.length > 0);
    for (const s of selectors) for (const part of s.split(",")) assert.match(part.trim(), /#banner/, `rule reaches outside the banner: ${part}`);
    for (const t of THEMES.filter((x) => x.id !== "teal")) {
      assert.ok(css.includes(`:root[data-skin="${t.id}"] #banner:not(.ink-dark)`), `${t.id}: light-ink rule`);
      assert.ok(css.includes(`:root[data-skin="${t.id}"] #banner.ink-dark`), `${t.id}: dark-ink rule`);
    }
  });
});
