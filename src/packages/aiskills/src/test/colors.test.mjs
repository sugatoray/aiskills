// Colored output for the aiskills CLI (src/scripts/core/colors.mjs).
//
// Color is on when the output is a terminal, and can be forced either way:
// --no-color > --color > NO_COLOR > FORCE_COLOR > a terminal (not TERM=dumb).
// The CLI tests run with piped output, so color is off unless FORCE_COLOR or
// --color turns it on; stripping the color must give exactly the plain text.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

import { PKG_SRC, SAMPLE_VIEW, sandbox } from "./helpers.mjs";

const COLORS = pathToFileURL(join(PKG_SRC, "src", "scripts", "core", "colors.mjs")).href;
const ESC = "\x1b[";
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const bold = (s) => `${ESC}1m${s}${ESC}22m`;
const dim = (s) => `${ESC}2m${s}${ESC}22m`;
const red = (s) => `${ESC}31m${s}${ESC}39m`;
const green = (s) => `${ESC}32m${s}${ESC}39m`;
const yellow = (s) => `${ESC}33m${s}${ESC}39m`;
const cyan = (s) => `${ESC}36m${s}${ESC}39m`;
const FORCE = { FORCE_COLOR: "1" };

describe("colorChoice: when output is colored", () => {
  test("a terminal is colored; a pipe, or TERM=dumb, isn't", async () => {
    const { colorChoice } = await import(COLORS);
    assert.equal(colorChoice({ isTTY: true, env: {} }), true);
    assert.equal(colorChoice({ isTTY: false, env: {} }), false);
    assert.equal(colorChoice({ isTTY: true, env: { TERM: "dumb" } }), false);
  });

  test("NO_COLOR turns it off and FORCE_COLOR on; NO_COLOR wins; empty values don't count", async () => {
    const { colorChoice } = await import(COLORS);
    assert.equal(colorChoice({ isTTY: true, env: { NO_COLOR: "1" } }), false);
    assert.equal(colorChoice({ isTTY: false, env: { FORCE_COLOR: "1" } }), true);
    assert.equal(colorChoice({ isTTY: false, env: { FORCE_COLOR: "true" } }), true);
    assert.equal(colorChoice({ isTTY: true, env: { FORCE_COLOR: "0" } }), false);
    assert.equal(colorChoice({ isTTY: false, env: { NO_COLOR: "1", FORCE_COLOR: "1" } }), false);
    assert.equal(colorChoice({ isTTY: true, env: { NO_COLOR: "" } }), true);
    assert.equal(colorChoice({ isTTY: false, env: { FORCE_COLOR: "" } }), false);
  });

  test("--color and --no-color win over everything", async () => {
    const { colorChoice } = await import(COLORS);
    assert.equal(colorChoice({ flag: true, isTTY: false, env: { NO_COLOR: "1" } }), true);
    assert.equal(colorChoice({ flag: false, isTTY: true, env: { FORCE_COLOR: "1" } }), false);
  });

  test("the painters add codes only when color is on, and ok/warn messages are green/yellow", async () => {
    const { paint, setColorFlag, ok, warn } = await import(COLORS);
    try {
      setColorFlag(true);
      assert.equal(paint.out.cyan("x"), cyan("x"));
      assert.equal(paint.err.red("x"), red("x"));
      const seen = [];
      const [log, err] = [console.log, console.warn];
      console.log = (...a) => seen.push(a.join(" "));
      console.warn = (...a) => seen.push(a.join(" "));
      try {
        ok("upgraded");
        warn("careful");
      } finally {
        [console.log, console.warn] = [log, err];
      }
      assert.deepEqual(seen, [`${dim("[aiskills]")} ${green("upgraded")}`, `${dim("[aiskills]")} ${yellow("careful")}`]);
      setColorFlag(false);
      assert.equal(paint.out.cyan("x"), "x");
    } finally {
      setColorFlag(null);
    }
  });
});

describe("the CLI in color", { skip: process.platform === "win32" && "stand-in npm/npx are POSIX scripts" }, () => {
  let sb;
  before(() => {
    sb = sandbox();
    sb.setVersion("0.8.0");
    sb.setView(SAMPLE_VIEW);
  });
  after(() => sb.cleanup());
  const both = (args, env = {}) => [sb.run(args, { env }), sb.run(args, { env: { ...env, ...FORCE } })];

  test("color is off when the output is piped, and stripping it gives the plain text exactly", () => {
    for (const args of [["--help"], ["info"], ["groups"], ["rel"]]) {
      const [plain, colored] = both(args, { AISKILLS_TODAY: "2026-11-12" });
      assert.ok(!plain.out.includes(ESC), `${args.join(" ")}: no color when piped`);
      assert.ok(colored.out.includes(ESC), `${args.join(" ")}: FORCE_COLOR colors it`);
      assert.equal(strip(colored.out), plain.out, `${args.join(" ")}: same text and alignment`);
    }
  });

  test("--help: the title and section headings are bold, and it documents the switches", () => {
    const [plain, colored] = both(["--help"]);
    assert.ok(colored.out.startsWith(bold(plain.out.split("\n")[0])));
    for (const h of ["Commands:", "Environment:", "Output (any command; may also go before the command):"]) {
      assert.ok(colored.out.includes(`\n${bold(h)}\n`), h);
    }
    assert.match(plain.out, /--color +Color the output/);
    assert.match(plain.out, /--no-color +Never color the output/);
    assert.match(plain.out, /NO_COLOR=1 +Same as --no-color/);
    assert.match(plain.out, /FORCE_COLOR=1 +Same as --color/);
  });

  test("info: labels dim, values bold, where a value comes from dim", () => {
    const r = sb.run(["info"], { env: FORCE });
    assert.match(r.out, new RegExp(`${dim(" *aiskills version").replace(/\[/g, "\\[")} : ${bold("0.8.0").replace(/\[/g, "\\[")}`));
    assert.ok(r.out.includes(dim("(AISKILLS_HOME)")), "the source of the install root");
  });

  test("rel: the header row bold, the latest tag green, the installed mark bold", () => {
    const r = sb.run(["rel"], { env: { ...FORCE, AISKILLS_TODAY: "2026-11-12" } });
    assert.ok(r.out.includes(bold("  VERSION  PUBLISHED                TAG")), r.out);
    assert.ok(r.out.includes(green("latest")));
    assert.ok(r.out.includes(bold("← installed")));
  });

  test("groups: group names bold, the command to run cyan", () => {
    const r = sb.run(["groups"], { env: FORCE });
    assert.match(r.out, new RegExp(`^${bold("alpha-skills").replace(/\[/g, "\\[")}`, "m"));
    assert.ok(r.out.includes(cyan("aiskills install --group <name|alias> --global --agent <agent>")));
  });

  test("messages: the [aiskills] prefix dim, errors red on stderr", () => {
    const sync = sb.run(["sync"], { env: FORCE });
    assert.match(sync.out, new RegExp(`^${dim("[aiskills]").replace(/\[/g, "\\[")} skills saved to`, "m"));
    const bad = sb.run(["install", "--bogus"], { env: FORCE });
    assert.equal(bad.status, 1);
    assert.ok(bad.out.includes(`${dim("[aiskills]")} ${red("unknown option: --bogus")}`), bad.out);
  });

  test("--json output is never colored", () => {
    for (const args of [["info", "--json"], ["groups", "--json"]]) {
      const r = sb.run(args, { env: FORCE });
      assert.equal(r.status, 0, r.out);
      assert.ok(!r.out.includes(ESC), args.join(" "));
      JSON.parse(r.out);
    }
  });

  test("--color and --no-color work before or after the command, and win over the environment", () => {
    assert.ok(sb.run(["--help", "--color"]).out.includes(ESC));
    assert.ok(sb.run(["--color", "groups"]).out.includes(ESC));
    assert.ok(sb.run(["groups", "--color"], { env: { NO_COLOR: "1" } }).out.includes(ESC));
    assert.ok(!sb.run(["--no-color", "groups"], { env: FORCE }).out.includes(ESC));
    assert.ok(!sb.run(["info", "--no-color"], { env: FORCE }).out.includes(ESC));
    assert.ok(!sb.run(["groups"], { env: { ...FORCE, NO_COLOR: "1" } }).out.includes(ESC));
  });

  test("'skills' and 'find' pass --color/--no-color through to npx skills", () => {
    const r = sb.run(["skills", "list", "--no-color"]);
    assert.equal(r.status, 0, r.out);
    assert.ok(r.calls.some((c) => c.args.includes("--no-color")), JSON.stringify(r.calls));
  });
});
