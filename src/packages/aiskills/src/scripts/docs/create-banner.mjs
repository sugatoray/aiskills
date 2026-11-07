#!/usr/bin/env node
// Build the aiskills banner page from docs/banner/config.yaml and
// src/scripts/docs/templates/banner-template.html, the way sugatoray/callai builds its
// banner (src/tools/banner/create_banner.py).
//
// Usage:
//   node src/scripts/docs/create-banner.mjs                 write docs/banner/aiskills-banner.html   (npm run banner)
//   node src/scripts/docs/create-banner.mjs --check         exit 1 if it is out of date; write nothing (npm run banner:check)
//   node src/scripts/docs/create-banner.mjs --png [PATH]    also render a PNG (default docs/banner/banner_2x.png; npm run banner:png)
// Options:
//   --out PATH                the page to write or check
//   --package-version V       show this version instead of package.json's
//   --set KEY=VALUE           override a config value (lists: comma-separated); repeatable
//   --scale 1|2|4             PNG scale (default 2)
//   --background as-is|white|black|transparent    PNG background (default as-is)
//   --ink auto|light|dark     PNG text colour (default auto)
//
// The page is a self-contained 1280x640 banner that can be edited in the
// browser and exported as PNG. It is a maintainer tool: nothing here ships in
// the npm package.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { bundled } from "./build-skills-docs.mjs";
import { SKILLS_CLI_VERSION } from "../core/installer.mjs";
import { findRepoRoot } from "../pack/vendor-skills.mjs";
import { THEMES, bannerSkinCss, themeById } from "./themes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..", "..");
export const BANNER_DIR = join(PKG_DIR, "docs", "banner");
export const DEFAULT_CONFIG = join(BANNER_DIR, "config.yaml");
export const DEFAULT_TEMPLATE = join(HERE, "templates", "banner-template.html");
export const DEFAULT_OUTPUT = join(BANNER_DIR, "aiskills-banner.html");
export const DEFAULT_PNG = join(BANNER_DIR, "banner_2x.png");
const LIST_KEYS = ["groups", "install_commands"];
const AUTO_KEYS = ["package_name", "package_version", "node_requires", "license", "repo_url", "skills_count", "groups_count", "skills_cli_version", "groups"];
const INSTALL_LIMITS = { box: 3, chips: 2 };

/**
 * Read the config: `key: "value"`, or `key:` followed by `  - "item"` lines.
 * Blank lines and `#` comments are skipped. Anything else is an error.
 */
export function parseConfig(text) {
  const out = {};
  let list = null;
  const quoted = (s, no) => {
    const m = /^"((?:[^"\\]|\\.)*)"$/.exec(s.trim());
    if (!m) throw new Error(`config line ${no}: values must be double-quoted strings: ${s.trim()}`);
    return JSON.parse(`"${m[1]}"`);
  };
  text.split(/\r?\n/).forEach((line, i) => {
    const no = i + 1;
    if (!line.trim() || line.trim().startsWith("#")) return;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item) {
      if (!list) throw new Error(`config line ${no}: a list item without a key above it`);
      list.push(quoted(item[1], no));
      return;
    }
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`config line ${no}: expected 'key: "value"' or a '  - "item"' line`);
    if (kv[2] === "") {
      list = out[kv[1]] = [];
    } else {
      list = null;
      out[kv[1]] = quoted(kv[2], no);
    }
  });
  return out;
}

export const readConfig = (file = DEFAULT_CONFIG) => parseConfig(readFileSync(file, "utf8"));

/** The values "auto" stands for, read from package.json and the bundled skills. */
function autoValues(repoRoot) {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  const { skills, groups } = bundled(repoRoot);
  const withSkills = groups.filter((g) => g.skills.length);
  return {
    package_name: pkg.name,
    package_version: pkg.version,
    node_requires: "≥ " + (pkg.engines?.node ?? "").replace(/^>=\s*/, ""),
    license: pkg.license,
    repo_url: String(pkg.repository?.url ?? "").replace(/^git\+/, "").replace(/\.git$/, ""),
    skills_count: String(skills.length),
    groups_count: String(withSkills.length),
    skills_cli_version: SKILLS_CLI_VERSION,
    groups: withSkills.map((g) => g.alias),
    _groups: withSkills,
  };
}

/**
 * The final values: the config, "auto" filled in, overrides applied, and
 * `{name}` references in text expanded.
 */
export function resolveValues(config, { packageVersion, set = {}, repoRoot = findRepoRoot(PKG_DIR) } = {}) {
  const v = { ...config };
  for (const [k, val] of Object.entries(set)) {
    if (!(k in config)) throw new Error(`--set: unknown key: ${k}`);
    v[k] = LIST_KEYS.includes(k) ? String(val).split(",").map((s) => s.trim()).filter(Boolean) : String(val);
  }
  if (packageVersion) v.package_version = packageVersion;
  const auto = autoValues(repoRoot);
  for (const k of AUTO_KEYS) if (v[k] === "auto") v[k] = auto[k];
  v._groups = auto._groups;
  const refs = Object.fromEntries(AUTO_KEYS.filter((k) => typeof v[k] === "string").map((k) => [k, v[k]]));
  const expand = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in refs ? refs[k] : m));
  for (const [k, val] of Object.entries(v)) {
    if (k.startsWith("_") || AUTO_KEYS.includes(k)) continue;
    v[k] = Array.isArray(val) ? val.map(expand) : expand(val);
  }
  v.repo_label = v.repo_label.replace(/^https?:\/\//, "");
  if (!themeById(v.theme)) throw new Error(`unknown theme: ${v.theme} (use one of ${THEMES.map((t) => t.id).join(", ")})`);
  return v;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function installHtml(v) {
  const style = v.install_style;
  if (!(style in INSTALL_LIMITS)) throw new Error(`install_style must be "box" or "chips", not "${style}"`);
  const cmds = v.install_commands;
  if (!cmds.length || cmds.length > INSTALL_LIMITS[style]) {
    throw new Error(`install_style "${style}" has room for 1 to ${INSTALL_LIMITS[style]} install commands, not ${cmds.length}`);
  }
  const row = style === "box" ? "line" : "install";
  const rows = cmds.map((c) => `            <div class="${row}"><span class="dollar">$</span><span data-edit>${esc(c)}</span></div>`);
  return `          <div class="${style === "box" ? "install install-box" : "install-chips"}">\n${rows.join("\n")}\n          </div>`;
}

/** The terminal demo, made from the bundled skills so its output is real. */
function terminalHtml(v) {
  const groups = v._groups ?? [];
  const demo = groups.find((g) => g.alias === v.demo_group || g.name === v.demo_group);
  if (!demo) throw new Error(`demo_group "${v.demo_group}" isn't a bundled group (${groups.map((g) => g.alias).join(", ")})`);
  if (groups.some((g) => g.skills.includes(v.route_skill))) {
    throw new Error(`route_skill "${v.route_skill}" is bundled, so 'aix i -s ${v.route_skill}' wouldn't look it up`);
  }
  const shown = groups.slice(0, 2);
  const width = Math.max(...shown.map((g) => g.name.length)) + 2;
  const listing = shown.map((g, i) =>
    `<span class="h">${esc(g.name)}</span>${" ".repeat(width - g.name.length)}<span class="c">(alias: ${esc(g.alias)})</span>` +
    (i === shown.length - 1 && groups.length > shown.length ? `  <span class="c">…</span>` : ""),
  );
  const n = demo.skills.length;
  const bundledLine = n === 1 ? demo.skills[0] : `${demo.skills[0]}, … (${n})`;
  return [
    `<span class="p">$</span> ais groups`,
    ...listing,
    ``,
    `<span class="p">$</span> ais i <span class="f">-G</span> ${esc(demo.alias)} <span class="f">-a</span> ${esc(v.demo_agent)}`,
    `<span class="o">[aiskills] bundled: ${esc(bundledLine)}</span>`,
    `<span class="o">[aiskills] running: npx -y skills@${esc(v.skills_cli_version)} add …</span>`,
    ``,
    `<span class="p">$</span> aix i <span class="f">-s</span> <span class="s">${esc(v.route_skill)}</span>   <span class="c"># not bundled</span>`,
    `<span class="o">[aiskills] found ${esc(v.route_source)}@${esc(v.route_skill)}</span>`,
    ``,
    `<span class="p">$</span> <span class="cursor"></span>`,
  ].join("\n");
}

/** Fill the template. Values are HTML-escaped; *_html values are built here. */
export function render(v, template = readFileSync(DEFAULT_TEMPLATE, "utf8")) {
  const fill = {
    page_title: esc(v.page_title),
    version_label: esc(v.version_label),
    node_label: esc(v.node_label),
    license_label: esc(v.license_label),
    counts_label: esc(v.counts_label),
    mark_glyph: esc(v.mark_glyph),
    wordmark_accent: esc(v.wordmark_accent),
    wordmark_plain: esc(v.wordmark_plain),
    tagline: esc(v.tagline),
    subtitle: esc(v.subtitle),
    install_html: installHtml(v),
    terminal_title: esc(v.terminal_title),
    terminal_html: terminalHtml(v),
    group_label: esc(v.group_label),
    pills_html: v.groups.map((g) => `            <span class="pill">${esc(g)}</span>`).join("\n"),
    repo_label: esc(v.repo_label),
    theme: esc(v.theme),
    theme_ids_json: JSON.stringify(THEMES.map((t) => t.id)),
    skins_css: bannerSkinCss(),
    skin_menu_html: THEMES.map(
      (t) =>
        `      <button class="skin-item" type="button" role="menuitemradio" data-skin="${t.id}" aria-checked="${t.id === v.theme}">` +
        `<span class="sw" aria-hidden="true">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join("")}</span>` +
        `<span class="nm">${esc(t.name)}</span><span class="ck" aria-hidden="true">✓</span><span class="ds">${esc(t.blurb)}</span></button>`,
    ).join("\n"),
    store_key: "",
  };
  const put = (t) =>
    t.replace(/\{\{ (\w+) \}\}/g, (m, k) => {
      if (!(k in fill)) throw new Error(`template placeholder {{ ${k} }} has no value`);
      return fill[k];
    });
  // Saved edits are keyed by the page's content, so a new design doesn't load stale edits.
  fill.store_key = "aiskills-banner:" + createHash("sha256").update(put(template)).digest("hex").slice(0, 12);
  return put(template);
}

/** CRC-32 of a buffer (the PNG chunk checksum). */
function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

/** <png> with tEXt chunks for <entries> added right after IHDR. */
export function addPngText(png, entries) {
  const ihdrEnd = 8 + 12 + png.readUInt32BE(8);
  const chunks = Object.entries(entries).map(([k, v]) => {
    const data = Buffer.concat([Buffer.from(k, "latin1"), Buffer.from([0]), Buffer.from(String(v), "latin1")]);
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write("tEXt", 4, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
  });
  return Buffer.concat([png.subarray(0, ihdrEnd), ...chunks, png.subarray(ihdrEnd)]);
}

/**
 * Render the banner page to a PNG with headless Chromium (Playwright). The PNG
 * records the theme and the SHA-256 of the page it came from, so a test can
 * tell when it is out of date.
 */
export async function renderPng(page, out, { scale = 2, background = "as-is", ink = "auto", theme } = {}) {
  let playwright;
  try {
    playwright = createRequire(import.meta.url)("playwright");
  } catch {
    throw new Error("--png needs Playwright (npm install -g playwright, then npx playwright install chromium)");
  }
  const browser = await playwright.chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: Number(scale) });
    await p.goto(`${pathToFileURL(page).href}?export&bg=${background}&ink=${ink}&skin=${theme ?? ""}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    mkdirSync(dirname(resolve(out)), { recursive: true });
    const png = await p.locator("#banner").screenshot({ omitBackground: background === "transparent" });
    const sha = createHash("sha256").update(readFileSync(page)).digest("hex");
    writeFileSync(out, addPngText(png, { "aiskills:theme": theme ?? "", "aiskills:page-sha256": sha }));
  } finally {
    await browser.close();
  }
}

function parseArgs(argv) {
  const o = { set: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--check") o.check = true;
    else if (a === "--out") o.out = next();
    else if (a === "--package-version") o.packageVersion = next();
    else if (a === "--set") {
      const [k, ...rest] = next().split("=");
      o.set[k] = rest.join("=");
    } else if (a === "--png") o.png = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : DEFAULT_PNG;
    else if (a === "--scale") o.scale = next();
    else if (a === "--background") o.background = next();
    else if (a === "--ink") o.ink = next();
    else throw new Error(`unknown option: ${a}`);
  }
  if (o.scale && !["1", "2", "4"].includes(o.scale)) throw new Error("--scale must be 1, 2 or 4");
  return o;
}

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const out = o.out ?? DEFAULT_OUTPUT;
  const values = resolveValues(readConfig(), { packageVersion: o.packageVersion, set: o.set });
  const html = render(values);
  if (o.check) {
    if (!existsSync(out) || readFileSync(out, "utf8") !== html) {
      console.error(`${out} is out of date: run npm run banner`);
      return 1;
    }
    console.error(`${out} is up to date`);
    return 0;
  }
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, html);
  console.error(`wrote ${out}`);
  if (o.png) {
    await renderPng(out, o.png, { ...o, theme: values.theme });
    console.error(`wrote ${o.png}`);
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => (process.exitCode = code),
    (err) => {
      console.error(err.message);
      process.exitCode = 1;
    },
  );
}
