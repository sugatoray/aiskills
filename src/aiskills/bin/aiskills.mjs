#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_DIR,
  envOptions,
  installRoot,
  installedFromRoot,
  loadGroups,
  log,
  packageSkillNames,
  purgeRoot,
  runSkills,
  selectedSkills,
  skillsAdd,
  skillsRemove,
  syncSkills,
  warn,
} from "../scripts/installer.mjs";

const { version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
const ROOT = installRoot();

const HELP = `aiskills ${version} — Sugato Ray's agent skills

Usage: aiskills <command> [options]

Commands:
  install        Save skills to ${ROOT}/skills and run 'npx skills add' on it (default)
  uninstall      Remove skills installed from ${ROOT} via 'npx skills remove'
  installed      Show skills currently installed from ${ROOT}
  groups         List skill groups (from .claude-plugin/marketplace.json) and their skills
  sync           Only save/refresh the skills folder; do not run 'npx skills add'
  list           List the skills available in the saved folder
  path           Print the folder that holds skills/
  skills <args>  Pass <args> straight to 'npx skills'; ':root' is replaced by ${ROOT}
  help           Show this help

Scope/selection options (install, uninstall, installed):
  -g, --global           User-level (default)
  -p, --project          Current project instead of user-level
  -a, --agent <names>    Comma-separated agents (e.g. claude-code,codex); default: all
  -s, --skill <names>    Comma-separated skill names; default: all skills from this package
  -G, --group <names>    Comma-separated skill groups (e.g. scrolls-skills or just scrolls;
                         'all' = everything). Combines with -s. See 'aiskills groups'.
  -s/-G/-a may be repeated; values accumulate.

install only:
      --copy             Copy files into agent dirs instead of symlinking

uninstall only:
      --purge            Also delete ${ROOT} (only with a full uninstall)
  -f, --force            Allow -s names that this package does not provide
  -n, --dry-run          Print what would run; change nothing

Anything after '--' is appended to the underlying 'npx skills' command.

Examples:
  aiskills groups                             # what groups exist
  aiskills install --group scrolls --global --agent claude-code
  aiskills install -G scrolls,personas -s newsletter-ai -a claude-code,codex
  aiskills uninstall                          # remove every skill this package installed
  aiskills uninstall -G stata                 # remove one group
  aiskills uninstall -s scrolls-hide,prodigy  # remove just these
  aiskills uninstall -a codex                 # unlink from Codex only
  aiskills uninstall --purge                  # remove all, then delete ${ROOT}
  aiskills skills list -g                     # = npx skills list -g
  aiskills skills add :root -s prodigy -g -y  # = npx skills add ${ROOT} -s prodigy -g -y

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY
                         Defaults for the options above (also used by the npm postinstall)
  AISKILLS_SKIP_POSTINSTALL=1   Skip the npm postinstall hook entirely
  AISKILLS_SKIP_SKILLS_ADD=1    Postinstall copies files but skips 'npx skills add'
`;

const split = (v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function parse(argv, allowed) {
  const opts = { ...envOptions(), purge: false, force: false, dryRun: false, json: false };
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
    else if (a === "--copy" && ok("copy")) opts.copy = true;
    else if (a === "--purge" && ok("purge")) opts.purge = true;
    else if ((a === "-f" || a === "--force") && ok("force")) opts.force = true;
    else if ((a === "-n" || a === "--dry-run") && ok("dryRun")) opts.dryRun = true;
    else throw new Error(`unknown option: ${a}`);
    if (["-a", "--agent", "-s", "--skill", "-G", "--group", "--groups"].includes(a) && args[i] === undefined) {
      throw new Error(`${a} needs a value`);
    }
  }
  return { ...opts, extra };
}

function uninstall(opts) {
  const cwd = opts.global ? ROOT : process.cwd();
  const scope = opts.global ? "global" : "project";
  const provided = packageSkillNames(ROOT);
  const installed = installedFromRoot(ROOT, { global: opts.global, cwd });
  const installedNames = new Set((installed ?? []).map((r) => r.name));

  const picked = selectedSkills(opts, ROOT);
  let names;
  if (picked) {
    if (opts.purge) throw new Error("--purge only applies to a full uninstall (drop -s/-G)");
    const known = new Set([...provided, ...installedNames]);
    const unknown = picked.filter((n) => !known.has(n));
    if (unknown.length && !opts.force) {
      throw new Error(
        `not provided by this package: ${unknown.join(", ")}\n` +
          `  available: ${[...known].sort().join(", ") || "(none)"}\n` +
          `  use -f/--force to remove them anyway`,
      );
    }
    // Skip group members that aren't installed (npx skills remove would no-op).
    names = installed && opts.groups.length
      ? picked.filter((n) => installedNames.has(n) || opts.skills.includes(n))
      : picked;
  } else if (installed) {
    // Full uninstall: exactly what 'npx skills' recorded as coming from ROOT.
    names = [...installedNames];
  } else {
    warn("could not read 'npx skills list'; falling back to the skills found in", ROOT);
    names = [...provided];
  }
  names.sort();

  if (!names.length) {
    log(`no ${scope} skills installed from ${ROOT}.`);
  } else if (opts.dryRun) {
    log(`[dry-run] would remove (${scope}): ${names.join(", ")}`);
    log(`[dry-run] npx -y skills remove ${names.join(" ")}${opts.global ? " --global" : ""}` +
      `${opts.agents.map((a) => ` --agent ${a}`).join("")} --yes ${opts.extra.join(" ")}`.trimEnd());
  } else {
    const status = skillsRemove(names, { ...opts, cwd });
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
  const rows = installedFromRoot(ROOT, { global: opts.global, cwd: opts.global ? ROOT : process.cwd() });
  if (rows === null) {
    warn("could not read 'npx skills list'");
    return 1;
  }
  if (!rows.length) log(`no ${opts.global ? "global" : "project"} skills installed from ${ROOT}.`);
  const groupOf = new Map();
  for (const g of loadGroups(ROOT).groups) for (const n of g.skills) groupOf.set(n, g.name);
  for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${r.name.padEnd(26)} ${(groupOf.get(r.name) ?? "-").padEnd(22)} ${(r.agents ?? []).join(", ")}`);
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
  const [cmd = "install", ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "install": {
      const opts = parse(rest, ["scope", "agent", "skill", "group", "copy"]);
      const root = syncSkills({ version });
      const picked = selectedSkills(opts, root);
      if (picked && !picked.length) throw new Error("the selected group(s) contain no skills");
      if (picked) log(`selected: ${picked.join(", ")}`);
      return skillsAdd(root, { ...opts, skills: picked ?? ["*"], cwd: opts.global ? root : process.cwd() });
    }
    case "uninstall":
    case "remove":
    case "rm":
      return uninstall(parse(rest, ["scope", "agent", "skill", "group", "purge", "force", "dryRun"]));
    case "installed":
      return installed(parse(rest, ["scope"]));
    case "groups":
      return groups(parse(rest, ["json"]));
    case "skills":
      // Piggyback on any 'npx skills' command; ':root' -> install root.
      return runSkills(rest.map((a) => (a === ":root" ? ROOT : a)));
    case "sync":
      syncSkills({ version });
      return 0;
    case "list":
      return skillsAdd(syncSkills({ version }), { list: true });
    case "path":
      console.log(ROOT);
      return 0;
    case "help":
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
