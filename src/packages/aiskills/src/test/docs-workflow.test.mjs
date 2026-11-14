// The GitHub Actions workflow that publishes docs/docsite/ on GitHub Pages
// (.github/workflows/aiskills-docs.yml at the repo root). Same shape as
// sugatoray/callai's docs.yml: build on master, upload a Pages artifact, deploy
// it with actions/deploy-pages. These tests keep the workflow pointing at real
// paths and scripts, so a moved folder or renamed script fails here instead of
// in CI after merge.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, test } from "node:test";

import { PKG_SRC, tempDir } from "./helpers.mjs";

const REPO = join(PKG_SRC, "..", "..", "..");
const PKG_REL = relative(REPO, PKG_SRC).split("\\").join("/"); // src/packages/aiskills
const WORKFLOW = join(REPO, ".github", "workflows", "aiskills-docs.yml");
const read = () => readFileSync(WORKFLOW, "utf8");
const pkg = () => JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));

/** The entries of the `paths:` list under `on.push`. */
function pushPaths(yml) {
  const block = yml.match(/\n\s+paths:\n((?:\s+- .+\n)+)/);
  assert.ok(block, "on.push should have a paths: list");
  return [...block[1].matchAll(/- "?([^"\n]+)"?/g)].map((m) => m[1].trim());
}

describe("docs publishing workflow", () => {
  test("exists at the repo root", () => {
    assert.ok(existsSync(WORKFLOW), `missing ${relative(REPO, WORKFLOW)}`);
  });

  test("runs on pushes to master and by hand, with an opt-out deploy input", () => {
    const yml = read();
    assert.match(yml, /\n {2}push:\n {4}branches: \[master\]/);
    assert.match(yml, /\n {4}tags: \["aiskills-v\*"\]/, "a pushed release tag rebuilds the site");
    assert.match(yml, /\n {2}workflow_dispatch:/);
    assert.match(yml, /\n {6}deploy:\n(?: {8}.+\n)*? {8}type: boolean/);
    assert.match(yml, /if: github\.event_name != 'workflow_dispatch' \|\| inputs\.deploy/);
  });

  test("every watched path exists, and the docs, builders and workflow are watched", () => {
    const paths = pushPaths(read());
    for (const p of paths) {
      const fixed = p.replace(/\/?\*\*.*$/, "");
      assert.ok(existsSync(join(REPO, fixed)), `paths: entry ${p} points at nothing`);
    }
    for (const need of [
      `${PKG_REL}/docs/docsite/**`,
      `${PKG_REL}/docs/banner/**`,
      `${PKG_REL}/src/scripts/docs/**`,
      `${PKG_REL}/package.json`,
      ".github/workflows/aiskills-docs.yml",
    ]) {
      assert.ok(paths.includes(need), `paths: should include ${need}`);
    }
  });

  test("builds with npm run docs:site in the package folder, on the branch being built", () => {
    const yml = read();
    assert.match(yml, new RegExp(`working-directory: ${PKG_REL.replace(/\//g, "\\/")}`));
    assert.match(yml, /run: npm run docs:site -- --ref \$\{\{ github\.ref_name \}\}/);
    assert.match(yml, /uses: actions\/setup-node@v\d+/);
  });

  test("checks out the full history, so the release tags are there", () => {
    assert.match(read(), /uses: actions\/checkout@v\d+\n\s+with:\n\s+fetch-depth: 0(?: #.*)?\n/);
  });

  test("docs:site builds the site into site/ with build-site.mjs", () => {
    const script = pkg().scripts["docs:site"];
    assert.ok(script, 'package.json needs a "docs:site" script');
    const m = script.match(/^node (\S+) --out (\S+)$/);
    assert.ok(m, `unexpected docs:site script: ${script}`);
    assert.equal(m[1], "src/scripts/docs/build-site.mjs");
    assert.ok(existsSync(join(PKG_SRC, m[1])));
    assert.equal(m[2], "site");
  });

  test("uploads the folder docs:site writes, and deploys it to GitHub Pages", () => {
    const yml = read();
    const upload = yml.match(/uses: actions\/upload-pages-artifact@v\d+\n\s+with:\n\s+path: (\S+)/);
    assert.ok(upload, "build should upload a Pages artifact");
    assert.equal(upload[1], `${PKG_REL}/site`);
    assert.match(yml, /uses: actions\/deploy-pages@v\d+/);
    assert.match(yml, /pages: write/);
    assert.match(yml, /id-token: write/);
    assert.match(yml, /name: github-pages/);
    assert.match(yml, /\npermissions:\n {2}contents: read/);
  });

  test("site/ is git-ignored and not published to npm", () => {
    const ignore = readFileSync(join(PKG_SRC, ".gitignore"), "utf8").split(/\r?\n/);
    assert.ok(ignore.includes("site/"), ".gitignore should list site/");
    assert.ok(!pkg().files.some((f) => f.replace(/^\//, "").startsWith("site")), "site/ must not be in files");
  });

  test("the build command the workflow runs writes a working site", async () => {
    const { main } = await import(new URL("../scripts/docs/build-site.mjs", import.meta.url).href);
    const site = join(tempDir(), "site");
    const err = console.error;
    console.error = () => {};
    let result;
    try {
      result = main(["--out", site, "--ref", "some-branch"]);
    } finally {
      console.error = err;
    }
    // The working tree's docs are in dev/ while package.json is -dev, else at the root.
    const current = join(site, result.find((p) => p.source === null).path);
    const html = readFileSync(join(current, "index.html"), "utf8");
    assert.match(html, /<title>[^<]*aiskills/i);
    assert.match(html, /github\.com\/sugatoray\/aiskills\/blob\/some-branch\//);
    const explainer = join(current, "explainers", "scrolls-explainer.html");
    assert.ok(existsSync(explainer), "the explainer page is published next to index.html");
    assert.equal(
      readFileSync(explainer, "utf8"),
      readFileSync(join(PKG_SRC, "docs", "docsite", "explainers", "scrolls-explainer.html"), "utf8"),
      "an exact copy of the one in docs/docsite/",
    );
    assert.ok(existsSync(join(site, "index.html")) && existsSync(join(site, "dev", "index.html")));
  });
});
