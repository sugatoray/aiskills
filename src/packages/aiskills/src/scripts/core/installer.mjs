// All the logic behind the `aiskills` CLI (src/scripts/core/cli.mjs).
//
// 1. Copy the vendored <package>/skills folder to
//    ~/.config/sugatoray/aiskills/skills (replacing any previous copy).
// 2. Run `npx skills add ~/.config/sugatoray/aiskills ...` so the skills
//    are registered with the user's agents (Claude Code, Codex, ...).

import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at <package>/src/scripts/core/installer.mjs.
export const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const PKG_SKILLS = join(PKG_DIR, "skills");
export const MARKETPLACE_REL = join(".claude-plugin", "marketplace.json");
// Written by vendor-skills.mjs: each skill's original nested folder + the
// files that sit outside any skill folder (stored under NESTED_EXTRAS_REL).
export const LAYOUT_REL = join(".aiskills", "layout.json");
export const NESTED_EXTRAS_REL = join(".aiskills", "nested");
export const LAYOUTS = ["flat", "nested"];

/** ~/.config/sugatoray/aiskills (override with AISKILLS_HOME). */
export function installRoot() {
  return process.env.AISKILLS_HOME
    ? resolve(process.env.AISKILLS_HOME)
    : join(homedir(), ".config", "sugatoray", "aiskills");
}

export const log = (...a) => console.log("[aiskills]", ...a);
export const warn = (...a) => console.warn("[aiskills]", ...a);

// Reverse of the renames done by src/scripts/pack/vendor-skills.mjs.
const DOTFILES = { _gitignore: ".gitignore", _npmignore: ".npmignore" };
function restoreDotfiles(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) restoreDotfiles(p);
    else if (DOTFILES[ent.name]) renameSync(p, join(dir, DOTFILES[ent.name]));
  }
}

/** The `name:` from a SKILL.md frontmatter, or null. */
export function readSkillName(file) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"));
  const m = fm && /^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(fm[1]);
  return m ? m[1].trim() : null;
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

/** The package's .aiskills/layout.json, or null for an un-flattened package. */
export const packageLayout = (pkgDir = PKG_DIR) => readJson(join(pkgDir, LAYOUT_REL));

/**
 * Which layout to write: an explicit --nested/--flat wins, then
 * AISKILLS_LAYOUT, then whatever the last sync used, then "flat".
 */
export function resolveLayout(explicit, root = installRoot()) {
  const pick = explicit ?? process.env.AISKILLS_LAYOUT?.toLowerCase() ?? readJson(join(root, "aiskills.json"))?.layout ?? "flat";
  if (!LAYOUTS.includes(pick)) throw new Error(`unknown layout '${pick}' (use ${LAYOUTS.join(" or ")})`);
  return pick;
}

/**
 * Copy the package's skills to <root>/skills, replacing any older copy.
 *   layout "flat":   <root>/skills/<name>/...      (as shipped)
 *   layout "nested": <root>/skills/<group>/<name>/... plus the group-level
 *                    files: exactly the repo's skills/ folder
 * Also copies marketplace.json and layout.json next to it, and records the
 * layout in <root>/aiskills.json so later commands keep using it.
 */
export function syncSkills({ root = installRoot(), version, quiet = false, layout, stats, pkgDir = PKG_DIR } = {}) {
  const pkgSkills = join(pkgDir, "skills");
  if (!existsSync(pkgSkills)) {
    throw new Error(`no vendored skills folder at ${pkgSkills}`);
  }
  assertInstallFolder(root);
  const mode = resolveLayout(layout, root);
  const map = packageLayout(pkgDir);
  if (mode === "nested" && !map) throw new Error(`this package has no ${LAYOUT_REL}, so --nested can't rebuild the nested layout`);

  mkdirSync(root, { recursive: true });
  const dest = join(root, "skills");
  const staging = join(root, `.skills.tmp-${process.pid}`);
  rmSync(staging, { recursive: true, force: true });
  if (mode === "nested") {
    for (const [name, rel] of Object.entries(map.skills)) {
      cpSync(join(pkgSkills, name), join(staging, rel), { recursive: true });
    }
    const extras = join(pkgDir, NESTED_EXTRAS_REL);
    if (existsSync(extras)) cpSync(extras, staging, { recursive: true });
  } else {
    cpSync(pkgSkills, staging, { recursive: true });
  }
  restoreDotfiles(staging);
  rmSync(dest, { recursive: true, force: true });
  renameSync(staging, dest);

  // marketplace.json (groups) and layout.json (original paths) live next to
  // skills/; `npx skills add` finds the same skills with or without them.
  for (const rel of [MARKETPLACE_REL, LAYOUT_REL]) {
    const target = join(root, rel);
    rmSync(target, { force: true });
    if (existsSync(join(pkgDir, rel))) {
      mkdirSync(dirname(target), { recursive: true });
      cpSync(join(pkgDir, rel), target);
    }
  }
  // --stats / --no-stats is remembered until changed (like the layout).
  const keepStats = stats ?? readJson(join(root, "aiskills.json"))?.stats;
  writeFileSync(
    join(root, "aiskills.json"),
    JSON.stringify(
      {
        package: "@sugatoray-ai/aiskills",
        version,
        layout: mode,
        ...(typeof keepStats === "boolean" ? { stats: keepStats } : {}),
        installedAt: new Date().toISOString(),
        skills: dest,
      },
      null,
      2,
    ) + "\n",
  );
  if (!quiet) log(`skills saved to ${dest} (${mode} layout)`);
  return root;
}

// Run through `npx @sugatoray-ai/aiskills` or `npm exec`, npm exports
// npm_config_global, npm_config_prefix, npm_lifecycle_* etc. Passing those on
// can make the nested `npx` resolve into the wrong prefix ("skills: not found"). Keep only the
// settings that describe how to reach the registry.
// Also keep npm's release-age settings (min-release-age, its exclude list, and
// before), so `npm_config_min_release_age=0 aiskills ...` relaxes the rule for one run.
const KEEP_NPM_CONFIG = /^npm_config_(registry|cache|userconfig|globalconfig|https?_proxy|proxy|noproxy|no_proxy|cafile|ca|strict_ssl|before|min_release_age|min_release_age_exclude|@.*:registry|\/\/.*)$/i;
function childEnv() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^npm_/i.test(k) && !KEEP_NPM_CONFIG.test(k)) continue;
    env[k] = v;
  }
  return env;
}

/** Quote an argument for a POSIX shell when it has spaces, quotes or shell syntax (for printed commands). */
export const quote = (a) => (/[\s*'"<>|&;()$`]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a);

/**
 * Run `npx -y skills <args...>` with inherited stdio; returns the exit code.
 * opts: { cwd, capture=false } — capture returns { status, stdout } instead.
 */
// The `skills` CLI version every npx call runs. Pinned so a new (or
// compromised) release is never picked up silently; bump it after testing
// (npm test && npm run test:e2e && npm run audit:skills <version>).
// AISKILLS_SKILLS_LIB_VERSION (the old name AISKILLS_SKILLS_VERSION still works,
// deprecated) overrides it with a version, "latest"/"next", an npm
// range or an interval (see skillsVersionSpec).
export const SKILLS_CLI_VERSION = "1.7.6";
/** The variable that overrides it ("LIB": the skills CLI library, not the bundled skills). */
export const SKILLS_LIB_VERSION_VAR = "AISKILLS_SKILLS_LIB_VERSION";
/** Its name in 0.4.0 - 0.5.0; still read, with a deprecation warning. */
export const OLD_SKILLS_LIB_VERSION_VAR = "AISKILLS_SKILLS_VERSION";

// npm range grammar, limited to version characters: comparators (<, <=, >, >=,
// =, ~, ^), x-ranges (1.7.x, 1.x, *), hyphen ranges (a - b) and || between sets.
const PART = "(?:0|[1-9]\\d*|[xX*])";
const PRE = "(?:-[0-9A-Za-z.-]+)?";
const VER = `v?${PART}(?:\\.${PART}){0,2}${PRE}`;
const COMPARATOR = `(?:[<>]=?|=|~|\\^)?${VER}`;
// Parts are separated by plain ASCII spaces only: tabs, newlines and Unicode
// spaces would be passed to npx (and on Windows to cmd.exe) as typed.
const SET = `(?:${VER} +- +${VER}|${COMPARATOR}(?: +${COMPARATOR})*)`;
const NPM_RANGE = new RegExp(`^${SET}(?: *\\|\\| *${SET})*$`);
// Interval notation: [x, ...) >=x, (x, ...) >x, [x, y) >=x <y, (..., x] <=x,
// and the other mixes of [ ( ) ]. Exactly one of "...", "?" or "*" is an open
// end, never a combination like "?*" (plain ASCII, so it types the same in
// every shell and Windows console); "…" is read as "...".
const BOUND = "(\\d+(?:\\.\\d+){0,2}|\\.\\.\\.|\\?|\\*|…)";
const INTERVAL = new RegExp(`^([\\[(]) *${BOUND} *, *${BOUND} *([\\])])$`);
const OPEN = new Set(["...", "?", "*", "…"]);

/** Compare two dotted numeric versions, padding missing parts with 0. */
const compareVersions = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
};

/**
 * What npx is asked for, from AISKILLS_SKILLS_LIB_VERSION: an exact version,
 * "latest", "next", an npm range (passed on as is), or interval notation
 * (turned into an npm range). Throws on anything else; <name> is the
 * variable the value came from, for the error message.
 */
export function skillsVersionSpec(input, name = SKILLS_LIB_VERSION_VAR) {
  const v = String(input).trim();
  const bad = () =>
    new Error(
      `${name} must be a version (e.g. 1.7.6), "latest", "next", an npm range (e.g. ~1.7.4) ` +
        `or an interval (e.g. [1.7.4, 1.8.0)); got '${v}'`,
    );
  if (v === "latest" || v === "next") return v;
  const m = INTERVAL.exec(v);
  if (m) {
    const [, open, lo, hi, close] = m;
    const loOpen = OPEN.has(lo);
    const hiOpen = OPEN.has(hi);
    // An open end can only be exclusive, and at least one end needs a version.
    if ((loOpen && open !== "(") || (hiOpen && close !== ")") || (loOpen && hiOpen)) throw bad();
    if (!loOpen && !hiOpen) {
      const c = compareVersions(lo, hi);
      if (c > 0 || (c === 0 && !(open === "[" && close === "]"))) {
        throw new Error(`${name} '${v}' is an empty interval: no version fits it`);
      }
    }
    const parts = [];
    if (!loOpen) parts.push(`${open === "[" ? ">=" : ">"}${lo}`);
    if (!hiOpen) parts.push(`${close === "]" ? "<=" : "<"}${hi}`);
    return parts.join(" ");
  }
  if (NPM_RANGE.test(v)) return v;
  throw bad();
}

let announced = false;
let deprecationShown = false;

/**
 * "skills@<version or range>" for npx; throws on a malformed
 * AISKILLS_SKILLS_LIB_VERSION. The old name, AISKILLS_SKILLS_VERSION (0.4.0 -
 * 0.5.0), still works with a deprecation warning; the new one wins when both
 * are set. When the value overrides the pinned version, says so once per
 * command (next to the `running: npx ...` lines), so a downgrade set by a
 * profile, .envrc or CI variable can't happen silently.
 */
export function skillsPackageSpec() {
  const current = process.env[SKILLS_LIB_VERSION_VAR]?.trim();
  const old = process.env[OLD_SKILLS_LIB_VERSION_VAR]?.trim();
  if (old && !deprecationShown) {
    deprecationShown = true;
    warn(`${OLD_SKILLS_LIB_VERSION_VAR} is deprecated: use ${SKILLS_LIB_VERSION_VAR} (the version of the skills CLI library, not of the bundled skills)`);
  }
  const name = current ? SKILLS_LIB_VERSION_VAR : OLD_SKILLS_LIB_VERSION_VAR;
  const spec = skillsVersionSpec(current || old || SKILLS_CLI_VERSION, name);
  if (spec !== SKILLS_CLI_VERSION && !announced) {
    announced = true;
    log(`using skills@${spec} from ${name}, not the tested ${SKILLS_CLI_VERSION}`);
  }
  return `skills@${spec}`;
}

// On Windows, npx.cmd has to run through cmd.exe, which interprets these.
const WINDOWS_SHELL_CHARS = /[&|<>^%!"()]/;

/** The arguments cmd.exe would treat as shell syntax (none are allowed on Windows). */
export const unsafeForWindowsShell = (args) => args.filter((a) => WINDOWS_SHELL_CHARS.test(a));

/** cmd.exe splits on spaces: quote arguments that contain whitespace (they can't contain '"'). */
export const quoteForCmd = (args) => args.map((a) => (/\s/.test(a) ? `"${a}"` : a));

/**
 * npx's arguments for cmd.exe. The `skills@<range>` spec was already limited
 * to version characters by skillsVersionSpec; it may hold < > | ^, which
 * cmd.exe reads as text inside double quotes, so it is quoted. Every other
 * argument is refused if it holds a shell character.
 */
export function cmdArgs(full) {
  const isSpec = (a) => a.startsWith("skills@");
  const bad = unsafeForWindowsShell(full.filter((a) => !isSpec(a)));
  if (bad.length) throw new Error(`refusing to pass shell characters to cmd.exe: ${bad.join(" ")}`);
  return full.map((a) => (isSpec(a) ? (/[\s<>|^]/.test(a) ? `"${a}"` : a) : quoteForCmd([a])[0]));
}

/**
 * If npm refused the skills CLI because of its release-age rule
 * (min-release-age or before), say so and what to do. <stderr> is npx's.
 */
export function explainReleaseAge(stderr) {
  const m = /No matching version found for (skills@.+?) with a date before (.+?)\.?\s*$/m.exec(stderr ?? "");
  if (!m) return false;
  const [, spec, cutoff] = m;
  const exact = /^skills@(\d+\.\d+\.\d+)$/.exec(spec)?.[1];
  warn(`npm's release-age rule (min-release-age or before) blocked ${spec}: npm only installs versions published before ${cutoff}, and this one is newer.`);
  warn("  - wait until it is old enough ('npm view skills time' shows when each version came out), or");
  warn("  - relax the rule for one run: npm_config_min_release_age=0 aiskills <command>, or");
  warn(
    exact
      ? `  - allow an older, untested skills CLI: AISKILLS_SKILLS_LIB_VERSION='(..., ${exact}]' (npm picks the newest it may)`
      : "  - allow an older, untested skills CLI with a wider AISKILLS_SKILLS_LIB_VERSION range",
  );
  return true;
}

/**
 * Run `npx -y skills@<version> <args...>`; returns the exit code, or with
 * capture { status, stdout, stderr }. npx's stderr is read (and then shown,
 * unless captureStderr) so an npm release-age refusal can be explained;
 * interactive=true leaves it on the terminal (the `skills` passthrough).
 */
export function runSkills(args, { cwd, capture = false, quiet = false, captureStderr = false, timeout, interactive = false } = {}) {
  const win = process.platform === "win32";
  const npx = win ? "npx.cmd" : "npx";
  const full = ["-y", skillsPackageSpec(), ...args];
  const argv = win ? cmdArgs(full) : full;
  if (!quiet) log(`running: npx ${full.map(quote).join(" ")}`);
  const res = spawnSync(npx, argv, {
    stdio: [capture ? "ignore" : "inherit", capture ? "pipe" : "inherit", interactive ? "inherit" : "pipe"],
    encoding: "utf8",
    // The install root may not exist (e.g. after --purge); run from $HOME then.
    cwd: cwd && existsSync(cwd) ? cwd : cwd ? homedir() : process.cwd(),
    shell: process.platform === "win32",
    env: childEnv(),
    maxBuffer: 64 * 1024 * 1024,
    ...(timeout ? { timeout, killSignal: "SIGKILL" } : {}),
  });
  if (res.error) throw res.error;
  const status = res.status ?? 1;
  if (!interactive && !captureStderr && res.stderr) process.stderr.write(res.stderr);
  if (status !== 0) explainReleaseAge(res.stderr);
  return capture ? { status, stdout: res.stdout ?? "", stderr: res.stderr ?? "" } : status;
}

/**
 * Run `npx -y skills add <root> ...`.
 * opts: { global=true, agents=[], skills=['*'], copy=false, list=false, cwd, extra=[] }
 */
export function skillsAdd(root = installRoot(), opts = {}) {
  const { global = true, agents = [], skills = ["*"], copy = false, list = false, cwd, extra = [], dryRun = false } = opts;
  const args = ["add", root];
  if (list) {
    args.push("--list");
  } else {
    if (global) args.push("--global");
    for (const s of skills) args.push("--skill", s);
    for (const a of agents) args.push("--agent", a);
    if (copy) args.push("--copy");
    args.push("--yes");
  }
  args.push(...extra);
  return dryRun ? showDryRun(args) : runSkills(args, { cwd });
}

/** For install -n: print the exact `npx skills` command instead of running it. */
function showDryRun(args) {
  log(`[dry-run] npx -y ${quote(skillsPackageSpec())} ${args.join(" ")}`);
  return 0;
}

/**
 * Ask a yes/no question on the terminal (stderr) and read the answer from
 * stdin. Only `y` or `yes` (any case) is yes; Enter, anything else or end of
 * input is no. Call it only when stdin is a terminal.
 */
export function confirm(question, fd = 0) {
  process.stderr.write(question);
  const buf = Buffer.alloc(1);
  let answer = "";
  for (;;) {
    let n;
    try {
      n = readSync(fd, buf, 0, 1, null);
    } catch (err) {
      if (err.code === "EAGAIN") continue;
      if (err.code === "EOF") break;
      throw err;
    }
    if (!n) break;
    const ch = buf.toString("utf8");
    if (ch === "\n" || ch === "\r") break;
    answer += ch;
  }
  return /^y(es)?$/i.test(answer.trim());
}

// ---------------------------------------------------------------- uninstall

/** Skill names (SKILL.md frontmatter `name:`, else folder name) under <dir>. */
export function skillNamesIn(dir) {
  const names = new Set();
  if (!existsSync(dir)) return names;
  (function walk(d) {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      const p = join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name === "SKILL.md") names.add(readSkillName(p) ?? basename(d));
    }
  })(dir);
  return names;
}

/** All skill names under <root>/skills. */
export function packageSkillNames(root = installRoot()) {
  return skillNamesIn(join(root, "skills"));
}

// ------------------------------------------------------------------- groups

/**
 * Skill groups, taken from <root>/.claude-plugin/marketplace.json: each
 * plugin entry is a group whose skills are the SKILL.md files under its
 * `source` folder (relative to metadata.pluginRoot). Returns
 * { groups: [{ name, alias, description, source, skills: [] }], ungrouped: [] }.
 */
export function loadGroups(root = installRoot()) {
  const file = join(root, MARKETPLACE_REL);
  const all = packageSkillNames(root);
  if (!existsSync(file)) return { groups: [], ungrouped: [...all].sort(), missing: true };
  const market = JSON.parse(readFileSync(file, "utf8"));
  const pluginRoot = resolve(root, market?.metadata?.pluginRoot ?? ".");
  // With layout.json, membership comes from each skill's ORIGINAL nested
  // folder, so groups work whether <root>/skills is flat or nested.
  const map = readJson(join(root, LAYOUT_REL))?.skills;
  const skillsRoot = join(root, "skills");
  const groups = [];
  for (const p of market.plugins ?? []) {
    if (!p?.name || typeof p.source !== "string") continue; // remote sources: not bundled
    const dir = resolve(pluginRoot, p.source);
    const rel = relative(skillsRoot, dir).split(sep).join("/");
    const skills = map
      ? Object.entries(map)
          .filter(([, orig]) => rel === "" || orig === rel || orig.startsWith(rel + "/"))
          .map(([name]) => name)
      : [...skillNamesIn(dir)];
    groups.push({
      name: p.name,
      alias: p.name.replace(/-skills$/, ""),
      description: p.description ?? "",
      source: dir,
      skills: skills.sort(),
    });
  }
  const grouped = new Set(groups.flatMap((g) => g.skills));
  return { groups, ungrouped: [...all].filter((n) => !grouped.has(n)).sort() };
}

// -------------------------------------------------------------------- globs

/** True if <s> uses glob syntax: *, ? or [...]. */
export const isGlob = (s) => /[*?[]/.test(s);

/**
 * Glob -> case-insensitive RegExp matching the whole string.
 *   *      any run of characters (including none)
 *   ?      exactly one character
 *   [abc]  one of a, b, c   ([a-z] ranges, [!abc] / [^abc] negation)
 */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else if (c === "[") {
      const close = glob.indexOf("]", i + 2);
      if (close === -1) {
        re += "\\[";
        continue;
      }
      let body = glob.slice(i + 1, close);
      if (body[0] === "!") body = "^" + body.slice(1);
      re += "[" + body.replace(/\\/g, "\\\\") + "]";
      i = close;
    } else re += c.replace(/[.+^${}()|\\\]\/]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

/**
 * Expand <patterns> against <candidates>. Literals are matched
 * case-insensitively and returned in their canonical spelling; a literal with
 * no match is reported in `unknown`. A glob that matches nothing is reported
 * in `empty`. Returns { matched: Set, literals: Set, unknown: [], empty: [] }.
 */
export function expandPatterns(patterns, candidates) {
  const list = [...candidates];
  const matched = new Set();
  const literals = new Set();
  const unknown = [];
  const empty = [];
  for (const p of patterns) {
    if (isGlob(p)) {
      const re = globToRegExp(p);
      const hits = list.filter((c) => re.test(c));
      if (!hits.length) empty.push(p);
      hits.forEach((h) => matched.add(h));
    } else {
      const hit = list.find((c) => c.toLowerCase() === p.toLowerCase());
      if (hit) {
        matched.add(hit);
        literals.add(hit);
      } else {
        unknown.push(p);
        literals.add(p);
      }
    }
  }
  return { matched, literals, unknown, empty };
}

// ---------------------------------------------------------- group selection

/**
 * Expand group names/aliases/globs into skill names. "all" (or a glob that
 * matches a group) works too; every entry must match at least one group.
 */
export function skillsForGroups(patterns, root = installRoot()) {
  const { groups, missing } = loadGroups(root);
  if (missing) throw new Error(`no ${MARKETPLACE_REL} in ${root}; run 'aiskills sync' first`);
  const out = new Set();
  const bad = [];
  for (const p of patterns) {
    if (p.toLowerCase() === "all" || p === "*") {
      packageSkillNames(root).forEach((s) => out.add(s));
      continue;
    }
    const re = isGlob(p) ? globToRegExp(p) : null;
    const hits = groups.filter((g) =>
      re ? re.test(g.name) || re.test(g.alias) : [g.name, g.alias].some((n) => n.toLowerCase() === p.toLowerCase()),
    );
    if (!hits.length) bad.push(p);
    hits.forEach((g) => g.skills.forEach((s) => out.add(s)));
  }
  if (bad.length) {
    throw new Error(
      `no group matches: ${bad.join(", ")}\n` +
        `  available: ${groups.map((g) => `${g.name} (${g.alias})`).join(", ")}, all\n` +
        `  see 'aiskills groups'`,
    );
  }
  return [...out].sort();
}

/**
 * Final skill list from opts.skills (names/globs) + opts.groups (names/
 * aliases/globs), expanded against <universe> (default: the package's
 * skills). Returns null for "everything" (nothing given, or -s '*').
 * Otherwise returns { names: [...], literals: Set, unknown: [] } where
 * `unknown` holds literal skill names not in the universe.
 */
export function selectedSkills(opts, root = installRoot(), universe = packageSkillNames(root)) {
  const skills = opts.skills ?? [];
  const groups = opts.groups ?? [];
  if (skills.includes("*")) return null;
  if (!skills.length && !groups.length) return null;
  const { matched, literals, unknown, empty } = expandPatterns(skills, universe);
  if (empty.length) {
    throw new Error(
      `no skill matches: ${empty.join(", ")}\n  available: ${[...universe].sort().join(", ") || "(none)"}`,
    );
  }
  const fromGroups = groups.length ? skillsForGroups(groups, root) : [];
  const names = new Set([...matched, ...unknown, ...fromGroups]);
  return { names: [...names].sort(), literals, unknown };
}

// ------------------------------------------------------------------- agents

let agentCache;
/**
 * Agent ids accepted by `npx skills --agent`, read from the CLI itself: an
 * unknown agent makes `skills add <empty dir> --list` print "Valid agents:"
 * without installing anything.
 */
export function knownAgents() {
  if (agentCache) return agentCache;
  const empty = mkdtempSync(join(tmpdir(), "aiskills-probe-"));
  try {
    const { stdout, stderr } = runSkills(["add", empty, "--list", "--agent", "__aiskills_probe__"], {
      cwd: empty,
      capture: true,
      captureStderr: true,
      quiet: true,
    });
    const text = (stdout + "\n" + stderr).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
    const m = /Valid agents:\s*([^\n]+)/.exec(text);
    if (!m) throw new Error("could not read the agent list from 'npx skills'");
    agentCache = m[1].split(",").map((a) => a.trim()).filter(Boolean);
    return agentCache;
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
}

/**
 * Expand agent globs (e.g. 'claude*', 'codex,cursor', 'qoder*') into agent ids.
 * A lone '*' and plain names are passed through untouched ('npx skills'
 * understands '*' and validates names itself).
 */
export function expandAgents(patterns) {
  if (!patterns?.length || !patterns.some((p) => p !== "*" && isGlob(p))) return patterns ?? [];
  if (patterns.includes("*")) return ["*"];
  const { matched, unknown, empty } = expandPatterns(patterns, knownAgents());
  if (empty.length) {
    throw new Error(`no agent matches: ${empty.join(", ")}\n  valid agents: ${knownAgents().join(", ")}`);
  }
  const out = [...matched, ...unknown];
  log(`agents: ${out.join(", ")}`);
  return out;
}

/**
 * Skills that `npx skills list` reports as installed from <root>.
 * Returns null if the list could not be read.
 */
export function installedFromRoot(root = installRoot(), opts = {}) {
  const rows = listInstalled(opts);
  if (!rows) return null;
  return rows.filter((r) => isFromRoot(r, root));
}

/** True if an `npx skills list --json` row was installed from <root>. */
export function isFromRoot(row, root = installRoot()) {
  return row.sourceType === "local" && !!row.source && resolve(row.source) === resolve(root);
}

/** Every skill `npx skills list --json` reports (any source); null on error. */
export function listInstalled({ global = true, cwd } = {}) {
  const args = ["list", "--json"];
  if (global) args.push("--global");
  const { status, stdout } = runSkills(args, { cwd, capture: true, quiet: true });
  if (status !== 0) return null;
  try {
    return JSON.parse(stdout.slice(stdout.indexOf("[")));
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ routing
//
// With --route, skills that are not in the bundled set are handed to
// `npx skills` instead of being rejected:
//   owner/repo, owner/repo@skill, URLs, paths  -> npx skills add <spec>
//   a bare name                                -> npx skills find <name>,
//                                                 then npx skills add <source>@<name>

/** True if <entry> is a source spec for `npx skills add` rather than a bare skill name. */
export const isSourceSpec = (entry) => /[/\\:]/.test(entry) || entry.startsWith("~") || entry.startsWith(".");

/** Skill name a source spec / bare name refers to, for uninstall. */
export function specSkillName(entry) {
  if (!isSourceSpec(entry)) return entry;
  const at = entry.lastIndexOf("@");
  return at > 0 && !entry.slice(at).includes("/") ? entry.slice(at + 1) : null;
}

const stripAnsi = (t) => t.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

/**
 * Look a skill up on the skills registry via `npx skills find <name>`.
 * Returns [{ spec: "owner/repo@name", source, name, installs }].
 */
const SAFE_PART = "[A-Za-z0-9][A-Za-z0-9._-]*";
const SAFE_REGISTRY_SPEC = new RegExp(`^${SAFE_PART}/${SAFE_PART}@${SAFE_PART}$`);

/** True for an owner/repo@skill made only of letters, digits, '.', '_' and '-'. */
export const isSafeRegistrySpec = (spec) => SAFE_REGISTRY_SPEC.test(spec);

/**
 * Look a skill up on the skills registry via `npx skills find <name>`.
 * Registry text is untrusted: only results that pass isSafeRegistrySpec are
 * returned; the rest are listed in `unsafe`.
 * Returns { hits: [{ spec, source, name, installs }], unsafe: [spec] }.
 */
export function findSkill(query) {
  const { stdout } = runSkills(["find", query], { capture: true, quiet: true });
  const hits = [];
  const unsafe = [];
  for (const line of stripAnsi(stdout).split(/\r?\n/)) {
    const m = /^\s*(\S+)@([^\s@]+)(?:\s+(.*))?$/.exec(line);
    if (!m || !m[1].includes("/")) continue;
    const spec = `${m[1]}@${m[2]}`;
    if (isSafeRegistrySpec(spec)) hits.push({ spec, source: m[1], name: m[2], installs: (m[3] ?? "").trim() });
    else unsafe.push(spec);
  }
  return { hits, unsafe };
}

/**
 * Turn the entries that aren't bundled into `npx skills add` specs.
 * A bare name must have exactly one exact-name match in `npx skills find`;
 * otherwise this throws with the candidates so the user can pin
 * owner/repo@skill. Returns [{ entry, spec, installs, lookedUp }]; `lookedUp`
 * is false for entries given as a source (owner/repo@skill, URL, path), which
 * the user named exactly, and true for names the registry lookup chose.
 */
export function resolveExternal(entries) {
  const resolved = [];
  const problems = [];
  for (const entry of entries) {
    if (isSourceSpec(entry)) {
      resolved.push({ entry, spec: entry, lookedUp: false });
      continue;
    }
    log(`'${entry}' is not bundled; looking it up with 'npx skills find ${entry}' ...`);
    const { hits, unsafe } = findSkill(entry);
    if (unsafe.length) {
      warn(`ignored ${unsafe.length} registry result(s) with unsafe characters: ${unsafe.map((u) => JSON.stringify(u)).join(", ")}`);
    }
    const exact = hits.filter((h) => h.name.toLowerCase() === entry.toLowerCase());
    const show = (list) => list.slice(0, 10).map((h) => `    ${h.spec}${h.installs ? `  (${h.installs})` : ""}`).join("\n");
    if (exact.length === 1) {
      log(`found ${exact[0].spec}`);
      resolved.push({ entry, spec: exact[0].spec, installs: exact[0].installs, lookedUp: true });
    } else if (exact.length > 1) {
      problems.push(`'${entry}' matches several skills; pick one with -s <owner/repo@skill>:\n${show(exact)}`);
    } else if (hits.length) {
      problems.push(`no skill named exactly '${entry}'; closest results:\n${show(hits)}`);
    } else {
      problems.push(`no skill named '${entry}' found by 'npx skills find'`);
    }
  }
  if (problems.length) throw new Error(problems.join("\n"));
  return resolved;
}

/** `npx skills add <spec> [--global] [--agent a] [--copy] --yes`. */
export function skillsAddExternal(spec, { global = true, agents = [], copy = false, cwd, extra = [], dryRun = false } = {}) {
  const args = ["add", spec];
  if (global) args.push("--global");
  for (const a of agents) args.push("--agent", a);
  if (copy) args.push("--copy");
  args.push("--yes", ...extra);
  return dryRun ? showDryRun(args) : runSkills(args, { cwd });
}

/**
 * Run `npx -y skills remove <names...> [--global] [--agent a] --yes`.
 * opts: { global=true, agents=[], cwd, extra=[] }
 */
export function skillsRemove(names, opts = {}) {
  const { global = true, agents = [], cwd, extra = [] } = opts;
  const args = ["remove", ...names];
  if (global) args.push("--global");
  for (const a of agents) args.push("--agent", a);
  args.push("--yes", ...extra);
  return runSkills(args, { cwd });
}

// ------------------------------------------------------- skills.sh count

// `npx skills add <local folder>` sends skills.sh no install event (only
// GitHub sources are counted), so installs through aiskills never showed up
// there. After a successful install, aiskills runs the real CLI once more
// against the GitHub repo, as a throwaway project install in a temp folder;
// that run sends skills.sh its usual event (after checking with
// api.github.com that the repo is public). Nothing it installs is kept.
// Without access to github.com the clone fails and nothing is counted or shown.

/** The GitHub repo the bundled skills come from (package.json "repository"). */
export const STATS_SOURCE = "sugatoray/aiskills";
// Long enough for a shallow clone on a slow line; then the count is dropped.
const STATS_TIMEOUT_MS = 120_000;
const TRUE = /^(1|true|yes|on)$/i;
const FALSE = /^(0|false|no|off)$/i;

/**
 * Whether `aiskills install` adds the install to the skills.sh count:
 * --stats / --no-stats, then AISKILLS_STATS, then the choice remembered in
 * <root>/aiskills.json, then on. DO_NOT_TRACK, DISABLE_TELEMETRY (which the
 * skills CLI honours too) and CI (CI, GITHUB_ACTIONS) always turn it off.
 */
export function resolveStats(explicit, root = installRoot()) {
  const e = process.env;
  if (e.DO_NOT_TRACK || e.DISABLE_TELEMETRY || e.CI || e.GITHUB_ACTIONS) return false;
  if (typeof explicit === "boolean") return explicit;
  const v = e.AISKILLS_STATS?.trim();
  if (v) {
    if (TRUE.test(v)) return true;
    if (FALSE.test(v)) return false;
    throw new Error(`AISKILLS_STATS must be 1 or 0 (or true/false, yes/no, on/off); got '${v}'`);
  }
  const saved = readJson(join(root, "aiskills.json"))?.stats;
  return typeof saved === "boolean" ? saved : true;
}

/** The `npx skills` arguments of the counted install (agents: the user's -a, else "universal"). */
export function statsArgs(skills, agents = []) {
  const args = ["add", STATS_SOURCE];
  for (const s of skills) args.push("--skill", s);
  for (const a of agents.length ? agents : ["universal"]) args.push("--agent", a);
  return [...args, "--copy", "--yes"];
}

/**
 * Add an install of <skills> to the skills.sh count: with dryRun, only show
 * the command; otherwise run it in a new temp folder, in the background
 * (AISKILLS_STATS_FOREGROUND=1: wait for it and show its output). Never
 * fails and never changes the exit status.
 */
export function countInstall(skills, { agents = [], dryRun = false } = {}) {
  const args = statsArgs(skills, agents);
  if (dryRun) {
    log(`[dry-run] skills.sh count: npx -y ${quote(skillsPackageSpec())} ${args.join(" ")} (in a temp folder; turn off: --no-stats)`);
    return;
  }
  log("adding this install to the skills.sh count in the background (turn off: --no-stats)");
  try {
    const dir = mkdtempSync(join(tmpdir(), "aiskills-stats-"));
    if (TRUE.test(process.env.AISKILLS_STATS_FOREGROUND ?? "")) return runCount(dir, args, { quiet: false });
    // A detached node process outlives this one, so the install returns at once.
    const code = `import(${JSON.stringify(import.meta.url)}).then((m) => m.runCount(...JSON.parse(process.argv[1])))`;
    const child = spawn(process.execPath, ["--input-type=module", "-e", code, JSON.stringify([dir, args])], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: childEnv(),
    });
    child.on("error", () => rmSync(dir, { recursive: true, force: true }));
    child.unref();
  } catch {
    // Counting is best effort.
  }
}

/** Run the counted install in <dir>, then delete <dir>; errors are swallowed. */
export function runCount(dir, args, { quiet = true } = {}) {
  try {
    runSkills(args, { cwd: dir, quiet, capture: quiet, captureStderr: quiet, timeout: STATS_TIMEOUT_MS });
  } catch {
    // github.com unreachable, timed out, npx missing: nothing to count.
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Delete <root> (the ~/.config/sugatoray/aiskills folder). */
/**
 * Throws unless <root> is safe to replace or delete: missing, empty, or an
 * aiskills install folder (has our aiskills.json). Protects against an
 * AISKILLS_HOME that points at a folder holding anything else.
 */
export function assertInstallFolder(root = installRoot()) {
  if (!existsSync(root)) return;
  if (readdirSync(root).length === 0) return;
  if (readJson(join(root, "aiskills.json"))?.package === "@sugatoray-ai/aiskills") return;
  throw new Error(
    `${root} is not an aiskills folder (it has other files but no aiskills.json), so it won't be replaced or deleted.\n` +
      `  Point AISKILLS_HOME at a new or empty folder instead.`,
  );
}

export function purgeRoot(root = installRoot()) {
  assertInstallFolder(root);
  rmSync(root, { recursive: true, force: true });
  log(`deleted ${root}`);
}

const csv = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** Options for skillsAdd() taken from AISKILLS_* environment variables. */
export function envOptions() {
  const e = process.env;
  return {
    global: (e.AISKILLS_SCOPE || "global").toLowerCase() !== "project",
    agents: csv(e.AISKILLS_AGENTS),
    skills: csv(e.AISKILLS_SKILLS),
    groups: csv(e.AISKILLS_GROUPS),
    copy: /^(1|true|yes)$/i.test(e.AISKILLS_COPY || ""),
    route: /^(1|true|yes)$/i.test(e.AISKILLS_ROUTE || ""),
    layout: undefined, // --nested / --flat; AISKILLS_LAYOUT is read by resolveLayout()
  };
}
