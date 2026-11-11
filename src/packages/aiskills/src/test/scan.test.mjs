// `aiskills scan`: runs NVIDIA's SkillSpector over skill folders and writes a report.
//
// Unit tests cover the pure pieces (finding skills, staging them flat, building the
// skillspector command line, choosing how to run it). CLI tests run the real CLI in
// the usual sandbox with stand-in `skillspector` / `uvx` executables, so nothing here
// needs Python, uv or the network.
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { sandbox, tempDir } from "./helpers.mjs";
import {
  SKILLSPECTOR_GIT,
  SKILLSPECTOR_REF,
  buildScanArgs,
  findSkillDirs,
  resolveRunner,
  stageSkills,
} from "../scripts/core/scan.mjs";

const posixOnly = { skip: process.platform === "win32" && "stand-in executables are POSIX scripts" };

function tree(files) {
  const dir = tempDir("aiskills-scan-");
  for (const [rel, body] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}

describe("findSkillDirs", () => {
  test("finds every folder holding a SKILL.md, at any depth, sorted", () => {
    const dir = tree({
      "grp/b/SKILL.md": "x",
      "grp/a/SKILL.md": "x",
      "top/SKILL.md": "x",
      "grp/README.md": "not a skill",
    });
    assert.deepEqual(findSkillDirs(dir), [join(dir, "grp", "a"), join(dir, "grp", "b"), join(dir, "top")]);
  });

  test("does not descend into a skill (its own subfolders are not skills)", () => {
    const dir = tree({ "s/SKILL.md": "x", "s/examples/inner/SKILL.md": "x" });
    assert.deepEqual(findSkillDirs(dir), [join(dir, "s")]);
  });

  test("the root itself may be a skill", () => {
    const dir = tree({ "SKILL.md": "x" });
    assert.deepEqual(findSkillDirs(dir), [dir]);
  });

  test("skips node_modules and .git", () => {
    const dir = tree({ "node_modules/p/SKILL.md": "x", ".git/h/SKILL.md": "x", "ok/SKILL.md": "x" });
    assert.deepEqual(findSkillDirs(dir), [join(dir, "ok")]);
  });

  test("returns [] for a folder with no skills", () => {
    assert.deepEqual(findSkillDirs(tree({ "a.txt": "x" })), []);
  });
});

describe("stageSkills", () => {
  test("copies each skill into one flat folder (what skillspector --recursive expects)", () => {
    const dir = tree({ "g/a/SKILL.md": "A", "g/a/scripts/run.sh": "echo", "h/b/SKILL.md": "B" });
    const st = stageSkills(findSkillDirs(dir));
    try {
      assert.deepEqual(readdirSync(st.dir).sort(), ["a", "b"]);
      assert.equal(readFileSync(join(st.dir, "a", "scripts", "run.sh"), "utf8"), "echo");
      assert.equal(readFileSync(join(st.dir, "b", "SKILL.md"), "utf8"), "B");
    } finally {
      st.cleanup();
    }
    assert.equal(existsSync(st.dir), false, "cleanup removes the staging folder");
  });

  test("two skills with the same folder name both survive", () => {
    const dir = tree({ "g1/same/SKILL.md": "1", "g2/same/SKILL.md": "2" });
    const st = stageSkills(findSkillDirs(dir));
    try {
      const names = readdirSync(st.dir);
      assert.equal(names.length, 2);
      const bodies = names.map((n) => readFileSync(join(st.dir, n, "SKILL.md"), "utf8")).sort();
      assert.deepEqual(bodies, ["1", "2"]);
    } finally {
      st.cleanup();
    }
  });
});

describe("buildScanArgs", () => {
  test("static-only by default: --no-llm, --recursive, markdown to the terminal", () => {
    assert.deepEqual(buildScanArgs({ target: "/t" }), ["scan", "/t", "--recursive", "--no-llm"]);
  });

  test("--llm turns LLM analysis on (drops --no-llm)", () => {
    assert.ok(!buildScanArgs({ target: "/t", llm: true }).includes("--no-llm"));
  });

  test("passes format, output, baseline and the CI gate through", () => {
    const a = buildScanArgs({
      target: "/t",
      format: "sarif",
      output: "r.sarif",
      baseline: "b.json",
      failOnFindings: true,
    });
    assert.deepEqual(a, [
      "scan", "/t", "--recursive", "--no-llm",
      "--format", "sarif", "--output", "r.sarif", "--baseline", "b.json", "--fail-on-findings",
    ]);
  });

  test("appends extra args last", () => {
    assert.deepEqual(buildScanArgs({ target: "/t", extra: ["--verbose"] }).at(-1), "--verbose");
  });

  test("rejects an unknown format", () => {
    assert.throws(() => buildScanArgs({ target: "/t", format: "pdf" }), /format/);
  });
});

describe("resolveRunner", () => {
  test("uses skillspector on PATH when present", () => {
    const r = resolveRunner({ has: (c) => c === "skillspector" || c === "uvx" });
    assert.deepEqual(r, { cmd: "skillspector", args: [], via: "skillspector on PATH" });
  });

  test("falls back to uvx with the pinned git ref", () => {
    const r = resolveRunner({ has: (c) => c === "uvx" });
    assert.equal(r.cmd, "uvx");
    assert.deepEqual(r.args, ["--from", `git+${SKILLSPECTOR_GIT}@${SKILLSPECTOR_REF}`, "skillspector"]);
  });

  test("falls back to 'uv tool run' when only uv exists", () => {
    const r = resolveRunner({ has: (c) => c === "uv" });
    assert.equal(r.cmd, "uv");
    assert.deepEqual(r.args.slice(0, 2), ["tool", "run"]);
    assert.ok(r.args.includes(`git+${SKILLSPECTOR_GIT}@${SKILLSPECTOR_REF}`));
  });

  test("returns null when nothing can run it", () => {
    assert.equal(resolveRunner({ has: () => false }), null);
  });

  test("the pin is a full 40-char commit SHA, not a branch", () => {
    assert.match(SKILLSPECTOR_REF, /^[0-9a-f]{40}$/);
  });
});

// --- CLI ---------------------------------------------------------------------------------

const FAKE_SKILLSPECTOR = `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const target = args[1];
const listing = fs.existsSync(target) ? fs.readdirSync(target).sort() : [];
if (process.env.FAKE_SS_LOG) fs.appendFileSync(process.env.FAKE_SS_LOG, JSON.stringify({ tool: path.basename(process.argv[1]), args, listing }) + "\\n");
const o = args.indexOf("--output");
if (o >= 0) fs.writeFileSync(args[o + 1], "REPORT");
console.log("fake skillspector report");
process.exit(Number(process.env.FAKE_SS_EXIT || 0));
`;

let sb;
beforeEach(() => {
  sb = sandbox();
});
afterEach(() => sb.cleanup());

/** Install a stand-in executable named <name> in the sandbox's first PATH folder. */
function fake(name, body = FAKE_SKILLSPECTOR) {
  const p = join(sb.dir, "fakebin", name);
  writeFileSync(p, body);
  chmodSync(p, 0o755);
}
const ssLog = () => join(sb.dir, "ss.log");
const ssCalls = () =>
  existsSync(ssLog()) ? readFileSync(ssLog(), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const env = (extra = {}) => ({ FAKE_SS_LOG: ssLog(), ...extra });

/** A skills folder to scan, inside the sandbox. */
function skillsFolder() {
  const dir = join(sb.dir, "myskills");
  for (const rel of ["g/one/SKILL.md", "g/two/SKILL.md"]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), "---\nname: x\n---\n");
  }
  return dir;
}

describe("aiskills scan", posixOnly, () => {
  test("--help documents scan", () => {
    const r = sb.run(["--help"]);
    assert.match(r.out, /scan/);
    assert.match(r.out, /skillspector/i);
  });

  test("scans a folder with skillspector: static-only, every skill staged flat", () => {
    fake("skillspector");
    const r = sb.run(["scan", skillsFolder()], { env: env() });
    assert.equal(r.status, 0, r.out);
    const [c] = ssCalls();
    assert.equal(c.args[0], "scan");
    assert.ok(c.args.includes("--no-llm"));
    assert.ok(c.args.includes("--recursive"));
    assert.deepEqual(c.listing, ["one", "two"]);
  });

  test("--output and --format reach skillspector and the report file is written", () => {
    fake("skillspector");
    const out = join(sb.dir, "report.md");
    const r = sb.run(["scan", skillsFolder(), "--format", "markdown", "--output", out], { env: env() });
    assert.equal(r.status, 0, r.out);
    const [c] = ssCalls();
    assert.equal(c.args[c.args.indexOf("--format") + 1], "markdown");
    assert.equal(readFileSync(out, "utf8"), "REPORT");
  });

  test("--llm enables LLM analysis", () => {
    fake("skillspector");
    sb.run(["scan", skillsFolder(), "--llm"], { env: env() });
    assert.ok(!ssCalls()[0].args.includes("--no-llm"));
  });

  test("report-only: findings (skillspector exit 1) do not fail the command", () => {
    fake("skillspector");
    const r = sb.run(["scan", skillsFolder()], { env: env({ FAKE_SS_EXIT: "1" }) });
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /report-only|findings/i);
  });

  test("--fail-on-findings gates: skillspector exit 1 becomes exit 1", () => {
    fake("skillspector");
    const r = sb.run(["scan", skillsFolder(), "--fail-on-findings"], { env: env({ FAKE_SS_EXIT: "1" }) });
    assert.equal(r.status, 1, r.out);
    assert.ok(ssCalls()[0].args.includes("--fail-on-findings"));
  });

  test("a scanner error (exit 2) is always an error", () => {
    fake("skillspector");
    const r = sb.run(["scan", skillsFolder()], { env: env({ FAKE_SS_EXIT: "2" }) });
    assert.equal(r.status, 2, r.out);
  });

  test("without skillspector, runs it through uvx at the pinned ref", () => {
    fake("uvx");
    const r = sb.run(["scan", skillsFolder()], { env: env() });
    assert.equal(r.status, 0, r.out);
    const [c] = ssCalls();
    assert.equal(c.tool, "uvx");
    assert.ok(c.args.some((a) => a.includes(SKILLSPECTOR_REF)));
    assert.ok(c.args.includes("skillspector"));
  });

  test("with neither skillspector nor uv, explains how to install it and exits 2", () => {
    // PATH holds only the sandbox's fakebin plus node's own folder.
    const r = sb.run(["scan", skillsFolder()], { env: { PATH: join(sb.dir, "fakebin") + ":" + dirname(process.execPath) } });
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /uv/);
    assert.match(r.out, /skillspector/i);
  });

  test("a folder with no skills is an error and skillspector is not run", () => {
    fake("skillspector");
    const empty = join(sb.dir, "empty");
    mkdirSync(empty);
    const r = sb.run(["scan", empty], { env: env() });
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /no skills/i);
    assert.equal(ssCalls().length, 0);
  });

  test("a missing path is an error", () => {
    fake("skillspector");
    const r = sb.run(["scan", join(sb.dir, "nope")], { env: env() });
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /not found|does not exist/i);
  });

  test("defaults to the saved skills folder under the install root", () => {
    fake("skillspector");
    sb.run(["sync"]);
    const r = sb.run(["scan"], { env: env() });
    assert.equal(r.status, 0, r.out);
    assert.ok(ssCalls()[0].listing.includes("a1"));
  });

  test("anything after -- goes straight to skillspector", () => {
    fake("skillspector");
    sb.run(["scan", skillsFolder(), "--", "--verbose"], { env: env() });
    assert.equal(ssCalls()[0].args.at(-1), "--verbose");
  });

  test("--dry-run prints the command and runs nothing", () => {
    fake("skillspector");
    const r = sb.run(["scan", skillsFolder(), "--dry-run"], { env: env() });
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /skillspector scan/);
    assert.equal(ssCalls().length, 0);
  });
});
