// CLI tests for bin/aiskills.mjs (-> src/scripts/core/cli.mjs).
//
// Each test runs the real CLI in a throwaway sandbox (see helpers.mjs) with a
// stand-in `npx` first on PATH, then checks the exact `npx skills` commands
// the CLI issued and what it wrote to disk. No network, no real $HOME.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { FIXTURE_SKILLS, listTree, row, sandbox, skillsArgs, skillsPackage } from "./helpers.mjs";
import { SKILLS_CLI_VERSION } from "../scripts/core/installer.mjs";

const posixOnly = { skip: process.platform === "win32" && "stand-in npx is a POSIX script" };

let sb;
beforeEach(() => {
  sb = sandbox();
});
afterEach(() => sb.cleanup());

/** Only the `npx skills add|remove` calls, without the agent-list probe or list/find. */
const changes = (calls) =>
  calls.map(skillsArgs).filter((a) => (a[0] === "add" || a[0] === "remove") && !a.includes("__aiskills_probe__") && !a.includes("--list"));

describe("aiskills (basics)", posixOnly, () => {
  test("--help mentions every command and --route", () => {
    const r = sb.run(["--help"]);
    assert.equal(r.status, 0);
    for (const word of ["install", "uninstall", "installed", "groups", "find", "skills <args>", "--route", "--group"]) {
      assert.match(r.out, new RegExp(word.replace(/[-<>]/g, "\\$&")), word);
    }
  });

  test("path prints the install root", () => {
    const r = sb.run(["path"]);
    assert.equal(r.status, 0);
    assert.equal(r.out.trim(), sb.root);
  });

  test("--version prints the package version", () => {
    const { version } = JSON.parse(readFileSync(join(sb.pkg, "package.json"), "utf8"));
    assert.equal(sb.run(["--version"]).out.trim(), version);
  });

  test("single-letter and short aliases run the same command as the full name", () => {
    sb.run(["sync"]);
    sb.setList([row("a1", sb.root)]);
    for (const [alias, full, args] of [
      ["ls", "installed", []],
      ["g", "groups", ["--json"]],
      ["p", "path", []],
      ["h", "help", []],
      ["f", "find", ["pdf"]],
    ]) {
      const a = sb.run([alias, ...args]);
      const b = sb.run([full, ...args]);
      assert.equal(a.status, 0, `${alias}: ${a.out}`);
      assert.equal(a.out, b.out, alias);
      assert.deepEqual(a.calls.map(skillsArgs), b.calls.map(skillsArgs), alias);
    }
    assert.deepEqual(changes(sb.run(["r", "-s", "a1"]).calls), [["remove", "a1", "--global", "--yes"]]);
  });

  test("i is install, rm and remove are uninstall", () => {
    const long = sb.run(["install", "-G", "alpha", "-a", "codex"]);
    const short = sb.run(["i", "-G", "alpha", "-a", "codex"]);
    assert.equal(short.status, 0, short.out);
    assert.deepEqual(changes(short.calls), changes(long.calls));
    assert.ok(changes(short.calls).length === 1);

    sb.setList([row("a1", sb.root)]);
    for (const cmd of ["uninstall", "rm", "remove"]) {
      assert.deepEqual(changes(sb.run([cmd, "-s", "a1"]).calls), [["remove", "a1", "--global", "--yes"]], cmd);
    }
  });

  test("aliases also work after a leading --route / --nested", () => {
    const r = sb.run(["--nested", "i", "-s", "a1"]);
    assert.equal(r.status, 0, r.out);
    assert.equal(JSON.parse(readFileSync(join(sb.root, "aiskills.json"), "utf8")).layout, "nested");
  });

  test("an unknown command or option fails", () => {
    assert.equal(sb.run(["frobnicate"]).status, 1);
    const r = sb.run(["install", "--bogus"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /unknown option: --bogus/);
  });

  test("an option without its value fails", () => {
    const r = sb.run(["install", "-G"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /-G needs a value/);
  });
});

describe("aiskills sync / install (bundled)", posixOnly, () => {
  test("sync saves flat skills/, marketplace.json and layout.json, restores dotfiles, runs nothing", () => {
    const r = sb.run(["sync"]);
    assert.equal(r.status, 0);
    assert.deepEqual(r.calls, []);
    assert.ok(existsSync(join(sb.root, "skills", "a1", "SKILL.md")));
    assert.ok(existsSync(join(sb.root, ".claude-plugin", "marketplace.json")));
    assert.ok(existsSync(join(sb.root, ".aiskills", "layout.json")));
    assert.ok(existsSync(join(sb.root, "skills", "lonely", ".gitignore")), "_gitignore renamed back");
    assert.ok(!existsSync(join(sb.root, "skills", "lonely", "_gitignore")));
    const meta = JSON.parse(readFileSync(join(sb.root, "aiskills.json"), "utf8"));
    assert.equal(meta.package, "@sugatoray-ai/aiskills");
    assert.equal(meta.layout, "flat");
  });

  test("sync replaces an older copy instead of merging into it", () => {
    sb.run(["sync"]);
    const stale = join(sb.root, "skills", "removed-in-new-version", "SKILL.md");
    mkdirSync(dirname(stale), { recursive: true });
    writeFileSync(stale, "---\nname: old\n---\n");
    sb.run(["sync"]);
    assert.ok(!existsSync(stale));
  });

  test("install with no options adds every skill globally from the root", () => {
    const r = sb.run(["install"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "*", "--yes"]]);
  });

  test("install --project runs in the current folder without --global", () => {
    const r = sb.run(["install", "-p", "-s", "a1"]);
    assert.equal(r.status, 0, r.out);
    const add = r.calls.find((c) => skillsArgs(c)[0] === "add");
    assert.deepEqual(skillsArgs(add), ["add", sb.root, "--skill", "a1", "--yes"]);
    assert.equal(add.cwd, sb.dir);
  });

  test("install -i leaves out --yes and --skill '*' so npx skills shows its pickers", () => {
    const r = sb.tty(["install", "-i"], "");
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global"]]);
  });

  test("install -i keeps -s/-G/-a (skipping those pickers) and still drops --yes", () => {
    const r = sb.tty(["install", "--interactive", "-G", "alpha", "-a", "codex"], "");
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--agent", "codex"]]);
  });

  test("install -i without a terminal is refused and installs nothing", () => {
    const r = sb.run(["install", "-i"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /-i\/--interactive needs a terminal/);
    assert.deepEqual(changes(r.calls), []);
  });

  test("install --last-agents uses the agents npx skills recorded as last picked", () => {
    mkdirSync(join(sb.home, ".agents"), { recursive: true });
    writeFileSync(join(sb.home, ".agents", ".skill-lock.json"), JSON.stringify({ version: 3, skills: {}, lastSelectedAgents: ["claude-code", "codex"] }));
    const r = sb.run(["install", "--last-agents", "-a", "cursor"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "*", "--agent", "cursor", "--agent", "claude-code", "--agent", "codex", "--yes"]]);
    // XDG_STATE_HOME moves the lock, as in npx skills.
    const state = join(sb.dir, "state");
    mkdirSync(join(state, "skills"), { recursive: true });
    writeFileSync(join(state, "skills", ".skill-lock.json"), JSON.stringify({ lastSelectedAgents: ["qoder"] }));
    const x = sb.run(["install", "--last-agents"], { env: { XDG_STATE_HOME: state } });
    assert.deepEqual(changes(x.calls), [["add", sb.root, "--global", "--skill", "*", "--agent", "qoder", "--yes"]]);
  });

  test("install --last-agents with nothing recorded is an error", () => {
    const r = sb.run(["install", "--last-agents"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /--last-agents: no agents recorded in .*\.skill-lock\.json/);
    assert.deepEqual(changes(r.calls), []);
  });

  test("-s, -G and -a accumulate, and --copy / -- extras pass through", () => {
    const r = sb.run(["install", "-G", "alpha", "-s", "lonely", "-s", "beta-one", "-a", "codex", "--copy", "--", "--full-depth"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--skill", "beta-one", "--skill", "lonely",
        "--agent", "codex", "--copy", "--yes", "--full-depth"],
    ]);
  });

  test("AISKILLS_* env vars are defaults, replaced by the command line", () => {
    const env = { AISKILLS_GROUPS: "beta", AISKILLS_AGENTS: "cursor" };
    assert.deepEqual(changes(sb.run(["install"], { env }).calls), [
      ["add", sb.root, "--global", "--skill", "beta-one", "--skill", "beta-two", "--agent", "cursor", "--yes"],
    ]);
    assert.deepEqual(changes(sb.run(["install", "-G", "alpha"], { env }).calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--agent", "cursor", "--yes"],
    ]);
  });

  test("an unknown skill is rejected with a --route hint and installs nothing", () => {
    const r = sb.run(["install", "-s", "a1,nope"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /not provided by this package: nope/);
    assert.match(r.out, /--route/);
    assert.deepEqual(changes(r.calls), []);
  });
});

describe("layouts: --flat (default) and --nested", posixOnly, () => {
  const FLAT = ["a1", "a2", "beta-one", "beta-two", "lonely"];
  const top = () => listTree(join(sb.root, "skills")).map((p) => p.split("/")[0]).filter((v, i, a) => a.indexOf(v) === i);
  const layoutOf = () => JSON.parse(readFileSync(join(sb.root, "aiskills.json"), "utf8")).layout;

  test("the vendored package is flat, with layout.json and the extra files", () => {
    assert.deepEqual(listTree(join(sb.pkg, "skills")).map((p) => p.split("/")[0]).filter((v, i, a) => a.indexOf(v) === i), FLAT);
    const layout = JSON.parse(readFileSync(join(sb.pkg, ".aiskills", "layout.json"), "utf8"));
    assert.deepEqual(layout.skills, {
      a1: "alpha/a1",
      a2: "alpha/a2",
      "beta-one": "beta/beta-one",
      "beta-two": "beta/beta-two",
      lonely: "loose/lonely",
    });
    assert.deepEqual(layout.extras, ["alpha/.claude-plugin/plugin.json", "alpha/README.md", "beta/.gitignore"]);
    assert.ok(existsSync(join(sb.pkg, ".aiskills", "nested", "beta", "_gitignore")));
  });

  test("--nested rebuilds the repo's skills/ folder exactly", () => {
    const r = sb.run(["sync", "--nested"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(listTree(join(sb.root, "skills")), Object.keys(FIXTURE_SKILLS).sort());
    for (const [rel, body] of Object.entries(FIXTURE_SKILLS)) {
      assert.equal(readFileSync(join(sb.root, "skills", rel), "utf8"), body, rel);
    }
    assert.equal(layoutOf(), "nested");
  });

  test("the layout is remembered; --flat switches back", () => {
    sb.run(["sync", "--nested"]);
    sb.run(["sync"]);
    assert.deepEqual(top(), ["alpha", "beta", "loose"]);
    assert.equal(layoutOf(), "nested");
    sb.run(["sync", "--flat"]);
    assert.deepEqual(top(), FLAT);
    assert.equal(layoutOf(), "flat");
  });

  test("--nested before the command, bare 'aiskills --nested', and AISKILLS_LAYOUT", () => {
    sb.run(["--nested", "sync"]);
    assert.equal(layoutOf(), "nested");
    sb.run(["--flat", "sync"]);
    assert.equal(layoutOf(), "flat");

    const bare = sb.run(["--nested"]);
    assert.equal(bare.status, 0, bare.out);
    assert.equal(layoutOf(), "nested");
    assert.deepEqual(changes(bare.calls), [["add", sb.root, "--global", "--skill", "*", "--yes"]]);

    sb.run(["sync", "--flat"]);
    sb.run(["sync"], { env: { AISKILLS_LAYOUT: "nested" } });
    assert.equal(layoutOf(), "nested");
    sb.run(["sync", "--flat"], { env: { AISKILLS_LAYOUT: "nested" } });
    assert.equal(layoutOf(), "flat", "the flag beats the env var");
  });

  test("groups and installs work the same in both layouts", () => {
    for (const layout of ["--flat", "--nested"]) {
      const r = sb.run(["install", layout, "-G", "alpha,beta"]);
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(changes(r.calls), [
        ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--skill", "beta-one", "--skill", "beta-two", "--yes"],
      ], layout);
      assert.deepEqual(JSON.parse(sb.run(["groups", "--json"]).out).ungrouped, ["lonely"], layout);
    }
  });

  test("sync honours AISKILLS_LAYOUT", () => {
    const r = sb.run(["sync"], { env: { AISKILLS_LAYOUT: "nested" } });
    assert.equal(r.status, 0, r.out);
    assert.ok(existsSync(join(sb.root, "skills", "alpha", "a1", "SKILL.md")));
    assert.ok(existsSync(join(sb.root, "skills", "beta", ".gitignore")));
  });

  test("bad layouts are refused", () => {
    const bad = sb.run(["sync"], { env: { AISKILLS_LAYOUT: "sideways" } });
    assert.equal(bad.status, 1);
    assert.match(bad.out, /unknown layout 'sideways'/);

    rmSync(join(sb.pkg, ".aiskills", "layout.json"));
    const old = sb.run(["sync", "--nested"]);
    assert.equal(old.status, 1);
    assert.match(old.out, /--nested can't rebuild/);
    assert.equal(sb.run(["sync", "--flat"]).status, 0, "a package without layout.json still syncs flat");
  });

  test("--nested is only accepted where it makes sense", () => {
    const r = sb.run(["uninstall", "--nested"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /option --nested is not valid here/);
  });
});

describe("groups and patterns", posixOnly, () => {
  test("groups --json lists groups (name, alias, skills) and ungrouped skills", () => {
    const r = sb.run(["groups", "--json"]);
    assert.equal(r.status, 0);
    const data = JSON.parse(r.out);
    assert.deepEqual(data.groups.map((g) => [g.name, g.alias, g.skills]), [
      ["alpha-skills", "alpha", ["a1", "a2"]],
      ["beta-skills", "beta", ["beta-one", "beta-two"]],
    ]);
    assert.deepEqual(data.ungrouped, ["lonely"]);
  });

  test("--group accepts the name or the alias", () => {
    for (const g of ["alpha-skills", "alpha"]) {
      assert.deepEqual(changes(sb.run(["install", "--group", g]).calls), [
        ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--yes"],
      ]);
    }
  });

  test("glob patterns in -s and -G", () => {
    const r = sb.run(["install", "-s", "beta-*", "-G", "al*"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--skill", "a2", "--skill", "beta-one", "--skill", "beta-two", "--yes"],
    ]);
  });

  test("agent patterns expand against the list npx skills reports", () => {
    const r = sb.run(["install", "-s", "a1", "-a", "qoder*,codex"]);
    assert.equal(r.status, 0, r.out);
    assert.ok(r.calls.some((c) => skillsArgs(c).includes("__aiskills_probe__")), "probed for the agent list");
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--agent", "qoder", "--agent", "qoder-cn", "--agent", "codex", "--yes"],
    ]);
  });

  test("a lone -a '*' and plain agent names are passed through without probing", () => {
    const r = sb.run(["install", "-s", "a1", "-a", "*"]);
    assert.ok(!r.calls.some((c) => skillsArgs(c).includes("__aiskills_probe__")));
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "a1", "--agent", "*", "--yes"]]);
  });

  test("patterns that match nothing fail before anything is installed", () => {
    for (const [args, msg] of [
      [["-s", "zz*"], /no skill matches: zz\*/],
      [["-G", "zz*"], /no group matches: zz\*/],
      [["-G", "nope"], /no group matches: nope/],
      [["-s", "a1", "-a", "zz*"], /no agent matches: zz\*/],
    ]) {
      const r = sb.run(["install", ...args]);
      assert.equal(r.status, 1, args.join(" "));
      assert.match(r.out, msg);
      assert.deepEqual(changes(r.calls), [], args.join(" "));
    }
  });
});

describe("aiskills install --route", posixOnly, () => {
  test("a bare name with one exact match is looked up, then installed after the bundled ones", () => {
    sb.setFind("Install with npx skills add <owner/repo@skill>\n\nacme/tools@ext 1.2K installs\n└ https://skills.sh/acme/tools/ext\n\nacme/tools@ext-plus 3 installs\n");
    const r = sb.run(["install", "--route", "-s", "a1,ext", "-a", "claude-code", "--yes"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(skillsArgs(r.calls.find((c) => skillsArgs(c)[0] === "find")), ["find", "ext"]);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--agent", "claude-code", "--yes"],
      ["add", "acme/tools@ext", "--global", "--agent", "claude-code", "--yes"],
    ]);
  });

  test("--route also works before the command, and via AISKILLS_ROUTE", () => {
    sb.setFind("acme/tools@ext\n");
    for (const [args, env] of [[["--route", "install", "-s", "ext", "-y"], {}], [["install", "-s", "ext", "-y"], { AISKILLS_ROUTE: "1" }]]) {
      const r = sb.run(args, { env });
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(changes(r.calls), [["add", "acme/tools@ext", "--global", "--yes"]]);
    }
  });

  test("owner/repo@skill, URLs and paths skip the lookup", () => {
    const r = sb.run(["install", "--route", "-s", "acme/tools@ext,https://example.com/r.git", "-p"]);
    assert.equal(r.status, 0, r.out);
    assert.ok(!r.calls.some((c) => skillsArgs(c)[0] === "find"));
    assert.deepEqual(changes(r.calls), [
      ["add", "acme/tools@ext", "--yes"],
      ["add", "https://example.com/r.git", "--yes"],
    ]);
  });

  test("several exact matches: stop, list them, install nothing", () => {
    sb.setFind("a/one@dupe 5 installs\nb/two@dupe 9 installs\n");
    const r = sb.run(["install", "--route", "-s", "a1,dupe"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /'dupe' matches several skills[\s\S]*a\/one@dupe[\s\S]*b\/two@dupe/);
    assert.deepEqual(changes(r.calls), [], "not even the bundled a1");
  });

  test("no exact match: stop and show the closest results", () => {
    sb.setFind("acme/tools@ext-plus 3 installs\n");
    const r = sb.run(["install", "--route", "-s", "ext"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /no skill named exactly 'ext'[\s\S]*acme\/tools@ext-plus/);
    assert.deepEqual(changes(r.calls), []);
  });

  test("nothing found at all", () => {
    sb.setFind('No skills found for "ext"\n');
    const r = sb.run(["install", "--route", "-s", "ext"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /no skill named 'ext' found/);
  });
});

describe("aix (= aiskills --route)", posixOnly, () => {
  test("install routes non-bundled names exactly like aiskills --route", () => {
    sb.setFind("acme/tools@ext 1.2K installs\n");
    const viaAix = sb.aix(["i", "-s", "a1,ext", "-a", "claude-code", "-y"]);
    const viaFlag = sb.run(["--route", "install", "-s", "a1,ext", "-a", "claude-code", "-y"]);
    assert.equal(viaAix.status, 0, viaAix.out);
    assert.deepEqual(changes(viaAix.calls), changes(viaFlag.calls));
    assert.deepEqual(changes(viaAix.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--agent", "claude-code", "--yes"],
      ["add", "acme/tools@ext", "--global", "--agent", "claude-code", "--yes"],
    ]);
  });

  test("plain aiskills still rejects a non-bundled name", () => {
    assert.equal(sb.run(["i", "-s", "ext"]).status, 1);
  });

  test("uninstall and installed also run in route mode", () => {
    sb.run(["sync"]);
    sb.setList([row("a1", sb.root), row("ext", "acme/tools", "github")]);
    assert.deepEqual(changes(sb.aix(["r", "-s", "ext"]).calls), [["remove", "ext", "--global", "--yes"]]);
    assert.match(sb.aix(["ls"]).out, /^ext\s+acme\/tools\s+-\s+Claude Code$/m);
    // A full uninstall still only removes bundled skills.
    assert.deepEqual(changes(sb.aix(["uninstall"]).calls), [["remove", "a1", "--global", "--yes"]]);
  });

  test("other commands work unchanged, and --help explains aix", () => {
    assert.equal(sb.aix(["p"]).out.trim(), sb.root);
    assert.match(sb.aix(["--help"]).out, /The 'aix' command is 'aiskills --route'/);
  });
});

describe("aix safety: external skills found by a lookup are confirmed before anything is installed", posixOnly, () => {
  const FIND = "acme/tools@ext 1.2K installs\n";
  const FOUND = /\[aiskills\] found in the skills registry \(not bundled; third-party code your agents may run\):\n {4}acme\/tools@ext {2}\(1\.2K installs\) {2}for 'ext'\n/;
  const BOTH = (agent = []) => [
    ["add", sb.root, "--global", "--skill", "a1", ...agent, "--yes"],
    ["add", "acme/tools@ext", "--global", ...agent, "--yes"],
  ];
  const noScript = spawnSync("script", ["--version"]).status !== 0 && "needs util-linux 'script' for a pseudo-terminal";

  test("no terminal and no --yes: show the match, install nothing (not even bundled skills), exit 1", () => {
    sb.setFind(FIND);
    const r = sb.aix(["i", "-s", "a1,ext"]);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, FOUND);
    assert.match(r.out, /\[aiskills\] not installing external skills without confirmation: acme\/tools@ext\n {2}re-run with -y\/--yes to install them, or pin each one with -s owner\/repo@skill/);
    assert.deepEqual(changes(r.calls), []);
  });

  test("-y and --yes confirm in advance", () => {
    sb.setFind(FIND);
    for (const flag of ["-y", "--yes"]) {
      const r = sb.aix(["i", "-s", "a1,ext", flag]);
      assert.equal(r.status, 0, r.out);
      assert.match(r.out, FOUND, "the match is still shown");
      assert.deepEqual(changes(r.calls), BOTH(), flag);
    }
  });

  test("a pinned owner/repo@skill needs no confirmation: you named the source", () => {
    const r = sb.aix(["i", "-s", "acme/tools@ext"]);
    assert.equal(r.status, 0, r.out);
    assert.doesNotMatch(r.out, /\[y\/N\]|without confirmation/);
    assert.deepEqual(changes(r.calls), [["add", "acme/tools@ext", "--global", "--yes"]]);
  });

  test("bundled skills never ask", { skip: noScript }, () => {
    const r = sb.tty(["i", "-s", "a1"], "n");
    assert.equal(r.status, 0, r.out);
    assert.doesNotMatch(r.out, /\[y\/N\]/);
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "a1", "--yes"]]);
  });

  test("in a terminal: the matches are listed, then [y/N]; y or yes installs", { skip: noScript }, () => {
    sb.setFind(FIND);
    for (const answer of ["y", "YES"]) {
      const r = sb.tty(["i", "-s", "a1,ext", "-a", "claude-code"], answer, { aix: true });
      assert.equal(r.status, 0, r.out);
      assert.match(r.out, /acme\/tools@ext {2}\(1\.2K installs\)[\s\S]*Install 1 external skill from the registry\? \[y\/N\] /);
      assert.deepEqual(changes(r.calls), BOTH(["--agent", "claude-code"]), answer);
    }
  });

  test("in a terminal: Enter, n or anything else installs nothing, exit 1", { skip: noScript }, () => {
    sb.setFind("acme/tools@ext 1.2K installs\nzed/kit@other 7 installs\n");
    for (const answer of ["", "n", "sure"]) {
      const r = sb.tty(["i", "-s", "a1,ext,other"], answer, { aix: true });
      assert.equal(r.status, 1, r.out);
      assert.match(r.out, /Install 2 external skills from the registry\? \[y\/N\] /);
      assert.match(r.out, /\[aiskills\] nothing installed: not confirmed/);
      assert.deepEqual(changes(r.calls), [], JSON.stringify(answer));
    }
  });

  test("install -n / --dry-run: show the matches and the exact commands, install nothing", () => {
    sb.setFind(FIND);
    for (const flag of ["-n", "--dry-run"]) {
      const r = sb.aix(["i", flag, "-s", "a1,ext", "-a", "claude-code"]);
      assert.equal(r.status, 0, r.out);
      assert.match(r.out, FOUND);
      assert.ok(r.out.includes(`[aiskills] [dry-run] npx -y skills@${SKILLS_CLI_VERSION} add ${sb.root} --global --skill a1 --agent claude-code --yes\n`), r.out);
      assert.ok(r.out.includes(`[aiskills] [dry-run] npx -y skills@${SKILLS_CLI_VERSION} add acme/tools@ext --global --agent claude-code --yes\n`), r.out);
      assert.deepEqual(changes(r.calls), [], flag);
    }
  });

  test("-y and -n are install options only", () => {
    assert.match(sb.run(["installed", "-y"]).out, /option -y is not valid here/);
  });
});

describe("security: registry text, folder guard, pinned skills CLI", posixOnly, () => {
  // 1. --route must never pass unsafe registry text on to npx.
  test("--route ignores registry results with unsafe characters and installs nothing", () => {
    for (const evil of ["ev&il/tools@ext", "acme/tools@ext&calc", "acme/to|ols@ext", "acme/tools@e%x%t", "acme/../x@ext"]) {
      sb.setFind(`${evil} 9 installs\n`);
      const r = sb.run(["install", "--route", "-s", "ext"]);
      assert.equal(r.status, 1, `${evil}: ${r.out}`);
      assert.match(r.out, /ignored .*unsafe/i, evil);
      assert.deepEqual(changes(r.calls), [], evil);
    }
  });

  test("--route still uses the safe result when an unsafe one is listed too", () => {
    sb.setFind("ev&il/tools@ext 99 installs\nacme/tools@ext 1 installs\n");
    const r = sb.run(["install", "--route", "-s", "ext", "-y"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["add", "acme/tools@ext", "--global", "--yes"]]);
  });

  // 2. Never delete or replace a folder that isn't an aiskills install folder.
  const foreign = () => {
    mkdirSync(join(sb.root, "skills"), { recursive: true });
    writeFileSync(join(sb.root, "precious.txt"), "keep me\n");
    writeFileSync(join(sb.root, "skills", "mine.md"), "keep me too\n");
  };

  test("--purge refuses a folder without aiskills.json and leaves it intact", () => {
    foreign();
    const r = sb.run(["uninstall", "--purge"]);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /not an aiskills folder/);
    assert.ok(existsSync(join(sb.root, "precious.txt")));
    assert.ok(existsSync(join(sb.root, "skills", "mine.md")));
  });

  test("sync / install refuse to replace skills/ in a folder without aiskills.json", () => {
    foreign();
    for (const args of [["sync"], ["install"]]) {
      const r = sb.run(args);
      assert.equal(r.status, 1, `${args}: ${r.out}`);
      assert.match(r.out, /not an aiskills folder/);
      assert.ok(existsSync(join(sb.root, "skills", "mine.md")), String(args));
      assert.deepEqual(changes(r.calls), [], String(args));
    }
  });

  test("a missing or empty folder, or a real install folder, is fine", () => {
    assert.equal(sb.run(["sync"]).status, 0, "missing");
    assert.equal(sb.run(["uninstall", "--purge"]).status, 0, "own folder");
    assert.ok(!existsSync(sb.root));
    mkdirSync(sb.root, { recursive: true });
    assert.equal(sb.run(["sync"]).status, 0, "empty");
    assert.equal(sb.run(["uninstall", "--purge"]).status, 0, "purge after sync");
    assert.equal(sb.run(["uninstall", "--purge"]).status, 0, "purge when already gone");
  });

  // 3. npx runs a pinned, tested version of the skills CLI.
  test("npx runs skills@<pinned version>, overridable with AISKILLS_SKILLS_LIB_VERSION", () => {
    const pinned = sb.run(["install"]).calls.map(skillsPackage);
    assert.ok(pinned.length > 0);
    for (const p of pinned) assert.match(p, /^skills@\d+\.\d+\.\d+$/);
    const latest = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "latest" } }).calls.map(skillsPackage);
    for (const p of latest) assert.equal(p, "skills@latest");
    const bad = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "1.0 && calc" } });
    assert.equal(bad.status, 1);
    assert.match(bad.out, /AISKILLS_SKILLS_LIB_VERSION/);
    assert.deepEqual(bad.calls, []);
  });
});

describe("aiskills uninstall", posixOnly, () => {
  // Installed: two bundled skills (source = install root) and one external.
  const installed = () => [row("a1", sb.root), row("beta-one", sb.root), row("ext", "acme/tools", "github")];

  // Every real install syncs the root first; mirror that.
  beforeEach(() => sb.run(["sync"]));

  test("a full uninstall removes exactly the skills installed from the root", () => {
    sb.setList(installed());
    const r = sb.run(["uninstall"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["remove", "a1", "beta-one", "--global", "--yes"]]);
    assert.match(r.out, /skill files kept/);
  });

  test("--purge also deletes the root; a second run is a no-op", () => {
    sb.setList(installed());
    assert.equal(sb.run(["uninstall", "--purge"]).status, 0);
    assert.ok(!existsSync(sb.root));
    sb.setList([]);
    const again = sb.run(["uninstall"]);
    assert.equal(again.status, 0, again.out);
    assert.deepEqual(changes(again.calls), []);
    assert.doesNotMatch(again.out, /skill files kept/);
  });

  test("-s / -G / patterns remove only matching installed skills", () => {
    sb.setList(installed());
    assert.deepEqual(changes(sb.run(["uninstall", "-G", "beta"]).calls), [["remove", "beta-one", "--global", "--yes"]]);
    assert.deepEqual(changes(sb.run(["uninstall", "-s", "a*,beta-*"]).calls), [
      ["remove", "a1", "beta-one", "--global", "--yes"],
    ]);
  });

  test("-a patterns and -p are passed on", () => {
    sb.setList(installed());
    const r = sb.run(["uninstall", "-s", "a1", "-a", "claude*", "-p"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [["remove", "a1", "--agent", "claude-code", "--yes"]]);
  });

  test("--dry-run prints the command and changes nothing", () => {
    sb.setList(installed());
    const r = sb.run(["uninstall", "-n"]);
    assert.equal(r.status, 0);
    assert.match(r.out, /\[dry-run\] npx -y skills@1\.7\.6 remove a1 beta-one --global --yes/);
    assert.deepEqual(changes(r.calls), []);
  });

  test("--dry-run shows the skills version that would really run", () => {
    sb.setList(installed());
    const r = sb.run(["uninstall", "-n"], { env: { AISKILLS_SKILLS_LIB_VERSION: "latest" } });
    assert.equal(r.status, 0);
    assert.match(r.out, /\[dry-run\] npx -y skills@latest remove a1 beta-one --global --yes/);
  });

  test("--purge with -s is refused", () => {
    const r = sb.run(["uninstall", "-s", "a1", "--purge"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /--purge only applies to a full uninstall/);
  });

  test("an external skill needs --route (or -f)", () => {
    sb.setList(installed());
    const no = sb.run(["uninstall", "-s", "ext"]);
    assert.equal(no.status, 1);
    assert.match(no.out, /not provided by this package: ext[\s\S]*--route/);
    assert.deepEqual(changes(no.calls), []);

    assert.deepEqual(changes(sb.run(["uninstall", "--route", "-s", "ext"]).calls), [["remove", "ext", "--global", "--yes"]]);
    assert.deepEqual(changes(sb.run(["uninstall", "-f", "-s", "ext"]).calls), [["remove", "ext", "--global", "--yes"]]);
  });

  test("--route: owner/repo@skill is reduced to the skill; missing names are skipped", () => {
    sb.setList(installed());
    const r = sb.run(["--route", "uninstall", "-s", "acme/tools@ext,not-here"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /not installed \(global\), skipping: not-here/);
    assert.deepEqual(changes(r.calls), [["remove", "ext", "--global", "--yes"]]);
  });

  test("--route: a source without @skill is refused", () => {
    const r = sb.run(["--route", "uninstall", "-s", "acme/tools"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /names a source, not a skill/);
  });

  test("--route: a full uninstall still leaves external skills alone", () => {
    sb.setList(installed());
    assert.deepEqual(changes(sb.run(["--route", "uninstall"]).calls), [["remove", "a1", "beta-one", "--global", "--yes"]]);
  });
});

describe("aiskills installed / find / skills passthrough", posixOnly, () => {
  test("installed lists bundled skills with their group; --route adds every source", () => {
    sb.run(["sync"]);
    sb.setList([row("a1", sb.root), row("ext", "acme/tools", "github")]);
    const plain = sb.run(["installed"]).out;
    assert.match(plain, /^a1\s+alpha-skills\s+Claude Code$/m);
    assert.doesNotMatch(plain, /ext/);
    const routed = sb.run(["installed", "--route"]).out;
    assert.match(routed, /^a1\s+bundled\s+alpha-skills\s+Claude Code$/m);
    assert.match(routed, /^ext\s+acme\/tools\s+-\s+Claude Code$/m);
  });

  test("find and skills <args> pass through, with :root expanded", () => {
    assert.deepEqual(skillsArgs(sb.run(["find", "pdf"]).calls[0]), ["find", "pdf"]);
    assert.deepEqual(skillsArgs(sb.run(["skills", "add", ":root", "-s", "a1", "-g", "-y"]).calls[0]), [
      "add", sb.root, "-s", "a1", "-g", "-y",
    ]);
  });

  test("a failing npx exit code is returned", () => {
    assert.equal(sb.run(["install"], { env: { FAKE_EXIT: "3" } }).status, 3);
  });
});

describe("no install step: aiskills install does the work (AIS-7)", posixOnly, () => {
  test("the package has no postinstall script to run", () => {
    assert.ok(!existsSync(join(sb.pkg, "src", "scripts", "core", "postinstall.mjs")));
    assert.equal(JSON.parse(readFileSync(join(sb.pkg, "package.json"), "utf8")).scripts.postinstall, undefined);
  });

  test("--help no longer describes an npm install step or its variables", () => {
    const out = sb.run(["--help"]).out;
    assert.doesNotMatch(out, /postinstall|AISKILLS_SKIP_|npm install/i);
    assert.match(out, /AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY\n\s+Defaults for the options above\n/);
  });

  test("aiskills install saves the skills and installs everything globally", () => {
    const r = sb.run(["install"]);
    assert.equal(r.status, 0, r.out);
    assert.ok(existsSync(join(sb.root, "skills", "a1", "SKILL.md")));
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "*", "--yes"]]);
  });

  test("AISKILLS_GROUPS / AISKILLS_AGENTS patterns are defaults for aiskills install", () => {
    const r = sb.run(["install"], { env: { AISKILLS_GROUPS: "b*", AISKILLS_AGENTS: "claude*" } });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "beta-one", "--skill", "beta-two", "--agent", "claude-code", "--yes"],
    ]);
  });

  test("npm variables (from npx / npm exec) are not passed on to npx skills, registry settings are", () => {
    const r = sb.run(["install"], {
      env: {
        npm_config_global: "true",
        npm_config_prefix: "/x",
        npm_lifecycle_event: "npx",
        npm_config_registry: "https://r.example/",
        npm_config_cache: "/tmp/cache",
      },
    });
    assert.equal(r.status, 0, r.out);
    const add = r.calls.find((c) => skillsArgs(c)[0] === "add");
    assert.deepEqual(add.npmEnv.sort(), ["npm_config_cache", "npm_config_registry"]);
  });
});
