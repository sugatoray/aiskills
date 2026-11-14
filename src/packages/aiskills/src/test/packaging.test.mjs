// Packaging tests: what `prepack` vendors and what `npm pack` would publish.
// Runs on a throwaway copy of the repo (helpers.repoCopy), never in place.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { after, before, describe, test } from "node:test";

import { PKG_SRC, REPO_ROOT, npm, repoCopy } from "./helpers.mjs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

// SHA-256 of https://www.apache.org/licenses/LICENSE-2.0.txt
const APACHE_2_SHA256 = "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30";
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

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

/** The repo files that should ship: tracked files minus .skillsignore files and what they ignore. */
const shippable = (tracked, layout) =>
  tracked.filter((p) => {
    if (p.endsWith("/.skillsignore")) return false;
    const rel = p.slice("skills/".length);
    return !(layout.ignored ?? []).some((i) => (i.endsWith("/") ? rel.startsWith(i) : rel === i));
  });

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
    // Every tracked skill, minus those a .skillsignore leaves out (layout.json lists them).
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    const expected = shippable(copy.skills, layout).filter((p) => p.endsWith("/SKILL.md")).map((p) => p.split("/").at(-2)).sort();
    assert.ok(expected.length > 5, `expected skills: ${expected}`);
    assert.deepEqual(tops.map((e) => e.name).sort(), expected);
    for (const e of tops) assert.ok(existsSync(join(copy.pkg, "skills", e.name, "SKILL.md")), e.name);
  });

  test("skills/ + .aiskills/nested/ hold every repo file, file-for-file, plus marketplace.json", (t) => {
    if (!copy) return t.skip("git not available");
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    const pkgPaths = [
      ...walk(join(copy.pkg, "skills")).map((p) => "skills/" + p),
      ...walk(join(copy.pkg, ".aiskills", "nested")).map((p) => ".aiskills/nested/" + p),
    ];
    const repoPaths = toRepoPaths(pkgPaths, layout);
    assert.deepEqual([...repoPaths].sort(), shippable(copy.skills, layout).sort());
    pkgPaths.forEach((p, i) => {
      assert.ok(readFileSync(join(copy.pkg, p)).equals(readFileSync(join(copy.repo, repoPaths[i]))), `${p} == ${repoPaths[i]}`);
    });
    assert.deepEqual(
      JSON.parse(readFileSync(join(copy.pkg, ".claude-plugin", "marketplace.json"), "utf8")),
      JSON.parse(readFileSync(join(copy.repo, ".claude-plugin", "marketplace.json"), "utf8")),
    );
    assert.equal(sha256(join(copy.pkg, "LICENSE")), APACHE_2_SHA256, "vendoring keeps the package's own Apache-2.0 LICENSE (the repo's LICENSE is MIT)");
  });

  test("skills/newsletters/.skillsignore leaves newsletter-ai out of the package; the repo keeps it for npx skills add", (t) => {
    if (!copy) return t.skip("git not available");
    const ignore = join(REPO_ROOT, "skills", "newsletters", ".skillsignore");
    assert.ok(existsSync(ignore), "skills/newsletters/.skillsignore");
    const rules = readFileSync(ignore, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    assert.deepEqual(rules, ["newsletter-ai/"]);
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    assert.ok(!("newsletter-ai" in layout.skills), "not in layout.json's skills");
    assert.ok(layout.ignored.includes("newsletters/newsletter-ai/"), `ignored: ${layout.ignored}`);
    assert.ok(!existsSync(join(copy.pkg, "skills", "newsletter-ai")), "not vendored");
    assert.ok(!existsSync(join(copy.pkg, ".aiskills", "nested", "newsletters")), "nothing of the family ships");
    // npx skills add sugatoray/aiskills reads the repo itself, where the skill stays.
    const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "skills/newsletters/newsletter-ai/SKILL.md"], { cwd: REPO_ROOT });
    assert.equal(tracked.status, 0, "the skill is still in the repo");
  });

  test("renames nested .gitignore/.npmignore so npm keeps them", (t) => {
    if (!copy) return t.skip("git not available");
    const names = [...walk(join(copy.pkg, "skills")), ...walk(join(copy.pkg, ".aiskills", "nested"))];
    assert.ok(!names.some((p) => /(^|\/)\.(git|npm)ignore$/.test(p)), "no raw ignore files left");
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    const expected = shippable(copy.skills, layout).filter((p) => /\/\.(git|npm)ignore$/.test(p)).length;
    assert.equal(names.filter((p) => /(^|\/)_(git|npm)ignore$/.test(p)).length, expected);
  });

  test("clean removes everything it vendored", (t) => {
    if (!copy) return t.skip("git not available");
    npm(["run", "-s", "vendor"], { cwd: copy.pkg });
    const res = npm(["run", "-s", "clean"], { cwd: copy.pkg });
    assert.equal(res.status, 0, res.stderr);
    for (const p of ["skills", ".claude-plugin", ".aiskills"]) assert.ok(!existsSync(join(copy.pkg, p)), p);
    assert.equal(sha256(join(copy.pkg, "LICENSE")), APACHE_2_SHA256, "clean keeps the committed LICENSE");
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

  test("ships the CLI, installer, metadata and every skill", (t) => {
    if (!copy) return t.skip("git not available");
    for (const p of [
      "package.json",
      "README.md",
      "CHANGELOG.md",
      "SECURITY.md",
      "LICENSE",
      "bin/aiskills.mjs",
      "bin/aix.mjs",
      "src/scripts/core/cli.mjs",
      "src/scripts/core/installer.mjs",
      "src/scripts/core/releases.mjs",
      "src/scripts/core/upgrade.mjs",
      ".claude-plugin/marketplace.json",
      ".aiskills/layout.json",
    ]) {
      assert.ok(files.includes(p), p);
    }
    const layout = JSON.parse(readFileSync(join(copy.pkg, ".aiskills", "layout.json"), "utf8"));
    assert.deepEqual(toRepoPaths(files, layout).sort(), shippable(copy.skills, layout).sort());
  });

  test("ships nothing of newsletter-ai", (t) => {
    if (!copy) return t.skip("git not available");
    assert.deepEqual(files.filter((p) => /newsletter/i.test(p)), []);
  });

  test("ships only the bin/ entry points and the runtime files under src/scripts/core/", (t) => {
    if (!copy) return t.skip("git not available");
    const code = files.filter((p) => /\.(m?js|cjs)$/.test(p) && !p.startsWith("skills/"));
    assert.deepEqual(code.sort(), ["bin/aiskills.mjs", "bin/aix.mjs", "src/scripts/core/cli.mjs", "src/scripts/core/installer.mjs", "src/scripts/core/releases.mjs", "src/scripts/core/upgrade.mjs"]);
  });

  test("installing the package runs nothing: no install-time lifecycle scripts", () => {
    // AIS-7 (option B): `npm install` only puts the files in place; `aiskills install`
    // saves and registers the skills. npm runs these scripts when the package is
    // installed as a dependency (prepare only for git installs).
    const { scripts } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    for (const s of ["preinstall", "install", "postinstall", "prepare"]) {
      assert.equal(scripts[s], undefined, `package.json must not have a "${s}" script`);
    }
  });

  test("the README's CLI summary lists every option install and uninstall accept", () => {
    const cli = readFileSync(join(PKG_SRC, "src", "scripts", "core", "cli.mjs"), "utf8");
    const flags = { scope: ["-g", "-p"], agent: ["-a"], skill: ["-s"], group: ["-G"], copy: ["--copy"], route: ["--route"], layout: ["--nested", "--flat"],
                    dryRun: ["-n"], yes: ["-y"], purge: ["--purge"], force: ["-f"], stats: ["--stats", "--no-stats"],
                    interactive: ["-i"], lastAgents: ["-l"] };
    const readme = readFileSync(join(PKG_SRC, "README.md"), "utf8");
    for (const [cmd, re] of [["install", /const opts = parse\(rest, \[([^\]]+)\]\);/], ["uninstall", /return uninstall\(parse\(rest, \[([^\]]+)\]\)\);/]]) {
      const allowed = [...cli.match(re)[1].matchAll(/"(\w+)"/g)].map((m) => m[1]);
      assert.ok(allowed.length > 3, `${cmd}: parsed ${allowed}`);
      const line = readme.split("\n").find((l) => new RegExp(`^aiskills ${cmd} +\\[`).test(l)); // the CLI summary line
      assert.ok(line, `README has no 'aiskills ${cmd}' line`);
      for (const opt of allowed) for (const f of flags[opt]) assert.ok(line.includes(`[${f}`) || line.includes(`|${f}`), `README 'aiskills ${cmd}' line lacks ${f}`);
    }
  });

  test("the package is licensed Apache-2.0: package.json, a committed LICENSE with the official text, and the README", () => {
    assert.equal(JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8")).license, "Apache-2.0");
    assert.equal(sha256(join(PKG_SRC, "LICENSE")), APACHE_2_SHA256, "LICENSE is https://www.apache.org/licenses/LICENSE-2.0.txt, unchanged");
    const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "LICENSE"], { cwd: PKG_SRC });
    assert.equal(tracked.status, 0, "LICENSE is committed, not vendored");
    const readme = readFileSync(join(PKG_SRC, "README.md"), "utf8");
    const section = readme.slice(readme.indexOf("\n## License\n"));
    assert.ok(readme.includes("\n## License\n"), "README has a License section");
    assert.match(section, /\[Apache License 2\.0\]\(LICENSE\)/);
    assert.match(section, /bundled skill keeps the license in its `SKILL\.md`/);
  });

  test("package.json declares the aiskills, ais and aix commands", () => {
    const { bin } = JSON.parse(readFileSync(join(copy?.pkg ?? ".", "package.json"), "utf8"));
    assert.deepEqual(bin, { aiskills: "bin/aiskills.mjs", ais: "bin/aiskills.mjs", aix: "bin/aix.mjs" });
  });

  test("leaves out tests, dev scripts and the scrolls memory", (t) => {
    if (!copy) return t.skip("git not available");
    for (const p of files) {
      assert.doesNotMatch(p, /^(src\/test\/|src\/scripts\/docs\/|src\/scripts\/pack\/|src\/scripts\/README\.md$|docs\/|SCROLLS\.md$|CLAUDE\.md$|AGENTS\.md$)/, p);
    }
    assert.ok(files.length > 20, "the file list is real");
  });

  test("src/scripts/ holds three groups: core/ (runtime), pack/ (packaging) and docs/ (docs and banner)", () => {
    const list = (rel) => readdirSync(join(PKG_SRC, "src", "scripts", rel), { withFileTypes: true }).map((e) => (e.isDirectory() ? e.name + "/" : e.name)).sort();
    assert.deepEqual(list("."), ["README.md", "core/", "docs/", "pack/"]);
    assert.deepEqual(list("core"), ["cli.mjs", "installer.mjs", "releases.mjs", "upgrade.mjs"]);
    assert.deepEqual(list("pack"), ["audit-skills.mjs", "skillsignore.mjs", "vendor-skills.mjs"]);
    assert.deepEqual(list("docs"), ["build-docs-html.mjs", "build-site.mjs", "build-skills-docs.mjs", "create-banner.mjs", "templates/", "themes.mjs"]);
    assert.deepEqual(list("docs/templates"), ["banner-template.html", "docs-template.html"]);
    // Imports only point "down": docs/ -> pack/ -> core/. core/ ships alone, so it may import neither.
    const read = (dir, f) => readFileSync(join(PKG_SRC, "src", "scripts", dir, f), "utf8");
    for (const f of list("core")) assert.doesNotMatch(read("core", f), /from "\.\.\/(docs|pack)\//, `core/${f} imports from docs/ or pack/`);
    for (const f of list("pack")) assert.doesNotMatch(read("pack", f), /from "\.\.\/docs\//, `pack/${f} imports from docs/`);
  });

  test("src/scripts/README.md explains each folder and lists every file in it", () => {
    const readme = readFileSync(join(PKG_SRC, "src", "scripts", "README.md"), "utf8");
    for (const dir of ["core", "pack", "docs"]) {
      assert.match(readme, new RegExp(`^## \`${dir}/\``, "m"), `no section for ${dir}/`);
      const section = readme.split(new RegExp(`^## \`${dir}/\``, "m"))[1].split(/^## /m)[0];
      const files = readdirSync(join(PKG_SRC, "src", "scripts", dir)).filter((f) => f !== "templates");
      for (const f of files) assert.ok(section.includes("`" + f + "`"), `${dir}/${f} isn't described in its section`);
    }
    assert.ok(readme.includes("`templates/`"), "docs/templates/ isn't described");
    for (const rule of ["published", "never imports", "files"]) assert.ok(readme.includes(rule), `README should explain: ${rule}`);
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

describe(".skillsignore in the repo", () => {
  test("npm pack leaves out what it ignores, and the .skillsignore itself", (t) => {
    const c = repoCopy();
    if (!c) return t.skip("git not available");
    try {
      writeFileSync(join(c.repo, "skills", ".skillsignore"), "# test\n**/tests/\n**/meta/MAINTAINERS.md\n");
      const res = npm(["pack", "--dry-run", "--json"], { cwd: c.pkg });
      assert.equal(res.status, 0, res.stderr);
      const files = JSON.parse(res.stdout)[0].files.map((f) => f.path);
      assert.ok(!files.some((p) => /\/tests\//.test(p)), "no tests/ folders ship");
      assert.ok(!files.some((p) => p.endsWith("meta/MAINTAINERS.md")), "no meta/MAINTAINERS.md ships");
      assert.ok(!files.some((p) => p.endsWith(".skillsignore")), "the ignore file doesn't ship");
      const layout = JSON.parse(readFileSync(join(c.pkg, ".aiskills", "layout.json"), "utf8"));
      assert.ok(layout.ignored.length > 0);
      assert.deepEqual(toRepoPaths(files, layout).sort(), shippable(c.skills, layout).sort());
      assert.ok(c.skills.some((p) => /\/tests\//.test(p)), "the repo really has tests/ folders to ignore");
    } finally {
      rmSync(c.dir, { recursive: true, force: true });
    }
  });
});
