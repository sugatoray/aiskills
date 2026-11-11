// `aiskills scan`: run NVIDIA's SkillSpector (https://github.com/NVIDIA/skillspector)
// over skill folders and produce a report.
//
// SkillSpector is a Python tool, so aiskills never bundles it. It runs skillspector from
// PATH if there is one, else through `uvx` at a pinned commit (see SKILLSPECTOR_REF), so
// the scanner you get is the one this release was tested with.
//
// Default is static-only (--no-llm): nothing about your skills is sent to an LLM provider.
// (SkillSpector's dependency check still asks OSV.dev about package names and versions.)
// Default is also report-only: findings never fail the command; --fail-on-findings does.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, dirname, join, resolve } from "node:path";

import { log, quote, warn } from "./installer.mjs";

export const SKILLSPECTOR_GIT = "https://github.com/NVIDIA/skillspector";
/** Pinned commit. Bump it on purpose, after running a scan with the new one. */
export const SKILLSPECTOR_REF = "5f0f73dd204ad2454cca4ad63b06e60ad1ec3648";
export const SCAN_FORMATS = ["terminal", "json", "markdown", "sarif"];

const SKIP_DIRS = new Set(["node_modules", ".git"]);

/** Every folder under <root> (or <root> itself) that holds a SKILL.md, sorted. Skills are leaves. */
export function findSkillDirs(root) {
  const found = [];
  const walk = (dir) => {
    if (existsSync(join(dir, "SKILL.md"))) {
      found.push(dir);
      return;
    }
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory() && !SKIP_DIRS.has(ent.name)) walk(join(dir, ent.name));
    }
  };
  walk(root);
  return found.sort();
}

/**
 * Copy the skills into one flat temp folder (skillspector --recursive only looks one level
 * down, but skills live at any depth). Returns { dir, cleanup }.
 */
export function stageSkills(skillDirs) {
  const dir = mkdtempSync(join(tmpdir(), "aiskills-scan-"));
  const used = new Set();
  for (const src of skillDirs) {
    let name = basename(src);
    if (used.has(name)) name = `${basename(dirname(src))}__${name}`;
    for (let n = 2; used.has(name); n++) name = `${basename(src)}__${n}`;
    used.add(name);
    cpSync(src, join(dir, name), { recursive: true, filter: (p) => !SKIP_DIRS.has(basename(p)) });
  }
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** The arguments after `skillspector`. Static-only unless llm is true. */
export function buildScanArgs({ target, format, output, llm = false, baseline, failOnFindings = false, extra = [] }) {
  if (format && !SCAN_FORMATS.includes(format)) {
    throw new Error(`unknown format '${format}' (use one of: ${SCAN_FORMATS.join(", ")})`);
  }
  const args = ["scan", target, "--recursive"];
  if (!llm) args.push("--no-llm");
  if (format) args.push("--format", format);
  if (output) args.push("--output", output);
  if (baseline) args.push("--baseline", baseline);
  if (failOnFindings) args.push("--fail-on-findings");
  return [...args, ...extra];
}

/** Is <cmd> an executable on PATH? */
export function onPath(cmd, env = process.env) {
  const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  for (const dir of (env.PATH ?? "").split(delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const p = join(dir, cmd + ext);
      try {
        if (statSync(p).isFile()) return true;
      } catch {
        /* not here */
      }
    }
  }
  return false;
}

/** How to start skillspector: { cmd, args, via } (args go before `scan`), or null if impossible. */
export function resolveRunner({ has = onPath } = {}) {
  const from = `git+${SKILLSPECTOR_GIT}@${SKILLSPECTOR_REF}`;
  if (has("skillspector")) return { cmd: "skillspector", args: [], via: "skillspector on PATH" };
  if (has("uvx")) return { cmd: "uvx", args: ["--from", from, "skillspector"], via: `uvx (${SKILLSPECTOR_REF.slice(0, 7)})` };
  if (has("uv")) {
    return { cmd: "uv", args: ["tool", "run", "--from", from, "skillspector"], via: `uv tool run (${SKILLSPECTOR_REF.slice(0, 7)})` };
  }
  return null;
}

const INSTALL_HELP = `skillspector is not installed, and neither uvx nor uv is available to run it.
  Install uv (https://docs.astral.sh/uv/), then re-run 'aiskills scan'; or install skillspector yourself:
    uv tool install git+${SKILLSPECTOR_GIT}@${SKILLSPECTOR_REF}
  (SkillSpector needs Python 3.12+.)`;

/**
 * Scan <path> (a skills folder, or one skill). Returns the exit status:
 *   0 scanned (report-only: findings do not fail it), 1 findings with failOnFindings,
 *   2 the scanner could not run or errored.
 * Throws for a bad path (the CLI turns that into exit 1).
 */
export function scan({ path, format, output, llm = false, baseline, failOnFindings = false, dryRun = false, extra = [] }) {
  const root = resolve(path);
  if (!existsSync(root)) throw new Error(`not found: ${root}`);
  const skillDirs = findSkillDirs(root);
  if (!skillDirs.length) throw new Error(`no skills (SKILL.md) found under ${root}`);

  const runner = resolveRunner();
  if (!runner) {
    warn(INSTALL_HELP);
    return 2;
  }
  const out = output ? resolve(output) : undefined;
  const base = baseline ? resolve(baseline) : undefined;
  const optsFor = (target) => ({ target, format, output: out, llm, baseline: base, failOnFindings, extra });

  if (dryRun) {
    const argv = [runner.cmd, ...runner.args, ...buildScanArgs(optsFor(root))];
    log(`[dry-run] ${skillDirs.length} skill(s) under ${root}; via ${runner.via}`);
    log(`[dry-run] ${argv.map(quote).join(" ")}`);
    return 0;
  }

  const staged = stageSkills(skillDirs);
  try {
    log(`scanning ${skillDirs.length} skill(s) under ${root} with SkillSpector (${runner.via}${llm ? ", LLM on" : ", static-only"})`);
    const res = spawnSync(runner.cmd, [...runner.args, ...buildScanArgs(optsFor(staged.dir))], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (res.error) {
      warn(`could not run ${runner.cmd}: ${res.error.message}`);
      return 2;
    }
    if (res.status === 0) {
      if (out) log(`report: ${out}`);
      return 0;
    }
    if (res.status === 1) {
      if (out) log(`report: ${out}`);
      if (failOnFindings) return 1;
      log("SkillSpector reported findings (report-only: not failing; pass --fail-on-findings to gate on them).");
      return 0;
    }
    return 2;
  } finally {
    staged.cleanup();
  }
}
