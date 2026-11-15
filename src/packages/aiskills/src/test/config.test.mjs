// `aiskills config`: persistent defaults, like `git config`.
//
//   aiskills config <key>                 the value (exit 1 when not set)
//   aiskills config <key> <value>         set it in the user file (--project: ./.aiskills.json)
//   aiskills config --unset <key>         remove it
//   aiskills config --list [--show-origin] [--json]
//
// Files: ~/.config/sugatoray/aiskillsconfig.json (user, --global) and ./.aiskills.json
// (project, --project). Precedence: option > AISKILLS_* > project > user >
// remembered (aiskills.json in the install root) > default.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

describe("examples/sample_aiskillsconfig.json", () => {
  const SAMPLE = join(PKG_SRC, "examples", "sample_aiskillsconfig.json");

  test("uses every key and each kind of alias, and every value is one aiskills config accepts", async () => {
    const { CONFIG_KEYS, isAliasKey, parseConfigValue } = await import(CONFIG);
    const sample = JSON.parse(readFileSync(SAMPLE, "utf8"));
    for (const key of Object.keys(CONFIG_KEYS)) assert.ok(Object.hasOwn(sample, key), `sets ${key}`);
    for (const [key, value] of Object.entries(sample)) {
      assert.ok(Object.hasOwn(CONFIG_KEYS, key) || isAliasKey(key), `${key} is a config key`);
      assert.deepEqual(parseConfigValue(key, value, { origin: "user" }), value, `${key} is stored as aiskills config would store it`);
    }
    const aliases = Object.entries(sample).filter(([k]) => isAliasKey(k));
    assert.ok(aliases.some(([, v]) => v.startsWith("!")), "a shell alias");
    assert.ok(aliases.some(([, v]) => Object.hasOwn(sample, `alias.${v.split(" ")[0]}`)), "an alias of an alias");
  });

  test("is laid out exactly as aiskills config writes a file (keys sorted, two-space indent)", async () => {
    const { writeConfigFile } = await import(CONFIG);
    const out = join(mkdtempSync(join(tmpdir(), "aiskills-sample-")), "c.json");
    writeConfigFile(out, JSON.parse(readFileSync(SAMPLE, "utf8")));
    assert.equal(readFileSync(SAMPLE, "utf8"), readFileSync(out, "utf8"));
  });
});

describe("config files", () => {
  test("AISKILLS_USER_CONFIG moves the user file; a relative path is from the current folder", async () => {
    const { configFiles } = await import(CONFIG);
    assert.equal(configFiles({ home: "/h", cwd: "/w", env: { AISKILLS_USER_CONFIG: "/x/mine.json" } }).user, join("/x", "mine.json"));
    assert.equal(configFiles({ home: "/h", cwd: "/w", env: { AISKILLS_USER_CONFIG: "conf/mine.json" } }).user, join("/w", "conf", "mine.json"));
    assert.equal(configFiles({ home: "/h", cwd: "/w", env: { AISKILLS_USER_CONFIG: " " } }).user, join("/h", ".config", "sugatoray", "aiskillsconfig.json"));
  });

  test("the user file is aiskillsconfig.json, next to the install folder, so it isn't mistaken for the install folder's aiskills.json", async () => {
    const { configFiles } = await import(CONFIG);
    assert.deepEqual(configFiles({ home: "/h", cwd: "/w" }), { user: join("/h", ".config", "sugatoray", "aiskillsconfig.json"), project: join("/w", ".aiskills.json") });
  });
});

describe("aiskills config", posixOnly, () => {
  let sb;
  const userFile = () => join(sb.home, ".config", "sugatoray", "aiskillsconfig.json");
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
    assert.equal(origin, "project  ./.aiskills.json                         agents=codex\nuser     ~/.config/sugatoray/aiskillsconfig.json  layout=nested\n");
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
    assert.match(r.out, /aiskillsconfig\.json is not valid JSON/);
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
    rmSync(join(sb.home, ".config", "sugatoray", "aiskillsconfig.json"), { force: true });
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
    assert.match(out, /user config : ~\/\.config\/sugatoray\/aiskillsconfig\.json\n/);
    assert.match(out, /project config : \.\/\.aiskills\.json\n/);
    assert.match(out, /scope : project {2}\(project config\)/);
    assert.match(out, /layout : nested {2}\(user config\)/);
    rmSync(join(sb.dir, ".aiskills.json"));
    assert.match(run(["info"], { NO_COLOR: "1" }).out, /project config : .*\.aiskills\.json {2}\(not created\)/);
  });
});

describe("config aliases, like git config alias.*", () => {
  test("alias.<name> keys: names checked, values split like a shell", async () => {
    const { assertConfigKey, parseConfigValue, splitArgs } = await import(CONFIG);
    assert.equal(assertConfigKey("alias.gi").kind, "alias");
    assert.throws(() => assertConfigKey("alias."), /unknown config key: alias\./);
    assert.throws(() => assertConfigKey("alias.Bad_Name"), /alias names are lowercase letters, digits and dashes/);
    assert.equal(parseConfigValue("alias.gi", "  install -g  "), "install -g");
    assert.throws(() => parseConfigValue("alias.gi", " "), /alias\.gi needs a value/);
    assert.equal(parseConfigValue("alias.hi", " !echo hi "), "!echo hi", "a shell alias, in the user file");
    assert.equal(parseConfigValue("alias.hi", "!echo hi", { origin: "user" }), "!echo hi");
    assert.throws(() => parseConfigValue("alias.hi", "!echo hi", { origin: "project" }), /alias\.hi: shell aliases \(!\.\.\.\) are only allowed in the user file/);
    assert.throws(() => parseConfigValue("alias.hi", "! "), /alias\.hi needs a value/);
    assert.deepEqual(splitArgs(`install -s "my skill" -a 'claude-code' x\\ y`), ["install", "-s", "my skill", "-a", "claude-code", "x y"]);
    assert.throws(() => splitArgs(`install "open`), /unclosed quote/);
  });
});

describe("aiskills <alias>", posixOnly, () => {
  let sb;
  before(() => {
    sb = sandbox();
  });
  after(() => sb.cleanup());
  beforeEach(() => {
    rmSync(join(sb.home, ".config", "sugatoray", "aiskillsconfig.json"), { force: true });
    rmSync(join(sb.dir, ".aiskills.json"), { force: true });
  });
  const run = (args, env = {}) => sb.run(args, { env });

  test("an alias runs its command, with the rest of the arguments after it", () => {
    assert.equal(run(["config", "alias.gi", "install -g -a codex"]).status, 0);
    assert.equal(run(["config", "alias.gi"]).out, "install -g -a codex\n");
    const r = run(["gi", "-n", "-s", "a1"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /\[dry-run\] npx .*--global .*--agent '?codex'?/);
  });

  test("aliases of aliases work; a loop is an error", () => {
    run(["config", "alias.gi", "install -g"]);
    run(["config", "alias.gin", "gi -n"]);
    assert.match(run(["gin"]).out, /\[dry-run\] npx .*--global/);
    run(["config", "alias.a", "b"]);
    run(["config", "alias.b", "a"]);
    const loop = run(["a"]);
    assert.equal(loop.status, 1);
    assert.match(loop.out, /alias loop: a → b → a/);
  });

  test("a project alias wins over a user alias; --list shows aliases", () => {
    run(["config", "alias.where", "info"]);
    run(["config", "--project", "alias.where", "path"]);
    assert.equal(run(["where"]).out.trim(), sb.root);
    assert.match(run(["config", "--list"]).out, /^alias\.where=path$/m);
  });

  test("an alias can't shadow a command, and an unknown command is still an error", () => {
    for (const name of ["install", "i", "config", "help"]) {
      const r = run(["config", `alias.${name}`, "info"]);
      assert.equal(r.status, 1, name);
      assert.match(r.out, new RegExp(`alias\\.${name}: '${name}' is an aiskills command`));
    }
    const r = run(["nope"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /unknown command: nope/);
  });

  test("a shell alias (!...) in the user file runs through the shell, with the arguments after it, and passes on the exit code", () => {
    assert.equal(run(["config", "alias.hello", "!echo hello"]).status, 0);
    const r = run(["hello", "big world"]);
    assert.equal(r.status, 0, r.out);
    assert.equal(r.out, "hello big world\n");
    run(["config", "alias.three", "!exit 3"]);
    assert.equal(run(["three"]).status, 3);
    run(["config", "alias.sh-of-alias", "hello"]);
    assert.equal(run(["sh-of-alias", "again"]).out, "hello again\n", "an alias may use a shell alias");
  });

  test("a project's ./.aiskills.json can't have a shell alias: refused when set", () => {
    const set = run(["config", "--project", "alias.boom", "!touch pwned"]);
    assert.equal(set.status, 1);
    assert.match(set.out, /alias\.boom: shell aliases \(!\.\.\.\) are only allowed in the user file/);
    assert.match(set.out, /aiskillsconfig\.json/);
    assert.match(set.out, /AISKILLS_USER_CONFIG/);
    assert.ok(!existsSync(join(sb.dir, ".aiskills.json")), "nothing written");
  });

  test("a shell alias written into ./.aiskills.json by hand is skipped with a warning; everything else keeps working", () => {
    writeFileSync(join(sb.dir, ".aiskills.json"), JSON.stringify({ "alias.setup": "!touch pwned", "alias.where": "path", layout: "nested" }));
    const warning = /warning: alias\.setup in \.\/\.aiskills\.json is ignored: an alias that starts with '!' isn't allowed in a project's \.aiskills\.json/;
    const get = run(["config", "layout"]);
    assert.equal(get.status, 0, get.out);
    assert.match(get.out, /^nested$/m, "the other settings in the file still count");
    assert.match(get.out, warning);
    assert.match(get.out, /define it in ~\/\.config\/sugatoray\/aiskillsconfig\.json instead \(or in the file AISKILLS_USER_CONFIG names\)/);
    assert.equal(get.out.match(/is ignored/g).length, 1, "warned once per run");
    const where = run(["where"]);
    assert.equal(where.status, 0, where.out);
    assert.match(where.out, new RegExp(`^${sb.root}$`, "m"), "the file's other aliases still work");
    assert.equal(run(["sync"]).status, 0);
    assert.doesNotMatch(run(["config", "--list"]).out, /alias\.setup=/);
    const r = run(["setup"]);
    assert.equal(r.status, 1);
    assert.match(r.out, /alias\.setup in \.\/\.aiskills\.json is a shell alias, which a project can't define/);
    assert.ok(!existsSync(join(sb.dir, "pwned")), "the shell command did not run");
    rmSync(join(sb.dir, ".aiskills.json"));
  });

  test("AISKILLS_USER_CONFIG names the user file: it is read and written there, and may hold shell aliases", () => {
    const mine = join(sb.dir, "my-aiskills.json");
    const env = { AISKILLS_USER_CONFIG: mine };
    assert.equal(run(["config", "alias.hi", "!echo hi"], env).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(mine, "utf8")), { "alias.hi": "!echo hi" });
    assert.ok(!existsSync(join(sb.home, ".config", "sugatoray", "aiskillsconfig.json")), "not the default file");
    assert.equal(run(["hi", "there"], env).out, "hi there\n");
    assert.match(run(["config", "--list", "--show-origin"], env).out, /^user +\.\/my-aiskills\.json +alias\.hi=!echo hi$/m);
    assert.match(run(["info"], { ...env, NO_COLOR: "1" }).out, /user config : \.\/my-aiskills\.json {2}\(AISKILLS_USER_CONFIG\)/);
    assert.match(run(["hi"]).out, /unknown command: hi/, "without the variable, the default file is used");
    rmSync(mine);
  });

  test("a project alias of the same name wins over a user shell alias", () => {
    run(["config", "alias.where", "!echo user"]);
    run(["config", "--project", "alias.where", "path"]);
    assert.equal(run(["where"]).out.trim(), sb.root);
  });

  test("--unset removes an alias", () => {
    run(["config", "alias.gi", "install -g"]);
    assert.equal(run(["config", "--unset", "alias.gi"]).status, 0);
    assert.match(run(["gi"]).out, /unknown command: gi/);
  });
});
