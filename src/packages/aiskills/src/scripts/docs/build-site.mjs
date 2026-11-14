#!/usr/bin/env node
// Build the GitHub Pages site (npm run docs:site; .github/workflows/aiskills-docs.yml).
//
// Usage: node src/scripts/docs/build-site.mjs --out site [--ref BRANCH] [--releases N|all]
//
//   <out>/index.html             the latest release
//   <out>/v/<version>/index.html the releases before it, newest first (--releases
//                                counts the latest too; default 5)
//   <out>/dev/index.html         while package.json is a pre-release (x.y.z-dev):
//                                the docs in the working tree
// While package.json is -dev, the latest release is the newest release tag
// (aiskills-vX.Y.Z); on a release it is the working tree itself. Every page's
// header has a menu listing all of them, and the dev and older pages say what
// they are, with a link to the latest. Without a version in development,
// <out>/dev/index.html sends readers to the root, so a link to dev/ keeps working.
//
// Tagged docs are read with `git archive`, so the workflow needs the tags
// (actions/checkout with fetch-depth: 0). Every page is built by this
// checkout's build-docs-html.mjs, so they share one page design and menu.
// Used only to build the docs, so it is not published.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main as buildPage } from "./build-docs-html.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..", "..");
const TAG = /^aiskills-v(\d+)\.(\d+)\.(\d+)$/;

/** The release tags (aiskills-vX.Y.Z, no pre-releases), newest version first. */
export function releaseTags(tags) {
  return tags
    .map((tag) => [tag, TAG.exec(tag)])
    .filter(([, m]) => m)
    .sort(([, a], [, b]) => b[1] - a[1] || b[2] - a[2] || b[3] - a[3])
    .map(([tag, m]) => ({ tag, version: `${m[1]}.${m[2]}.${m[3]}` }));
}

export const DEFAULT_RELEASES = 5;

/** Compare two x.y.z versions (pre-release suffix ignored): negative, 0 or positive. */
function cmp(a, b) {
  const [x, y] = [a, b].map((v) => v.split("-")[0].split(".").map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/**
 * The site's pages, in menu order: [{ kind: "dev" | "latest" | "older", version,
 * source: <tag> | null (the working tree), path: <folder under the site root> }].
 * releases: how many releases to show, the latest included (a number, or "all").
 */
export function plan({ version, tags, releases = DEFAULT_RELEASES }) {
  const limit = releases === "all" ? Infinity : Number(releases);
  if (!(limit >= 1) || (limit !== Infinity && !Number.isInteger(limit))) throw new Error(`--releases must be a whole number of at least 1, or all: ${releases}`);
  const tagged = releaseTags(tags);
  const pages = [];
  let past;
  if (version.includes("-")) {
    if (!tagged.length) return [{ kind: "latest", version, source: null, path: "" }];
    pages.push({ kind: "dev", version, source: null, path: "dev/" });
    pages.push({ kind: "latest", version: tagged[0].version, source: tagged[0].tag, path: "" });
    past = tagged.slice(1);
  } else {
    pages.push({ kind: "latest", version, source: null, path: "" });
    past = tagged.filter((t) => cmp(t.version, version) < 0);
  }
  const room = limit - 1;
  for (const t of past.slice(0, room)) pages.push({ kind: "older", version: t.version, source: t.tag, path: `v/${t.version}/` });
  return pages;
}

/** A page for dev/ when nothing is in development: it sends readers to the root, keeping the #page. */
export const DEV_REDIRECT = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>aiskills documentation</title>
<meta http-equiv="refresh" content="0; url=../">
<link rel="canonical" href="../">
<script>location.replace("../" + location.hash);</script>
<p>No version is in development right now. <a href="../">Read the current docs</a>.</p>
</html>
`;

const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });

/** Extract <pkgRel>/docs at <tag> into a new temporary folder; returns the folder. */
function docsAtTag(repo, tag, pkgRel) {
  const dir = mkdtempSync(join(tmpdir(), "aiskills-site-"));
  const tar = join(dir, "docs.tar");
  writeFileSync(tar, git(repo, "archive", "--format=tar", tag, `${pkgRel ? pkgRel + "/" : ""}docs`));
  execFileSync("tar", ["-xf", tar, "-C", dir]);
  return { dir, docs: join(dir, pkgRel, "docs") };
}

const USAGE = "usage: build-site.mjs --out <dir> [--ref <branch>] [--releases <n>|all]";

/** Command line: --out <dir> [--ref <branch>] [--releases <n>|all]. opts.pkgDir and opts.repo are for tests. */
export function main(argv = process.argv.slice(2), { pkgDir = PKG_DIR, repo = null } = {}) {
  let out = null;
  let ref = "master";
  let releases = DEFAULT_RELEASES;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i];
    else if (argv[i] === "--ref") ref = argv[++i];
    else if (argv[i] === "--releases") releases = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}\n${USAGE}`);
  }
  if (!out) throw new Error(USAGE);
  repo ??= git(pkgDir, "rev-parse", "--show-toplevel").toString().trim();
  const version = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;
  const tags = git(repo, "tag", "--list", "aiskills-v*").toString().split("\n").filter(Boolean);
  const pages = plan({ version, tags, releases });
  const pkgRel = relative(repo, pkgDir).split("\\").join("/");
  const entries = pages.map(({ kind, version: v, path }) => ({ version: v, path, kind }));

  for (const page of pages) {
    const base = page.path ? "../".repeat(page.path.split("/").filter(Boolean).length) : "";
    const pageOut = join(out, page.path, "index.html");
    const menu = pages.length > 1 ? ["--menu", JSON.stringify({ current: page.version, base, entries })] : [];
    if (!page.source) {
      buildPage([join(pkgDir, "docs", "docsite"), "--out", pageOut, "--ref", ref,
        "--banner", join(pkgDir, "docs", "banner", "aiskills-banner.html"), "--version", page.version, ...menu]);
      continue;
    }
    const tagged = docsAtTag(repo, page.source, pkgRel);
    try {
      const banner = join(tagged.docs, "banner", "aiskills-banner.html");
      buildPage([join(tagged.docs, "docsite"), "--out", pageOut, "--ref", page.source,
        ...(existsSync(banner) ? ["--banner", banner] : ["--no-banner"]), "--version", page.version, ...menu]);
    } finally {
      rmSync(tagged.dir, { recursive: true, force: true });
    }
  }
  if (!pages.some((p) => p.kind === "dev")) {
    mkdirSync(join(out, "dev"), { recursive: true });
    writeFileSync(join(out, "dev", "index.html"), DEV_REDIRECT);
  }
  console.error(`site: ${pages.map((p) => `${p.version} at ${out}/${p.path}`).join(", ")}`);
  return pages;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
