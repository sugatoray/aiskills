// npm run audit:skills [version|range|interval] [--min-age <days>]
//
// Before pinning a `skills` CLI version (SKILLS_CLI_VERSION in
// core/installer.mjs), check it the way a user's machine would get it:
//   1. resolve `skills@<spec>` and its dependency tree into a lockfile
//      (npm install --package-lock-only --ignore-scripts; nothing is installed);
//   2. its age: fail if it was published less than --min-age days ago (default 7),
//      because users with npm's min-release-age=7 couldn't install it yet;
//   3. `npm audit` on that tree: fail on any high or critical advisory.
// Defaults to the pinned version. Maintainer tool; never published.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SKILLS_CLI_VERSION, skillsVersionSpec } from "../core/installer.mjs";

const DAY = 86_400_000;

/** Run `npm <args>` in <cwd>; returns { status, stdout }. */
function npm(args, { cwd }) {
  const win = process.platform === "win32";
  const res = spawnSync(win ? "npm.cmd" : "npm", args, { cwd, encoding: "utf8", shell: win, maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  return { status: res.status ?? 1, stdout: res.stdout ?? "" };
}

/**
 * Check a skills CLI version. Returns { ok, lines }.
 * opts: { version (default: the pinned one), minAgeDays = 7, run = npm, now = new Date() }
 */
export function auditSkills({ version = SKILLS_CLI_VERSION, minAgeDays = 7, run = npm, now = new Date() } = {}) {
  const spec = skillsVersionSpec(version);
  const lines = [];
  let ok = true;
  const fail = (msg) => {
    ok = false;
    lines.push(`FAIL: ${msg}`);
  };
  const dir = mkdtempSync(join(tmpdir(), "aiskills-audit-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "aiskills-audit", private: true }));
    const install = run(["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund", `skills@${spec}`], { cwd: dir });
    if (install.status !== 0) {
      fail(`npm could not resolve skills@${spec}`);
      return { ok, lines };
    }
    const lock = JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8"));
    const resolved = lock.packages?.["node_modules/skills"]?.version;
    if (!resolved) {
      fail(`skills@${spec} is not in the lockfile`);
      return { ok, lines };
    }
    if (resolved !== spec) lines.push(`skills@${spec} resolves to ${resolved}`);

    // Age: users with min-release-age=<minAgeDays> can't install a younger version.
    const view = run(["view", `skills@${resolved}`, "time", "--json"], { cwd: dir });
    const published = view.status === 0 ? JSON.parse(view.stdout || "{}")[resolved] : undefined;
    if (!published) {
      fail(`could not read when skills@${resolved} was published`);
    } else {
      const days = Math.floor((now - new Date(published)) / DAY);
      lines.push(`skills@${resolved}: published ${published.slice(0, 10)}, ${days} day${days === 1 ? "" : "s"} ago`);
      if (days < minAgeDays) {
        fail(`skills@${resolved} is only ${days} day${days === 1 ? "" : "s"} old; users with min-release-age=${minAgeDays} can't install it yet`);
      }
    }

    // Known advisories anywhere in the tree.
    const audit = run(["audit", "--json"], { cwd: dir });
    let meta;
    try {
      meta = JSON.parse(audit.stdout).metadata;
    } catch {
      meta = null;
    }
    if (!meta?.vulnerabilities) {
      fail("npm audit gave no result");
    } else {
      const v = meta.vulnerabilities;
      const total = meta.dependencies?.total ?? meta.dependencies;
      lines.push(`advisories: ${v.critical} critical, ${v.high} high, ${v.moderate} moderate, ${v.low} low in ${total} packages`);
      if (v.critical + v.high > 0) fail(`${v.critical + v.high} high or critical advisories; see 'npm audit' in a project with skills@${resolved}`);
    }
    return { ok, lines };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--min-age") opts.minAgeDays = Number(argv[++i]);
    else opts.version = argv[i];
  }
  const { ok, lines } = auditSkills(opts);
  for (const l of lines) console.log(`[audit:skills] ${l}`);
  console.log(`[audit:skills] ${ok ? "OK" : "not OK"}`);
  return ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`[audit:skills] ${err?.message ?? err}`);
    process.exitCode = 1;
  }
}
