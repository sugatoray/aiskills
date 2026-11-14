#!/usr/bin/env node
// Build the GitHub Pages site (npm run docs:site; .github/workflows/aiskills-docs.yml).
//
// Usage: node src/scripts/docs/build-site.mjs --out site [--ref BRANCH]
//
// While package.json is a pre-release (x.y.z-dev) and a release tag exists, the
// site has two versions:
//   <out>/index.html      the newest release's docs, from its tag aiskills-vX.Y.Z
//   <out>/dev/index.html  the docs in the working tree (the version in development)
// Each page's header has a menu to switch between them, and dev/ says it isn't
// released yet. Otherwise (a release, or no tag yet) the site has one version,
// the working tree's, and <out>/dev/index.html sends readers to the root, so a
// link to dev/ keeps working after the release.
//
// The tagged docs are read with `git archive`, so the workflow needs the tags
// (actions/checkout with fetch-depth: 0). Both pages are built by this
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

/**
 * Whether the site shows two versions. { both: true, stable: { tag, version }, dev }
 * or { both: false, reason }.
 */
export function plan({ version, tags }) {
  if (!version.includes("-")) return { both: false, reason: `${version} is a release` };
  const [stable] = releaseTags(tags);
  if (!stable) return { both: false, reason: "no aiskills-vX.Y.Z release tag" };
  return { both: true, stable, dev: version };
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

/** Command line: --out <dir> [--ref <branch>]. opts.pkgDir and opts.repo are for tests. */
export function main(argv = process.argv.slice(2), { pkgDir = PKG_DIR, repo = null } = {}) {
  let out = null;
  let ref = "master";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = argv[++i];
    else if (argv[i] === "--ref") ref = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}\nusage: build-site.mjs --out <dir> [--ref <branch>]`);
  }
  if (!out) throw new Error("usage: build-site.mjs --out <dir> [--ref <branch>]");
  repo ??= git(pkgDir, "rev-parse", "--show-toplevel").toString().trim();
  const version = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;
  const tags = git(repo, "tag", "--list", "aiskills-v*").toString().split("\n").filter(Boolean);
  const site = plan({ version, tags });
  const docs = join(pkgDir, "docs", "docsite");
  const banner = join(pkgDir, "docs", "banner", "aiskills-banner.html");

  if (!site.both) {
    buildPage([docs, "--out", join(out, "index.html"), "--ref", ref, "--banner", banner, "--version", version]);
    mkdirSync(join(out, "dev"), { recursive: true });
    writeFileSync(join(out, "dev", "index.html"), DEV_REDIRECT);
    console.error(`one version (${site.reason}): ${version} at ${out}/, ${out}/dev/ points there`);
    return site;
  }

  const both = ["--stable", site.stable.version, "--dev", site.dev];
  const tagged = docsAtTag(repo, site.stable.tag, relative(repo, pkgDir).split("\\").join("/"));
  try {
    const tagBanner = join(tagged.docs, "banner", "aiskills-banner.html");
    buildPage([
      join(tagged.docs, "docsite"), "--out", join(out, "index.html"), "--ref", site.stable.tag,
      ...(existsSync(tagBanner) ? ["--banner", tagBanner] : ["--no-banner"]),
      "--version", site.stable.version, "--channel", "stable", ...both,
    ]);
  } finally {
    rmSync(tagged.dir, { recursive: true, force: true });
  }
  buildPage([docs, "--out", join(out, "dev", "index.html"), "--ref", ref, "--banner", banner, "--version", site.dev, "--channel", "dev", ...both]);
  console.error(`two versions: ${site.stable.version} (${site.stable.tag}) at ${out}/, ${site.dev} at ${out}/dev/`);
  return site;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
