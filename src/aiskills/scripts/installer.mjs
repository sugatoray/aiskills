// Shared logic for the postinstall hook and the `aiskills` CLI.
//
// 1. Copy the vendored <package>/skills folder to
//    ~/.config/sugatoray/aiskills/skills (replacing any previous copy).
// 2. Run `npx skills add ~/.config/sugatoray/aiskills ...` so the skills
//    are registered with the user's agents (Claude Code, Codex, ...).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const PKG_SKILLS = join(PKG_DIR, "skills");
export const MARKETPLACE_REL = join(".claude-plugin", "marketplace.json");

/** ~/.config/sugatoray/aiskills (override with AISKILLS_HOME). */
export function installRoot() {
  return process.env.AISKILLS_HOME
    ? resolve(process.env.AISKILLS_HOME)
    : join(homedir(), ".config", "sugatoray", "aiskills");
}

export const log = (...a) => console.log("[aiskills]", ...a);
export const warn = (...a) => console.warn("[aiskills]", ...a);

// Reverse of the renames done by scripts/vendor-skills.mjs.
const DOTFILES = { _gitignore: ".gitignore", _npmignore: ".npmignore" };
function restoreDotfiles(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) restoreDotfiles(p);
    else if (DOTFILES[ent.name]) renameSync(p, join(dir, DOTFILES[ent.name]));
  }
}

/** Copy <package>/skills -> <installRoot>/skills, atomically-ish. */
export function syncSkills({ root = installRoot(), version, quiet = false } = {}) {
  if (!existsSync(PKG_SKILLS)) {
    throw new Error(`no vendored skills folder at ${PKG_SKILLS}`);
  }
  mkdirSync(root, { recursive: true });
  const dest = join(root, "skills");
  const staging = join(root, `.skills.tmp-${process.pid}`);
  rmSync(staging, { recursive: true, force: true });
  cpSync(PKG_SKILLS, staging, { recursive: true });
  restoreDotfiles(staging);
  rmSync(dest, { recursive: true, force: true });
  renameSync(staging, dest);
  // Keep the repo layout: <root>/.claude-plugin/marketplace.json next to
  // <root>/skills. Only used for grouping (`--group`); `npx skills add`
  // discovers the same skills with or without it.
  const market = join(root, MARKETPLACE_REL);
  rmSync(market, { force: true });
  if (existsSync(join(PKG_DIR, MARKETPLACE_REL))) {
    mkdirSync(dirname(market), { recursive: true });
    cpSync(join(PKG_DIR, MARKETPLACE_REL), market);
  }
  writeFileSync(
    join(root, "aiskills.json"),
    JSON.stringify(
      { package: "@sugatoray-ai/aiskills", version, installedAt: new Date().toISOString(), skills: dest },
      null,
      2,
    ) + "\n",
  );
  if (!quiet) log(`skills saved to ${dest}`);
  return root;
}

// Inside an npm lifecycle script (postinstall) npm exports npm_config_global,
// npm_config_prefix, npm_lifecycle_* etc. Passing those on makes the nested
// `npx` resolve into the wrong prefix ("skills: not found"). Keep only the
// settings that describe how to reach the registry.
const KEEP_NPM_CONFIG = /^npm_config_(registry|cache|userconfig|globalconfig|https?_proxy|proxy|noproxy|no_proxy|cafile|ca|strict_ssl|@.*:registry|\/\/.*)$/i;
function childEnv() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^npm_/i.test(k) && !KEEP_NPM_CONFIG.test(k)) continue;
    env[k] = v;
  }
  return env;
}

const quote = (a) => (/[\s*'"]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a);

/**
 * Run `npx -y skills <args...>` with inherited stdio; returns the exit code.
 * opts: { cwd, capture=false } — capture returns { status, stdout } instead.
 */
export function runSkills(args, { cwd, capture = false, quiet = false, captureStderr = false } = {}) {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const full = ["-y", "skills", ...args];
  if (!quiet) log(`running: npx ${full.map(quote).join(" ")}`);
  const res = spawnSync(npx, full, {
    stdio: capture ? ["ignore", "pipe", captureStderr ? "pipe" : "inherit"] : "inherit",
    encoding: "utf8",
    // The install root may not exist (e.g. after --purge); run from $HOME then.
    cwd: cwd && existsSync(cwd) ? cwd : cwd ? homedir() : process.cwd(),
    shell: process.platform === "win32",
    env: childEnv(),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  const status = res.status ?? 1;
  return capture ? { status, stdout: res.stdout ?? "", stderr: res.stderr ?? "" } : status;
}

/**
 * Run `npx -y skills add <root> ...`.
 * opts: { global=true, agents=[], skills=['*'], copy=false, list=false, cwd, extra=[] }
 */
export function skillsAdd(root = installRoot(), opts = {}) {
  const { global = true, agents = [], skills = ["*"], copy = false, list = false, cwd, extra = [] } = opts;
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
  return runSkills(args, { cwd });
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
      else if (ent.name === "SKILL.md") {
        const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(p, "utf8"));
        const m = fm && /^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(fm[1]);
        names.add(m ? m[1].trim() : basename(d));
      }
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
  const groups = [];
  for (const p of market.plugins ?? []) {
    if (!p?.name || typeof p.source !== "string") continue; // remote sources: not bundled
    const dir = resolve(pluginRoot, p.source);
    groups.push({
      name: p.name,
      alias: p.name.replace(/-skills$/, ""),
      description: p.description ?? "",
      source: dir,
      skills: [...skillNamesIn(dir)].sort(),
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
export function installedFromRoot(root = installRoot(), { global = true, cwd } = {}) {
  const args = ["list", "--json"];
  if (global) args.push("--global");
  const { status, stdout } = runSkills(args, { cwd, capture: true, quiet: true });
  if (status !== 0) return null;
  try {
    const start = stdout.indexOf("[");
    const rows = JSON.parse(stdout.slice(start));
    const want = resolve(root);
    return rows.filter((r) => r.source && resolve(r.source) === want);
  } catch {
    return null;
  }
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

/** Delete <root> (the ~/.config/sugatoray/aiskills folder). */
export function purgeRoot(root = installRoot()) {
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
  };
}
