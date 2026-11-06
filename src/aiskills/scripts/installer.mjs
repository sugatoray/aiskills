// Shared logic for the postinstall hook and the `aiskills` CLI.
//
// 1. Copy the vendored <package>/skills folder to
//    ~/.config/sugatoray/aiskills/skills (replacing any previous copy).
// 2. Run `npx skills add ~/.config/sugatoray/aiskills ...` so the skills
//    are registered with the user's agents (Claude Code, Codex, ...).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const PKG_SKILLS = join(PKG_DIR, "skills");

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
export function syncSkills({ root = installRoot(), version } = {}) {
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
  writeFileSync(
    join(root, "aiskills.json"),
    JSON.stringify(
      { package: "@sugatoray-ai/aiskills", version, installedAt: new Date().toISOString(), skills: dest },
      null,
      2,
    ) + "\n",
  );
  log(`skills saved to ${dest}`);
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

/**
 * Run `npx -y skills add <root> ...`.
 * opts: { global=true, agents=[], skills=['*'], copy=false, list=false, cwd, extra=[] }
 */
export function skillsAdd(root = installRoot(), opts = {}) {
  const { global = true, agents = [], skills = ["*"], copy = false, list = false, cwd, extra = [] } = opts;
  const args = ["-y", "skills", "add", root];
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

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  log(`running: npx ${args.map((a) => (/[\s*]/.test(a) ? `'${a}'` : a)).join(" ")}`);
  const res = spawnSync(npx, args, {
    stdio: "inherit",
    cwd: cwd ?? process.cwd(),
    shell: process.platform === "win32",
    env: childEnv(),
  });
  if (res.error) throw res.error;
  return res.status ?? 1;
}

const csv = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** Options for skillsAdd() taken from AISKILLS_* environment variables. */
export function envOptions() {
  const e = process.env;
  return {
    global: (e.AISKILLS_SCOPE || "global").toLowerCase() !== "project",
    agents: csv(e.AISKILLS_AGENTS),
    skills: csv(e.AISKILLS_SKILLS).length ? csv(e.AISKILLS_SKILLS) : ["*"],
    copy: /^(1|true|yes)$/i.test(e.AISKILLS_COPY || ""),
  };
}
