#!/usr/bin/env node
// npm postinstall hook: save skills to ~/.config/sugatoray/aiskills/skills
// and register them via `npx skills add`. Never fails the npm install.
//
// Opt out with AISKILLS_SKIP_POSTINSTALL=1 (or npm --ignore-scripts).
// Register-only opt out (still copies files): AISKILLS_SKIP_SKILLS_ADD=1.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PKG_DIR, PKG_SKILLS, envOptions, log, skillsAdd, syncSkills, warn } from "./installer.mjs";

const truthy = (v) => /^(1|true|yes)$/i.test(v || "");

function main() {
  if (truthy(process.env.AISKILLS_SKIP_POSTINSTALL)) {
    log("AISKILLS_SKIP_POSTINSTALL set; skipping.");
    return;
  }
  // In the source checkout (src/aiskills) nothing is vendored yet: no-op.
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
  const status = skillsAdd(root, { ...opts, cwd });
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
