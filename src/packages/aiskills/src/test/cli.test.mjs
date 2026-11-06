// CLI tests for src/scripts/cli.mjs (the `aiskills` bin) and src/scripts/postinstall.mjs.
//
// Each test runs the real CLI in a throwaway sandbox (see helpers.mjs) with a
// stand-in `npx` first on PATH, then checks the exact `npx skills` commands
// the CLI issued and what it wrote to disk. No network, no real $HOME.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { row, sandbox, skillsArgs } from "./helpers.mjs";

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
  test("sync saves skills/ and marketplace.json, restores dotfiles, runs nothing", () => {
    const r = sb.run(["sync"]);
    assert.equal(r.status, 0);
    assert.deepEqual(r.calls, []);
    assert.ok(existsSync(join(sb.root, "skills", "alpha", "a1", "SKILL.md")));
    assert.ok(existsSync(join(sb.root, ".claude-plugin", "marketplace.json")));
    assert.ok(existsSync(join(sb.root, "skills", "loose", "lonely", ".gitignore")), "_gitignore renamed back");
    assert.ok(!existsSync(join(sb.root, "skills", "loose", "lonely", "_gitignore")));
    const meta = JSON.parse(readFileSync(join(sb.root, "aiskills.json"), "utf8"));
    assert.equal(meta.package, "@sugatoray-ai/aiskills");
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
    const r = sb.run(["install", "--route", "-s", "a1,ext", "-a", "claude-code"]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(skillsArgs(r.calls.find((c) => skillsArgs(c)[0] === "find")), ["find", "ext"]);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "a1", "--agent", "claude-code", "--yes"],
      ["add", "acme/tools@ext", "--global", "--agent", "claude-code", "--yes"],
    ]);
  });

  test("--route also works before the command, and via AISKILLS_ROUTE", () => {
    sb.setFind("acme/tools@ext\n");
    for (const [args, env] of [[["--route", "install", "-s", "ext"], {}], [["install", "-s", "ext"], { AISKILLS_ROUTE: "1" }]]) {
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
    assert.match(r.out, /\[dry-run\] npx -y skills remove a1 beta-one --global --yes/);
    assert.deepEqual(changes(r.calls), []);
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

describe("postinstall", posixOnly, () => {
  test("saves the skills and installs everything globally", () => {
    const r = sb.postinstall();
    assert.equal(r.status, 0, r.out);
    assert.ok(existsSync(join(sb.root, "skills", "alpha", "a1", "SKILL.md")));
    assert.deepEqual(changes(r.calls), [["add", sb.root, "--global", "--skill", "*", "--yes"]]);
    assert.equal(r.calls[0].cwd, sb.root);
  });

  test("honours AISKILLS_GROUPS / AISKILLS_AGENTS patterns", () => {
    const r = sb.postinstall({ env: { AISKILLS_GROUPS: "b*", AISKILLS_AGENTS: "claude*" } });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(changes(r.calls), [
      ["add", sb.root, "--global", "--skill", "beta-one", "--skill", "beta-two", "--agent", "claude-code", "--yes"],
    ]);
  });

  test("project scope runs in INIT_CWD", () => {
    const r = sb.postinstall({ env: { AISKILLS_SCOPE: "project", INIT_CWD: sb.home } });
    assert.equal(r.calls[0].cwd, sb.home);
    assert.ok(!skillsArgs(r.calls[0]).includes("--global"));
  });

  test("CI and AISKILLS_SKIP_SKILLS_ADD save files but run nothing", () => {
    for (const env of [{ CI: "true" }, { AISKILLS_SKIP_SKILLS_ADD: "1" }]) {
      const r = sb.postinstall({ env });
      assert.equal(r.status, 0);
      assert.deepEqual(r.calls, []);
      assert.ok(existsSync(join(sb.root, "skills")));
    }
  });

  test("AISKILLS_SKIP_POSTINSTALL does nothing at all", () => {
    const r = sb.postinstall({ env: { AISKILLS_SKIP_POSTINSTALL: "1" } });
    assert.equal(r.status, 0);
    assert.deepEqual(r.calls, []);
    assert.ok(!existsSync(sb.root));
  });

  test("never fails npm install, even when npx fails or input is bad", () => {
    for (const env of [{ FAKE_EXIT: "1" }, { AISKILLS_GROUPS: "nope" }, { AISKILLS_SKILLS: "not-bundled" }]) {
      const r = sb.postinstall({ env });
      assert.equal(r.status, 0, JSON.stringify(env));
    }
  });

  test("npm lifecycle variables are not passed on to npx, registry settings are", () => {
    const r = sb.postinstall({
      env: {
        npm_config_global: "true",
        npm_config_prefix: "/x",
        npm_lifecycle_event: "postinstall",
        npm_config_registry: "https://r.example/",
        npm_config_cache: "/tmp/cache",
      },
    });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(r.calls[0].npmEnv.sort(), ["npm_config_cache", "npm_config_registry"]);
  });
});
