// The `aiskills` command-line interface. bin/aiskills.mjs is the entry point.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  PKG_DIR,
  envOptions,
  expandAgents,
  assertInstallFolder,
  installRoot,
  installedFromRoot,
  isFromRoot,
  lastSelectedAgents,
  listInstalled,
  confirm,
  knownAgents,
  countInstall,
  resolveExternal,
  skillsAddExternal,
  specSkillName,
  loadGroups,
  log,
  packageSkillNames,
  purgeRoot,
  quote,
  resolveStats,
  STATS_SOURCE,
  SKILLS_CLI_VERSION,
  runSkills,
  selectedSkills,
  skillsAdd,
  skillsLockPath,
  skillsPackageSpec,
  skillsRemove,
  syncSkills,
  warn,
  SKILLS_LIB_VERSION_VAR,
  readJson,
  resolveLayout,
  skillNamesIn,
  skillsVersionSpec,
} from "./installer.mjs";
import {
  CHANGELOG_URL,
  DEFAULT_COUNT,
  fetchDownloads,
  bucketize,
  npmRegistry,
  npmView,
  parseCount,
  parsePeriod,
  pickBy,
  releaseRows,
  renderReleases,
  renderSeries,
  todayDate,
} from "./releases.mjs";
import { fail, ok, paint, setColorConfig, setColorFlag } from "./colors.mjs";
import { CONFIG_KEYS, assertConfigKey, configFiles, configList, configValue, displayPath, formatConfigValue, parseConfigValue, readConfigFile, writeConfigFile } from "./config.mjs";
import { HOW_TO_UPGRADE, detectInstall, installCommand, npmGlobalRoot, pickTarget, refreshPlan, runInstall } from "./upgrade.mjs";

const { name: PKG_NAME, version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
const ROOT = installRoot();

const HELP = `aiskills ${version} — Sugato Ray's agent skills

Usage: aiskills <command> [options]
       ais <command> [options]     (same as aiskills)
       aix <command> [options]     (same as aiskills --route)

Commands:
  install, i     Save skills to ${ROOT}/skills and run 'npx skills add' on it (default)
  uninstall, r   Remove skills installed from ${ROOT} via 'npx skills remove' (also: rm, remove)
  installed, ls  Show skills currently installed from ${ROOT}
  groups, g      List skill groups (from .claude-plugin/marketplace.json) and their skills
  sync           Only save/refresh the skills folder; do not run 'npx skills add'
  list           List the skills available in the saved folder
  path, p        Print the folder that holds skills/
  info           Show this setup: versions, folders, settings and where each comes from
                 (offline); --full also asks npx skills and npm; --json for scripts
  config         Get and set defaults, like git config: config <key> [<value>], --unset <key>,
                 --list; in ~/.config/sugatoray/aiskills.json (or ./.aiskills.json with --project)
  releases, rel  Show the latest releases on npm (default 5): rel 10, rel all, -L/--last <n|all>
  upgrade        Install the latest aiskills (or <version|tag>) globally, then re-add the
                 installed skills for the same agents with the new version
  find, f <q>    Search the skills registry (= npx skills find <query>)
  skills <args>  Pass <args> straight to 'npx skills'; ':root' is replaced by ${ROOT}
  help, h        Show this help

Scope/selection options (install, uninstall, installed):
  -g, --global           User-level (default)
  -p, --project          Current project instead of user-level
  -a, --agent <names>    Comma-separated agents (e.g. claude-code,codex); default: auto-detect
  -s, --skill <names>    Comma-separated skill names; default: all skills from this package
  -G, --group <names>    Comma-separated skill groups (e.g. scrolls-skills or just scrolls;
                         'all' = everything). Combines with -s. See 'aiskills groups'.
  -s/-G/-a may be repeated; values accumulate.
  -s/-G/-a accept glob patterns: * (any text), ? (one character), [abc] / [a-z] / [!a]
  (one of / range / not). Matching ignores case. A pattern that matches nothing is an
  error. Quote patterns so your shell doesn't expand them: -s 'scrolls-*'.

Routing (install, uninstall, installed; may also go before the command):
      --route            Hand skills that are NOT bundled to 'npx skills'.
                         The 'aix' command is 'aiskills --route' (e.g. 'aix i -s pdf'):
                           install:   -s <name>             -> npx skills find <name>, then add owner/repo@<name>
                                                                 after you confirm (shows the match first; see -y)
                                      -s owner/repo[@skill] -> npx skills add owner/repo[@skill] (also URLs/paths)
                           uninstall: -s <name|pattern>     -> also matches skills from other sources
                           installed: lists every installed skill with its source

Layout of ${ROOT}/skills (install, sync; may also go before the command):
      --flat             skills/<skill>/...          one folder per skill, as the npm package ships it
      --nested           skills/<group>/<skill>/...  the repo's original layout, incl. group READMEs etc.
                         The choice is remembered for later commands; default: flat. Either way,
                         'npx skills add' installs the same skills.

install only:
  -i, --interactive      Let 'npx skills add' ask which skills and agents to install for
                         (its own pickers; agents you picked last time are pre-checked,
                         and it remembers this pick). -s/-G/-a skip the matching picker.
                         Needs a terminal.
  -l, --last-agents      Install for the agents you last picked in 'npx skills add'
                         (its lastSelectedAgents), instead of every detected agent.
                         Combines with -a.
      --copy             Copy files into agent dirs instead of symlinking
      --no-stats         Don't add this install to the skills.sh install count. By default, after
                         installing bundled skills, aiskills runs 'npx skills add ${STATS_SOURCE}' for
                         them in a temp folder, in the background, so skills.sh counts the install
                         (needs github.com; skipped silently without it). Remembered until --stats;
                         also accepted by sync. Always off with DO_NOT_TRACK, DISABLE_TELEMETRY or CI.
      --stats            Count installs on skills.sh again (the default)
  -y, --yes              Install skills that --route found by a registry lookup without asking
                         (needed when there is no terminal to ask in); pinned owner/repo@skill never asks
  -n, --dry-run          Show what would be installed, and the exact commands; install nothing

releases only:
  <n|all>, -L, --last <n|all>  How many releases to show (default ${DEFAULT_COUNT})
      --downloads [period]     Add download counts: a 7-day column per version (the only
                               per-version counts npm keeps), the package total over <period>,
                               and a breakdown. period: all (default), <N><d|w|m|y> (7d, 2w,
                               1m = 30 days, 1y = 365 days), <YYYY-MM-DD>:<YYYY-MM-DD> or <YYYY-MM-DD>:
      --chart                  Show the breakdown as a bar chart (the default)
      --table                  Show the breakdown as a plain table
      --by day|week|month      Row size of the breakdown; default: by the period's length
      --ascii                  Draw the bars with # instead of block characters
  --chart, --table, --by and --ascii imply --downloads.

upgrade only:
  <version|tag>          What to install instead of latest: 0.9.1, next
      --check            Only say whether an upgrade is available; change nothing (exit 0)
      --json             With --check: the result as JSON
      --no-refresh       Upgrade the package only; print how to refresh the skills
  -n, --dry-run          Print what would run; change nothing
  -y, --yes              Allow a downgrade without asking

config only:
  <key>                  Print the value (exit 1 when it isn't set)
  <key> <value>          Set it. Keys: ${Object.keys(CONFIG_KEYS).sort().join(", ")}
      --unset <key>      Remove it
  -l, --list             Every key that is set (the project file wins over the user file)
      --show-origin      With --list: which file each value comes from
      --json             With --list: as JSON
      --global           The user file, ~/.config/sugatoray/aiskills.json (the default for set and unset)
      --project          The project file, ./.aiskills.json
  Order: option > AISKILLS_* variable > project file > user file > remembered > default.

uninstall only:
      --purge            Also delete ${ROOT} (only with a full uninstall)
  -f, --force            Allow -s names that this package does not provide
  -n, --dry-run          Print what would run; change nothing

Output (any command; may also go before the command):
      --color            Color the output even when it isn't a terminal (e.g. piped into less -R)
      --no-color         Never color the output
                         By default the output is colored on a terminal and plain when piped.
                         'skills' and 'find' pass both on to 'npx skills'.

Anything after '--' is appended to the underlying 'npx skills' command.

Examples:
  aiskills groups                             # what groups exist
  aiskills install --group scrolls --global --agent claude-code
  aiskills install -G scrolls,personas -s create-lib-docs -a claude-code,codex
  aiskills install -i                         # pick skills and agents interactively
  aiskills install -l                         # only the agents picked last time (--last-agents)
  aiskills uninstall                          # remove every skill this package installed
  aiskills uninstall -G stata                 # remove one group
  aiskills install -G 'scroll*,d*' -a 'claude*,codex'
  aiskills install -s 'scrolls-*' -a 'cursor,qoder*'
  aiskills uninstall -s 'scrolls-[hu]*'       # scrolls-hide, -unhide, -update
  aiskills --route install -s scrolls-setup,pdf -a claude-code      # bundled + registry lookup
  aiskills install --route -s anthropics/skills@pdf -g              # external, pinned
  aiskills --route uninstall -s pdf                                 # remove an external skill
  aiskills --route installed                                        # bundled + external
  aiskills --nested                                                 # install, keeping the repo's nested folders
  aiskills uninstall -s scrolls-hide,prodigy  # remove just these
  aiskills uninstall -a codex                 # unlink from Codex only
  aiskills uninstall --purge                  # remove all, then delete ${ROOT}
  aiskills config agents claude-code,codex    # always install for these agents
  aiskills config --project layout nested     # in ./.aiskills.json
  aiskills config --list --show-origin        # what is set, and where
  aiskills info                               # this setup, offline
  aiskills rel 10 --downloads 1m              # latest 10 releases, downloads of the last 30 days
  aiskills upgrade --check                    # is there a newer aiskills?
  aiskills upgrade                            # install it, and update the skills your agents have
  aiskills skills list -g                     # = npx skills list -g
  aiskills skills add :root -s prodigy -g -y  # = npx skills add ${ROOT} -s prodigy -g -y

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY
                         Defaults for the options above
  AISKILLS_ROUTE=1              Same as --route
  AISKILLS_LAYOUT=flat|nested   Same as --flat / --nested
  AISKILLS_SKILLS_LIB_VERSION   The skills CLI library version npx runs (default ${SKILLS_CLI_VERSION}, tested): a version,
                                latest, next, an npm range (~1.7.4, 1.7.x) or an interval, where one of
                                "...", "?" or "*" is an open end: [1.7.4, ...) >=1.7.4   (1.7.4, *) >1.7.4
                                [1.7.4, 1.8.0) >=1.7.4 <1.8.0   (..., 1.7.6] <=1.7.6. With a range, npm picks
                                the newest version its rules (e.g. min-release-age) allow.
                                Quote it: AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'
  AISKILLS_STATS=0|1            Same as --no-stats / --stats (not remembered)
  AISKILLS_STATS_FOREGROUND=1   Wait for the skills.sh count and show its output
  NO_COLOR=1                    Same as --no-color
  FORCE_COLOR=1                 Same as --color (NO_COLOR wins if both are set)
`;

/** The help text, its title and section headings bold when colored. */
const helpText = () =>
  HELP.replace(/^[^\n]*/, (title) => paint.out.bold(title)).replace(/^[A-Za-z][^\n]*:$/gm, (h) => paint.out.bold(h));

const split = (v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function parse(argv, allowed) {
  const opts = { ...envOptions(), purge: false, force: false, dryRun: false, yes: false, json: false };
  // Values from the command line replace the env defaults, then accumulate.
  const seen = new Set();
  const add = (key, v) => {
    if (!seen.has(key)) opts[key] = [];
    seen.add(key);
    opts[key].push(...split(v));
  };
  const passIdx = argv.indexOf("--");
  const extra = passIdx >= 0 ? argv.slice(passIdx + 1) : [];
  const args = passIdx >= 0 ? argv.slice(0, passIdx) : argv;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const ok = (name) => {
      if (!allowed.includes(name)) throw new Error(`option ${a} is not valid here`);
      return true;
    };
    if ((a === "-p" || a === "--project") && ok("scope")) opts.global = false;
    else if ((a === "-g" || a === "--global") && ok("scope")) opts.global = true;
    else if ((a === "-a" || a === "--agent") && ok("agent")) add("agents", args[++i]);
    else if ((a === "-s" || a === "--skill") && ok("skill")) add("skills", args[++i]);
    else if ((a === "-G" || a === "--group" || a === "--groups") && ok("group")) add("groups", args[++i]);
    else if (a === "--json" && ok("json")) opts.json = true;
    else if (a === "--full" && ok("full")) opts.full = true;
    else if (a === "--route" && ok("route")) opts.route = true;
    else if ((a === "--nested" || a === "--flat") && ok("layout")) opts.layout = a.slice(2);
    else if ((a === "--stats" || a === "--no-stats") && ok("stats")) opts.stats = a === "--stats";
    else if (a === "--copy" && ok("copy")) opts.copy = true;
    else if ((a === "-i" || a === "--interactive") && ok("interactive")) opts.interactive = true;
    else if ((a === "-l" || a === "--last-agents") && ok("lastAgents")) opts.lastAgents = true;
    else if (a === "--purge" && ok("purge")) opts.purge = true;
    else if ((a === "-f" || a === "--force") && ok("force")) opts.force = true;
    else if ((a === "-n" || a === "--dry-run") && ok("dryRun")) opts.dryRun = true;
    else if ((a === "-y" || a === "--yes") && ok("yes")) opts.yes = true;
    else throw new Error(`unknown option: ${a}`);
    if (["-a", "--agent", "-s", "--skill", "-G", "--group", "--groups"].includes(a) && args[i] === undefined) {
      throw new Error(`${a} needs a value`);
    }
  }
  return { ...opts, extra };
}

function uninstall(opts) {
  // Check --purge's target before removing anything, so a refusal changes nothing.
  if (opts.purge && !opts.dryRun) assertInstallFolder(ROOT);
  const cwd = opts.global ? ROOT : process.cwd();
  const scope = opts.global ? "global" : "project";
  const provided = packageSkillNames(ROOT);
  const all = listInstalled({ global: opts.global, cwd });
  const installed = all && all.filter((r) => isFromRoot(r, ROOT));
  const installedNames = new Set((installed ?? []).map((r) => r.name));
  const anyNames = new Set((all ?? []).map((r) => r.name));

  // --route: owner/repo@skill -> skill; names/patterns may match skills from any source.
  if (opts.route) {
    opts.skills = opts.skills.map((e) => {
      const n = specSkillName(e);
      if (!n) throw new Error(`'${e}' names a source, not a skill; use -s <skill> or <owner/repo@skill>`);
      return n;
    });
  }
  const known = new Set([...provided, ...installedNames, ...(opts.route ? anyNames : [])]);
  const picked = selectedSkills(opts, ROOT, known);
  const agents = expandAgents(opts.agents);
  let names;
  if (picked) {
    if (opts.purge) throw new Error("--purge only applies to a full uninstall (drop -s/-G)");
    const { unknown } = picked;
    if (unknown.length && !opts.force) {
      if (opts.route) {
        warn(`not installed (${scope}), skipping: ${unknown.join(", ")}`);
      } else {
        throw new Error(
          `not provided by this package: ${unknown.join(", ")}\n` +
            `  available: ${[...known].sort().join(", ") || "(none)"}\n` +
            `  use --route to also match skills installed from other sources, or -f/--force`,
        );
      }
    }
    // Skills reached via a glob or a group are only removed if installed;
    // with --force, names typed out in full are always passed on.
    const have = opts.route ? anyNames : installedNames;
    names = all
      ? picked.names.filter((n) => have.has(n) || (opts.force && picked.literals.has(n)))
      : picked.names;
  } else if (installed) {
    // Full uninstall: exactly what 'npx skills' recorded as coming from ROOT.
    names = [...installedNames];
  } else {
    warn("could not read 'npx skills list'; falling back to the skills found in", ROOT);
    names = [...provided];
  }
  names.sort();

  if (!names.length) {
    log(picked ? `nothing to remove (${scope}).` : `no ${scope} skills installed from ${ROOT}.`);
  } else if (opts.dryRun) {
    log(`[dry-run] would remove (${scope}): ${names.join(", ")}`);
    log(`[dry-run] npx -y ${quote(skillsPackageSpec())} remove ${names.join(" ")}${opts.global ? " --global" : ""}` +
      `${agents.map((a) => ` --agent '${a}'`).join("")} --yes ${opts.extra.join(" ")}`.trimEnd());
  } else {
    const status = skillsRemove(names, { ...opts, agents, cwd });
    if (status !== 0) return status;
  }

  if (opts.purge) {
    if (opts.dryRun) log(`[dry-run] would delete ${ROOT}`);
    else purgeRoot(ROOT);
  } else if (!picked && existsSync(join(ROOT, "skills"))) {
    log(`skill files kept in ${ROOT}/skills (re-add with 'aiskills install'; delete with --purge).`);
  }
  return 0;
}

function installed(opts) {
  const all = listInstalled({ global: opts.global, cwd: opts.global ? ROOT : process.cwd() });
  if (all === null) {
    warn("could not read 'npx skills list'");
    return 1;
  }
  const rows = opts.route ? all : all.filter((r) => isFromRoot(r, ROOT));
  const where = opts.route ? "" : ` from ${ROOT}`;
  if (!rows.length) log(`no ${opts.global ? "global" : "project"} skills installed${where}.`);
  const groupOf = new Map();
  for (const g of loadGroups(ROOT).groups) for (const n of g.skills) groupOf.set(n, g.name);
  for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    const bundled = isFromRoot(r, ROOT);
    const group = bundled ? groupOf.get(r.name) ?? "-" : "-";
    const source = opts.route ? `${(bundled ? "bundled" : r.source ?? "?").padEnd(30)} ` : "";
    console.log(`${paint.out.bold(r.name.padEnd(26))} ${source}${paint.out.dim(group.padEnd(22))} ${(r.agents ?? []).join(", ")}`);
  }
  return 0;
}

function groups(opts) {
  syncSkills({ version, quiet: true });
  const { groups: gs, ungrouped } = loadGroups(ROOT);
  if (opts.json) {
    console.log(JSON.stringify({ groups: gs.map(({ source, ...g }) => g), ungrouped }, null, 2));
    return 0;
  }
  for (const g of gs) {
    console.log(`${paint.out.bold(g.name)}  ${paint.out.dim(`(alias: ${g.alias})`)}`);
    if (g.description) console.log(`  ${g.description.length > 110 ? g.description.slice(0, 107) + "..." : g.description}`);
    console.log(`  skills: ${g.skills.join(", ") || "(none)"}\n`);
  }
  if (ungrouped.length) console.log(`(ungrouped; use -s or -G all)\n  skills: ${ungrouped.join(", ")}\n`);
  console.log(`Install a group:  ${paint.out.cyan("aiskills install --group <name|alias> --global --agent <agent>")}`);
  return 0;
}

const CONFIG_USAGE =
  "usage: aiskills config <key> [<value>] | --unset <key> | --list [--show-origin] [--json]  [--global | --project]";

/** `aiskills config`: get, set, unset or list defaults, like `git config`. */
function config(argv) {
  let only = null;
  let unset = false;
  let list = false;
  let showOrigin = false;
  let json = false;
  const words = [];
  for (const a of argv) {
    if (a === "--global") only = "user";
    else if (a === "--project") only = "project";
    else if (a === "--unset") unset = true;
    else if (a === "-l" || a === "--list") list = true;
    else if (a === "--show-origin") showOrigin = true;
    else if (a === "--json") json = true;
    else if (a.startsWith("-")) throw new Error(`option ${a} is not valid here`);
    else words.push(a);
  }
  const files = configFiles();
  if (list) {
    if (words.length || unset) throw new Error(CONFIG_USAGE);
    const entries = configList({ only });
    if (json) {
      console.log(JSON.stringify(Object.fromEntries(entries.map(({ key, ...e }) => [key, e])), null, 2));
      return 0;
    }
    const ow = Math.max(0, ...entries.map((e) => e.origin.length));
    const fw = Math.max(0, ...entries.map((e) => displayPath(e.file).length));
    for (const e of entries) {
      const kv = `${paint.out.bold(e.key)}=${formatConfigValue(e.value)}`;
      console.log(showOrigin ? `${paint.out.dim(e.origin.padEnd(ow))}  ${paint.out.dim(displayPath(e.file).padEnd(fw))}  ${kv}` : kv);
    }
    return 0;
  }
  if (unset) {
    if (words.length !== 1) throw new Error(CONFIG_USAGE);
    const [key] = words;
    assertConfigKey(key);
    const file = files[only ?? "user"];
    const data = readConfigFile(file);
    if (!Object.hasOwn(data, key)) throw new Error(`${key} is not set in ${displayPath(file)}`);
    delete data[key];
    writeConfigFile(file, data);
    return 0;
  }
  if (words.length === 1) {
    const found = configValue(words[0], { only });
    if (!found) return 1;
    console.log(formatConfigValue(found.value));
    return 0;
  }
  if (words.length === 2) {
    const [key, raw] = words;
    const value = parseConfigValue(key, raw);
    if (key === "skills-version") skillsVersionSpec(value, "skills-version");
    const file = files[only ?? "user"];
    writeConfigFile(file, { ...readConfigFile(file), [key]: value });
    return 0;
  }
  throw new Error(CONFIG_USAGE);
}

const ON = (b) => (b ? "on" : "off");

/** `aiskills info`: this setup, each setting with where it comes from. Offline unless --full. */
function info(opts) {
  const e = process.env;
  const meta = readJson(join(ROOT, "aiskills.json"));
  const savedDir = join(ROOT, "skills");
  const tryOr = (fn) => {
    try {
      return fn();
    } catch (err) {
      return `invalid: ${err.message.split("\n")[0]}`;
    }
  };
  let saved = null;
  if (meta && existsSync(savedDir)) {
    const groups = tryOr(() => loadGroups(ROOT).groups.length);
    saved = {
      skills: skillNamesIn(savedDir).size,
      groups: typeof groups === "number" ? groups : 0,
      layout: meta.layout ?? null,
      version: meta.version ?? null,
      savedAt: meta.installedAt ?? null,
    };
  }
  const libVar = e[SKILLS_LIB_VERSION_VAR]?.trim() ? SKILLS_LIB_VERSION_VAR : null;
  // Where a setting comes from: its AISKILLS_* variable, then a config file, then `fallback`.
  const files = configFiles();
  const conf = (key) => {
    try {
      return configValue(key);
    } catch {
      return undefined; // a broken config file shows in the settings that read it
    }
  };
  const from = (key, fallback) => (CONFIG_KEYS[key].env && e[CONFIG_KEYS[key].env]?.trim() ? CONFIG_KEYS[key].env : conf(key) ? `${conf(key).origin} config` : fallback);
  const skillsCfg = libVar ? null : conf("skills-version");
  const statsOff = ["DO_NOT_TRACK", "DISABLE_TELEMETRY", "CI", "GITHUB_ACTIONS"].find((k) => e[k]);
  const env = envOptions();
  const data = {
    aiskills: { version, path: PKG_DIR, node: process.version, platform: `${process.platform}-${process.arch}` },
    installRoot: { path: ROOT, source: e.AISKILLS_HOME ? "AISKILLS_HOME" : "default", exists: existsSync(ROOT) },
    saved,
    settings: {
      skillsCli: {
        value: tryOr(() => `skills@${skillsVersionSpec(libVar ? e[libVar].trim() : skillsCfg?.value ?? SKILLS_CLI_VERSION, libVar ?? (skillsCfg ? "skills-version" : SKILLS_LIB_VERSION_VAR))}`),
        source: libVar ?? (skillsCfg ? `${skillsCfg.origin} config` : "pinned, tested"),
      },
      scope: { value: env.global ? "global" : "project", source: from("scope", "default") },
      layout: {
        value: tryOr(() => resolveLayout(undefined, ROOT)),
        source: from("layout", meta?.layout ? "remembered" : "default"),
      },
      stats: {
        value: tryOr(() => ON(resolveStats(undefined, ROOT))),
        source: statsOff ?? from("stats", typeof meta?.stats === "boolean" ? "remembered" : "default"),
      },
      route: { value: ON(env.route), source: from("route", "default") },
      // The setting in effect: NO_COLOR / FORCE_COLOR override the config (--color/--no-color are per run).
      color: e.NO_COLOR
        ? { value: "never", source: "NO_COLOR" }
        : e.FORCE_COLOR && !["0", "false"].includes(e.FORCE_COLOR.toLowerCase())
          ? { value: "always", source: "FORCE_COLOR" }
          : { value: conf("color")?.value ?? "auto", source: from("color", "default") },
    },
    config: Object.fromEntries(["user", "project"].map((o) => [o, { path: files[o], exists: existsSync(files[o]) }])),
    skillsLock: { path: skillsLockPath(), exists: existsSync(skillsLockPath()), lastPickedAgents: lastSelectedAgents() },
    env: Object.fromEntries(Object.entries(e).filter(([k]) => k.startsWith("AISKILLS_")).sort(([a], [b]) => a.localeCompare(b))),
  };
  if (opts.full) {
    const full = {};
    try {
      const view = npmView(PKG_NAME);
      const latest = view.distTags.latest ?? null;
      const status = !(version in view.time)
        ? "not published"
        : latest === version
          ? "up to date"
          : latest && view.time[latest] > view.time[version]
            ? "update available"
            : "newer than latest";
      full.npm = { latest, status };
    } catch (err) {
      full.npm = { error: err.message };
    }
    const rows = listInstalled({ global: env.global, cwd: env.global ? ROOT : process.cwd() });
    if (rows) {
      const ours = rows.filter((r) => isFromRoot(r, ROOT));
      const perAgent = {};
      for (const r of ours) for (const a of r.agents ?? []) perAgent[a] = (perAgent[a] ?? 0) + 1;
      full.installed = { scope: env.global ? "global" : "project", fromRoot: ours.length, other: rows.length - ours.length, perAgent };
    } else {
      full.installed = { error: "could not read 'npx skills list'" };
    }
    data.full = full;
  }
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  const lines = [];
  const kv = (key, value, source) => lines.push([key, value, source]);
  const gap = () => lines.push(null);
  kv("aiskills version", version);
  kv("package path", PKG_DIR);
  kv("node version", `${process.version} (${data.aiskills.platform})`);
  gap();
  kv("install root", ROOT, data.installRoot.source + (data.installRoot.exists ? "" : "; not created yet"));
  for (const o of ["user", "project"]) kv(`${o} config`, displayPath(data.config[o].path), data.config[o].exists ? null : "not created");
  if (saved) {
    kv("saved skills", `${saved.skills} skills in ${saved.groups} groups, ${saved.layout ?? "?"} layout`);
    const when = saved.savedAt ? `, ${saved.savedAt.slice(0, 16).replace("T", " ")} UTC` : "";
    kv("saved by", `aiskills ${saved.version ?? "?"}${when}`, saved.version === version ? null : "not this version: run aiskills install");
  } else {
    kv("saved skills", "none yet", "run aiskills install or aiskills sync");
  }
  gap();
  const st = data.settings;
  kv("skills CLI", st.skillsCli.value, st.skillsCli.source);
  kv("scope", st.scope.value, st.scope.source);
  kv("layout", st.layout.value, st.layout.source);
  kv("stats", st.stats.value, st.stats.source);
  kv("route", st.route.value, st.route.source);
  kv("color", st.color.value, st.color.source);
  gap();
  kv("skills lock file", data.skillsLock.path, data.skillsLock.exists ? null : "not created yet");
  kv("last-picked agents", data.skillsLock.lastPickedAgents.join(", ") || "none", "used by install -l");
  gap();
  const envs = Object.entries(data.env);
  if (!envs.length) kv("env overrides", "none");
  envs.forEach(([k, v], i) => kv(i ? "" : "env overrides", `${k}=${v}`));
  if (data.full) {
    gap();
    const { npm, installed: inst } = data.full;
    if (npm.error) kv("latest on npm", "unavailable", npm.error);
    else {
      const hint = { "update available": "update available: run aiskills upgrade", "not published": `${version} is not published on npm` }[npm.status] ?? npm.status;
      kv("latest on npm", npm.latest ?? "none", hint);
    }
    if (inst.error) kv("installed skills", "unavailable", inst.error);
    else {
      kv("installed skills", `${inst.fromRoot} from the install root, ${inst.other} from other sources`, inst.scope);
      const agents = Object.entries(inst.perAgent).sort(([a], [b]) => a.localeCompare(b));
      kv("per agent", agents.map(([a, n]) => `${a} ${n}`).join(", ") || "none");
    }
  }
  const w = Math.max(...lines.filter(Boolean).map(([k]) => k.length));
  const c = paint.out;
  for (const l of lines) {
    if (!l) console.log("");
    else console.log(`${l[0] ? c.dim(l[0].padStart(w)) : " ".repeat(w)}${l[0] ? " : " : "   "}${c.bold(l[1])}${l[2] ? `  ${c.dim(`(${l[2]})`)}` : ""}`);
  }
  return 0;
}

/** Options of `aiskills releases` / `rel`. */
function parseReleases(argv) {
  const o = { count: DEFAULT_COUNT, downloads: undefined, view: undefined, by: undefined, ascii: false, json: false };
  const PERIODISH = /^(all|\d+[a-z]+|\d{4}-\d{2}-\d{2}:.*)$/i;
  const setView = (v) => {
    if (o.view && o.view !== v) throw new Error("--chart and --table can't be used together");
    o.view = v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-L" || a === "--last") {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      o.count = parseCount(argv[++i]);
    } else if (a === "--downloads") {
      o.downloads = PERIODISH.test(argv[i + 1] ?? "") ? argv[++i] : "all";
    } else if (a.startsWith("--downloads=")) o.downloads = a.slice("--downloads=".length);
    else if (a === "--chart") setView("chart");
    else if (a === "--table") setView("table");
    else if (a === "--by") {
      const v = argv[++i];
      const got = v === undefined ? "" : `; got '${v}'`;
      if (!["day", "week", "month"].includes(v)) throw new Error(`--by takes day, week or month${got}`);
      o.by = v;
    } else if (a === "--ascii") o.ascii = true;
    else if (a === "--json") o.json = true;
    else if (!a.startsWith("-")) o.count = parseCount(a);
    else throw new Error(`unknown option: ${a}`);
  }
  if (o.downloads === undefined && (o.view || o.by || o.ascii)) o.downloads = "all";
  // Check the period before any network call.
  o.period = o.downloads === undefined ? null : parsePeriod(o.downloads);
  return o;
}

/** `aiskills releases` / `rel`: the latest releases on npm, optionally with download counts. */
function releases(o, command) {
  const today = todayDate();
  const view = npmView(PKG_NAME);
  const rows = releaseRows(view, version);
  const latest = view.distTags.latest ?? null;
  const dl = o.period ? fetchDownloads(PKG_NAME, o.period, { created: view.time.created }) : null;
  const by = dl ? o.by ?? pickBy(dl.days.length) : null;
  const series = dl ? bucketize(dl.days, by) : null;
  const hidden = [...new Set([...view.versions, ...Object.keys(view.time)])].filter((v) => v !== "created" && v !== "modified" && !rows.some((r) => r.version === v));
  // Name the registry (a mirror, say) when it matters: in JSON, and when it reports no publish dates.
  const registry = o.json || rows.some((r) => !r.published) ? npmRegistry() : null;
  if (o.json) {
    const shown = rows.slice(0, o.count).map((r) => (dl ? { ...r, downloadsLastWeek: dl.perVersion[r.version] ?? null } : r));
    const out = { package: PKG_NAME, registry, installed: version, latest, total: rows.length, releases: shown };
    if (dl) {
      out.downloads = {
        start: dl.start,
        end: dl.end,
        label: dl.label,
        total: dl.total,
        by,
        rows: series.map((r) => ({
          start: r.start,
          end: r.end,
          downloads: r.downloads,
          partial: r.days < r.size,
          published: rows.filter((x) => x.published && x.published.slice(0, 10) >= r.start && x.published.slice(0, 10) <= r.end).map((x) => x.version).reverse(),
        })),
      };
    }
    console.log(JSON.stringify(out, null, 2));
    return 0;
  }
  console.log(renderReleases({ pkg: PKG_NAME, rows, count: o.count, installed: version, latest, today, perVersion: dl?.perVersion, registry, command: `aiskills ${command}` }));
  if (dl) {
    console.log("");
    console.log(`downloads, all versions: ${dl.total.toLocaleString("en-US")} ${dl.label} (${dl.start} → ${dl.end})`);
    console.log("per-version counts cover the last 7 days only (npm keeps no older ones); – = no count yet");
    if (hidden.length) console.log(`the total includes versions not listed here (${hidden.join(", ")})`);
    console.log("");
    console.log(renderSeries(series, { by, releases: rows, table: o.view === "table", ascii: o.ascii || process.env.TERM === "dumb" }));
  }
  // The changelog that ships in the package is readable offline; the URL has newer versions.
  const local = join(PKG_DIR, "CHANGELOG.md");
  console.log("");
  if (existsSync(local)) console.log(`changelog: ${local}\n           ${CHANGELOG_URL}`);
  else console.log(`changelog: ${CHANGELOG_URL}`);
  return 0;
}

/** Options of `aiskills upgrade`. */
function parseUpgrade(argv) {
  const o = { target: undefined, check: false, json: false, refresh: true, dryRun: false, yes: false };
  for (const a of argv) {
    if (a === "--check") o.check = true;
    else if (a === "--json") o.json = true;
    else if (a === "--no-refresh") o.refresh = false;
    else if (a === "-n" || a === "--dry-run") o.dryRun = true;
    else if (a === "-y" || a === "--yes") o.yes = true;
    else if (!a.startsWith("-")) {
      if (o.target !== undefined) throw new Error(`give one version or tag (got '${o.target}' and '${a}')`);
      o.target = a;
    } else throw new Error(`unknown option: ${a}`);
  }
  if (o.json && !o.check) throw new Error("--json only works with --check");
  return o;
}

const HOW = { npx: "npx", project: "project dependency", source: "source checkout" };
const csvList = (xs) => xs.join(",");

/**
 * `aiskills upgrade`: install a newer aiskills globally with the package
 * manager that installed it, then re-add the skills installed from the
 * install folder, for the same agents, by running the new version.
 */
function upgrade(o) {
  const view = npmView(PKG_NAME);
  const versions = [...new Set([...view.versions, ...Object.keys(view.time).filter((v) => v !== "created" && v !== "modified")])];
  const t = pickTarget({ distTags: view.distTags, versions }, version, o.target);
  const inst = detectInstall(PKG_DIR, { npmGlobalRoot: npmGlobalRoot() });
  const published = view.time[t.target]?.slice(0, 10) ?? null;
  const how = inst.global ? `${inst.method}, global` : HOW[inst.method];
  const status = `installed: ${version} (${how}) · ${t.tag ?? "requested"}: ${t.target}${published ? ` (published ${published})` : ""}`;

  if (o.check) {
    if (o.json) {
      console.log(JSON.stringify({ installed: version, target: t.target, tag: t.tag, change: t.change, upgradable: t.change === "upgrade", method: inst.method, global: inst.global, published }, null, 2));
      return 0;
    }
    log(status);
    const than = t.tag ? `${t.tag} (${t.target})` : t.target;
    log(t.change === "upgrade" ? "update available: run 'aiskills upgrade'" : t.change === "none" ? "up to date" : `installed ${version} is newer than ${than}`);
    return 0;
  }
  log(status);
  if (t.change === "none") {
    log(`already up to date (${version})`);
    return 0;
  }
  if (!inst.global) throw new Error(`can't upgrade: ${HOW_TO_UPGRADE[inst.method]}`);
  if (t.change === "downgrade" && !o.yes && !o.dryRun) {
    if (!process.stdin.isTTY) throw new Error(`not downgrading ${version} → ${t.target} without confirmation: re-run with -y`);
    if (!confirm(`Downgrade aiskills ${version} → ${t.target}? [y/N] `)) throw new Error("nothing changed: not confirmed");
  }

  // What to refresh afterwards: the skills installed from the install folder (global), by agents.
  // (Needed with --no-refresh too, to print the commands that would refresh them.)
  let plan = null;
  const rows = listInstalled({ global: true, cwd: ROOT });
  if (rows) plan = refreshPlan(rows, ROOT, knownAgents());
  else warn("could not read 'npx skills list'; the skills won't be refreshed");
  const refreshCmd = (g) => `aiskills install -g -s ${csvList(g.skills)} -a ${csvList(g.agents)}`;
  const oldNames = skillNamesIn(join(PKG_DIR, "skills"));
  const [cmd, args] = installCommand(inst.method, `${PKG_NAME}@${t.target}`);
  log(`changes: ${CHANGELOG_URL}`);
  if (o.dryRun) {
    log(`[dry-run] ${cmd} ${args.join(" ")}`);
    for (const g of plan?.groups ?? []) log(`[dry-run] then: ${refreshCmd(g)}`);
    return 0;
  }
  log(`running: ${cmd} ${args.join(" ")}`);
  const code = runInstall(cmd, args);
  if (code !== 0) return code;

  const newPkg = dirname(dirname(inst.entry));
  const newVersion = JSON.parse(readFileSync(join(newPkg, "package.json"), "utf8")).version;
  if (newVersion !== t.target) warn(`${cmd} installed ${newVersion}, not ${t.target}`);
  const newNames = skillNamesIn(join(newPkg, "skills"));
  const installed = plan?.installed ?? [];
  const groups = (plan?.groups ?? [])
    .map((g) => ({ ...g, skills: g.skills.filter((n) => newNames.has(n)) }))
    .filter((g) => g.skills.length);

  let result = 0;
  if (!o.refresh) {
    log(`your agents still have the ${version} skills; to update them:`);
    for (const g of groups) console.log(`  ${paint.out.cyan(refreshCmd(g))}`);
    if (!groups.length) console.log(`  ${paint.out.cyan("aiskills install")}`);
  } else if (plan) {
    if (!installed.length) log(`no skills installed from ${ROOT} (global); install them with: aiskills install`);
    for (const g of groups) {
      const n = g.skills.length;
      log(`refreshing ${n} skill${n === 1 ? "" : "s"} for ${g.agents.join(", ")} (global) with aiskills ${newVersion}`);
      // The new version does the work; the count on skills.sh isn't bumped for a refresh.
      const res = spawnSync(process.execPath, [inst.entry, "install", "-g", "-s", csvList(g.skills), "-a", csvList(g.agents)], {
        stdio: "inherit",
        env: { ...process.env, AISKILLS_STATS: "0" },
      });
      if ((res.status ?? 1) !== 0) result = res.status ?? 1;
    }
    for (const u of plan.unknownAgents) warn(`couldn't tell which agent '${u}' is; re-add its skills with: aiskills install -s <skills> -a <agent id>`);
  }
  const added = [...newNames].filter((n) => !oldNames.has(n)).sort();
  if (added.length) {
    const agents = [...new Set(groups.flatMap((g) => g.agents))].sort();
    log(`new in ${newVersion}, not installed: ${added.join(", ")}`);
    console.log(`  to install them:      ${paint.out.cyan(`aiskills install -s ${csvList(added)}${agents.length ? ` -a ${csvList(agents)}` : ""}`)}`);
    console.log(`  or pick from a list:  ${paint.out.cyan("aiskills install -i")}`);
  }
  const dropped = installed.filter((n) => !newNames.has(n));
  if (dropped.length) {
    log(`no longer in ${newVersion} but still installed: ${dropped.join(", ")}`);
    console.log(`  to remove:  ${paint.out.cyan(`aiskills uninstall -s ${csvList(dropped)}`)}`);
  }
  if (o.refresh) log("project installs aren't refreshed: run 'aiskills install -p' in each project that uses them");
  ok(`${t.change === "downgrade" ? "downgraded" : "upgraded"} ${version} → ${newVersion}`);
  return result;
}

function main() {
  // '--route', '--nested' and '--flat' may come before the command
  // (aiskills --route install ..., aiskills --nested).
  let argv = process.argv.slice(2);
  // --color / --no-color: before the command, or anywhere before '--' in its options
  // (except for 'skills' and 'find', which pass their options on to npx skills).
  const colorFlag = (a) => {
    if (a !== "--color" && a !== "--no-color") return false;
    setColorFlag(a === "--color");
    return true;
  };
  for (;;) {
    if (colorFlag(argv[0])) {}
    else if (argv[0] === "--route") process.env.AISKILLS_ROUTE = "1";
    else if (argv[0] === "--nested" || argv[0] === "--flat") process.env.AISKILLS_LAYOUT = argv[0].slice(2);
    else break;
    argv = argv.slice(1);
  }
  // `aiskills config color`; a broken config file is reported by the command that reads it.
  try {
    setColorConfig(configValue("color")?.value);
  } catch {}
  let [cmd = "install", ...rest] = argv;
  if (!["skills", "find", "f"].includes(cmd)) {
    const end = rest.includes("--") ? rest.indexOf("--") : rest.length;
    rest = [...rest.slice(0, end).filter((a) => !colorFlag(a)), ...rest.slice(end)];
  }
  switch (cmd) {
    case "install":
    case "i": {
      const opts = parse(rest, ["scope", "agent", "skill", "group", "copy", "route", "layout", "dryRun", "yes", "stats", "interactive", "lastAgents"]);
      if (opts.interactive && !opts.dryRun && !process.stdin.isTTY) {
        throw new Error("-i/--interactive needs a terminal; pick with -s/-G/-a instead");
      }
      if (opts.lastAgents) {
        const last = lastSelectedAgents();
        if (!last.length) {
          throw new Error(
            `--last-agents: no agents recorded in ${skillsLockPath()}\n` +
              `  pick them once with 'aiskills install -i' (or 'npx skills add'), or use -a <agents>`,
          );
        }
        log(`last-picked agents: ${last.join(", ")}`);
        opts.agents = [...new Set([...opts.agents, ...last])];
      }
      const root = syncSkills({ version, layout: opts.layout, stats: opts.stats });
      const picked = selectedSkills(opts, root);
      const external = picked?.unknown ?? [];
      if (external.length && !opts.route) {
        throw new Error(
          `not provided by this package: ${external.join(", ")}\n` +
            `  available: ${[...packageSkillNames(root)].sort().join(", ")}\n` +
            `  add --route to look them up with 'npx skills' instead`,
        );
      }
      const bundled = picked ? picked.names.filter((n) => !external.includes(n)) : null;
      if (picked && !picked.names.length) throw new Error("the selected group(s) contain no skills");
      const agents = expandAgents(opts.agents);
      // Resolve every external skill before installing anything.
      const routed = external.length ? resolveExternal(external) : [];
      // Safety: a skill the registry lookup chose is third-party code. Show it, and
      // install it (or anything else) only once the user confirms. A pinned
      // owner/repo@skill, URL or path was named exactly, so it isn't asked about.
      const looked = routed.filter((r) => r.lookedUp);
      if (looked.length) {
        log(
          "found in the skills registry (not bundled; third-party code your agents may run):\n" +
            looked.map((r) => `    ${r.spec}${r.installs ? `  (${r.installs})` : ""}  for '${r.entry}'`).join("\n"),
        );
        if (!opts.yes && !opts.dryRun) {
          const specs = looked.map((r) => r.spec).join(", ");
          if (!process.stdin.isTTY) {
            throw new Error(
              `not installing external skills without confirmation: ${specs}\n` +
                `  re-run with -y/--yes to install them, or pin each one with -s owner/repo@skill`,
            );
          }
          const n = looked.length;
          if (!confirm(`Install ${n} external skill${n === 1 ? "" : "s"} from the registry? [y/N] `)) {
            throw new Error("nothing installed: not confirmed");
          }
        }
      }
      const cwd = opts.global ? root : process.cwd();
      let status = 0;
      if (!picked || bundled.length) {
        if (picked) log(`bundled: ${bundled.join(", ")}`);
        status = skillsAdd(root, { ...opts, agents, skills: bundled ?? ["*"], cwd });
        // Add it to the skills.sh install count (best effort; see countInstall).
        if (status === 0 && resolveStats(opts.stats, root)) {
          let counted = bundled ?? [...packageSkillNames(root)].sort();
          if (opts.interactive && !bundled && !opts.dryRun) {
            // The picker chose the skills: count the ones now installed from root.
            const rows = listInstalled({ global: opts.global, cwd });
            if (rows) counted = rows.filter((r) => isFromRoot(r, root)).map((r) => r.name).sort();
          }
          if (counted.length) countInstall(counted, { agents, dryRun: opts.dryRun });
        }
      }
      for (const { spec } of routed) {
        log(`external: ${spec}`);
        status = skillsAddExternal(spec, { ...opts, agents, cwd: opts.global ? undefined : process.cwd() }) || status;
      }
      return status;
    }
    case "uninstall":
    case "remove":
    case "rm":
    case "r":
      return uninstall(parse(rest, ["scope", "agent", "skill", "group", "purge", "force", "dryRun", "route"]));
    case "installed":
    case "ls":
      return installed(parse(rest, ["scope", "route"]));
    case "find":
    case "f":
      return runSkills(["find", ...rest]);
    case "groups":
    case "g":
      return groups(parse(rest, ["json"]));
    case "skills":
      // Piggyback on any 'npx skills' command; ':root' -> install root.
      // Interactive: npx skills may prompt, so its stderr stays on the terminal.
      return runSkills(rest.map((a) => (a === ":root" ? ROOT : a)), { interactive: true });
    case "sync": {
      const { layout, stats } = parse(rest, ["layout", "stats"]);
      syncSkills({ version, layout, stats });
      return 0;
    }
    case "list":
      return skillsAdd(syncSkills({ version }), { list: true });
    case "info":
      return info(parse(rest, ["json", "full"]));
    case "config":
      return config(rest);
    case "upgrade":
      return upgrade(parseUpgrade(rest));
    case "releases":
    case "rel":
      return releases(parseReleases(rest), cmd);
    case "path":
    case "p":
      console.log(ROOT);
      return 0;
    case "help":
    case "h":
    case "-h":
    case "--help":
      console.log(helpText());
      return 0;
    case "-v":
    case "--version":
      console.log(version);
      return 0;
    default:
      console.error(`${paint.err.red(`unknown command: ${cmd}`)}\n\n${HELP}`);
      return 1;
  }
}

try {
  process.exitCode = main();
} catch (err) {
  fail(err?.message ?? err);
  process.exitCode = 1;
}
