// Tests for the GitHub Pages site build (src/scripts/docs/build-site.mjs,
// npm run docs:site). While package.json is a pre-release (x.y.z-dev), the
// site has two versions: the newest release tag's docs at the root and the
// working tree's docs in dev/. Otherwise it has one, and dev/ sends readers
// to the root.
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
 * A git repository holding a copy of this package's docs under pkg/, with
 * package.json at `released`, tagged aiskills-v<released>; then, if `next`
 * is given, a commit that marks the landing page and sets package.json to
 * `next`. Returns { repo, pkg, dir }.
 */
function fixtureRepo({ released = "2.0.0", next = null, tag = true } = {}) {
  const dir = tempDir();
  const repo = join(dir, "repo");
  const pkg = join(repo, "pkg");
  mkdirSync(pkg, { recursive: true });
  cpSync(join(PKG_SRC, "docs", "docsite"), join(pkg, "docs", "docsite"), { recursive: true });
  cpSync(join(PKG_SRC, "docs", "banner"), join(pkg, "docs", "banner"), { recursive: true });
  const setVersion = (v) => writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "fixture", version: v }) + "\n");
  setVersion(released);
  git(repo, "init", "-q", "-b", "master");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", `release ${released}`);
  if (tag) {
    git(repo, "tag", "-a", `aiskills-v${released}`, "-m", released);
    git(repo, "tag", "other-v9.0.0"); // not an aiskills release
  }
  if (next) {
    const landing = join(pkg, "docs", "docsite", "README.md");
    writeFileSync(landing, readFileSync(landing, "utf8") + "\nDEV-ONLY-MARKER\n");
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

  test("a pre-release with a release tag gets both versions; anything else gets one", async () => {
    const { plan } = await load();
    const tags = ["aiskills-v1.2.0", "aiskills-v1.1.0"];
    assert.deepEqual(plan({ version: "1.3.0-dev", tags }), { both: true, stable: { tag: "aiskills-v1.2.0", version: "1.2.0" }, dev: "1.3.0-dev" });
    assert.deepEqual(plan({ version: "1.3.0", tags }), { both: false, reason: "1.3.0 is a release" });
    assert.deepEqual(plan({ version: "1.3.0-dev", tags: [] }), { both: false, reason: "no aiskills-vX.Y.Z release tag" });
  });
});

describe("build-site: the built site", () => {
  test("while package.json is -dev: the release tag's docs at the root, the working tree's in dev/", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ released: "2.0.0", next: "2.1.0-dev" });
    try {
      const out = join(dir, "site");
      quiet(() => main(["--out", out, "--ref", "master"], { pkgDir: pkg, repo }));

      const stable = readFileSync(join(out, "index.html"), "utf8");
      assert.equal(summary(stable), "v2.0.0");
      assert.ok(stable.includes('<a href="dev/"><span>2.1.0-dev</span>'));
      assert.ok(!stable.includes('class="channel-note"'));
      assert.ok(!data(stable).pages[0].md.includes("DEV-ONLY-MARKER"), "the root shows the tagged docs");
      assert.match(data(stable).repoBase, /\/blob\/aiskills-v2\.0\.0\//, "its links point at the tag");

      const dev = readFileSync(join(out, "dev", "index.html"), "utf8");
      assert.equal(summary(dev), "v2.1.0-dev");
      assert.ok(dev.includes('class="channel-note"'));
      assert.ok(data(dev).pages[0].md.includes("DEV-ONLY-MARKER"), "dev/ shows the working tree");
      assert.match(data(dev).repoBase, /\/blob\/master\//);

      for (const d of [out, join(out, "dev")]) {
        assert.ok(existsSync(join(d, "explainers", "scrolls-explainer.html")), `explainer missing next to ${d}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("on a release: one version at the root, and dev/ sends readers there", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ released: "2.0.0" });
    try {
      const out = join(dir, "site");
      quiet(() => main(["--out", out, "--ref", "master"], { pkgDir: pkg, repo }));
      const root = readFileSync(join(out, "index.html"), "utf8");
      assert.ok(root.includes('<span class="brand-ver">v2.0.0</span>'));
      assert.ok(!root.includes('class="ver-menu"'));
      const redirect = readFileSync(join(out, "dev", "index.html"), "utf8");
      assert.match(redirect, /<meta http-equiv="refresh" content="0; url=\.\.\/">/);
      assert.match(redirect, /location\.replace\("\.\.\/" \+ location\.hash\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a -dev version with no release tag yet builds one version", async () => {
    const { main } = await load();
    const { repo, pkg, dir } = fixtureRepo({ released: "0.1.0", next: "0.2.0-dev", tag: false });
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
  });
});
