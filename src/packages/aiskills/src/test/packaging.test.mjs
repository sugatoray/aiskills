// Packaging tests: what `prepack` vendors and what `npm pack` would publish.
// Runs on a throwaway copy of the repo (helpers.repoCopy), never in place.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
      "bin/aiskills.mjs",
      "src/scripts/cli.mjs",
      "src/scripts/installer.mjs",
      "src/scripts/postinstall.mjs",
      ".claude-plugin/marketplace.json",
    ]) {
      assert.ok(files.includes(p), p);
    }
    const shipped = files.filter((p) => p.startsWith("skills/")).map(unrename).sort();
    assert.deepEqual(shipped, [...copy.skills].sort());
  });

  test("ships only the bin/ entry point and the runtime files under src/scripts/", (t) => {
    if (!copy) return t.skip("git not available");
    const code = files.filter((p) => /\.(m?js|cjs)$/.test(p) && !p.startsWith("skills/"));
    assert.deepEqual(code.sort(), ["bin/aiskills.mjs", "src/scripts/cli.mjs", "src/scripts/installer.mjs", "src/scripts/postinstall.mjs"]);
  });

  test("leaves out tests, dev scripts and the scrolls memory", (t) => {
    if (!copy) return t.skip("git not available");
    for (const p of files) {
      assert.doesNotMatch(p, /^(src\/aiskills\/test\/|docs\/|SCROLLS\.md$|CLAUDE\.md$|AGENTS\.md$|src\/aiskills\/vendor-skills\.mjs$)/, p);
    }
  });
});

describe(".npmignore", () => {
  // "files" in package.json already keeps these out, and npm never lets
  // .npmignore exclude anything "files" lists. So drop "files" here to test
  // the .npmignore safety net on its own.
  test("keeps the package's own memory files out, but not same-named files inside a skill", (t) => {
    const c = repoCopy();
    if (!c) return t.skip("git not available");
    try {
      const pj = JSON.parse(readFileSync(join(c.pkg, "package.json"), "utf8"));
      delete pj.files;
      writeFileSync(join(c.pkg, "package.json"), JSON.stringify(pj, null, 2));
      const put = (base, rel) => {
        mkdirSync(join(base, rel, ".."), { recursive: true });
        writeFileSync(join(base, rel), "x\n");
      };
      // The package's project memory (must NOT ship) ...
      for (const rel of ["AGENTS.md", "CLAUDE.md", "SCROLLS.md", "docs/.scrolls/HANDOFF.md"]) put(c.pkg, rel);
      // ... and a bundled skill that happens to use the same names (must ship).
      for (const rel of ["AGENTS.md", "CLAUDE.md", "SCROLLS.md", "docs/.scrolls/HANDOFF.md", "SKILL.md"]) {
        put(c.repo, `skills/zz-fixture/demo/${rel}`);
      }
      const res = npm(["pack", "--dry-run", "--json"], { cwd: c.pkg });
      assert.equal(res.status, 0, res.stderr);
      const files = JSON.parse(res.stdout)[0].files.map((f) => f.path);
      for (const p of ["AGENTS.md", "CLAUDE.md", "SCROLLS.md", "docs/.scrolls/HANDOFF.md"]) {
        assert.ok(!files.includes(p), `root ${p} must not ship`);
        assert.ok(files.includes(`skills/zz-fixture/demo/${p}`), `skills/.../${p} must ship`);
      }
    } finally {
      rmSync(c.dir, { recursive: true, force: true });
    }
  });
});
