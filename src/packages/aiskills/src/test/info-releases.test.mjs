// CLI tests for `aiskills info` and `aiskills releases` / `rel`, with a
// stand-in npm (`npm view`) and a stand-in api.npmjs.org (see helpers.mjs).
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";

import { SAMPLE_API, SAMPLE_VIEW, sandbox, skillsArgs } from "./helpers.mjs";

const posixOnly = { skip: process.platform === "win32" && "stand-in npm/npx are POSIX scripts" };
const TODAY = { AISKILLS_TODAY: "2026-11-12" };

let sb;
before(async () => {
  sb = sandbox();
  await sb.startApi();
});
after(() => sb.cleanup());
beforeEach(() => {
  sb.setView(SAMPLE_VIEW);
  sb.setApi(SAMPLE_API);
  sb.apiCalls();
  rmSync(join(sb.home, ".agents"), { recursive: true, force: true });
});

const lines = (out) => out.trimEnd().split("\n");

describe("aiskills releases / rel", posixOnly, () => {
  test("shows the latest 5, newest first, marks the installed version, and links the changelog", () => {
    const r = sb.run(["releases"], { env: TODAY });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(lines(r.out), [
      "@sugatoray-ai/aiskills: 5 releases",
      "",
      "  VERSION  PUBLISHED                TAG",
      "  0.8.0    2026-11-12 (today)       latest  ← installed",
      "  0.7.0    2026-11-11 (1 day ago)",
      "  0.6.0    2026-11-11 (1 day ago)",
      "  0.5.0    2026-11-09 (3 days ago)",
      "  0.4.0    2026-11-09 (3 days ago)",
      "",
      "changelog: https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md",
    ]);
    assert.deepEqual(sb.apiCalls(), [], "no download counts asked for");
  });

  test("rel = releases; a number, all, -L and --last pick how many", () => {
    for (const args of [["rel", "2"], ["rel", "-L", "2"], ["releases", "--last", "2"]]) {
      const r = sb.run(args, { env: TODAY });
      assert.equal(r.status, 0, r.out);
      assert.match(r.out, /^@sugatoray-ai\/aiskills: latest 2 of 5 releases$/m, args.join(" "));
      assert.match(r.out, /^more: aiskills (rel|releases) all$/m);
      assert.ok(!r.out.includes("0.6.0"));
    }
    assert.match(sb.run(["rel", "all"], { env: TODAY }).out, /: 5 releases$/m);
    assert.match(sb.run(["rel", "-L", "all"], { env: TODAY }).out, /0\.4\.0/);
  });

  test("an older installed version gets an update hint", () => {
    const view = structuredClone(SAMPLE_VIEW);
    view.time["0.9.0"] = "2026-11-12T12:00:00.000Z";
    view["dist-tags"].latest = "0.9.0";
    sb.setView(view);
    const r = sb.run(["rel"], { env: TODAY });
    assert.match(r.out, /^update available: 0\.8\.0 → 0\.9\.0 {2}\(npm install -g @sugatoray-ai\/aiskills@latest\)$/m);
  });

  test("a version that isn't on npm says so", () => {
    const view = structuredClone(SAMPLE_VIEW);
    delete view.time["0.8.0"];
    view["dist-tags"].latest = "0.7.0";
    sb.setView(view);
    assert.match(sb.run(["rel"], { env: TODAY }).out, /^installed: 0\.8\.0 \(not published on npm\)$/m);
  });

  test("--downloads: a 7-day column, the all-time total, notes, and a daily chart", () => {
    const r = sb.run(["rel", "--downloads"], { env: TODAY });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(lines(r.out), [
      "@sugatoray-ai/aiskills: 5 releases",
      "",
      "  VERSION  PUBLISHED                TAG     DOWNLOADS (7 DAYS)",
      "  0.8.0    2026-11-12 (today)       latest                   –  ← installed",
      "  0.7.0    2026-11-11 (1 day ago)                            –",
      "  0.6.0    2026-11-11 (1 day ago)                            –",
      "  0.5.0    2026-11-09 (3 days ago)                         140",
      "  0.4.0    2026-11-09 (3 days ago)                         162",
      "",
      "downloads, all versions: 424 all time (2026-11-09 → 2026-11-10)",
      "per-version counts cover the last 7 days only (npm keeps no older ones); – = no count yet",
      "the total includes versions not listed here (0.0.0-stage)",
      "",
      "  2026-11-09 ██████████████████████████████ 402  0.4.0, 0.5.0 published",
      "  2026-11-10 █▋                              22",
      "",
      "changelog: https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md",
    ]);
    assert.deepEqual(sb.apiCalls(), [
      "/downloads/point/last-day/@sugatoray-ai/aiskills",
      "/versions/%40sugatoray-ai%2Faiskills/last-week",
      "/downloads/range/2026-11-09:2026-11-10/@sugatoray-ai/aiskills",
    ]);
  });

  test("--downloads <period>, --downloads=<period>; a bare number after it is still the count", () => {
    let r = sb.run(["rel", "--downloads", "2w"], { env: TODAY });
    assert.match(r.out, /^downloads, all versions: 424 in the last 14 days \(2026-10-28 → 2026-11-10\)$/m);
    assert.match(r.out, /^ {2}… {10}\(10 more days with 0 downloads\)$/m);
    r = sb.run(["rel", "--downloads=2026-11-10:"], { env: TODAY });
    assert.match(r.out, /^downloads, all versions: 22 from 2026-11-10 to 2026-11-10/m);
    r = sb.run(["rel", "--downloads", "2"], { env: TODAY });
    assert.match(r.out, /latest 2 of 5 releases/);
    assert.match(r.out, /424 all time/);
  });

  test("long periods are fetched in 18-month pieces and shown by month", () => {
    const r = sb.run(["rel", "--downloads", "2y"], { env: TODAY });
    assert.equal(r.status, 0, r.out);
    assert.deepEqual(sb.apiCalls().filter((c) => c.startsWith("/downloads/range/")), [
      "/downloads/range/2024-11-11:2026-05-04/@sugatoray-ai/aiskills",
      "/downloads/range/2026-05-05:2026-11-10/@sugatoray-ai/aiskills",
    ]);
    assert.match(r.out, /^ {2}2024-11 .* 0 {2}\(partial: 20 of 30 days\)$/m);
    assert.match(r.out, /^ {2}2026-11 .* 424 {2}0\.4\.0, 0\.5\.0 published {2}\(partial: 10 of 30 days\)$/m);
  });

  test("--table, --by and --ascii (each implies --downloads)", () => {
    let r = sb.run(["rel", "--table"], { env: TODAY });
    assert.match(r.out, /^ {2}DAY {9}DOWNLOADS {2}RELEASED$/m);
    assert.match(r.out, /^ {2}2026-11-09 {8}402 {2}0\.4\.0, 0\.5\.0$/m);
    r = sb.run(["rel", "--by", "week", "--downloads", "14d"], { env: TODAY });
    assert.match(r.out, /^ {2}week of 2026-10-28 ▏ +0$/m);
    assert.match(r.out, /^ {2}week of 2026-11-04 █{30} 424 {2}0\.4\.0, 0\.5\.0 published$/m);
    r = sb.run(["rel", "--ascii"], { env: TODAY });
    assert.match(r.out, /^ {2}2026-11-09 #{30} 402/m);
  });

  test("--json: the releases, and with --downloads the counts and rows", () => {
    const r = sb.run(["rel", "2", "--json", "--downloads"], { env: TODAY });
    assert.equal(r.status, 0, r.out);
    const j = JSON.parse(r.out);
    assert.equal(j.package, "@sugatoray-ai/aiskills");
    assert.equal(j.installed, "0.8.0");
    assert.equal(j.latest, "0.8.0");
    assert.equal(j.total, 5);
    assert.deepEqual(j.releases.map((x) => [x.version, x.tags, x.installed, x.downloadsLastWeek]), [
      ["0.8.0", ["latest"], true, null],
      ["0.7.0", [], false, null],
    ]);
    assert.deepEqual(j.downloads, {
      start: "2026-11-09",
      end: "2026-11-10",
      label: "all time",
      total: 424,
      by: "day",
      rows: [
        { start: "2026-11-09", end: "2026-11-09", downloads: 402, partial: false, published: ["0.4.0", "0.5.0"] },
        { start: "2026-11-10", end: "2026-11-10", downloads: 22, partial: false, published: [] },
      ],
    });
  });

  test("bad counts, periods and option mixes stop before any network call", () => {
    for (const [args, re] of [
      [["rel", "0"], /invalid number of releases '0'/],
      [["rel", "-L"], /-L needs a value/],
      [["rel", "--downloads", "7days"], /invalid period '7days'\n {2}use all, <N><d\|w\|m\|y>/],
      [["rel", "--chart", "--table"], /--chart and --table can't be used together/],
      [["rel", "--by", "year"], /--by takes day, week or month; got 'year'/],
      [["rel", "--nope"], /unknown option: --nope/],
    ]) {
      const r = sb.run(args, { env: TODAY });
      assert.equal(r.status, 1, args.join(" "));
      assert.match(r.out, re, args.join(" "));
    }
    assert.deepEqual(sb.apiCalls(), []);
    const r = sb.run(["rel", "--downloads", "2026-12-01:"], { env: TODAY });
    assert.equal(r.status, 1);
    assert.match(r.out, /npm has no download counts after 2026-11-10/);
  });

  test("npm or api.npmjs.org failing is one clear line and exit 1", () => {
    let r = sb.run(["rel"], { env: { ...TODAY, FAKE_NPM_VIEW_ERROR: "1" } });
    assert.equal(r.status, 1);
    assert.match(r.out, /^\[aiskills\] could not read the releases of @sugatoray-ai\/aiskills from npm: 404 Not Found/m);
    sb.setApi({ down: true });
    r = sb.run(["rel", "--downloads"], { env: TODAY });
    assert.equal(r.status, 1);
    assert.match(r.out, /^\[aiskills\] could not reach 127\.0\.0\.1:\d+: HTTP 503$/m);
    r = sb.run(["rel"], { env: { AISKILLS_TODAY: "soon" } });
    assert.match(r.out, /AISKILLS_TODAY must be a date \(YYYY-MM-DD\); got 'soon'/);
  });
});

describe("aiskills info", posixOnly, () => {
  test("offline: versions, folders, settings and their sources; nothing run", () => {
    sb.run(["sync"]);
    const r = sb.run(["info"]);
    assert.equal(r.status, 0, r.out);
    const out = r.out.replaceAll(sb.home, "~");
    assert.match(out, /^ *aiskills version : 0\.8\.0$/m);
    assert.match(out, /^ *package path : .*\/pkg$/m);
    assert.match(out, /^ *node version : v\d+\.\d+\.\d+ \(\w+-\w+\)$/m);
    assert.match(out, /^ *install root : ~\/\.config\/sugatoray\/aiskills {2}\(AISKILLS_HOME\)$/m);
    assert.match(out, /^ *saved skills : 5 skills in 2 groups, flat layout$/m);
    assert.match(out, /^ *saved by : aiskills 0\.8\.0, \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/m);
    assert.match(out, /^ *skills CLI : skills@1\.7\.6 {2}\(pinned, tested\)$/m);
    assert.match(out, /^ *scope : global {2}\(default\)$/m);
    assert.match(out, /^ *layout : flat {2}\(remembered\)$/m);
    assert.match(out, /^ *stats : off {2}\(AISKILLS_STATS\)$/m);
    assert.match(out, /^ *route : off {2}\(default\)$/m);
    assert.match(out, /^ *skills lock file : ~\/\.agents\/\.skill-lock\.json {2}\(not created yet\)$/m);
    assert.match(out, /^last-picked agents : none {2}\(used by install -l\)$/m);
    assert.match(out, /^ *env overrides : AISKILLS_HOME=~\/\.config\/sugatoray\/aiskills$/m);
    assert.match(out, /^ {21}AISKILLS_STATS=0$/m);
    assert.deepEqual(r.calls, [], "info ran no npx");
    assert.ok(!out.includes("latest on npm"));
  });

  test("shows env sources, last-picked agents, and a saved copy from another version", () => {
    sb.run(["sync"]);
    const meta = join(sb.root, "aiskills.json");
    writeFileSync(meta, JSON.stringify({ package: "@sugatoray-ai/aiskills", version: "0.7.0", layout: "flat", installedAt: "2026-11-11T18:10:00.000Z" }));
    mkdirSync(join(sb.home, ".agents"), { recursive: true });
    writeFileSync(join(sb.home, ".agents", ".skill-lock.json"), JSON.stringify({ lastSelectedAgents: ["claude-code", "codex"] }));
    const r = sb.run(["info"], { env: { AISKILLS_SCOPE: "project", AISKILLS_SKILLS_LIB_VERSION: "~1.7.4", DO_NOT_TRACK: "1" } });
    assert.match(r.out, /saved by : aiskills 0\.7\.0, 2026-11-11 18:10 UTC {2}\(not this version: run aiskills install\)$/m);
    assert.match(r.out, /skills CLI : skills@~1\.7\.4 {2}\(AISKILLS_SKILLS_LIB_VERSION\)$/m);
    assert.match(r.out, /scope : project {2}\(AISKILLS_SCOPE\)$/m);
    assert.match(r.out, /stats : off {2}\(DO_NOT_TRACK\)$/m);
    assert.match(r.out, /last-picked agents : claude-code, codex {2}\(used by install -l\)$/m);
    assert.ok(!r.out.includes("using skills@"), "no override notice: info runs nothing");
  });

  test("before the first install it says so", () => {
    const fresh = sandbox();
    try {
      const r = fresh.run(["info"]);
      assert.equal(r.status, 0, r.out);
      assert.match(r.out, /install root : .* {2}\(AISKILLS_HOME; not created yet\)$/m);
      assert.match(r.out, /saved skills : none yet {2}\(run aiskills install or aiskills sync\)$/m);
    } finally {
      fresh.cleanup();
    }
  });

  test("--full adds the latest version on npm and what npx skills has installed", () => {
    sb.run(["sync"]);
    sb.setList([
      { name: "a1", agents: ["Claude Code", "Codex"], source: sb.root, sourceType: "local" },
      { name: "a2", agents: ["Claude Code"], source: sb.root, sourceType: "local" },
      { name: "pdf", agents: ["Claude Code"], source: "anthropics/skills", sourceType: "github" },
    ]);
    const r = sb.run(["info", "--full"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /latest on npm : 0\.8\.0 {2}\(up to date\)$/m);
    assert.match(r.out, /installed skills : 2 from the install root, 1 from other sources {2}\(global\)$/m);
    assert.match(r.out, /per agent : Claude Code 2, Codex 1$/m);
    assert.deepEqual(r.calls.map(skillsArgs).map((a) => a.slice(0, 2)), [["list", "--json"]]);
    const old = structuredClone(SAMPLE_VIEW);
    old.time["0.9.0"] = "2026-11-12T12:00:00.000Z";
    old["dist-tags"].latest = "0.9.0";
    sb.setView(old);
    assert.match(sb.run(["info", "--full"]).out, /latest on npm : 0\.9\.0 {2}\(update available: npm install -g @sugatoray-ai\/aiskills@latest\)$/m);
    assert.match(sb.run(["info", "--full"], { env: { FAKE_NPM_VIEW_ERROR: "1" } }).out, /latest on npm : unavailable {2}\(could not read the releases/m);
  });

  test("--json has the same facts, for scripts", () => {
    sb.run(["sync"]);
    const j = JSON.parse(sb.run(["info", "--json"]).out);
    assert.equal(j.aiskills.version, "0.8.0");
    assert.equal(j.installRoot.path, sb.root);
    assert.equal(j.installRoot.source, "AISKILLS_HOME");
    assert.deepEqual(Object.keys(j.saved), ["skills", "groups", "layout", "version", "savedAt"]);
    assert.deepEqual(j.settings.scope, { value: "global", source: "default" });
    assert.deepEqual(j.skillsLock.lastPickedAgents, []);
    assert.equal(j.env.AISKILLS_STATS, "0");
    assert.equal(j.full, undefined);
  });
});
