// `aiskills upgrade`: replace the globally installed package with a newer
// (or a chosen) version, then re-add the skills installed from the install
// folder, for the same agents, with the new code. Everything here but
// npmGlobalRoot() and runInstall() is pure, so it can be unit-tested
// (src/test/upgrade.test.mjs).

import { spawnSync } from "node:child_process";
import { dirname, join, resolve, sep } from "node:path";

import { childEnv, explainReleaseAge, isFromRoot } from "./installer.mjs";
import { compareVersions } from "./releases.mjs";

export const PKG = "@sugatoray-ai/aiskills";
const PKG_PARTS = PKG.split("/");

// ------------------------------------------------------------- detection

/**
 * How this copy of aiskills was installed, from where its files are:
 *   { method: "npm"|"pnpm"|"bun"|"yarn", global: true, globalRoot, entry }
 *   { method: "npx"|"project"|"source", global: false }
 * `entry` is the bin script at the package manager's global path, which
 * survives an upgrade (pnpm's real folder has the version in its name).
 */
export function detectInstall(pkgDir, { npmGlobalRoot } = {}) {
  const p = pkgDir.split(sep).join("/");
  const global = (method, globalRoot) => ({ method, global: true, globalRoot, entry: join(globalRoot, ...PKG_PARTS, "bin", "aiskills.mjs") });
  const above = () => dirname(dirname(pkgDir)); // <root>/@sugatoray-ai/aiskills -> <root>
  if (p.includes("/_npx/")) return { method: "npx", global: false };
  if (/\/pnpm\/global\//i.test(p)) {
    const i = pkgDir.indexOf(`${sep}.pnpm${sep}`);
    return global("pnpm", i >= 0 ? pkgDir.slice(0, i) : above());
  }
  if (p.includes("/.bun/install/global/node_modules/")) return global("bun", above());
  if (/\/yarn\/(data\/)?global\/node_modules\//i.test(p)) return global("yarn", above());
  if (npmGlobalRoot && resolve(pkgDir) === resolve(npmGlobalRoot, ...PKG_PARTS)) return global("npm", npmGlobalRoot);
  if (p.includes("/node_modules/")) return { method: "project", global: false };
  return { method: "source", global: false };
}

/** The global install command of each package manager, as [command, args]. */
export function installCommand(pm, spec) {
  return {
    npm: ["npm", ["install", "-g", spec]],
    pnpm: ["pnpm", ["add", "-g", spec]],
    bun: ["bun", ["add", "-g", spec]],
    yarn: ["yarn", ["global", "add", spec]],
  }[pm];
}

/** What to tell someone whose aiskills can't upgrade itself. */
export const HOW_TO_UPGRADE = {
  npx: `you're running aiskills through npx, which fetches it each time: run 'npx ${PKG}@latest install' to use the latest`,
  project: `aiskills is a dependency of this project, pinned by its lockfile: run 'npm install -D ${PKG}@latest' (or your package manager's equivalent)`,
  source: `aiskills is running from a source checkout, not an installed package: update the checkout (git pull), or install it with 'npm install -g ${PKG}'`,
};

// ---------------------------------------------------------------- target

/**
 * The version to install: `latest`, or the tag or version asked for.
 * change: "upgrade", "downgrade" or "none" (already installed).
 */
export function pickTarget({ distTags = {}, versions = [] }, installed, requested, pkg = PKG) {
  let target;
  let tag = null;
  if (requested === undefined) {
    tag = "latest";
    target = distTags.latest;
    if (!target) throw new Error(`the registry reports no latest version of ${pkg}`);
  } else if (distTags[requested]) {
    tag = requested;
    target = distTags[requested];
  } else if (versions.includes(requested)) {
    target = requested;
  } else {
    throw new Error(`no version or tag '${requested}' of ${pkg} on the registry (see: aiskills releases all)`);
  }
  const c = compareVersions(target, installed);
  return { target, tag, change: c > 0 ? "upgrade" : c < 0 ? "downgrade" : "none" };
}

// ---------------------------------------------------------------- agents

const dashed = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Map the display names `npx skills list --json` reports ("Claude Code") to
 * the ids `--agent` takes ("claude-code"): an exact match once lowercased
 * and dashed, then one without punctuation ("AiderDesk" = aider-desk), then
 * the longest id the name starts or ends with ("Kilo Code" = kilo, "IBM Bob" = bob).
 * Names matching none are returned in `unknown`, never guessed.
 */
export function agentIds(names, known) {
  const ids = [];
  const unknown = [];
  for (const name of names) {
    let id = known.find((k) => k === dashed(name)) ?? known.find((k) => compact(k) === compact(name));
    if (!id) {
      const c = compact(name);
      id = known
        .filter((k) => compact(k) && (c.startsWith(compact(k)) || c.endsWith(compact(k))))
        .sort((a, b) => compact(b).length - compact(a).length)[0];
    }
    if (!id) unknown.push(name);
    else if (!ids.includes(id)) ids.push(id);
  }
  return { ids, unknown };
}

/**
 * From `npx skills list --json` rows: the skills installed from <root>,
 * grouped by the agents they're installed for, ready for one
 * `aiskills install -s ... -a ...` per group.
 */
export function refreshPlan(rows, root, known) {
  const ours = rows.filter((r) => isFromRoot(r, root));
  const groups = new Map();
  const unknownAgents = [];
  for (const r of ours) {
    const { ids, unknown } = agentIds(r.agents ?? [], known);
    for (const u of unknown) if (!unknownAgents.includes(u)) unknownAgents.push(u);
    if (!ids.length) continue;
    const agents = [...ids].sort();
    const key = agents.join(",");
    if (!groups.has(key)) groups.set(key, { skills: [], agents });
    groups.get(key).skills.push(r.name);
  }
  return {
    groups: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => ({ ...g, skills: g.skills.sort() })),
    installed: ours.map((r) => r.name).sort(),
    unknownAgents,
  };
}

// --------------------------------------------------------------- running

/** `npm root -g` (where npm puts global packages), or null. */
export function npmGlobalRoot() {
  const win = process.platform === "win32";
  const res = spawnSync(win ? "npm.cmd" : "npm", ["root", "-g"], { encoding: "utf8", env: childEnv(), shell: win, timeout: 30_000 });
  const out = res.status === 0 ? (res.stdout ?? "").trim() : "";
  return out || null;
}

/**
 * Run the package manager's global install, showing its output. Returns the
 * exit code; on failure explains npm's release-age refusal or a permission error.
 */
export function runInstall(cmd, args) {
  const win = process.platform === "win32";
  const res = spawnSync(win ? `${cmd}.cmd` : cmd, args, {
    stdio: ["inherit", "inherit", "pipe"],
    encoding: "utf8",
    env: childEnv(),
    shell: win,
  });
  if (res.error) throw new Error(`could not run ${cmd}: ${res.error.message}`);
  if (res.stderr) process.stderr.write(res.stderr);
  const status = res.status ?? 1;
  if (status !== 0) {
    if (/EACCES|permission denied/i.test(res.stderr ?? "")) {
      console.error(
        `[aiskills] ${cmd} has no permission to write its global folder. Don't use sudo; give npm a folder you own:\n` +
          `  npm config set prefix ~/.npm-global   (then add ~/.npm-global/bin to PATH and install aiskills again)`,
      );
    } else explainReleaseAge(res.stderr);
  }
  return status;
}
