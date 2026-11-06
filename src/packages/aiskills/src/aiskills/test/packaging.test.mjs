// Packaging tests: what `prepack` vendors and what `npm pack` would publish.
// Runs on a throwaway copy of the repo (helpers.repoCopy), never in place.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { after, before, describe, test } from "node:test";

import { npm, repoCopy } from "./helpers.mjs";

let copy;
before(() => {
  copy = repoCopy();
});
after(() => copy && rmSync(copy.dir, { recursive: true, force: true }));

const walk = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), base) : [relative(base, join(dir, e.name)).split(sep).join("/")],
  );
const unrename = (p) => p.replace(/(^|\/)_gitignore$/, "$1.gitignore").replace(/(^|\/)_npmignore$/, "$1.npmignore");

describe("vendor-skills.mjs", () => {
  test("copies skills/ file-for-file, plus marketplace.json and LICENSE", (t) => {
    if (!copy) return t.skip("git not available");
    const res = npm(["run", "-s", "vendor"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    const vendored = walk(join(copy.pkg, "skills")).map((p) => "skills/" + unrename(p)).sort();
    assert.deepEqual(vendored, [...copy.skills].sort());
    assert.deepEqual(
      JSON.parse(readFileSync(join(copy.pkg, ".claude-plugin", "marketplace.json"), "utf8")),
      JSON.parse(readFileSync(join(copy.repo, ".claude-plugin", "marketplace.json"), "utf8")),
    );
    assert.ok(existsSync(join(copy.pkg, "LICENSE")));
  });

  test("renames nested .gitignore/.npmignore so npm keeps them", (t) => {
    if (!copy) return t.skip("git not available");
    const names = walk(join(copy.pkg, "skills"));
    assert.ok(!names.some((p) => /(^|\/)\.(git|npm)ignore$/.test(p)), "no raw ignore files left");
    const expected = copy.skills.filter((p) => /\/\.(git|npm)ignore$/.test(p)).length;
    assert.equal(names.filter((p) => /(^|\/)_(git|npm)ignore$/.test(p)).length, expected);
  });

  test("clean removes everything it vendored", (t) => {
    if (!copy) return t.skip("git not available");
    npm(["run", "-s", "vendor"], { cwd: copy.pkg });
    const res = npm(["run", "-s", "clean"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    for (const p of ["skills", ".claude-plugin", "LICENSE"]) assert.ok(!existsSync(join(copy.pkg, p)), p);
  });
});

describe("npm pack", () => {
  let files;
  before(() => {
    if (!copy) return;
    const res = npm(["pack", "--dry-run", "--json"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    files = JSON.parse(res.stdout)[0].files.map((f) => f.path);
  });

  test("ships the CLI, installer, postinstall, metadata and every skill", (t) => {
    if (!copy) return t.skip("git not available");
    for (const p of [
      "package.json",
      "README.md",
      "LICENSE",
      "src/aiskills/cli.mjs",
      "src/aiskills/installer.mjs",
      "src/aiskills/postinstall.mjs",
      ".claude-plugin/marketplace.json",
    ]) {
      assert.ok(files.includes(p), p);
    }
    const shipped = files.filter((p) => p.startsWith("skills/")).map(unrename).sort();
    assert.deepEqual(shipped, [...copy.skills].sort());
  });

  test("all shipped code is the runtime files under src/aiskills/", (t) => {
    if (!copy) return t.skip("git not available");
    const code = files.filter((p) => /\.(m?js|cjs)$/.test(p) && !p.startsWith("skills/"));
    assert.deepEqual(code.sort(), ["src/aiskills/cli.mjs", "src/aiskills/installer.mjs", "src/aiskills/postinstall.mjs"]);
  });

  test("leaves out tests, dev scripts and the scrolls memory", (t) => {
    if (!copy) return t.skip("git not available");
    for (const p of files) {
      assert.doesNotMatch(p, /^(src\/aiskills\/test\/|docs\/|SCROLLS\.md$|CLAUDE\.md$|AGENTS\.md$|src\/aiskills\/vendor-skills\.mjs$)/, p);
    }
  });
});
