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

/**
 * Map shipped package paths back to the repo's nested skills/ paths using
 * .aiskills/layout.json: skills/<name>/x -> skills/<original>/x and
 * .aiskills/nested/x -> skills/x. Other paths are dropped.
 */
const toRepoPaths = (paths, layout) =>
  paths.flatMap((p) => {
    let m = /^skills\/([^/]+)\/(.+)$/.exec(p);
    if (m) return [`skills/${layout.skills[m[1]]}/${unrename(m[2])}`];
    m = /^\.aiskills\/nested\/(.+)$/.exec(p);
    return m ? [`skills/${unrename(m[1])}`] : [];
  });

describe("vendor-skills.mjs", () => {
  test("flattens skills/ to one folder per skill, each with a SKILL.md", (t) => {
    if (!copy) return t.skip("git not available");
    const res = npm(["run", "-s", "vendor"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    const tops = readdirSync(join(copy.pkg, "skills"), { withFileTypes: true });
    assert.ok(tops.every((e) => e.isDirectory()), "only folders at the top of skills/");
    const expected = copy.skills.filter((p) => p.endsWith("/SKILL.md")).map((p) => p.split("/").at(-2)).sort();
    assert.deepEqual(tops.map((e) => e.name).sort(), expected);
    for (const e of tops) assert.ok(existsSync(join(copy.pkg, "skills", e.name, "SKILL.md")), e.name);
  });

  test("skills/ + .aiskills/nested/ hold every repo file, file-for-file, plus marketplace.json and LICENSE", (t) => {
    if (!copy) return t.skip("git not available");
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    const pkgPaths = [
      ...walk(join(copy.pkg, "skills")).map((p) => "skills/" + p),
      ...walk(join(copy.pkg, ".aiskills", "nested")).map((p) => ".aiskills/nested/" + p),
    ];
    const repoPaths = toRepoPaths(pkgPaths, layout);
    assert.deepEqual([...repoPaths].sort(), [...copy.skills].sort());
    pkgPaths.forEach((p, i) => {
      assert.ok(readFileSync(join(copy.pkg, p)).equals(readFileSync(join(copy.repo, repoPaths[i]))), `${p} == ${repoPaths[i]}`);
    });
    assert.deepEqual(
      JSON.parse(readFileSync(join(copy.pkg, ".claude-plugin", "marketplace.json"), "utf8")),
      JSON.parse(readFileSync(join(copy.repo, ".claude-plugin", "marketplace.json"), "utf8")),
    );
    assert.ok(existsSync(join(copy.pkg, "LICENSE")));
  });

  test("renames nested .gitignore/.npmignore so npm keeps them", (t) => {
    if (!copy) return t.skip("git not available");
    const names = [...walk(join(copy.pkg, "skills")), ...walk(join(copy.pkg, ".aiskills", "nested"))];
    assert.ok(!names.some((p) => /(^|\/)\.(git|npm)ignore$/.test(p)), "no raw ignore files left");
    const expected = copy.skills.filter((p) => /\/\.(git|npm)ignore$/.test(p)).length;
    assert.equal(names.filter((p) => /(^|\/)_(git|npm)ignore$/.test(p)).length, expected);
  });

  test("clean removes everything it vendored", (t) => {
    if (!copy) return t.skip("git not available");
    npm(["run", "-s", "vendor"], { cwd: copy.pkg });
    const res = npm(["run", "-s", "clean"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    for (const p of ["skills", ".claude-plugin", ".aiskills", "LICENSE"]) assert.ok(!existsSync(join(copy.pkg, p)), p);
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
      ".aiskills/layout.json",
    ]) {
      assert.ok(files.includes(p), p);
    }
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    assert.deepEqual(toRepoPaths(files, layout).sort(), [...copy.skills].sort());
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
        put(c.repo, `skills/zz-fixture/demo/${rel}`); // ships flat as skills/demo/...
      }
      put(c.repo, "skills/zz-fixture/CLAUDE.md"); // group-level file: ships under .aiskills/nested/
      const res = npm(["pack", "--dry-run", "--json"], { cwd: c.pkg });
      assert.equal(res.status, 0, res.stderr);
      const files = JSON.parse(res.stdout)[0].files.map((f) => f.path);
      for (const p of ["AGENTS.md", "CLAUDE.md", "SCROLLS.md", "docs/.scrolls/HANDOFF.md"]) {
        assert.ok(!files.includes(p), `root ${p} must not ship`);
        assert.ok(files.includes(`skills/demo/${p}`), `skills/demo/${p} must ship`);
      }
      assert.ok(files.includes(".aiskills/nested/zz-fixture/CLAUDE.md"), "group-level CLAUDE.md must ship");
    } finally {
      rmSync(c.dir, { recursive: true, force: true });
    }
  });
});
