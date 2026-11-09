// The skills.sh install count. `aiskills install` registers the skills from a
// local folder, which `npx skills` doesn't count on skills.sh. So, after a
// successful install, aiskills also runs the real CLI against the GitHub repo
// (`npx skills add sugatoray/aiskills --skill ...`) as a throwaway project
// install in a temp folder, in the background; that run sends skills.sh its
// usual install event. When github.com can't be reached nothing is counted
// and nothing is shown. Off with --no-stats (remembered), AISKILLS_STATS=0,
// DO_NOT_TRACK, DISABLE_TELEMETRY, or CI.

import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { PKG_SRC, sandbox, skillsArgs, tempDir } from "./helpers.mjs";
import { STATS_SOURCE, resolveStats, statsArgs } from "../scripts/core/installer.mjs";

const COUNTING = "[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)";
const FIXTURE = ["a1", "a2", "beta-one", "beta-two", "lonely"];
// Run the count in the foreground, so a test can check it as soon as the command returns.
const FG = { AISKILLS_STATS_FOREGROUND: "1" };

const isStats = (c) => skillsArgs(c)[0] === "add" && skillsArgs(c)[1] === STATS_SOURCE;
const statsCalls = (res) => res.calls.filter(isStats);
/** --skill / --agent values of a logged call. */
const values = (args, flag) => args.flatMap((a, i) => (args[i - 1] === flag ? [a] : []));

/** Wait (up to ~15 s) until <fn> returns something truthy. */
async function eventually(fn) {
  for (let i = 0; i < 150; i++) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
  return fn();
}

describe("resolveStats: whether to add an install to the skills.sh count", () => {
  const root = tempDir();
  const saved = {};
  const VARS = ["AISKILLS_STATS", "DO_NOT_TRACK", "DISABLE_TELEMETRY", "CI", "GITHUB_ACTIONS"];
  before(() => VARS.forEach((k) => ((saved[k] = process.env[k]), delete process.env[k])));
  after(() => VARS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));
  const withEnv = (env, fn) => {
    Object.assign(process.env, env);
    try {
      return fn();
    } finally {
      for (const k of Object.keys(env)) delete process.env[k];
    }
  };
  const remember = (stats) => writeFileSync(join(root, "aiskills.json"), JSON.stringify({ package: "@sugatoray-ai/aiskills", stats }));

  test("on by default", () => {
    assert.equal(resolveStats(undefined, tempDir()), true);
  });

  test("--stats / --no-stats win over AISKILLS_STATS, which wins over the remembered choice", () => {
    remember(false);
    assert.equal(resolveStats(undefined, root), false);
    assert.equal(withEnv({ AISKILLS_STATS: "1" }, () => resolveStats(undefined, root)), true);
    assert.equal(withEnv({ AISKILLS_STATS: "1" }, () => resolveStats(false, root)), false);
    remember(true);
    assert.equal(resolveStats(undefined, root), true);
    assert.equal(withEnv({ AISKILLS_STATS: "0" }, () => resolveStats(undefined, root)), false);
    assert.equal(withEnv({ AISKILLS_STATS: "0" }, () => resolveStats(true, root)), true);
  });

  test("AISKILLS_STATS takes 1/0, true/false, yes/no, on/off; empty means unset; anything else is an error", () => {
    const dir = tempDir();
    for (const v of ["1", "true", "YES", "on"]) assert.equal(withEnv({ AISKILLS_STATS: v }, () => resolveStats(undefined, dir)), true, v);
    for (const v of ["0", "false", "No", "off"]) assert.equal(withEnv({ AISKILLS_STATS: v }, () => resolveStats(undefined, dir)), false, v);
    assert.equal(withEnv({ AISKILLS_STATS: "" }, () => resolveStats(undefined, dir)), true);
    assert.throws(() => withEnv({ AISKILLS_STATS: "maybe" }, () => resolveStats(undefined, dir)), /AISKILLS_STATS/);
  });

  test("DO_NOT_TRACK, DISABLE_TELEMETRY and CI always turn it off, even with --stats", () => {
    const dir = tempDir();
    for (const env of [{ DO_NOT_TRACK: "1" }, { DISABLE_TELEMETRY: "1" }, { CI: "true" }, { GITHUB_ACTIONS: "true" }]) {
      assert.equal(withEnv(env, () => resolveStats(true, dir)), false, JSON.stringify(env));
    }
  });
});

describe("statsArgs: the npx skills command that gets counted", () => {
  test("installs the given skills from the GitHub repo, copied, without prompts", () => {
    assert.deepEqual(statsArgs(["a1", "lonely"]), ["add", STATS_SOURCE, "--skill", "a1", "--skill", "lonely", "--agent", "universal", "--copy", "--yes"]);
  });

  test("uses the agents the user chose, if any", () => {
    assert.deepEqual(statsArgs(["a1"], ["claude-code", "codex"]), ["add", STATS_SOURCE, "--skill", "a1", "--agent", "claude-code", "--agent", "codex", "--copy", "--yes"]);
  });

  test("the source is the package's own GitHub repo", () => {
    const { repository } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.equal(`git+https://github.com/${STATS_SOURCE}.git`, repository.url);
  });
});

describe("aiskills install adds to the skills.sh install count", () => {
  test("after the install, in a temp folder that is removed afterwards", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"], { env: FG });
    assert.equal(res.status, 0, res.out);
    assert.ok(res.out.includes(COUNTING), res.out);
    const [main, count, ...rest] = res.calls.filter((c) => skillsArgs(c)[0] === "add");
    assert.equal(rest.length, 0);
    assert.equal(skillsArgs(main)[1], b.root, "the real install comes first");
    assert.ok(isStats(count), JSON.stringify(count));
    assert.deepEqual(values(skillsArgs(count), "--skill").sort(), FIXTURE);
    assert.deepEqual(values(skillsArgs(count), "--agent"), ["universal"]);
    assert.ok(!skillsArgs(count).includes("--global"), "a project install in the temp folder, never global");
    assert.ok(count.cwd.startsWith(tmpdir()) && !count.cwd.startsWith(b.dir), count.cwd);
    assert.ok(!existsSync(count.cwd), "the temp folder is removed");
    b.cleanup();
  });

  test("runs in the background by default and doesn't hold up the install", async () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"]);
    assert.equal(res.status, 0, res.out);
    assert.ok(res.out.includes(COUNTING), res.out);
    const count = await eventually(() => b.calls().find(isStats));
    assert.ok(count, "the background count never ran");
    assert.deepEqual(values(skillsArgs(count), "--skill").sort(), FIXTURE);
    assert.ok(await eventually(() => !existsSync(count.cwd)), "the temp folder is removed");
    b.cleanup();
  });

  test("counts only the skills that were installed, for the chosen agents", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install", "-G", "alpha", "-s", "lonely", "-a", "codex"], { env: FG });
    assert.equal(res.status, 0, res.out);
    const [count] = statsCalls(res);
    assert.deepEqual(values(skillsArgs(count), "--skill").sort(), ["a1", "a2", "lonely"]);
    assert.deepEqual(values(skillsArgs(count), "--agent"), ["codex"]);
    b.cleanup();
  });

  test("project installs are counted too", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install", "-p", "-s", "a1"], { env: FG });
    assert.equal(res.status, 0, res.out);
    assert.equal(statsCalls(res).length, 1);
    b.cleanup();
  });

  test("github.com unreachable: nothing is shown and the install still succeeds", async () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"], { env: { FAKE_STATS_EXIT: "128" } });
    assert.equal(res.status, 0, res.out);
    assert.doesNotMatch(res.out, /unable to access|fatal|error/i);
    const count = await eventually(() => b.calls().find(isStats));
    assert.ok(count);
    assert.ok(await eventually(() => !existsSync(count.cwd)), "the temp folder is removed even when it fails");
    // In the foreground too, the exit status is the install's.
    assert.equal(b.run(["install"], { env: { ...FG, FAKE_STATS_EXIT: "128" } }).status, 0);
    b.cleanup();
  });

  test("a failed install isn't counted", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"], { env: { ...FG, FAKE_EXIT: "1" } });
    assert.notEqual(res.status, 0);
    assert.equal(statsCalls(res).length, 0);
    assert.ok(!res.out.includes(COUNTING));
    b.cleanup();
  });

  test("--dry-run shows the command it would run, and runs nothing", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install", "-n", "-s", "a1"], { env: FG });
    assert.equal(res.status, 0, res.out);
    assert.equal(res.calls.length, 0);
    assert.ok(
      res.out.includes("[dry-run] skills.sh count: npx -y skills@1.7.6 add sugatoray/aiskills --skill a1 --agent universal --copy --yes (in a temp folder; turn off: --no-stats)"),
      res.out,
    );
    b.cleanup();
  });

  test("external skills (--route) aren't counted again: npx skills add counts them itself", () => {
    const b = sandbox({ stats: true });
    const only = b.run(["install", "--route", "-s", "owner/repo@x"], { env: FG });
    assert.equal(only.status, 0, only.out);
    assert.equal(statsCalls(only).length, 0);
    assert.ok(!only.out.includes(COUNTING));
    const mixed = b.run(["install", "--route", "-s", "a1,owner/repo@x"], { env: FG });
    assert.deepEqual(values(skillsArgs(statsCalls(mixed)[0]), "--skill"), ["a1"]);
    b.cleanup();
  });
});

describe("turning the skills.sh count off", () => {
  test("--no-stats skips it and is remembered; --stats turns it back on", () => {
    const b = sandbox({ stats: true });
    const off = b.run(["install", "--no-stats"], { env: FG });
    assert.equal(off.status, 0, off.out);
    assert.equal(statsCalls(off).length, 0);
    assert.ok(!off.out.includes(COUNTING));
    assert.equal(JSON.parse(readFileSync(join(b.root, "aiskills.json"), "utf8")).stats, false);
    assert.equal(statsCalls(b.run(["install"], { env: FG })).length, 0, "remembered");
    assert.equal(statsCalls(b.run(["sync"], { env: FG })).length, 0);
    assert.equal(JSON.parse(readFileSync(join(b.root, "aiskills.json"), "utf8")).stats, false, "sync keeps the choice");
    const on = b.run(["install", "--stats"], { env: FG });
    assert.equal(statsCalls(on).length, 1);
    assert.equal(JSON.parse(readFileSync(join(b.root, "aiskills.json"), "utf8")).stats, true);
    b.cleanup();
  });

  test("sync --no-stats remembers the choice without installing anything", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["sync", "--no-stats"]);
    assert.equal(res.status, 0, res.out);
    assert.equal(res.calls.length, 0);
    assert.equal(statsCalls(b.run(["install"], { env: FG })).length, 0);
    b.cleanup();
  });

  test("AISKILLS_STATS=0, DO_NOT_TRACK, DISABLE_TELEMETRY and CI skip it", () => {
    const b = sandbox({ stats: true });
    // --stats wins over AISKILLS_STATS=0, but never over DO_NOT_TRACK, DISABLE_TELEMETRY or CI.
    for (const [args, env] of [[[], { AISKILLS_STATS: "0" }], [["--stats"], { DO_NOT_TRACK: "1" }], [["--stats"], { DISABLE_TELEMETRY: "1" }], [["--stats"], { CI: "true" }]]) {
      const res = b.run(["install", ...args], { env: { ...FG, ...env } });
      assert.equal(res.status, 0, res.out);
      assert.equal(statsCalls(res).length, 0, JSON.stringify(env));
      assert.ok(!res.out.includes(COUNTING), JSON.stringify(env));
    }
    b.cleanup();
  });

  test("--stats and --no-stats are only for install and sync", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["uninstall", "--no-stats"]);
    assert.equal(res.status, 1);
    assert.match(res.out, /option --no-stats is not valid here/);
    b.cleanup();
  });

  test("--help documents the count and how to turn it off", () => {
    const b = sandbox();
    const { out } = b.run(["--help"]);
    assert.match(out, /--no-stats/);
    assert.match(out, /--stats/);
    assert.match(out, /AISKILLS_STATS=0/);
    assert.match(out, /skills\.sh/);
    b.cleanup();
  });
});
