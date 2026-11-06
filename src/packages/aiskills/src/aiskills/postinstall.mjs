#!/usr/bin/env node
// npm postinstall hook: save skills to ~/.config/sugatoray/aiskills/skills
// and register them via `npx skills add`. Never fails the npm install.
//
// Opt out with AISKILLS_SKIP_POSTINSTALL=1 (or npm --ignore-scripts).
// Register-only opt out (still copies files): AISKILLS_SKIP_SKILLS_ADD=1.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_DIR,
  PKG_SKILLS,
  envOptions,
  expandAgents,
  log,
  resolveExternal,
  selectedSkills,
  skillsAdd,
  skillsAddExternal,
  syncSkills,
  warn,
} from "./installer.mjs";

const truthy = (v) => /^(1|true|yes)$/i.test(v || "");

function main() {
  if (truthy(process.env.AISKILLS_SKIP_POSTINSTALL)) {
    log("AISKILLS_SKIP_POSTINSTALL set; skipping.");
    return;
  }
  // In the source checkout (src/packages/aiskills in the repo) nothing is vendored yet: no-op.
  if (!existsSync(PKG_SKILLS)) return;

  const { version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  const root = syncSkills({ version });

  if (truthy(process.env.AISKILLS_SKIP_SKILLS_ADD) || truthy(process.env.CI)) {
    log(`skipping 'npx skills add' (run 'npx aiskills install' to register them).`);
    return;
  }

  const opts = envOptions();
  // Project scope installs into the directory npm was invoked from.
  const cwd = opts.global ? root : process.env.INIT_CWD || process.cwd();
  // AISKILLS_SKILLS / AISKILLS_GROUPS / AISKILLS_AGENTS may use globs.
  const picked = selectedSkills(opts, root);
  const external = picked?.unknown ?? [];
  if (external.length && !opts.route) {
    throw new Error(`unknown skill(s) in AISKILLS_SKILLS: ${external.join(", ")} (set AISKILLS_ROUTE=1 to look them up)`);
  }
  const agents = expandAgents(opts.agents);
  const routed = external.length ? resolveExternal(external) : [];
  const bundled = picked ? picked.names.filter((n) => !external.includes(n)) : ["*"];
  let status = bundled.length ? skillsAdd(root, { ...opts, agents, skills: bundled, cwd }) : 0;
  for (const { spec } of routed) {
    status = skillsAddExternal(spec, { ...opts, agents, cwd: opts.global ? undefined : cwd }) || status;
  }
  if (status !== 0) {
    warn(`'npx skills add' exited with ${status}. Skills are saved in ${root}/skills;`);
    warn(`register them later with:  npx skills add ${root} --global`);
  }
}

try {
  main();
} catch (err) {
  warn(`postinstall did not complete: ${err?.message ?? err}`);
  warn("run 'npx aiskills install' to retry.");
}
