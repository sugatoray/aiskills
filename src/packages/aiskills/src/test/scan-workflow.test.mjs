// The GitHub Actions workflow that runs `aiskills scan` (SkillSpector) over the repo's skills
// (.github/workflows/skillspector.yml at the repo root). Like docs-workflow.test.mjs, these
// tests keep it pointing at real paths and commands, and keep it report-only, so a moved
// folder or a renamed flag fails here instead of in CI after merge.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, test } from "node:test";

import { PKG_SRC } from "./helpers.mjs";

const REPO = join(PKG_SRC, "..", "..", "..");
const PKG_REL = relative(REPO, PKG_SRC).split("\\").join("/"); // src/packages/aiskills
const WORKFLOW = join(REPO, ".github", "workflows", "skillspector.yml");
const read = () => readFileSync(WORKFLOW, "utf8");

/** The entries of the `paths:` list under `on.pull_request`. */
function prPaths(yml) {
  const block = yml.match(/\n {2}pull_request:\n {4}paths:\n((?: {6}- .+\n)+)/);
  assert.ok(block, "on.pull_request should have a paths: list");
  return [...block[1].matchAll(/- "?([^"\n]+)"?/g)].map((m) => m[1].trim());
}

/** Every `run:` command in the workflow. */
const runs = (yml) => [...yml.matchAll(/\n\s+run: (.+)/g)].map((m) => m[1]);

describe("SkillSpector workflow", () => {
  test("exists at the repo root", () => {
    assert.ok(existsSync(WORKFLOW), `missing ${relative(REPO, WORKFLOW)}`);
  });

  test("runs on pull requests that touch skills, weekly, and by hand", () => {
    const yml = read();
    assert.match(yml, /\n {2}pull_request:/);
    assert.match(yml, /\n {2}schedule:\n {4}- cron: /);
    assert.match(yml, /\n {2}workflow_dispatch:/);
  });

  test("every watched path exists; skills, the scanner and the workflow are watched", () => {
    const paths = prPaths(read());
    for (const p of paths) {
      const fixed = p.replace(/\/?\*\*.*$/, "");
      assert.ok(existsSync(join(REPO, fixed)), `paths: entry ${p} points at nothing`);
    }
    for (const need of ["skills/**", `${PKG_REL}/src/scripts/core/scan.mjs`, ".github/workflows/skillspector.yml"]) {
      assert.ok(paths.includes(need), `paths: should include ${need}`);
    }
  });

  test("scans the repo's skills with this repo's own aiskills CLI", () => {
    const scans = runs(read()).filter((c) => /\bscan\b/.test(c));
    assert.ok(scans.length > 0, "no scan command");
    for (const c of scans) {
      const bin = c.match(/node (\S+\.mjs) scan (\S+)/);
      assert.ok(bin, `unexpected scan command: ${c}`);
      assert.ok(existsSync(join(REPO, bin[1])), `${bin[1]} does not exist`);
      assert.ok(existsSync(join(REPO, bin[2])), `scan target ${bin[2]} does not exist`);
    }
  });

  test("is report-only and static-only: no --fail-on-findings, no --llm", () => {
    for (const c of runs(read()).filter((c) => /\bscan\b/.test(c))) {
      assert.doesNotMatch(c, /--fail-on-findings/, "start report-only");
      assert.doesNotMatch(c, /--llm\b/, "no skill content goes to an LLM provider in CI");
    }
  });

  test("produces SARIF and a markdown report", () => {
    const scans = runs(read()).filter((c) => /\bscan\b/.test(c)).join("\n");
    assert.match(scans, /(--format|-f) sarif/);
    assert.match(scans, /(--format|-f) markdown/);
  });

  test("installs uv and Node, which the scan needs", () => {
    const yml = read();
    assert.match(yml, /uses: astral-sh\/setup-uv@v\d+/);
    assert.match(yml, /uses: actions\/setup-node@v\d+/);
  });

  test("keeps the reports as an artifact and puts the markdown in the job summary", () => {
    const yml = read();
    assert.match(yml, /uses: actions\/upload-artifact@v\d+/);
    assert.match(yml, /GITHUB_STEP_SUMMARY/);
  });

  test("uploads SARIF to code scanning without failing the job when that is not allowed", () => {
    const yml = read();
    const step = yml.split(/\n {6}- /).find((s) => /uses: github\/codeql-action\/upload-sarif@v\d+/.test(s));
    assert.ok(step, "needs an upload-sarif step");
    assert.match(step, /sarif_file: /);
    assert.match(step, /continue-on-error: true|if: .*fork/);
  });

  test("least privilege: read contents; write security-events only to upload SARIF", () => {
    const yml = read();
    assert.match(yml, /\npermissions:\n {2}contents: read\n {2}security-events: write/);
    assert.doesNotMatch(yml, /pull-requests: write|id-token: write|contents: write/);
  });
});
