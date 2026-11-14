// Tests for the GitHub Pages site build (src/scripts/docs/build-site.mjs,
// npm run docs:site). The site root shows the latest release, v/<version>/
// the releases before it (the newest few, --releases), and, while package.json
// is a pre-release (x.y.z-dev), dev/ shows the working tree. Every page has a
// version menu listing them all. Without a version in development, dev/ sends
// readers to the root.
//
// The end-to-end tests build a throwaway git repository with release tags,
// so they don't depend on this clone's tags or history.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { PKG_SRC, tempDir } from "./helpers.mjs";

const SITE = join(PKG_SRC, "src", "scripts", "docs", "build-site.mjs");
const load = () => import(pathToFileURL(SITE).href);

/** The JSON data embedded in a built page. */
function data(html) {
  const m = /const DATA = (\{.*?\});\n/s.exec(html);
  assert.ok(m, "docs data not embedded");
  return JSON.parse(m[1].replaceAll("<\\/", "</"));
}
const summary = (html) => /<summary class="brand-ver"[^>]*>([^<]+)<\/summary>/.exec(html)?.[1];

const git = (cwd, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd, stdio: "pipe" }).toString();

/**
 * A git repository holding a copy of this package's docs under pkg/. One
 * commit per entry of `releases`, each marking the landing page with
 * RELEASE-<v> and tagged aiskills-v<v> (unless tag is false); then, if
 * `next` is given, a commit that marks it DEV-ONLY-MARKER and sets
 * package.json to `next`. Returns { repo, pkg, dir }.
 */
function fixtureRepo({ releases = ["2.0.0"], next = null, tag = true } = {}) {
  const dir = tempDir();
  const repo = join(dir, "repo");
  const pkg = join(repo, "pkg");
  mkdirSync(pkg, { recursive: true });
  cpSync(join(PKG_SRC, "docs", "docsite"), join(pkg, "docs", "docsite"), { recursive: true });
  cpSync(join(PKG_SRC, "docs", "banner"), join(pkg, "docs", "banner"), { recursive: true });
  const landing = join(pkg, "docs", "docsite", "README.md");
  const original = readFileSync(landing, "utf8");
  const setVersion = (v) => writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "fixture", version: v }) + "\n");
  git(repo, "init", "-q", "-b", "master");
  for (const v of releases) {
    writeFileSync(landing, original + `\nRELEASE-${v}\n`);
    setVersion(v);
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", `release ${v}`);
    if (tag) git(repo, "tag", "-a", `aiskills-v${v}`, "-m", v);
  }
  if (tag) git(repo, "tag", "other-v9.0.0"); // not an aiskills release
  if (next) {
    writeFileSync(landing, original + "\nDEV-ONLY-MARKER\n");
    setVersion(next);
    git(repo, "commit", "-q", "-am", `start ${next}`);
  }
  return { repo, pkg, dir };
}

function quiet(fn) {
  const err = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = err;
  }
}

describe("build-site: which versions the site shows", () => {
  test("releaseTags keeps aiskills-vX.Y.Z tags only, newest first by version", async () => {
    const { releaseTags } = await load();
    const tags = ["aiskills-v1.9.0", "aiskills-v1.10.0", "aiskills-v1.3.0-dev", "other-v9.0.0", "aiskills-v0.4.0", "aiskills-vx"];
    assert.deepEqual(releaseTags(tags), [
      { tag: "aiskills-v1.10.0", version: "1.10.0" },
      { tag: "aiskills-v1.9.0", version: "1.9.0" },
      { tag: "aiskills-v0.4.0", version: "0.4.0" },
    ]);
  });

  test("while package.json is -dev: dev/, the newest tag at the root, and older tags under v/", async () => {
    const { plan } = await load();
    const tags = ["aiskills-v1.0.0", "aiskills-v1.2.0", "aiskills-v1.1.0"];
    assert.deepEqual(plan({ version: "1.3.0-dev", tags, releases: 2 }), [
      { kind: "dev", version: "1.3.0-dev", source: null, path: "dev/" },
      { kind: "latest", version: "1.2.0", source: "aiskills-v1.2.0", path: "" },
      { kind: "older", version: "1.1.0", source: "aiskills-v1.1.0", path: "v/1.1.0/" },
    ]);
    assert.equal(plan({ version: "1.3.0-dev", tags, releases: "all" }).length, 4);
  });

  test("on a release: the working tree at the root, older tags under v/, no dev/", async () => {
    const { plan } = await load();
    // Its own tag (pushed after the release) isn't listed twice; a tag newer than it is ignored.
    const tags = ["aiskills-v1.2.0", "aiskills-v1.3.0", "aiskills-v1.1.0", "aiskills-v9.0.0"];
    assert.deepEqual(plan({ version: "1.3.0", tags, releases: 3 }), [
      { kind: "latest", version: "1.3.0", source: null, path: "" },
      { kind: "older", version: "1.2.0", source: "aiskills-v1.2.0", path: "v/1.2.0/" },
      { kind: "older", version: "1.1.0", source: "aiskills-v1.1.0", path: "v/1.1.0/" },
    ]);
  });

  test("a -dev version with no release tag yet is the only page", async () => {
    const { plan } = await load();
    assert.deepEqual(plan({ version: "0.2.0-dev", tags: [] }), [{ kind: "latest", version: "0.2.0-dev", source: null, path: "" }]);
  });

  test("--releases counts the latest release too, and defaults to 5", async () => {
    const { plan } = await load();
    const tags = ["0.1.0", "0.2.0", "0.3.0", "0.4.0", "0.5.0", "0.6.0", "0.7.0"].map((v) => `aiskills-v${v}`);
    assert.deepEqual(plan({ version: "0.8.0-dev", tags }).map((p) => p.version), ["0.8.0-dev", "0.7.0", "0.6.0", "0.5.0", "0.4.0", "0.3.0"]);
    assert.deepEqual(plan({ version: "0.8.0-dev", tags, releases: 1 }).map((p) => p.version), ["0.8.0-dev", "0.7.0"]);
    assert.throws(() => plan({ version: "1.0.0", tags, releases: 0 }), /--releases/);
  });
});

describe("build-site: the built site", () => {
  const menuLinks = (html) => [...(/<div class="ver-list">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "").matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);

  test("while package.json is -dev: the latest release at the root, older ones under v/, the working tree in dev/", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ releases: ["1.0.0", "2.0.0", "2.1.0"], next: "2.2.0-dev" });
    try {
      const out = join(dir, "site");
      quiet(() => main(["--out", out, "--ref", "master", "--releases", "2"], { pkgDir: pkg, repo }));

      const root = readFileSync(join(out, "index.html"), "utf8");
      assert.equal(summary(root), "v2.1.0");
      assert.deepEqual(menuLinks(root), ["dev/", "./", "v/2.0.0/"]);
      assert.ok(!root.includes('class="channel-note"'));
      assert.ok(data(root).pages[0].md.includes("RELEASE-2.1.0"), "the root shows the newest tag's docs");
      assert.match(data(root).repoBase, /\/blob\/aiskills-v2\.1\.0\//, "its links point at the tag");

      const older = readFileSync(join(out, "v", "2.0.0", "index.html"), "utf8");
      assert.equal(summary(older), "v2.0.0");
      assert.deepEqual(menuLinks(older), ["../../dev/", "../../", "../../v/2.0.0/"]);
      assert.match(older, /an older release/);
      assert.ok(data(older).pages[0].md.includes("RELEASE-2.0.0"));
      assert.match(data(older).repoBase, /\/blob\/aiskills-v2\.0\.0\//);
      assert.ok(!existsSync(join(out, "v", "1.0.0")), "--releases 2 leaves out 1.0.0");

      const dev = readFileSync(join(out, "dev", "index.html"), "utf8");
      assert.equal(summary(dev), "v2.2.0-dev");
      assert.match(dev, /which is not released yet/);
      assert.ok(data(dev).pages[0].md.includes("DEV-ONLY-MARKER"), "dev/ shows the working tree");
      assert.match(data(dev).repoBase, /\/blob\/master\//);

      for (const d of [out, join(out, "v", "2.0.0"), join(out, "dev")]) {
        assert.ok(existsSync(join(d, "explainers", "scrolls-explainer.html")), `explainer missing next to ${d}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("on a release: it at the root, older releases under v/, and dev/ sends readers to the root", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ releases: ["1.0.0", "2.0.0"] });
    try {
      const out = join(dir, "site");
      quiet(() => main(["--out", out, "--ref", "master"], { pkgDir: pkg, repo }));
      const root = readFileSync(join(out, "index.html"), "utf8");
      assert.equal(summary(root), "v2.0.0");
      assert.deepEqual(menuLinks(root), ["./", "v/1.0.0/"]);
      assert.ok(existsSync(join(out, "v", "1.0.0", "index.html")));
      const redirect = readFileSync(join(out, "dev", "index.html"), "utf8");
      assert.match(redirect, /<meta http-equiv="refresh" content="0; url=\.\.\/">/);
      assert.match(redirect, /location\.replace\("\.\.\/" \+ location\.hash\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a -dev version with no release tag yet builds one page, without a menu", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ releases: ["0.1.0"], next: "0.2.0-dev", tag: false });
    try {
      const out = join(dir, "site");
      quiet(() => main(["--out", out], { pkgDir: pkg, repo }));
      const root = readFileSync(join(out, "index.html"), "utf8");
      assert.ok(root.includes('<span class="brand-ver">v0.2.0-dev</span>'));
      assert.ok(data(root).pages[0].md.includes("DEV-ONLY-MARKER"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("--out is required", async () => {
    const { main } = await load();
    assert.throws(() => main([]), /usage: build-site\.mjs --out <dir>/);
    assert.throws(() => main(["--out", "x", "--releases", "none"]), /--releases/);
  });
});
