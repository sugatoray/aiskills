#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PKG_DIR, envOptions, installRoot, skillsAdd, syncSkills } from "../scripts/installer.mjs";

const { version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));

const HELP = `aiskills ${version} — Sugato Ray's agent skills

Usage: aiskills <command> [options]

Commands:
  install        Save skills to ${installRoot()}/skills and run 'npx skills add' on it (default)
  sync           Only save/refresh the skills folder; do not run 'npx skills add'
  list           List the skills available in the saved folder
  path           Print the folder that holds skills/
  help           Show this help

Options for install:
  -p, --project          Install to the current project instead of globally
  -a, --agent <names>    Comma-separated agents (e.g. claude-code,codex); default: auto-detect
  -s, --skill <names>    Comma-separated skill names; default: all
      --copy             Copy files into agent dirs instead of symlinking
  Anything after '--' is passed through to 'npx skills add'.

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_COPY  Defaults for the options above
  AISKILLS_SKIP_POSTINSTALL=1   Skip the npm postinstall hook entirely
  AISKILLS_SKIP_SKILLS_ADD=1    Postinstall copies files but skips 'npx skills add'
`;

function parse(argv) {
  const opts = envOptions();
  const passIdx = argv.indexOf("--");
  const extra = passIdx >= 0 ? argv.slice(passIdx + 1) : [];
  const args = passIdx >= 0 ? argv.slice(0, passIdx) : argv;
  const split = (v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-p" || a === "--project") opts.global = false;
    else if (a === "-g" || a === "--global") opts.global = true;
    else if (a === "-a" || a === "--agent") opts.agents = split(args[++i]);
    else if (a === "-s" || a === "--skill") opts.skills = split(args[++i]);
    else if (a === "--copy") opts.copy = true;
    else throw new Error(`unknown option: ${a}`);
  }
  return { ...opts, extra };
}

function main() {
  const [cmd = "install", ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "install": {
      const opts = parse(rest);
      const root = syncSkills({ version });
      return skillsAdd(root, { ...opts, cwd: opts.global ? root : process.cwd() });
    }
    case "sync":
      syncSkills({ version });
      return 0;
    case "list":
      return skillsAdd(syncSkills({ version }), { list: true });
    case "path":
      console.log(installRoot());
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
