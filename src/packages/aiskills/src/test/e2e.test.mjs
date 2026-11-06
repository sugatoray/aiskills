// End-to-end: pack the package, install it globally into a throwaway prefix
// and HOME, and let the REAL `npx skills` install and remove skills.
//
// Needs network access (npm registry for `skills`), so it only runs when
// AISKILLS_E2E=1 is set:   npm run test:e2e
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { listTree, npm, repoCopy } from "./helpers.mjs";

const enabled = process.env.AISKILLS_E2E === "1";

describe("e2e: npm install -g + real npx skills", { skip: !enabled && "set AISKILLS_E2E=1 to run", timeout: 600_000 }, () => {
  let copy, home, prefix, cli;
  const env = () => ({ HOME: home, USERPROFILE: home, AISKILLS_HOME: "" });
  const aiskills = (...args) => {
    const res = spawnSync(cli, args, { encoding: "utf8", env: { ...process.env, ...env() }, cwd: home });
    return { status: res.status, out: (res.stdout ?? "") + (res.stderr ?? "") };
  };

  before(() => {
    copy = repoCopy();
    assert.ok(copy, "git is required");
    home = join(copy.dir, "home");
    prefix = join(copy.dir, "prefix");
    mkdirSync(join(home, ".claude"), { recursive: true });
    const pack = npm(["pack", "--pack-destination", copy.dir], { cwd: copy.pkg });
    assert.equal(pack.status, 0, pack.stderr);
    const tgz = readdirSync(copy.dir).find((f) => f.endsWith(".tgz"));
    const install = npm(["install", "-g", "--prefix", prefix, join(copy.dir, tgz)], {
      cwd: copy.dir,
      env: { ...env(), AISKILLS_GROUPS: "personas", AISKILLS_AGENTS: "claude-code" },
    });
    assert.equal(install.status, 0, install.stderr);
    // npm's own bin link inside the install prefix, not a folder in this package.
    cli = process.platform === "win32" ? join(prefix, "aiskills.cmd") : join(prefix, "bin", "aiskills");
  });
  after(() => copy && rmSync(copy.dir, { recursive: true, force: true }));

  const root = () => join(home, ".config", "sugatoray", "aiskills");

  test("postinstall saved the skills and installed the requested group", () => {
    assert.ok(existsSync(join(root(), "skills")));
    assert.ok(existsSync(join(root(), ".claude-plugin", "marketplace.json")));
    assert.ok(existsSync(join(home, ".claude", "skills", "prodigy")));
    assert.match(aiskills("installed").out, /^prodigy\s+personas-skills\s+Claude Code$/m);
  });

  test("install by group + pattern, then partial uninstall", () => {
    assert.equal(aiskills("install", "-G", "scroll*", "-a", "claude-code").status, 0);
    assert.ok(existsSync(join(home, ".claude", "skills", "scrolls-setup")));
    assert.equal(aiskills("uninstall", "-s", "scrolls-[hu]*").status, 0);
    assert.ok(!existsSync(join(home, ".claude", "skills", "scrolls-hide")));
    assert.ok(existsSync(join(home, ".claude", "skills", "scrolls-setup")));
  });

  test("--nested rebuilds the repo's skills/ folder exactly; --flat goes back", () => {
    assert.equal(aiskills("sync", "--nested").status, 0);
    const shipped = copy.skills.filter((p) => !p.endsWith("/.skillsignore")); // no .skillsignore in the repo yet
    assert.deepEqual(listTree(join(root(), "skills")), shipped.map((p) => p.slice("skills/".length)).sort());
    for (const rel of shipped) {
      assert.ok(readFileSync(join(home, ".config", "sugatoray", "aiskills", rel)).equals(readFileSync(join(copy.repo, rel))), rel);
    }
    assert.equal(aiskills("sync", "--flat").status, 0);
    assert.ok(existsSync(join(root(), "skills", "prodigy", "SKILL.md")));
  });

  test("npx skills experimental_sync finds every skill in node_modules", () => {
    const proj = join(copy.dir, "proj");
    mkdirSync(join(proj, ".claude"), { recursive: true });
    writeFileSync(join(proj, "package.json"), JSON.stringify({ name: "proj", private: true }));
    const tgz = readdirSync(copy.dir).find((f) => f.endsWith(".tgz"));
    const inst = npm(["install", "--ignore-scripts", join(copy.dir, tgz)], { cwd: proj, env: env() });
    assert.equal(inst.status, 0, inst.stderr);
    const res = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["-y", "skills", "experimental_sync", "--agent", "claude-code", "--yes"], {
      cwd: proj,
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, ...env() },
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    const expected = copy.skills.filter((p) => p.endsWith("/SKILL.md")).map((p) => p.split("/").at(-2)).sort();
    assert.deepEqual(readdirSync(join(proj, ".claude", "skills")).sort(), expected);
  });

  test("the ais command is installed and is the same as aiskills", () => {
    const ais = process.platform === "win32" ? join(prefix, "ais.cmd") : join(prefix, "bin", "ais");
    const res = spawnSync(ais, ["installed"], { encoding: "utf8", env: { ...process.env, ...env() }, cwd: home });
    assert.equal(res.status, 0, res.stderr);
    assert.equal(res.stdout, aiskills("installed").out);
  });

  test("the aix command is installed and runs in --route mode", () => {
    const aix = process.platform === "win32" ? join(prefix, "aix.cmd") : join(prefix, "bin", "aix");
    const res = spawnSync(aix, ["installed"], { encoding: "utf8", env: { ...process.env, ...env() }, cwd: home });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /^prodigy\s+bundled\s+personas-skills/m, "route mode shows the source column");
  });

  test("uninstall --purge removes everything and the local folder", () => {
    assert.equal(aiskills("uninstall", "--purge").status, 0);
    assert.ok(!existsSync(root()));
    assert.ok(!existsSync(join(home, ".claude", "skills", "prodigy")));
    assert.ok(!existsSync(join(home, ".claude", "skills", "scrolls-setup")));
  });
});
