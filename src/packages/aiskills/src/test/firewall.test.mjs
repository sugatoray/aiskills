// Behind a firewall: a company npm mirror (Artifactory, Nexus, Verdaccio)
// or a network proxy, where github.com and git traffic are often blocked.
//
// 1. The skills.sh count (a `git clone` of github.com in the background) is
//    off by default when npm uses a registry mirror or a proxy.
// 2. The skills CLI is a pinned dependency of the package, so the registry
//    (and its policies) see it at install time, and aiskills runs that copy
//    instead of fetching it again with `npx` at run time.
// 3. A `--route` source that has to be cloned from GitHub explains why it
//    failed when it can't be reached.

import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { PKG_SRC, sandbox, skillsArgs, tempDir } from "./helpers.mjs";
import {
  SKILLS_CLI_VERSION,
  STATS_SOURCE,
  bundledSkillsCli,
  isGitSource,
  networkRestriction,
  parseNpmConfigGet,
  resolveStats,
  skillsCommand,
} from "../scripts/core/installer.mjs";

const MIRROR = "https://acme.jfrog.io/artifactory/api/npm/npm-remote/";
const FG = { AISKILLS_STATS_FOREGROUND: "1" };
const isStats = (c) => skillsArgs(c)[0] === "add" && skillsArgs(c)[1] === STATS_SOURCE;

describe("networkRestriction: does npm go through a company mirror or a proxy?", () => {
  test("the public registry and no proxy: no restriction", () => {
    assert.equal(networkRestriction({ registry: "https://registry.npmjs.org/" }, {}), null);
    assert.equal(networkRestriction({ registry: "https://registry.npmjs.org" }, {}), null);
    assert.equal(networkRestriction({ registry: "https://registry.yarnpkg.com/" }, {}), null);
    assert.equal(networkRestriction({}, {}), null, "unknown config is not a restriction");
  });

  test("a registry mirror is named by its host only (never credentials or paths)", () => {
    const why = networkRestriction({ registry: MIRROR }, {});
    assert.equal(why, "npm uses a registry mirror (acme.jfrog.io)");
    const secret = networkRestriction({ registry: "https://user:s3cret@nexus.corp.example/repository/npm/" }, {});
    assert.equal(secret, "npm uses a registry mirror (nexus.corp.example)");
  });

  test("a proxy from npm's config or the environment, without showing its URL", () => {
    assert.equal(networkRestriction({ httpsProxy: "http://u:p@proxy.corp:8080" }, {}), "npm uses a network proxy");
    assert.equal(networkRestriction({ proxy: "http://proxy.corp:8080" }, {}), "npm uses a network proxy");
    assert.equal(networkRestriction({}, { HTTPS_PROXY: "http://proxy.corp:8080" }), "npm uses a network proxy");
    assert.equal(networkRestriction({}, { http_proxy: "http://proxy.corp:8080" }), "npm uses a network proxy");
    assert.equal(networkRestriction({ httpsProxy: "null", proxy: "" }, {}), null, "npm prints null for unset");
  });

  test("parseNpmConfigGet reads `npm config get registry https-proxy proxy`", () => {
    assert.deepEqual(parseNpmConfigGet(`registry=${MIRROR}\nhttps-proxy=null\nproxy=http://p:3128\n`), {
      registry: MIRROR,
      httpsProxy: null,
      proxy: "http://p:3128",
    });
    assert.deepEqual(parseNpmConfigGet(""), {});
  });
});

describe("resolveStats: a mirror or proxy turns the count off by default", () => {
  const behind = () => "npm uses a registry mirror (acme.jfrog.io)";
  const open = () => null;
  const remember = (root, stats) => writeFileSync(join(root, "aiskills.json"), JSON.stringify({ package: "@sugatoray-ai/aiskills", stats }));

  test("off by default behind a mirror; on by default otherwise", () => {
    assert.equal(resolveStats(undefined, tempDir(), behind), false);
    assert.equal(resolveStats(undefined, tempDir(), open), true);
  });

  test("an explicit choice still wins: --stats, AISKILLS_STATS, the remembered choice", () => {
    assert.equal(resolveStats(true, tempDir(), behind), true);
    const root = tempDir();
    remember(root, true);
    assert.equal(resolveStats(undefined, root, behind), true);
    const saved = process.env.AISKILLS_STATS;
    process.env.AISKILLS_STATS = "1";
    try {
      assert.equal(resolveStats(undefined, tempDir(), behind), true);
    } finally {
      if (saved === undefined) delete process.env.AISKILLS_STATS;
      else process.env.AISKILLS_STATS = saved;
    }
  });
});

describe("aiskills install behind a registry mirror", () => {
  test("doesn't clone github.com for the count, and says why", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"], { env: { ...FG, FAKE_NPM_REGISTRY: MIRROR } });
    assert.equal(res.status, 0, res.out);
    assert.equal(res.calls.filter(isStats).length, 0, JSON.stringify(res.calls));
    assert.ok(
      res.out.includes("[aiskills] not adding this install to the skills.sh count: npm uses a registry mirror (acme.jfrog.io); turn on with --stats"),
      res.out,
    );
    b.cleanup();
  });

  test("--stats still counts it", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install", "--stats"], { env: { ...FG, FAKE_NPM_REGISTRY: MIRROR } });
    assert.equal(res.status, 0, res.out);
    assert.equal(res.calls.filter(isStats).length, 1, JSON.stringify(res.calls));
    b.cleanup();
  });

  test("a proxy in npm's config turns it off too", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["install"], { env: { ...FG, FAKE_NPM_HTTPS_PROXY: "http://proxy.corp:8080" } });
    assert.equal(res.status, 0, res.out);
    assert.equal(res.calls.filter(isStats).length, 0, JSON.stringify(res.calls));
    assert.ok(res.out.includes("count: npm uses a network proxy;"), res.out);
    assert.ok(!res.out.includes("proxy.corp"), "the proxy URL is never printed");
    b.cleanup();
  });

  test("info names the reason as the setting's source", () => {
    const b = sandbox({ stats: true });
    const res = b.run(["info", "--json"], { env: { FAKE_NPM_REGISTRY: MIRROR } });
    assert.equal(res.status, 0, res.out);
    const { stats } = JSON.parse(res.out).settings;
    assert.deepEqual(stats, { value: "off", source: "npm uses a registry mirror (acme.jfrog.io)" });
    b.cleanup();
  });
});

describe("the skills CLI ships as a pinned dependency", () => {
  test("package.json depends on exactly the tested skills version", () => {
    const pj = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.deepEqual(pj.dependencies, { skills: SKILLS_CLI_VERSION });
  });

  test("engines.node is the skills CLI's own minimum, Node.js 22.20", () => {
    // skills@1.7.6 declares "node": ">=22.20.0"; raise this with any skills bump that raises it.
    const pj = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.equal(pj.engines.node, ">=22.20.0");
  });

  /** A stand-in skills package at <dir>/node_modules/skills. */
  const fakeSkills = (dir, version = SKILLS_CLI_VERSION) => {
    const at = join(dir, "node_modules", "skills");
    mkdirSync(join(at, "bin"), { recursive: true });
    writeFileSync(join(at, "package.json"), JSON.stringify({ name: "skills", version, bin: { skills: "./bin/cli.mjs" } }));
    writeFileSync(
      join(at, "bin", "cli.mjs"),
      `import { appendFileSync } from "node:fs";\n` +
        `if (process.env.FAKE_NPX_LOG) appendFileSync(process.env.FAKE_NPX_LOG, JSON.stringify({ args: ["skills", ...process.argv.slice(2)], cwd: process.cwd(), bundled: true }) + "\\n");\n`,
    );
    return join(at, "bin", "cli.mjs");
  };

  test("bundledSkillsCli finds it next to the package or in a parent node_modules", () => {
    const top = tempDir();
    const bin = fakeSkills(top);
    const pkg = join(top, "node_modules", "@sugatoray-ai", "aiskills");
    mkdirSync(pkg, { recursive: true });
    assert.deepEqual(bundledSkillsCli(pkg), { version: SKILLS_CLI_VERSION, bin });
    assert.equal(bundledSkillsCli(tempDir()), null);
  });

  test("skillsCommand runs the bundled copy with node when it is the pinned version", () => {
    const pkg = tempDir();
    const bin = fakeSkills(pkg);
    const cmd = skillsCommand(["add", "x", "--yes"], { pkgDir: pkg });
    assert.equal(cmd.command, process.execPath);
    assert.deepEqual(cmd.argv, [bin, "add", "x", "--yes"]);
    assert.equal(cmd.shell, false, "never through a shell, on any platform");
    assert.equal(cmd.display, `skills@${SKILLS_CLI_VERSION} (bundled) add x --yes`);
  });

  test("falls back to npx when the bundled copy is missing or another version", () => {
    for (const pkg of [tempDir(), (() => { const d = tempDir(); fakeSkills(d, "1.0.0"); return d; })()]) {
      const cmd = skillsCommand(["list"], { pkgDir: pkg });
      assert.match(cmd.command, /^npx(\.cmd)?$/);
      assert.equal(cmd.display, `npx -y skills@${SKILLS_CLI_VERSION} list`);
    }
  });

  test("AISKILLS_SKILLS_LIB_VERSION asks for another version, so npx runs it", () => {
    const pkg = tempDir();
    fakeSkills(pkg);
    const saved = process.env.AISKILLS_SKILLS_LIB_VERSION;
    process.env.AISKILLS_SKILLS_LIB_VERSION = "1.7.5";
    try {
      assert.equal(skillsCommand(["list"], { pkgDir: pkg }).display, "npx -y skills@1.7.5 list");
    } finally {
      if (saved === undefined) delete process.env.AISKILLS_SKILLS_LIB_VERSION;
      else process.env.AISKILLS_SKILLS_LIB_VERSION = saved;
    }
  });

  test("aiskills install runs the bundled copy, not npx", () => {
    const b = sandbox();
    fakeSkills(b.pkg);
    const res = b.run(["install", "-a", "claude-code"]);
    assert.equal(res.status, 0, res.out);
    const adds = res.calls.filter((c) => skillsArgs(c)[0] === "add");
    assert.equal(adds.length, 1, JSON.stringify(res.calls));
    assert.equal(adds[0].bundled, true, "ran the bundled skills CLI");
    assert.equal(skillsArgs(adds[0])[1], b.root);
    assert.ok(res.out.includes(`[aiskills] running: skills@${SKILLS_CLI_VERSION} (bundled) add ${b.root} --global`), res.out);
    b.cleanup();
  });
});

describe("--route sources that come from GitHub", () => {
  test("isGitSource: owner/repo and git URLs, not local paths", () => {
    for (const s of ["owner/repo", "owner/repo@skill", "https://github.com/o/r", "git@github.com:o/r.git", "https://gitlab.com/o/r"]) {
      assert.equal(isGitSource(s), true, s);
    }
    for (const s of ["./skills/x", "../x", "/abs/path", "~/skills", "C:\\skills\\x"]) assert.equal(isGitSource(s), false, s);
  });

  test("a failed install of a GitHub source explains the firewall case", () => {
    const b = sandbox();
    const res = b.run(["install", "--route", "-s", "owner/repo@x", "-a", "claude-code"], { env: { FAKE_EXIT: "1" } });
    assert.notEqual(res.status, 0, res.out);
    assert.ok(
      res.out.includes("could not install owner/repo@x: it is cloned from GitHub with git, not downloaded from the npm registry"),
      res.out,
    );
    b.cleanup();
  });

  test("names the mirror when there is one", () => {
    const b = sandbox();
    const res = b.run(["install", "--route", "-s", "owner/repo@x", "-a", "claude-code"], { env: { FAKE_EXIT: "1", FAKE_NPM_REGISTRY: MIRROR } });
    assert.notEqual(res.status, 0, res.out);
    assert.ok(res.out.includes("npm uses a registry mirror (acme.jfrog.io)"), res.out);
    b.cleanup();
  });

  test("a failed local path gets no GitHub explanation", () => {
    const b = sandbox();
    const res = b.run(["install", "--route", "-s", "./local/x", "-a", "claude-code"], { env: { FAKE_EXIT: "1" } });
    assert.notEqual(res.status, 0, res.out);
    assert.ok(!res.out.includes("cloned from GitHub"), res.out);
    b.cleanup();
  });

  test("a registry lookup that can't reach skills.sh says so, instead of 'not found'", () => {
    const b = sandbox();
    const res = b.run(["install", "--route", "-s", "pdf", "-a", "claude-code"], { env: { FAKE_FIND_EXIT: "1" } });
    assert.notEqual(res.status, 0, res.out);
    assert.ok(res.out.includes("could not search the skills registry for 'pdf'"), res.out);
    assert.ok(!res.out.includes("no skill named 'pdf' found"), res.out);
    b.cleanup();
  });
});
