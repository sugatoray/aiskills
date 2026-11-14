// `aiskills config`: persistent defaults, like `git config`.
//
//   aiskills config <key>                 the value (exit 1 when not set)
//   aiskills config <key> <value>         set it in the user file (--project: ./.aiskills.json)
//   aiskills config --unset <key>         remove it
//   aiskills config --list [--show-origin] [--json]
//
// Files: ~/.config/sugatoray/aiskills.json (user, --global) and ./.aiskills.json
// (project, --project). Precedence: option > AISKILLS_* > project > user >
// remembered (aiskills.json in the install root) > default.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { pathToFileURL } from "node:url";

import { PKG_SRC, sandbox } from "./helpers.mjs";

const CONFIG = pathToFileURL(join(PKG_SRC, "src", "scripts", "core", "config.mjs")).href;
const posixOnly = { skip: process.platform === "win32" && "stand-in npm/npx are POSIX scripts" };
const ESC = "\x1b[";

describe("config keys and values", () => {
  test("every AISKILLS_* default is a key, plus color", async () => {
    const { CONFIG_KEYS } = await import(CONFIG);
    assert.deepEqual(Object.keys(CONFIG_KEYS).sort(), ["agents", "color", "copy", "groups", "layout", "route", "scope", "skills", "skills-version", "stats"]);
    assert.equal(CONFIG_KEYS.layout.env, "AISKILLS_LAYOUT");
    assert.equal(CONFIG_KEYS["skills-version"].env, "AISKILLS_SKILLS_LIB_VERSION");
  });

  test("values are checked and normalized when set", async () => {
    const { parseConfigValue } = await import(CONFIG);
    for (const [raw, v] of [["true", true], ["yes", true], ["ON", true], ["1", true], ["false", false], ["no", false], ["off", false], ["0", false]]) {
      assert.equal(parseConfigValue("copy", raw), v, raw);
    }
    assert.equal(parseConfigValue("layout", "Nested"), "nested");
    assert.equal(parseConfigValue("scope", "project"), "project");
    assert.equal(parseConfigValue("color", "never"), "never");
    assert.equal(parseConfigValue("agents", " claude-code , codex ,"), "claude-code,codex");
    assert.equal(parseConfigValue("skills-version", " ~1.7.4 "), "~1.7.4");
    assert.throws(() => parseConfigValue("layout", "deep"), /^Error: layout must be flat or nested; got 'deep'$/);
    assert.throws(() => parseConfigValue("scope", "world"), /scope must be global or project; got 'world'/);
    assert.throws(() => parseConfigValue("color", "sometimes"), /color must be auto, always or never; got 'sometimes'/);
    assert.throws(() => parseConfigValue("stats", "maybe"), /stats must be true or false \(or yes\/no, on\/off, 1\/0\); got 'maybe'/);
    assert.throws(() => parseConfigValue("agents", " , "), /agents needs at least one name/);
    assert.throws(() => parseConfigValue("colour", "auto"), /unknown config key: colour \(keys: agents, color, copy, /);
  });
});

describe("aiskills config", posixOnly, () => {
  let sb;
  const userFile = () => join(sb.home, ".config", "sugatoray", "aiskills.json");
  const projectFile = () => join(sb.dir, ".aiskills.json");
  const reset = () => {
    rmSync(userFile(), { force: true });
    rmSync(projectFile(), { force: true });
    rmSync(sb.root, { recursive: true, force: true });
  };
  before(() => {
    sb = sandbox();
  });
  after(() => sb.cleanup());
  beforeEach(reset);
  const run = (args, env = {}) => sb.run(args, { env });

  test("sets a value in the user file and gets it back", () => {
    const set = run(["config", "layout", "nested"]);
    assert.equal(set.status, 0, set.out);
    assert.equal(set.out, "");
    assert.deepEqual(JSON.parse(readFileSync(userFile(), "utf8")), { layout: "nested" });
    assert.equal(run(["config", "layout"]).out, "nested\n");
    run(["config", "stats", "off"]);
    assert.deepEqual(JSON.parse(readFileSync(userFile(), "utf8")), { layout: "nested", stats: false });
    assert.equal(run(["config", "stats"]).out, "false\n");
  });

  test("a key that isn't set prints nothing and exits 1", () => {
    const r = run(["config", "agents"]);
    assert.equal(r.status, 1);
    assert.equal(r.out, "");
  });

  test("--project writes ./.aiskills.json, which wins over the user file; --global and --project read one file", () => {
    run(["config", "scope", "global"]);
    assert.equal(run(["config", "--project", "scope", "project"]).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(projectFile(), "utf8")), { scope: "project" });
    assert.equal(run(["config", "scope"]).out, "project\n");
    assert.equal(run(["config", "--global", "scope"]).out, "global\n");
    assert.equal(run(["config", "--project", "scope"]).out, "project\n");
  });

  test("--unset removes a key; a key that isn't set exits 1", () => {
    run(["config", "layout", "nested"]);
    run(["config", "copy", "true"]);
    assert.equal(run(["config", "--unset", "layout"]).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(userFile(), "utf8")), { copy: true });
    const again = run(["config", "--unset", "layout"]);
    assert.equal(again.status, 1);
    assert.match(again.out, /layout is not set in /);
  });

  test("--list shows what is set, project over user; --show-origin says where; --json for scripts", () => {
    run(["config", "layout", "nested"]);
    run(["config", "agents", "claude-code,codex"]);
    run(["config", "--project", "agents", "codex"]);
    assert.equal(run(["config", "--list"]).out, "agents=codex\nlayout=nested\n");
    assert.equal(run(["config", "-l"]).out, "agents=codex\nlayout=nested\n");
    const origin = run(["config", "--list", "--show-origin"]).out.replaceAll(sb.home, "~").replaceAll(sb.dir, ".");
    assert.equal(origin, "project  ./.aiskills.json                   agents=codex\nuser     ~/.config/sugatoray/aiskills.json  layout=nested\n");
    const json = JSON.parse(run(["config", "--list", "--json"]).out);
    assert.deepEqual(json.agents, { value: "codex", origin: "project", file: projectFile() });
    assert.deepEqual(json.layout, { value: "nested", origin: "user", file: userFile() });
    assert.equal(run(["config", "--list", "--global"]).out, "agents=claude-code,codex\nlayout=nested\n");
    assert.equal(run(["config", "--list"], { NO_COLOR: "1" }).status, 0);
  });

  test("bad input fails with a message and changes nothing", () => {
    for (const [args, msg] of [
      [["config", "layout", "deep"], /layout must be flat or nested; got 'deep'/],
      [["config", "colour", "auto"], /unknown config key: colour/],
      [["config"], /usage: aiskills config/],
      [["config", "layout", "nested", "extra"], /usage: aiskills config/],
      [["config", "--unset"], /usage: aiskills config/],
      [["config", "skills-version", "[1.8.0, 1.7.0)"], /skills-version '\[1\.8\.0, 1\.7\.0\)' is an empty interval/],
      [["config", "--bogus"], /option --bogus is not valid here/],
    ]) {
      const r = run(args);
      assert.equal(r.status, 1, args.join(" "));
      assert.match(r.out, msg, args.join(" "));
    }
    assert.ok(!existsSync(userFile()), "nothing written");
  });

  test("a config file that isn't valid JSON is reported, not overwritten", () => {
    mkdirSync(join(sb.home, ".config", "sugatoray"), { recursive: true });
    writeFileSync(userFile(), "{ nope");
    const r = run(["config", "layout", "nested"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /aiskills\.json is not valid JSON/);
    assert.equal(readFileSync(userFile(), "utf8"), "{ nope");
  });
});

describe("config values take effect", posixOnly, () => {
  let sb;
  before(() => {
    sb = sandbox();
  });
  after(() => sb.cleanup());
  beforeEach(() => {
    rmSync(join(sb.home, ".config", "sugatoray", "aiskills.json"), { force: true });
    rmSync(join(sb.dir, ".aiskills.json"), { force: true });
    rmSync(sb.root, { recursive: true, force: true });
  });
  const run = (args, env = {}) => sb.run(args, { env });

  test("layout: config > remembered; AISKILLS_LAYOUT and --flat win over config", () => {
    run(["config", "layout", "nested"]);
    assert.match(run(["sync"]).out, /\(nested layout\)/);
    assert.match(run(["sync"], { AISKILLS_LAYOUT: "flat" }).out, /\(flat layout\)/);
    assert.match(run(["sync", "--flat"]).out, /\(flat layout\)/);
  });

  test("scope and agents: the install's defaults", () => {
    run(["config", "scope", "project"]);
    run(["config", "agents", "codex"]);
    const r = run(["install", "-n"]);
    assert.equal(r.status, 0, r.out);
    const cmd = r.out.split("\n").find((l) => l.includes("[dry-run] npx"));
    assert.match(cmd, /--agent '?codex'?/);
    assert.doesNotMatch(cmd, /--global/);
    assert.match(run(["install", "-n", "-g", "-a", "cursor"]).out, /--global .*--agent '?cursor'?/, "options still win");
  });

  test("skills-version: the npx skills version, after AISKILLS_SKILLS_LIB_VERSION", () => {
    run(["config", "skills-version", "1.7.4"]);
    const r = run(["install", "-n"]);
    assert.match(r.out, /using skills@1\.7\.4 from aiskills config skills-version/);
    assert.match(r.out, /npx -y skills@1\.7\.4 add/);
    assert.match(run(["install", "-n"], { AISKILLS_SKILLS_LIB_VERSION: "1.7.6" }).out, /npx -y skills@1\.7\.6 add/);
  });

  test("stats: config > remembered; AISKILLS_STATS wins", () => {
    run(["config", "stats", "off"]);
    // The sandbox sets AISKILLS_STATS=0 (no counting in tests); leave it out to see the config.
    assert.match(run(["info"], { AISKILLS_STATS: undefined }).out, /stats : off {2}\(user config\)/);
    assert.match(run(["info"], { AISKILLS_STATS: "1" }).out, /stats : on {2}\(AISKILLS_STATS\)/);
  });

  test("color: always colors piped output; NO_COLOR and --no-color still win", () => {
    run(["config", "color", "always"]);
    assert.ok(run(["groups"]).out.includes(ESC));
    assert.ok(!run(["groups"], { NO_COLOR: "1" }).out.includes(ESC));
    assert.ok(!run(["groups", "--no-color"]).out.includes(ESC));
    run(["config", "color", "never"]);
    assert.ok(!run(["groups"]).out.includes(ESC));
    assert.ok(run(["groups"], { FORCE_COLOR: "1" }).out.includes(ESC), "the environment wins over config");
  });

  test("info names the config files and shows which settings come from them", () => {
    run(["config", "layout", "nested"]);
    run(["config", "--project", "scope", "project"]);
    const out = run(["info"], { NO_COLOR: "1" }).out.replaceAll(sb.home, "~").replaceAll(sb.dir, ".");
    assert.match(out, /user config : ~\/\.config\/sugatoray\/aiskills\.json\n/);
    assert.match(out, /project config : \.\/\.aiskills\.json\n/);
    assert.match(out, /scope : project {2}\(project config\)/);
    assert.match(out, /layout : nested {2}\(user config\)/);
    rmSync(join(sb.dir, ".aiskills.json"));
    assert.match(run(["info"], { NO_COLOR: "1" }).out, /project config : .*\.aiskills\.json {2}\(not created\)/);
  });
});
