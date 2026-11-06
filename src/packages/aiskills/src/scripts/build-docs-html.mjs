#!/usr/bin/env node
// Bundle the Markdown user docs into one HTML page with tabs, a page list,
// an outline, search and a light/dark theme.
//
// Usage: node src/scripts/build-docs-html.mjs docs/docsite --out docs/docsite/index.html [--ref BRANCH]
//        (npm run docs:html)
//
// Tabs follow the landing page's `### Section` groups and the pages linked
// under each. Every page's Markdown and every SVG in images/ are embedded as
// JSON; the page renders them in the browser with marked and highlight.js,
// loaded from cdnjs. Links to files outside the docs point at GitHub on --ref.
//
// Ported from sugatoray/callai's docs/site/build_docs_html.py. Used only to
// build the docs, so it is not published.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..");
const TEMPLATE = join(HERE, "docs-template.html");
export const REPO = "https://github.com/sugatoray/aiskills";
const DOCS_IN_REPO = "src/packages/aiskills/docs/docsite/";
const TAB_LABELS = { Help: "FAQ", "How-to guides": "Guides" };

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

/** Fill the template with the docs' pages, images and version. Returns { html, count }. */
export function build(docs, { ref = "master" } = {}) {
  const { tabs, pages } = collect(docs);
  const images = {};
  for (const f of readdirSync(join(docs, "images")).filter((f) => f.endsWith(".svg")).sort()) {
    images[`images/${f}`] = "data:image/svg+xml;base64," + readFileSync(join(docs, "images", f)).toString("base64");
  }
  const data = {
    tabs,
    pages,
    images,
    repoBase: `${REPO}/blob/${ref}/${DOCS_IN_REPO}`,
    treeBase: `${REPO}/tree/${ref}/${DOCS_IN_REPO}`,
  };
  const blob = JSON.stringify(data).replaceAll("</", "<\\/"); // never close the <script> early
  const html = readFileSync(TEMPLATE, "utf8")
    .replaceAll("{{VERSION}}", version())
    .replaceAll("{{REPO}}", REPO)
    .replace("/*__DOCS_DATA__*/null", () => blob);
  return { html, count: pages.length };
}

/** Command line: <docs> --out <file> [--ref <branch>]. */
export function main(argv = process.argv.slice(2)) {
  let docs = null;
  let out = null;
  let ref = "master";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i];
    else if (argv[i] === "--ref") ref = argv[++i];
    else docs = argv[i];
  }
  if (!docs || !out) throw new Error("usage: build-docs-html.mjs <docs-dir> --out <file.html> [--ref <branch>]");
  const { html, count } = build(docs, { ref });
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, html);
  console.error(`wrote ${out} (${count} pages, ${Math.round(html.length / 1024)} KB)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
