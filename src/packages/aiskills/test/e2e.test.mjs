// End-to-end: pack the package, install it globally into a throwaway prefix
// and HOME, and let the REAL `npx skills` install and remove skills.
//
// Needs network access (npm registry for `skills`), so it only runs when
// AISKILLS_E2E=1 is set:   npm run test:e2e
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { npm, repoCopy } from "./helpers.mjs";

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

  test("uninstall --purge removes everything and the local folder", () => {
    assert.equal(aiskills("uninstall", "--purge").status, 0);
    assert.ok(!existsSync(root()));
    assert.ok(!existsSync(join(home, ".claude", "skills", "prodigy")));
    assert.ok(!existsSync(join(home, ".claude", "skills", "scrolls-setup")));
  });
});
