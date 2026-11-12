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

import { spawn, spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at <package>/src/test/helpers.mjs.
import { vendor } from "../scripts/pack/vendor-skills.mjs";

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
const at = args.findIndex((x) => x === "skills" || x.startsWith("skills@"));
const a = args.slice(at + 1);
// FAKE_NOTARGET=<date>: npm's min-release-age / before rule refusing the requested skills version.
if (process.env.FAKE_NOTARGET) {
  console.error("npm error code ETARGET");
  console.error("npm error notarget No matching version found for " + args[at] + " with a date before " + process.env.FAKE_NOTARGET + ".");
  console.error("npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.");
  process.exit(1);
}
const read = (k, d) => (process.env[k] ? fs.readFileSync(process.env[k], "utf8") : d);
if (a[0] === "list" && a.includes("--json")) { process.stdout.write(read("FAKE_LIST_FILE", "[]")); process.exit(0); }
if (a[0] === "add" && a.includes("__aiskills_probe__")) {
  console.log("x  Invalid agents: __aiskills_probe__");
  console.log("\\u001b[2m•  Valid agents: " + (process.env.FAKE_AGENTS || "claude-code, codex, cursor, qoder, qoder-cn") + "\\u001b[0m");
  process.exit(1);
}
if (a[0] === "find") { process.stdout.write(read("FAKE_FIND_FILE", "")); process.exit(0); }
// The skills.sh install count (aiskills install, stats on): FAKE_STATS_EXIT fakes github.com being unreachable.
if (a[0] === "add" && a[1] === "sugatoray/aiskills" && process.env.FAKE_STATS_EXIT) { console.error("fatal: unable to access 'https://github.com/sugatoray/aiskills.git/'"); process.exit(Number(process.env.FAKE_STATS_EXIT)); }
process.exit(Number(process.env.FAKE_EXIT || 0));
`;

// Stand-in for npm: `npm view` (aiskills releases, info --full), answering
// with the JSON in $FAKE_NPM_VIEW, or failing like npm does with FAKE_NPM_VIEW_ERROR=1;
// and `npm config get registry` ($FAKE_NPM_REGISTRY, e.g. a company mirror).
const FAKE_NPM = `#!/usr/bin/env node
const fs = require("fs");
const a = process.argv.slice(2);
if (a[0] === "config" && a[1] === "get" && a[2] === "registry") {
  console.log(process.env.FAKE_NPM_REGISTRY || "https://registry.npmjs.org/");
  process.exit(0);
}
if (a[0] === "root" && a[1] === "-g") {
  console.log(process.env.FAKE_NPM_ROOT || "/nonexistent/lib/node_modules");
  process.exit(0);
}
// npm install -g <pkg>@<version> (aiskills upgrade): logs the call, then acts like
// npm replacing the package: sets its version, and adds or drops a skill.
if (a[0] === "install" && a[1] === "-g") {
  if (process.env.FAKE_NPM_LOG) fs.appendFileSync(process.env.FAKE_NPM_LOG, JSON.stringify(a) + "\\n");
  if (process.env.FAKE_NPM_INSTALL_ERROR) {
    console.error("npm error code EACCES");
    console.error("npm error Error: EACCES: permission denied, mkdir '/usr/lib/node_modules/@sugatoray-ai'");
    process.exit(243);
  }
  const pkgDir = process.env.FAKE_NPM_PKG;
  const version = a[2].slice(a[2].lastIndexOf("@") + 1);
  const pj = pkgDir + "/package.json";
  fs.writeFileSync(pj, JSON.stringify({ ...JSON.parse(fs.readFileSync(pj, "utf8")), version }, null, 2));
  if (process.env.FAKE_NPM_NEW_SKILL) {
    fs.mkdirSync(pkgDir + "/skills/" + process.env.FAKE_NPM_NEW_SKILL, { recursive: true });
    fs.writeFileSync(pkgDir + "/skills/" + process.env.FAKE_NPM_NEW_SKILL + "/SKILL.md", "---\\nname: " + process.env.FAKE_NPM_NEW_SKILL + "\\n---\\n");
  }
  if (process.env.FAKE_NPM_DROP_SKILL) fs.rmSync(pkgDir + "/skills/" + process.env.FAKE_NPM_DROP_SKILL, { recursive: true, force: true });
  console.log("changed 1 package in 1s");
  process.exit(0);
}
if (a[0] !== "view") process.exit(1);
if (process.env.FAKE_NPM_VIEW_ERROR) {
  console.error("npm error code E404");
  console.error("npm error 404 Not Found - GET https://registry.npmjs.org/@sugatoray-ai%2faiskills - Not found");
  process.exit(1);
}
process.stdout.write(process.env.FAKE_NPM_VIEW ? fs.readFileSync(process.env.FAKE_NPM_VIEW, "utf8") : "{}");
`;

// Stand-in for api.npmjs.org, run as its own process (the CLI is run with
// spawnSync, which would block a server in the test process). Reads its
// answers from <routes.json> on every request and logs each path.
const FAKE_API = `import { appendFileSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
const [routesFile, logFile] = process.argv.slice(2);
const DAY = 86400000;
createServer((req, res) => {
  appendFileSync(logFile, req.url + "\\n");
  const r = JSON.parse(readFileSync(routesFile, "utf8"));
  const send = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (r.down) return send(503, { error: "down" });
  const pkg = "@sugatoray-ai/aiskills";
  if (req.url === "/downloads/point/last-day/" + pkg) return send(200, { downloads: r.daily?.[r.lastDay] ?? 0, start: r.lastDay, end: r.lastDay, package: pkg });
  if (req.url === "/versions/" + encodeURIComponent(pkg) + "/last-week") return send(200, { package: pkg, downloads: r.perVersion ?? {} });
  const m = /^\\/downloads\\/range\\/(\\d{4}-\\d{2}-\\d{2}):(\\d{4}-\\d{2}-\\d{2})\\/(.+)$/.exec(req.url);
  if (m && m[3] === pkg) {
    const days = [];
    for (let t = Date.parse(m[1]); t <= Date.parse(m[2]); t += DAY) {
      const day = new Date(t).toISOString().slice(0, 10);
      days.push({ downloads: r.daily?.[day] ?? 0, day });
    }
    return send(200, { start: m[1], end: m[2], package: pkg, downloads: days });
  }
  send(404, { error: "Not Found" });
}).listen(0, "127.0.0.1", function () { process.stdout.write("port " + this.address().port + "\\n"); });
`;

/** Sample registry data: the real publish times of 0.4.0-0.7.0, plus 0.8.0 on 2026-11-12. */
export const SAMPLE_VIEW = {
  time: {
    created: "2026-11-09T05:01:33.181Z",
    modified: "2026-11-12T10:00:00.000Z",
    "0.0.0-stage": "2026-11-09T05:01:33.181Z",
    "0.4.0": "2026-11-09T05:02:49.317Z",
    "0.5.0": "2026-11-09T13:23:22.303Z",
    "0.6.0": "2026-11-11T17:06:37.038Z",
    "0.7.0": "2026-11-11T18:03:58.985Z",
    "0.8.0": "2026-11-12T10:00:00.000Z",
  },
  "dist-tags": { latest: "0.8.0" },
};

/** SAMPLE_VIEW plus 0.9.0, 1.0.0 and a 1.1.0 release (latest), for the docs' examples of the current version. */
export const DOCS_VIEW = {
  time: {
    ...SAMPLE_VIEW.time,
    modified: "2026-11-20T10:00:00.000Z",
    "0.9.0": "2026-11-15T10:00:00.000Z",
    "1.0.0": "2026-11-18T10:00:00.000Z",
    "1.1.0": "2026-11-20T10:00:00.000Z",
  },
  "dist-tags": { latest: "1.1.0" },
};

/** Sample download counts (the real ones up to 2026-11-10). */
export const SAMPLE_API = {
  lastDay: "2026-11-10",
  perVersion: { "0.0.0-stage": 122, "0.4.0": 162, "0.5.0": 140 },
  daily: { "2026-11-09": 402, "2026-11-10": 22 },
};

/** Runs a command in a pseudo-terminal (util-linux `script`); types argv[3] + Enter at "[y/N] ". */
const TTY_DRIVER = `import { spawn } from "node:child_process";
const [cmd, answer] = process.argv.slice(2);
const child = spawn("script", ["-qec", cmd, "/dev/null"], { stdio: ["pipe", "pipe", "inherit"] });
let out = "", typed = false;
child.stdout.on("data", (d) => {
  out += d;
  if (!typed && out.includes("[y/N] ")) { typed = true; child.stdin.write(answer + "\\n"); }
});
child.on("close", (code) => { process.stdout.write(out); process.exit(code ?? 1); });
`;

/**
 * A fresh sandbox, built from the fixture skills, or from the repo's real
 * (git-tracked) skills and marketplace.json with { realSkills: true }.
 * Returns helpers:
 *   run(args, {env})       run bin/aiskills.mjs (-> src/scripts/core/cli.mjs), returns { status, out, calls }
 *   aix(args, {env})       the same through bin/aix.mjs (= aiskills --route)
 *   tty(args, answer, {env, aix})  run aiskills (or aix) in a pseudo-terminal via `script`, typing <answer> + Enter
 *   setList(rows)          what the fake `npx skills list --json` returns
 *   setFind(text)          what the fake `npx skills find` prints
 *   calls()                the npx calls logged since the last run (also by background processes)
 * The skills.sh install count is off (AISKILLS_STATS=0) unless { stats: true },
 * so a background `npx skills add sugatoray/aiskills` never lands in another test's calls.
 */
export function sandbox({ realSkills = false, stats = false, globalNpm = false } = {}) {
  const dir = tempDir();
  // globalNpm: laid out like `npm install -g` (<prefix>/lib/node_modules/@sugatoray-ai/aiskills).
  const npmRoot = join(dir, "prefix", "lib", "node_modules");
  const pkg = globalNpm ? join(npmRoot, "@sugatoray-ai", "aiskills") : join(dir, "pkg");
  const npmLog = join(dir, "npm.log");
  cpSync(join(PKG_SRC, "bin"), join(pkg, "bin"), { recursive: true });
  cpSync(join(PKG_SRC, "src", "scripts"), join(pkg, "src", "scripts"), { recursive: true });
  cpSync(join(PKG_SRC, "package.json"), join(pkg, "package.json"));
  cpSync(join(PKG_SRC, "CHANGELOG.md"), join(pkg, "CHANGELOG.md"));
  const repo = realSkills ? copyRealSkills(join(dir, "repo")) : writeFixtureTree(join(dir, "repo"));
  vendor({ repoRoot: repo, pkgDir: pkg });
  const home = join(dir, "home");
  const root = join(home, ".config", "sugatoray", "aiskills");
  mkdirSync(home, { recursive: true });
  const fakeBin = join(dir, "fakebin");
  mkdirSync(fakeBin);
  writeFileSync(join(fakeBin, "npx"), FAKE_NPX);
  chmodSync(join(fakeBin, "npx"), 0o755);
  writeFileSync(join(fakeBin, "npm"), FAKE_NPM);
  chmodSync(join(fakeBin, "npm"), 0o755);
  const viewFile = join(dir, "npm-view.json");
  const routesFile = join(dir, "api.json");
  const apiLog = join(dir, "api.log");
  let api = null;
  const log = join(dir, "npx.log");
  const listFile = join(dir, "list.json");
  const findFile = join(dir, "find.txt");

  const baseEnv = () => {
    const env = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (/^(AISKILLS_|npm_)/i.test(k) || ["CI", "DO_NOT_TRACK", "DISABLE_TELEMETRY"].includes(k)) continue;
      env[k] = v;
    }
    return {
      ...env,
      PATH: fakeBin + delimiter + process.env.PATH,
      HOME: home,
      USERPROFILE: home,
      AISKILLS_HOME: root,
      ...(stats ? {} : { AISKILLS_STATS: "0" }),
      FAKE_NPX_LOG: log,
      FAKE_NPM_LOG: npmLog,
      FAKE_NPM_PKG: pkg,
      ...(globalNpm ? { FAKE_NPM_ROOT: npmRoot } : {}),
      ...(existsSync(listFile) ? { FAKE_LIST_FILE: listFile } : {}),
      ...(existsSync(findFile) ? { FAKE_FIND_FILE: findFile } : {}),
      ...(existsSync(viewFile) ? { FAKE_NPM_VIEW: viewFile } : {}),
      ...(api ? { AISKILLS_NPM_API_URL: api.url } : {}),
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
    tty: (args, answer, { env, aix = false } = {}) => {
      rmSync(log, { force: true });
      const q = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
      const cmd = [process.execPath, join(pkg, "bin", aix ? "aix.mjs" : "aiskills.mjs"), ...args].map(q).join(" ");
      // Type the answer only once the [y/N] prompt is on screen, as a person would.
      const driver = join(dir, "tty-driver.mjs");
      writeFileSync(driver, TTY_DRIVER);
      const res = spawnSync(process.execPath, [driver, cmd, answer], { cwd: dir, env: { ...baseEnv(), ...env }, encoding: "utf8" });
      return { status: res.status, out: (res.stdout ?? "").replace(/\r\n?/g, "\n") + (res.stderr ?? ""), calls: calls() };
    },
    calls,
    setList: (rows) => writeFileSync(listFile, JSON.stringify(rows)),
    setFind: (text) => writeFileSync(findFile, text),
    /** The `npm install -g` calls the stand-in npm got since the last call. */
    npmCalls: () => {
      const lines = existsSync(npmLog) ? readFileSync(npmLog, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      rmSync(npmLog, { force: true });
      return lines;
    },
    /** Set the package's version (as if that version were installed). */
    setVersion: (v) => {
      const pj = join(pkg, "package.json");
      writeFileSync(pj, JSON.stringify({ ...JSON.parse(readFileSync(pj, "utf8")), version: v }, null, 2));
    },
    /** What the stand-in `npm view` answers (an object in npm view --json's shape). */
    setView: (view) => writeFileSync(viewFile, JSON.stringify(view)),
    /** What the stand-in api.npmjs.org answers: { lastDay, perVersion, daily: {day: n}, down }. */
    setApi: (routes) => writeFileSync(routesFile, JSON.stringify(routes)),
    /** Paths the stand-in api.npmjs.org was asked for since the last call. */
    apiCalls: () => {
      const lines = existsSync(apiLog) ? readFileSync(apiLog, "utf8").trim().split("\n").filter(Boolean) : [];
      rmSync(apiLog, { force: true });
      return lines;
    },
    /** Start the stand-in api.npmjs.org (async; await it in before/beforeEach). */
    startApi: async () => {
      if (api) return api;
      if (!existsSync(routesFile)) writeFileSync(routesFile, JSON.stringify(SAMPLE_API));
      const script = join(dir, "fake-api.mjs");
      writeFileSync(script, FAKE_API);
      const child = spawn(process.execPath, [script, routesFile, apiLog], { stdio: ["ignore", "pipe", "inherit"] });
      const port = await new Promise((ok, fail) => {
        let out = "";
        child.stdout.on("data", (d) => {
          out += d;
          const m = /port (\d+)/.exec(out);
          if (m) ok(Number(m[1]));
        });
        child.on("exit", (code) => fail(new Error(`fake api exited (${code})`)));
      });
      api = { url: `http://127.0.0.1:${port}`, child };
      return api;
    },
    cleanup: () => {
      api?.child.kill();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** The `npx skills` part of a logged call, e.g. ["add", "<root>", "--global", ...]. */
export const skillsArgs = (call) => call.args.slice(skillsIndex(call) + 1);

/** Index of the `skills` / `skills@<version>` package argument in a logged npx call. */
const skillsIndex = (call) => call.args.findIndex((x) => x === "skills" || x.startsWith("skills@"));

/** The package spec npx was asked to run, e.g. "skills@1.7.6". */
export const skillsPackage = (call) => call.args[skillsIndex(call)];

/** A `npx skills list --json` row. */
export const row = (name, source, sourceType = "local") => ({
  name,
  scope: "global",
  agents: ["Claude Code"],
  source,
  sourceType,
});

/** Copy the repo's git-tracked skills/ and its marketplace.json under <dir>. */
function copyRealSkills(dir) {
  const files = trackedFiles("skills");
  if (!files) throw new Error("git is needed to list the repo's skills");
  for (const rel of [...files, ".claude-plugin/marketplace.json"]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    cpSync(join(REPO_ROOT, rel), join(dir, rel));
  }
  return dir;
}

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
 *   <tmp>/repo/src/packages/aiskills/{bin, src, package.json, README.md, CHANGELOG.md, SECURITY.md, LICENSE, .npmignore, .gitignore}
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
  for (const p of ["bin", "src", "package.json", "README.md", "CHANGELOG.md", "SECURITY.md", "LICENSE", ".npmignore", ".gitignore"]) {
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
