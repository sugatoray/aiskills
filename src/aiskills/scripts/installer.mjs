// Shared logic for the postinstall hook and the `aiskills` CLI.
//
// 1. Copy the vendored <package>/skills folder to
//    ~/.config/sugatoray/aiskills/skills (replacing any previous copy).
// 2. Run `npx skills add ~/.config/sugatoray/aiskills ...` so the skills
//    are registered with the user's agents (Claude Code, Codex, ...).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
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
export function runSkills(args, { cwd, capture = false, quiet = false } = {}) {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const full = ["-y", "skills", ...args];
  if (!quiet) log(`running: npx ${full.map(quote).join(" ")}`);
  const res = spawnSync(npx, full, {
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
    // The install root may not exist (e.g. after --purge); run from $HOME then.
    cwd: cwd && existsSync(cwd) ? cwd : cwd ? homedir() : process.cwd(),
    shell: process.platform === "win32",
    env: childEnv(),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  const status = res.status ?? 1;
  return capture ? { status, stdout: res.stdout ?? "" } : status;
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

/**
 * Expand group names (exact plugin name, or without the "-skills" suffix,
 * case-insensitive; "all" = every skill) into skill names.
 */
export function skillsForGroups(names, root = installRoot()) {
  const { groups, missing } = loadGroups(root);
  if (missing) throw new Error(`no ${MARKETPLACE_REL} in ${root}; run 'aiskills sync' first`);
  const out = new Set();
  const unknown = [];
  for (const raw of names) {
    const n = raw.toLowerCase();
    if (n === "all") {
      packageSkillNames(root).forEach((s) => out.add(s));
      continue;
    }
    const g = groups.find((x) => x.name.toLowerCase() === n || x.alias.toLowerCase() === n);
    if (g) g.skills.forEach((s) => out.add(s));
    else unknown.push(raw);
  }
  if (unknown.length) {
    throw new Error(
      `unknown group(s): ${unknown.join(", ")}\n` +
        `  available: ${groups.map((g) => `${g.name} (${g.alias})`).join(", ")}, all\n` +
        `  see 'aiskills groups'`,
    );
  }
  return [...out].sort();
}

/**
 * Final skill list for install/uninstall from opts.skills (+ opts.groups).
 * Returns null for "everything" (no -s/-G given, or -s '*').
 */
export function selectedSkills(opts, root = installRoot()) {
  const explicit = (opts.skills ?? []).filter((s) => s !== "*");
  const wantAll = (opts.skills ?? []).includes("*") && !(opts.groups ?? []).length && !explicit.length;
  if (wantAll || (!explicit.length && !(opts.groups ?? []).length)) return null;
  const fromGroups = (opts.groups ?? []).length ? skillsForGroups(opts.groups, root) : [];
  return [...new Set([...explicit, ...fromGroups])].sort();
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
    skills: csv(e.AISKILLS_SKILLS).length ? csv(e.AISKILLS_SKILLS) : ["*"],
    groups: csv(e.AISKILLS_GROUPS),
    copy: /^(1|true|yes)$/i.test(e.AISKILLS_COPY || ""),
  };
}
