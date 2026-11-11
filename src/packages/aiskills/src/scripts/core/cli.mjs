// The `aiskills` command-line interface. bin/aiskills.mjs is the entry point.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_DIR,
  envOptions,
  expandAgents,
  assertInstallFolder,
  installRoot,
  installedFromRoot,
  isFromRoot,
  listInstalled,
  confirm,
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
  skillsPackageSpec,
  skillsRemove,
  syncSkills,
  warn,
} from "./installer.mjs";

const { version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
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

uninstall only:
      --purge            Also delete ${ROOT} (only with a full uninstall)
  -f, --force            Allow -s names that this package does not provide
  -n, --dry-run          Print what would run; change nothing

Anything after '--' is appended to the underlying 'npx skills' command.

Examples:
  aiskills groups                             # what groups exist
  aiskills install --group scrolls --global --agent claude-code
  aiskills install -G scrolls,personas -s create-lib-docs -a claude-code,codex
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
  aiskills skills list -g                     # = npx skills list -g
  aiskills skills add :root -s prodigy -g -y  # = npx skills add ${ROOT} -s prodigy -g -y

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY
                         Defaults for the options above
  AISKILLS_ROUTE=1              Same as --route
  AISKILLS_LAYOUT=flat|nested   Same as --flat / --nested
  AISKILLS_SKILLS_VERSION       The skills CLI version npx runs (default ${SKILLS_CLI_VERSION}, tested): a version,
                                latest, next, an npm range (~1.7.4, 1.7.x) or an interval, where one of
                                "...", "?" or "*" is an open end: [1.7.4, ...) >=1.7.4   (1.7.4, *) >1.7.4
                                [1.7.4, 1.8.0) >=1.7.4 <1.8.0   (..., 1.7.6] <=1.7.6. With a range, npm picks
                                the newest version its rules (e.g. min-release-age) allow.
                                Quote it: AISKILLS_SKILLS_VERSION='(..., 1.7.6]'
  AISKILLS_STATS=0|1            Same as --no-stats / --stats (not remembered)
  AISKILLS_STATS_FOREGROUND=1   Wait for the skills.sh count and show its output
`;

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
    else if (a === "--route" && ok("route")) opts.route = true;
    else if ((a === "--nested" || a === "--flat") && ok("layout")) opts.layout = a.slice(2);
    else if ((a === "--stats" || a === "--no-stats") && ok("stats")) opts.stats = a === "--stats";
    else if (a === "--copy" && ok("copy")) opts.copy = true;
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
    console.log(`${r.name.padEnd(26)} ${source}${group.padEnd(22)} ${(r.agents ?? []).join(", ")}`);
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
    console.log(`${g.name}  (alias: ${g.alias})`);
    if (g.description) console.log(`  ${g.description.length > 110 ? g.description.slice(0, 107) + "..." : g.description}`);
    console.log(`  skills: ${g.skills.join(", ") || "(none)"}\n`);
  }
  if (ungrouped.length) console.log(`(ungrouped; use -s or -G all)\n  skills: ${ungrouped.join(", ")}\n`);
  console.log(`Install a group:  aiskills install --group <name|alias> --global --agent <agent>`);
  return 0;
}

function main() {
  // '--route', '--nested' and '--flat' may come before the command
  // (aiskills --route install ..., aiskills --nested).
  let argv = process.argv.slice(2);
  for (;;) {
    if (argv[0] === "--route") process.env.AISKILLS_ROUTE = "1";
    else if (argv[0] === "--nested" || argv[0] === "--flat") process.env.AISKILLS_LAYOUT = argv[0].slice(2);
    else break;
    argv = argv.slice(1);
  }
  const [cmd = "install", ...rest] = argv;
  switch (cmd) {
    case "install":
    case "i": {
      const opts = parse(rest, ["scope", "agent", "skill", "group", "copy", "route", "layout", "dryRun", "yes", "stats"]);
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
          countInstall(bundled ?? [...packageSkillNames(root)].sort(), { agents, dryRun: opts.dryRun });
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
    case "path":
    case "p":
      console.log(ROOT);
      return 0;
    case "help":
    case "h":
    case "-h":
    case "--help":
      console.log(HELP);
      return 0;
    case "-v":
    case "--version":
      console.log(version);
      return 0;
    default:
      console.error(`unknown command: ${cmd}\n\n${HELP}`);
      return 1;
  }
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`[aiskills] ${err?.message ?? err}`);
  process.exitCode = 1;
}
