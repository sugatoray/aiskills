// Shared fixtures for the aiskills test suite.
//
// Nothing here touches the real $HOME, the real package folder, or the
// network: every test gets its own temp folder holding
//   repo/   a small fixture repo: nested skills/ + .claude-plugin/marketplace.json
//   pkg/    a copy of bin/, src/scripts/ and package.json, vendored from repo/
//           by the real vendor() -- i.e. laid out like the published tarball
//           (flat skills/, .aiskills/layout.json, .aiskills/nested/, _gitignore)
//   home/   $HOME for the CLI; AISKILLS_HOME = home/.config/sugatoray/aiskills
//   bin/npx a stand-in for npx that logs every call and returns canned output

import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at <package>/src/test/helpers.mjs.
import { vendor } from "../scripts/vendor-skills.mjs";

export const PKG_SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REPO_ROOT = resolve(PKG_SRC, "..", "..", "..");

/** Fixture skills: two groups (alpha, beta), one ungrouped skill. */
export const FIXTURE_SKILLS = {
  "alpha/a1/SKILL.md": "---\nname: a1\ndescription: first alpha\n---\n# a1\n",
  "alpha/a2/SKILL.md": '---\nname: "a2"\ndescription: second alpha\n---\n# a2\n',
  "beta/beta-one/SKILL.md": "---\nname: beta-one\n---\n",
  // No name: in frontmatter -> the folder name is used.
  "beta/beta-two/SKILL.md": "---\ndescription: unnamed\n---\n",
  "loose/lonely/SKILL.md": "---\nname: lonely\n---\n",
  // npm drops these; vendor-skills.mjs renames them and sync restores them.
  "loose/lonely/.gitignore": "__pycache__/\n",
  // Files outside any skill folder: kept for --nested under .aiskills/nested/.
  "alpha/README.md": "# Alpha group\n",
  "alpha/.claude-plugin/plugin.json": '{"name":"alpha-skills"}\n',
  "beta/.gitignore": "*.tmp\n",
};

export const FIXTURE_MARKETPLACE = {
  name: "fixture",
  metadata: { pluginRoot: "./skills" },
  plugins: [
    { name: "alpha-skills", source: "./alpha", description: "Alpha group" },
    { name: "beta-skills", source: "./beta", description: "Beta group" },
    // Remote sources aren't bundled and must be ignored.
    { name: "remote-skills", source: { source: "github", repo: "x/y" } },
  ],
};

/** Write the fixture skills + marketplace.json under <dir>. */
export function writeFixtureTree(dir, { marketplace = FIXTURE_MARKETPLACE } = {}) {
  for (const [rel, body] of Object.entries(FIXTURE_SKILLS)) {
    const p = join(dir, "skills", rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  if (marketplace) {
    mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
    writeFileSync(join(dir, ".claude-plugin", "marketplace.json"), JSON.stringify(marketplace, null, 2));
  }
  return dir;
}

export function tempDir(prefix = "aiskills-test-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

const FAKE_NPX = `#!/usr/bin/env node
// Stand-in for npx used by the aiskills tests.
const fs = require("fs");
const args = process.argv.slice(2);
if (process.env.FAKE_NPX_LOG) fs.appendFileSync(process.env.FAKE_NPX_LOG, JSON.stringify({ args, cwd: process.cwd(), npmEnv: Object.keys(process.env).filter((k) => /^npm_/i.test(k)) }) + "\\n");
const a = args.slice(args.indexOf("skills") + 1);
const read = (k, d) => (process.env[k] ? fs.readFileSync(process.env[k], "utf8") : d);
if (a[0] === "list" && a.includes("--json")) { process.stdout.write(read("FAKE_LIST_FILE", "[]")); process.exit(0); }
if (a[0] === "add" && a.includes("__aiskills_probe__")) {
  console.log("x  Invalid agents: __aiskills_probe__");
  console.log("\\u001b[2m•  Valid agents: " + (process.env.FAKE_AGENTS || "claude-code, codex, cursor, qoder, qoder-cn") + "\\u001b[0m");
  process.exit(1);
}
if (a[0] === "find") { process.stdout.write(read("FAKE_FIND_FILE", "")); process.exit(0); }
process.exit(Number(process.env.FAKE_EXIT || 0));
`;

/**
 * A fresh sandbox. Returns helpers:
 *   run(args, {env})       run bin/aiskills.mjs (-> src/scripts/cli.mjs), returns { status, out, calls }
 *   aix(args, {env})       the same through bin/aix.mjs (= aiskills --route)
 *   postinstall({env})     run src/scripts/postinstall.mjs the way npm would
 *   setList(rows)          what the fake `npx skills list --json` returns
 *   setFind(text)          what the fake `npx skills find` prints
 */
export function sandbox() {
  const dir = tempDir();
  const pkg = join(dir, "pkg");
  cpSync(join(PKG_SRC, "bin"), join(pkg, "bin"), { recursive: true });
  cpSync(join(PKG_SRC, "src", "scripts"), join(pkg, "src", "scripts"), { recursive: true });
  cpSync(join(PKG_SRC, "package.json"), join(pkg, "package.json"));
  const repo = writeFixtureTree(join(dir, "repo"));
  vendor({ repoRoot: repo, pkgDir: pkg });
  const home = join(dir, "home");
  const root = join(home, ".config", "sugatoray", "aiskills");
  mkdirSync(home, { recursive: true });
  const fakeBin = join(dir, "fakebin");
  mkdirSync(fakeBin);
  writeFileSync(join(fakeBin, "npx"), FAKE_NPX);
  chmodSync(join(fakeBin, "npx"), 0o755);
  const log = join(dir, "npx.log");
  const listFile = join(dir, "list.json");
  const findFile = join(dir, "find.txt");

  const baseEnv = () => {
    const env = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (/^(AISKILLS_|npm_)/i.test(k) || k === "CI") continue;
      env[k] = v;
    }
    return {
      ...env,
      PATH: fakeBin + delimiter + process.env.PATH,
      HOME: home,
      USERPROFILE: home,
      AISKILLS_HOME: root,
      FAKE_NPX_LOG: log,
      ...(existsSync(listFile) ? { FAKE_LIST_FILE: listFile } : {}),
      ...(existsSync(findFile) ? { FAKE_FIND_FILE: findFile } : {}),
    };
  };
  const calls = () =>
    existsSync(log)
      ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
      : [];
  const exec = (script, args, env = {}) => {
    rmSync(log, { force: true });
    const res = spawnSync(process.execPath, [script, ...args], {
      cwd: dir,
      env: { ...baseEnv(), ...env },
      encoding: "utf8",
    });
    return { status: res.status, out: (res.stdout ?? "") + (res.stderr ?? ""), calls: calls() };
  };

  return {
    dir,
    repo,
    pkg,
    home,
    root,
    run: (args, { env } = {}) => exec(join(pkg, "bin", "aiskills.mjs"), args, env),
    aix: (args, { env } = {}) => exec(join(pkg, "bin", "aix.mjs"), args, env),
    postinstall: ({ env } = {}) => exec(join(pkg, "src", "scripts", "postinstall.mjs"), [], env),
    setList: (rows) => writeFileSync(listFile, JSON.stringify(rows)),
    setFind: (text) => writeFileSync(findFile, text),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/** The `npx skills` part of a logged call, e.g. ["add", "<root>", "--global", ...]. */
export const skillsArgs = (call) => call.args.slice(call.args.indexOf("skills") + 1);

/** A `npx skills list --json` row. */
export const row = (name, source, sourceType = "local") => ({
  name,
  scope: "global",
  agents: ["Claude Code"],
  source,
  sourceType,
});

/** git-tracked files under <REPO_ROOT>/<dir>, or null when git isn't usable. */
export function trackedFiles(dir) {
  const res = spawnSync("git", ["-C", REPO_ROOT, "ls-files", "-z", dir], { encoding: "utf8" });
  if (res.status !== 0) return null;
  return res.stdout.split("\0").filter(Boolean);
}

/**
 * A throwaway copy of the repo shaped like the real one, so vendoring and
 * `npm pack` never write into the working tree:
 *   <tmp>/repo/{skills, .claude-plugin/marketplace.json, LICENSE}
 *   <tmp>/repo/src/packages/aiskills/{bin, src, package.json, README.md, .npmignore, .gitignore}
 * Only git-tracked skill files are copied. Returns { dir, repo, pkg } or null.
 */
export function repoCopy() {
  const skills = trackedFiles("skills");
  if (!skills) return null;
  const dir = tempDir();
  const repo = join(dir, "repo");
  for (const rel of [...skills, ".claude-plugin/marketplace.json", "LICENSE"]) {
    const dest = join(repo, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(REPO_ROOT, rel), dest);
  }
  const pkg = join(repo, "src", "packages", "aiskills");
  for (const p of ["bin", "src", "package.json", "README.md", ".npmignore", ".gitignore"]) {
    cpSync(join(PKG_SRC, p), join(pkg, p), { recursive: true });
  }
  return { dir, repo, pkg, skills };
}

/** Run npm (npm.cmd on Windows) and return { status, stdout, stderr }. */
export function npm(args, opts = {}) {
  const res = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
    env: { ...process.env, npm_config_update_notifier: "false", ...(opts.env ?? {}) },
  });
  return { status: res.status, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

/** Every file under <dir>, as sorted posix paths relative to it. */
export function listTree(dir) {
  const out = [];
  (function walk(d, rel) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name), rel + e.name + "/");
      else out.push(rel + e.name);
    }
  })(dir, "");
  return out.sort();
}
