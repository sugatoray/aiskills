// CLI tests for `aiskills upgrade`, in a sandbox laid out like `npm install -g`
// (see helpers.mjs): a stand-in npm answers `npm view`, `npm root -g` and
// `npm install -g` (which rewrites the package's version, and can add or drop
// a skill), and the stand-in npx records the refresh.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";

import { sandbox, skillsArgs } from "./helpers.mjs";

const posixOnly = { skip: process.platform === "win32" && "stand-in npm/npx are POSIX scripts" };
const VIEW = {
  time: {
    created: "2026-11-09T05:01:33.181Z",
    "0.7.0": "2026-11-11T18:03:58.985Z",
    "0.8.0": "2026-11-12T10:00:00.000Z",
    "0.9.0": "2026-11-20T10:00:00.000Z",
  },
  "dist-tags": { latest: "0.9.0", next: "1.0.0-beta.1" },
  versions: ["0.7.0", "0.8.0", "0.9.0", "1.0.0-beta.1"],
};

let sb;
before(() => {
  sb = sandbox({ globalNpm: true });
});
after(() => sb.cleanup());
beforeEach(() => {
  sb.setVersion("0.8.0");
  sb.setView(VIEW);
  sb.run(["sync"]);
  sb.setList([
    row("a1", sb.root, ["Claude Code", "Codex"]),
    row("a2", sb.root, ["Codex", "Claude Code"]),
    row("beta-one", sb.root, ["Cursor"]),
    row("pdf", "anthropics/skills", ["Claude Code"], "github"),
  ]);
  sb.npmCalls();
});

/** An `npx skills list --json` row. */
const row = (name, source, agents, sourceType = "local") => ({ name, scope: "global", agents, source, sourceType });
const version = () => JSON.parse(readFileSync(join(sb.pkg, "package.json"), "utf8")).version;
const adds = (calls) => calls.map(skillsArgs).filter((a) => a[0] === "add" && !a.includes("__aiskills_probe__"));

describe("aiskills upgrade", posixOnly, () => {
  test("--check reports, changes nothing, exits 0; --json for scripts", () => {
    const r = sb.run(["upgrade", "--check"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.out.trimEnd().split("\n"), [
      "[aiskills] installed: 0.8.0 (npm, global) · latest: 0.9.0 (published 2026-11-20)",
      "[aiskills] update available: run 'aiskills upgrade'",
    ]);
    assert.deepEqual(sb.npmCalls(), []);
    assert.deepEqual(adds(r.calls), []);
    const j = JSON.parse(sb.run(["upgrade", "--check", "--json"]).out);
    assert.deepEqual(j, { installed: "0.8.0", target: "0.9.0", tag: "latest", change: "upgrade", upgradable: true, method: "npm", global: true, published: "2026-11-20" });
  });

  test("upgrades with npm, then re-adds the installed skills for the same agents with the new code", () => {
    const r = sb.run(["upgrade"], { env: { FAKE_NPM_NEW_SKILL: "gamma" } });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(sb.npmCalls(), [["install", "-g", "@sugatoray-ai/aiskills@0.9.0"]]);
    assert.equal(version(), "0.9.0");
    assert.deepEqual(adds(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--agent", "claude-code", "--agent", "codex", "--yes"],
      ["add", sb.root, "--global", "--skill", "beta-one", "--agent", "cursor", "--yes"],
    ]);
    const out = r.out;
    assert.match(out, /^\[aiskills\] installed: 0\.8\.0 \(npm, global\) · latest: 0\.9\.0 \(published 2026-11-20\)$/m);
    assert.match(out, /^\[aiskills\] changes: https:\/\/github\.com\/sugatoray\/aiskills\/blob\/master\/src\/packages\/aiskills\/CHANGELOG\.md$/m);
    assert.match(out, /^\[aiskills\] running: npm install -g @sugatoray-ai\/aiskills@0\.9\.0$/m);
    assert.match(out, /^\[aiskills\] refreshing 2 skills for claude-code, codex \(global\) with aiskills 0\.9\.0$/m);
    assert.match(out, /^\[aiskills\] refreshing 1 skill for cursor \(global\) with aiskills 0\.9\.0$/m);
    assert.match(out, /^\[aiskills\] new in 0\.9\.0, not installed: gamma$/m);
    assert.match(out, /^ {2}to install them: {6}aiskills install -s gamma -a claude-code,codex,cursor$/m);
    assert.match(out, /^ {2}or pick from a list: {2}aiskills install -i$/m);
    assert.match(out, /^\[aiskills\] project installs aren't refreshed: run 'aiskills install -p' in each project that uses them$/m);
    assert.match(out, /^\[aiskills\] upgraded 0\.8\.0 → 0\.9\.0$/m);
  });

  test("already up to date: says so and changes nothing", () => {
    sb.setVersion("0.9.0");
    const r = sb.run(["upgrade"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /^\[aiskills\] already up to date \(0\.9\.0\)$/m);
    assert.deepEqual(sb.npmCalls(), []);
    assert.deepEqual(adds(r.calls), []);
    assert.match(sb.run(["upgrade", "--check"]).out, /^\[aiskills\] up to date$/m);
    sb.setVersion("1.0.0");
    assert.match(sb.run(["upgrade", "--check"]).out, /^\[aiskills\] installed 1\.0\.0 is newer than latest \(0\.9\.0\)$/m);
  });

  test("-n/--dry-run prints the commands and changes nothing", () => {
    const r = sb.run(["upgrade", "-n"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /^\[aiskills\] \[dry-run\] npm install -g @sugatoray-ai\/aiskills@0\.9\.0$/m);
    assert.match(r.out, /^\[aiskills\] \[dry-run\] then: aiskills install -g -s a1,a2 -a claude-code,codex$/m);
    assert.match(r.out, /^\[aiskills\] \[dry-run\] then: aiskills install -g -s beta-one -a cursor$/m);
    assert.deepEqual(sb.npmCalls(), []);
    assert.equal(version(), "0.8.0");
  });

  test("--no-refresh upgrades the package only and prints how to refresh", () => {
    const r = sb.run(["upgrade", "--no-refresh"]);
    assert.equal(r.status, 0, r.out);
    assert.equal(version(), "0.9.0");
    assert.deepEqual(adds(r.calls), []);
    assert.match(r.out, /^\[aiskills\] your agents still have the 0\.8\.0 skills; to update them:$/m);
    assert.match(r.out, /^ {2}aiskills install -g -s a1,a2 -a claude-code,codex$/m);
    assert.match(r.out, /^ {2}aiskills install -g -s beta-one -a cursor$/m);
  });

  test("a skill dropped by the new version isn't re-added, and how to remove it is shown", () => {
    const r = sb.run(["upgrade"], { env: { FAKE_NPM_DROP_SKILL: "a2" } });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(adds(r.calls)[0], ["add", sb.root, "--global", "--skill", "a1", "--agent", "claude-code", "--agent", "codex", "--yes"]);
    assert.match(r.out, /^\[aiskills\] no longer in 0\.9\.0 but still installed: a2$/m);
    assert.match(r.out, /^ {2}to remove: {2}aiskills uninstall -s a2$/m);
  });

  test("a tag or version on request; a downgrade needs -y (or a [y/N] in a terminal)", () => {
    let r = sb.run(["upgrade", "next", "-n"]);
    assert.match(r.out, /installed: 0\.8\.0 \(npm, global\) · next: 1\.0\.0-beta\.1$/m);
    r = sb.run(["upgrade", "0.7.0"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /^\[aiskills\] not downgrading 0\.8\.0 → 0\.7\.0 without confirmation: re-run with -y$/m);
    assert.equal(version(), "0.8.0");
    r = sb.run(["upgrade", "0.7.0", "-y", "--no-refresh"]);
    assert.equal(r.status, 0, r.out);
    assert.equal(version(), "0.7.0");
    assert.match(r.out, /^\[aiskills\] downgraded 0\.8\.0 → 0\.7\.0$/m);
    r = sb.run(["upgrade", "0.8.5"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /no version or tag '0\.8\.5' of @sugatoray-ai\/aiskills on the registry/);
  });

  test("npm failing: its exit code, with a hint for permission errors", () => {
    const r = sb.run(["upgrade"], { env: { FAKE_NPM_INSTALL_ERROR: "1" } });
    assert.equal(r.status, 243);
    assert.match(r.out, /npm has no permission to write its global folder\. Don't use sudo/);
    assert.equal(version(), "0.8.0");
    assert.deepEqual(adds(r.calls), []);
  });

  test("bad options are refused", () => {
    for (const [args, re] of [
      [["upgrade", "--json"], /--json only works with --check/],
      [["upgrade", "0.9.0", "0.8.0"], /give one version or tag/],
      [["upgrade", "--nope"], /unknown option: --nope/],
    ]) {
      const r = sb.run(args);
      assert.equal(r.status, 1, args.join(" "));
      assert.match(r.out, re);
    }
  });
});

describe("aiskills upgrade, not installed globally", posixOnly, () => {
  test("a source checkout (or npx, or a project dependency) says what to do instead", () => {
    const local = sandbox();
    try {
      local.setVersion("0.8.0");
      local.setView(VIEW);
      const check = local.run(["upgrade", "--check"]);
      assert.equal(check.status, 0, check.out);
      assert.match(check.out, /installed: 0\.8\.0 \(source checkout\) · latest: 0\.9\.0/);
      const r = local.run(["upgrade"]);
      assert.equal(r.status, 1);
      assert.match(r.out, /^\[aiskills\] can't upgrade: aiskills is running from a source checkout, not an installed package/m);
      assert.deepEqual(local.npmCalls(), []);
    } finally {
      local.cleanup();
    }
  });
});
