#!/usr/bin/env node
// Bundle the Markdown user docs into one HTML page with tabs, a page list,
// an outline, search and a light/dark theme.
//
// Usage: node src/scripts/docs/build-docs-html.mjs docs/docsite --out docs/docsite/index.html [--ref BRANCH]
//        (npm run docs:html)
//
// Tabs follow the landing page's `### Section` groups and the pages linked
// under each. Every page's Markdown and every SVG in images/ are embedded as
// JSON; the page renders them in the browser with marked and highlight.js,
// loaded from cdnjs. Links to files outside the docs point at GitHub on --ref.
// HTML pages kept in the docs folder (explainers/*.html, but not index.html)
// are listed in DATA.static and embedded (base64) in DATA.staticHtml: an iframe that
// shows one renders the embedded copy (srcdoc), so index.html works on its own
// (a preview, a single downloaded file). A link to one opens the file next to
// index.html when the site is served and the file is there, else the embedded
// copy. The command line also copies them next to the file it writes when that
// is not in the docs folder (the GitHub Pages build, site/index.html).
// The landing page opens with the banner: its markup and CSS, without the
// editing features, copied from docs/banner/aiskills-banner.html (npm run
// banner). --banner picks another file, --no-banner leaves it out.
//
// Ported from sugatoray/callai's docs/site/build_docs_html.py. Used only to
// build the docs, so it is not published.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_THEME, THEMES, fontsHref, pageSkinCss, themeById } from "./themes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..", "..");
const TEMPLATE = join(HERE, "templates", "docs-template.html");
export const REPO = "https://github.com/sugatoray/aiskills";
const DOCS_IN_REPO = "src/packages/aiskills/docs/docsite/";
const TAB_LABELS = { Help: "FAQ", "How-to guides": "Guides" };
export const BANNER = join(PKG_DIR, "docs", "banner", "aiskills-banner.html");
const BANNER_ALT = "aiskills: agent skills for every coding agent, in one npm package";

/** The text between the lines holding two marker comments. */
function between(text, start, end, file) {
  const m = new RegExp(`^[^\\n]*${start}[^\\n]*\\n([\\s\\S]*?)^[^\\n]*${end}`, "m").exec(text);
  if (!m) throw new Error(`${file}: no ${start} ... ${end} markers`);
  return m[1];
}

/**
 * The banner's markup and CSS from the banner page, without its editing
 * features: no data-edit/contenteditable hooks or the editor's ids, and the
 * wordmark heading becomes a div so it stays out of the page outline.
 */
export function bannerParts(file) {
  if (!existsSync(file)) throw new Error(`banner page not found: ${file} (run npm run banner, or pass --no-banner)`);
  const text = readFileSync(file, "utf8");
  let markup = between(text, "banner:html:start", "banner:html:end", file);
  const css = between(text, "banner:css:start", "banner:css:end", file);
  markup = markup.replace(/\s(?:data-edit|contenteditable(?:="[^"]*")?)(?=[\s>])/g, "").replace(' id="pills"', "");
  markup = markup.replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/g, "<div$1>$2</div>");
  return { markup: markup.replace(/^\n+|\n+$/g, ""), css: css.replace(/^\n+|\n+$/g, "") };
}

/** README.md -> home, guides/README.md -> guides, a/b.md -> a-b. */
export function pageId(rel) {
  if (rel === "README.md") return "home";
  const stem = rel.slice(0, -".md".length);
  return stem.endsWith("/README") ? stem.slice(0, -"/README".length) : stem.replaceAll("/", "-");
}

/** Every *.md under <dir>, as posix paths relative to it. */
function mdFiles(dir, rel = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? mdFiles(join(dir, e.name), rel + e.name + "/") : e.name.endsWith(".md") ? [rel + e.name] : [],
  );
}

/**
 * The HTML pages under <dir> (e.g. explainers/scrolls-explainer.html) that are
 * served next to the bundle as they are, as sorted posix paths. index.html at
 * the top is the bundle itself, so it isn't one.
 */
export function staticPages(dir, rel = "") {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? staticPages(join(dir, e.name), rel + e.name + "/") : e.name.endsWith(".html") && rel + e.name !== "index.html" ? [rel + e.name] : [],
    )
    .sort();
}

/**
 * The tabs and pages, in reading order, from README.md's `### Section` lists.
 * Throws if a page in the folder isn't linked from any section.
 */
export function collect(docs) {
  const tabs = [{ id: "home", label: "Home", pages: ["README.md"] }];
  let current = null;
  for (const line of readFileSync(join(docs, "README.md"), "utf8").split(/\r?\n/)) {
    if (line.startsWith("### ")) {
      const label = TAB_LABELS[line.slice(4).trim()] ?? line.slice(4).trim();
      current = { id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), label, pages: [] };
      tabs.push(current);
    } else if (current) {
      const m = /^- \[[^\]]+\]\(([^)#]+\.md)\)/.exec(line);
      if (m) current.pages.push(m[1]);
    }
  }
  const pages = [];
  for (const tab of tabs) {
    for (const rel of tab.pages) {
      const md = readFileSync(join(docs, rel), "utf8");
      const title = /^# (.+)$/m.exec(md);
      pages.push({ id: pageId(rel), path: rel, title: title ? title[1] : rel, tab: tab.id, md });
    }
  }
  const listed = new Set(pages.map((p) => p.path));
  const unlisted = mdFiles(docs).filter((p) => !listed.has(p)).sort();
  if (unlisted.length) throw new Error(`pages not linked from a section of README.md: ${unlisted.join(", ")}`);
  return { tabs, pages };
}

/** The package version, from package.json. */
const version = () => JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8")).version;

const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** The gear menu's items: one menuitemradio per theme, in THEMES order. */
export function skinMenuHtml() {
  const check = '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  return THEMES.map(
    (t) =>
      `      <button class="skin-item" type="button" role="menuitemradio" data-skin="${t.id}" aria-checked="${t.id === DEFAULT_THEME}">` +
      `<span class="sw" aria-hidden="true">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join("")}</span>` +
      `<span class="nm">${escAttr(t.name)}${t.id === DEFAULT_THEME ? " (default)" : ""}</span>${check}<span class="ds">${escAttr(t.blurb)}</span></button>`,
  ).join("\n");
}

const escHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

const KIND_LABEL = { dev: "in development", latest: "latest release", older: "older release" };

/**
 * The header's version badge, version menu and notice.
 * menu: null (one version: a plain badge), or the site's versions:
 *   { current: "<version of this page>", base: "<path from this page to the site root>",
 *     entries: [{ version, path: "<folder under the site root, '' for the root>", kind: "dev" | "latest" | "older" }] }
 * e.g. the site root (latest release, base ""), dev/ (base "../"), v/1.1.0/ (base "../../").
 * The dev page and older releases' pages get a notice that links to the latest release.
 */
export function versionParts(version, menu) {
  if (!menu) return { badge: `<span class="brand-ver">v${escHtml(version)}</span>`, menu: "", note: "" };
  const entries = menu.entries ?? [];
  for (const e of entries) if (!KIND_LABEL[e.kind]) throw new Error(`version menu: unknown kind: ${e.kind} (dev, latest or older)`);
  const latest = entries.filter((e) => e.kind === "latest");
  if (latest.length !== 1) throw new Error("version menu: needs exactly one latest release");
  const here = entries.find((e) => e.version === menu.current);
  if (!here) throw new Error(`version menu: ${menu.current} is not one of its versions`);
  const base = menu.base ?? "";
  const href = (e) => escHtml(base + e.path) || "./";
  const links = entries
    .map((e) => `<a href="${href(e)}"${e === here ? ' aria-current="page"' : ""}><span>${escHtml(e.version)}</span> <small>${KIND_LABEL[e.kind]}</small></a>`)
    .join("");
  const html =
    `<details class="ver-menu"><summary class="brand-ver" title="Docs version">v${escHtml(version)}</summary>` +
    `<div class="ver-list">${links}</div></details>`;
  const toLatest = `<a href="${href(latest[0])}">${escHtml(latest[0].version)} docs</a>`;
  const note =
    here.kind === "dev"
      ? `<div class="channel-note" role="note">These docs are for <b>${escHtml(here.version)}</b>, which is not released yet. For the current release, read the ${toLatest}.</div>`
      : here.kind === "older"
        ? `<div class="channel-note" role="note">These docs are for <b>${escHtml(here.version)}</b>, an older release. For the latest release, read the ${toLatest}.</div>`
        : "";
  return { badge: "", menu: html, note };
}

/**
 * Fill the template with the docs' pages, images and version. Returns { html, count }.
 * version: the version the page shows (default: package.json's). menu: see versionParts.
 */
export function build(docs, { ref = "master", banner = BANNER, version: shown = version(), menu = null } = {}) {
  const parts = versionParts(shown, menu);
  const { tabs, pages } = collect(docs);
  const images = {};
  for (const f of readdirSync(join(docs, "images")).filter((f) => f.endsWith(".svg")).sort()) {
    images[`images/${f}`] = "data:image/svg+xml;base64," + readFileSync(join(docs, "images", f)).toString("base64");
  }
  const data = {
    tabs,
    pages,
    images,
    static: staticPages(docs),
    // base64, like the images: raw HTML (with its own <script> tags) must not sit inside this page's <script>.
    staticHtml: Object.fromEntries(staticPages(docs).map((rel) => [rel, readFileSync(join(docs, rel)).toString("base64")])),
    repoBase: `${REPO}/blob/${ref}/${DOCS_IN_REPO}`,
    treeBase: `${REPO}/tree/${ref}/${DOCS_IN_REPO}`,
    banner: null,
    bannerLabel: BANNER_ALT,
  };
  let bannerCss = "";
  if (banner) {
    const parts = bannerParts(banner);
    data.banner = parts.markup;
    bannerCss = parts.css;
  }
  const blob = JSON.stringify(data).replaceAll("</", "<\\/"); // never close the <script> early
  const html = readFileSync(TEMPLATE, "utf8")
    .replace("{{VERSION_BADGE}}", () => parts.badge)
    .replace("{{VERSION_MENU}}", () => parts.menu)
    .replace("{{CHANNEL_NOTE}}", () => parts.note)
    .replaceAll("{{VERSION}}", shown)
    .replaceAll("{{REPO}}", REPO)
    .replaceAll("{{SKIN}}", DEFAULT_THEME)
    .replace("{{SKIN_DEFAULT_FONTS}}", () => `<link rel="stylesheet" href="${fontsHref(themeById(DEFAULT_THEME))}">`)
    .replace("{{SKIN_FONTS_JSON}}", () =>
      // Only the default theme's fonts are linked up front; every other theme's load when it is chosen.
      JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, t.id === DEFAULT_THEME ? "" : fontsHref(t)]))))
    .replace("{{SKIN_MENU}}", () => skinMenuHtml())
    .replace("/*__SKIN_CSS__*/", () => pageSkinCss())
    .replace("/*__BANNER_CSS__*/", () => bannerCss)
    .replace("/*__DOCS_DATA__*/null", () => blob);
  return { html, count: pages.length, statics: data.static };
}

/**
 * Command line: <docs> --out <file> [--ref <branch>] [--banner <file> | --no-banner]
 * [--version <v>] [--menu <json>] (see versionParts).
 */
export function main(argv = process.argv.slice(2)) {
  let docs = null;
  let out = null;
  let ref = "master";
  let banner = BANNER;
  let shown;
  let menu = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i];
    else if (argv[i] === "--version") shown = argv[++i];
    else if (argv[i] === "--menu") {
      try {
        menu = JSON.parse(argv[++i]);
      } catch {
        throw new Error("version menu: --menu is not valid JSON");
      }
    }
    else if (argv[i] === "--ref") ref = argv[++i];
    else if (argv[i] === "--banner") banner = argv[++i];
    else if (argv[i] === "--no-banner") banner = null;
    else docs = argv[i];
  }
  if (!docs || !out) {
    throw new Error("usage: build-docs-html.mjs <docs-dir> --out <file.html> [--ref <branch>] [--version <v>] [--menu <json>]");
  }
  const { html, count, statics } = build(docs, { ref, banner, version: shown, menu });
  const outDir = dirname(resolve(out));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(out, html);
  // Pages the bundle links to but doesn't embed must sit next to it.
  if (outDir !== resolve(docs)) {
    for (const rel of statics) {
      mkdirSync(dirname(join(outDir, rel)), { recursive: true });
      copyFileSync(join(docs, rel), join(outDir, rel));
    }
  }
  console.error(`wrote ${out} (${count} pages, ${Math.round(html.length / 1024)} KB` +
    (statics.length ? `; ${statics.length} page${statics.length === 1 ? "" : "s"} next to it: ${statics.join(", ")}` : "") + ")");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
